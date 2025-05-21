import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

// Extender la interfaz Request para incluir el usuario
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    // otras propiedades del usuario
  };
}

const prisma = new PrismaClient();

// Directorio para guardar comprobantes
const UPLOADS_DIR = path.join(__dirname, '../../uploads/comprobantes');

// Asegurar que el directorio existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Esquema para validar la creación de una operación bancaria
const OperacionBancariaCreateSchema = z.object({
  tipo: z.enum(['pos', 'transferencia'], { 
    errorMap: () => ({ message: 'El tipo debe ser pos o transferencia' })
  }),
  monto: z.number({
    required_error: 'El monto es requerido',
    invalid_type_error: 'El monto debe ser un número'
  }).positive('El monto debe ser mayor a cero'),
  montoACobrar: z.number().positive('El monto a cobrar debe ser mayor a cero').optional(),
  tipoServicio: z.string().min(1, 'El tipo de servicio es requerido'),
  codigoBarrasPos: z.string().optional(),
  posDescripcion: z.string().optional(),
  numeroComprobante: z.string().optional(),
  cuentaBancariaId: z.number().optional(),
  cajaId: z.string({
    required_error: 'El ID de la caja es requerido'
  }),
  crearMovimientoFarmacia: z.boolean().optional()
});

// Esquema para validar la actualización de una operación bancaria
const OperacionBancariaUpdateSchema = OperacionBancariaCreateSchema.partial();

// Extender el OperacionBancariaUpdateSchema para incluir crearMovimientoFarmacia
const OperacionBancariaUpdateWithFarmaciaSchema = OperacionBancariaUpdateSchema.extend({
  crearMovimientoFarmacia: z.boolean().optional()
});

/**
 * Obtener todas las operaciones bancarias
 */
export const getAllOperacionesBancarias = async (_req: Request, res: Response) => {
  try {
    const operaciones = await prisma.operacionBancaria.findMany({
      include: {
        cuentaBancaria: true,
        caja: {
          select: {
            id: true,
            estado: true,
            fechaApertura: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                username: true
              }
            },
            sucursal: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return res.status(200).json(operaciones);
  } catch (error) {
    console.error('Error al obtener operaciones bancarias:', error);
    return res.status(500).json({ error: 'Error al obtener operaciones bancarias' });
  }
};

/**
 * Obtener operaciones bancarias por ID de caja
 */
export const getOperacionesBancariasByCajaId = async (req: Request, res: Response) => {
  try {
    const { cajaId } = req.params;

    if (!cajaId) {
      return res.status(400).json({ error: 'ID de caja requerido' });
    }

    const operaciones = await prisma.operacionBancaria.findMany({
      where: {
        cajaId
      },
      include: {
        cuentaBancaria: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return res.status(200).json(operaciones);
  } catch (error) {
    console.error(`Error al obtener operaciones bancarias para caja ${req.params.cajaId}:`, error);
    return res.status(500).json({ error: 'Error al obtener operaciones bancarias' });
  }
};

/**
 * Obtener una operación bancaria por ID
 */
export const getOperacionBancariaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    const operacion = await prisma.operacionBancaria.findUnique({
      where: {
        id
      },
      include: {
        cuentaBancaria: true,
        caja: {
          select: {
            id: true,
            estado: true,
            fechaApertura: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                username: true
              }
            },
            sucursal: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        }
      }
    });

    if (!operacion) {
      return res.status(404).json({ error: 'Operación bancaria no encontrada' });
    }

    return res.status(200).json(operacion);
  } catch (error) {
    console.error(`Error al obtener operación bancaria ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al obtener operación bancaria' });
  }
};

/**
 * Crear una nueva operación bancaria
 */
export const createOperacionBancaria = async (req: AuthRequest, res: Response) => {
  console.log('Creando operación bancaria...');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  try {
    // Extraer datos según cómo se envían (FormData o JSON)
    let operacionData: any;
    
    // Comprobar si los datos vienen en el campo 'data' (FormData)
    if (req.body.data) {
      console.log('Procesando datos del campo data en FormData');
      try {
        operacionData = JSON.parse(req.body.data);
        console.log('Datos parseados del FormData:', operacionData);
      } catch (e) {
        console.error('Error al parsear JSON del campo data:', e);
        return res.status(400).json({ error: 'Datos JSON inválidos en el campo data' });
      }
    } else {
      // Si no viene con un campo data, los datos están directamente en req.body
      console.log('Procesando datos JSON directamente del body');
      operacionData = req.body;
    }
    
    // Convertir strings numéricos a números para la validación
    if (typeof operacionData.monto === 'string') {
      operacionData.monto = parseFloat(operacionData.monto);
    }
    
    if (typeof operacionData.montoACobrar === 'string') {
      operacionData.montoACobrar = parseFloat(operacionData.montoACobrar);
    }
    
    if (typeof operacionData.cuentaBancariaId === 'string') {
      operacionData.cuentaBancariaId = parseInt(operacionData.cuentaBancariaId);
    }
    
    // Validar datos
    console.log('Validando datos...');
    const validationResult = OperacionBancariaCreateSchema.safeParse(operacionData);

    if (!validationResult.success) {
      console.error('Error de validación:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;
    console.log('Datos validados:', data);
    
    // Verificar que la caja existe
    console.log(`Verificando caja con ID ${data.cajaId}...`);
    const caja = await prisma.caja.findUnique({
      where: { id: data.cajaId },
      select: { id: true, estado: true }
    });

    if (!caja) {
      console.error(`Caja con ID ${data.cajaId} no encontrada`);
      return res.status(404).json({ error: 'Caja no encontrada' });
    }
    console.log('Caja encontrada:', caja);

    // Si es una transferencia, verificar que la cuenta bancaria existe
    if (data.tipo === 'transferencia' && data.cuentaBancariaId) {
      console.log(`Verificando cuenta bancaria con ID ${data.cuentaBancariaId}...`);
      const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
        where: { id: data.cuentaBancariaId }
      });

      if (!cuentaBancaria) {
        console.error(`Cuenta bancaria con ID ${data.cuentaBancariaId} no encontrada`);
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }
      console.log('Cuenta bancaria encontrada:', cuentaBancaria);
    }

    // Procesar archivo si existe
    let rutaComprobante = null;
    if (req.file) {
      try {
        console.log('Procesando archivo adjunto...');
        // Generar nombre único para el archivo
        const extension = req.file.originalname.split('.').pop();
        const nombreArchivo = `${uuidv4()}.${extension}`;
        const rutaCompleta = path.join(UPLOADS_DIR, nombreArchivo);
        
        console.log(`Guardando archivo en ${rutaCompleta}...`);
        // Guardar archivo
        fs.writeFileSync(rutaCompleta, req.file.buffer);
        
        // Guardar ruta relativa para acceso desde API
        rutaComprobante = `/uploads/comprobantes/${nombreArchivo}`;
        console.log(`Archivo guardado con éxito. Ruta relativa: ${rutaComprobante}`);
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        return res.status(500).json({ error: 'Error al procesar el archivo adjunto' });
      }
    }

    // Crear la operación bancaria en la base de datos
    console.log('Creando operación bancaria en la base de datos...');
    const nuevaOperacion = await prisma.operacionBancaria.create({
      data: {
        tipo: data.tipo,
        monto: data.monto,
        montoACobrar: data.montoACobrar,
        tipoServicio: data.tipoServicio,
        codigoBarrasPos: data.codigoBarrasPos,
        posDescripcion: data.posDescripcion,
        numeroComprobante: data.numeroComprobante,
        cuentaBancariaId: data.cuentaBancariaId,
        cajaId: data.cajaId,
        rutaComprobante
      },
      include: {
        cuentaBancaria: true
      }
    });

    // Verificar si se debe crear un movimiento en la tabla movimientos_farmacia
    if (data.crearMovimientoFarmacia === true) {
      try {
        console.log('Creando movimiento de farmacia correspondiente...');
        
        // El monto a cobrar siempre es en guaraníes (moneda local)
        const montoFarmacia = data.montoACobrar || data.monto;
        
        // El monto se almacena como negativo para representar un EGRESO
        const montoNegativo = new Decimal(montoFarmacia || 0).negated();
        
        // Crear el movimiento de farmacia
        await prisma.movimientoFarmacia.create({
          data: {
            fechaHora: new Date(),
            tipoMovimiento: 'EGRESO',
            concepto: `Operación Bancaria: ${data.tipo === 'pos' ? 'POS' : 'Transferencia'} - ${data.tipoServicio}`,
            movimientoOrigenId: parseInt(nuevaOperacion.id),
            movimientoOrigenTipo: 'OPERACION_BANCARIA',
            monto: montoNegativo,
            monedaCodigo: 'PYG', // Siempre en guaraníes
            estado: 'CONFIRMADO',
            ...(req.user?.id ? { usuarioId: req.user.id } : {})
          }
        });
        
        console.log('Movimiento de farmacia creado con éxito');
      } catch (error) {
        console.error('Error al crear movimiento de farmacia:', error);
        // No interrumpimos el proceso si falla la creación del movimiento de farmacia
      }
    }

    console.log('Operación bancaria creada con éxito:', nuevaOperacion);
    return res.status(201).json(nuevaOperacion);
  } catch (error) {
    console.error('Error al crear operación bancaria:', error);
    return res.status(500).json({ error: 'Error al crear operación bancaria' });
  }
};

/**
 * Actualizar una operación bancaria existente
 */
export const updateOperacionBancaria = async (req: AuthRequest, res: Response) => {
  console.log('Actualizando operación bancaria...');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  console.log('Params:', req.params);
  
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    // Verificar si la operación existe
    const operacionExistente = await prisma.operacionBancaria.findUnique({
      where: { id },
      select: { id: true, rutaComprobante: true }
    });

    if (!operacionExistente) {
      return res.status(404).json({ error: 'Operación bancaria no encontrada' });
    }

    // Extraer datos según cómo se envían (FormData o JSON)
    let operacionData: any;
    
    // Comprobar si los datos vienen en el campo 'data' (FormData)
    if (req.body.data) {
      console.log('Procesando datos del campo data en FormData');
      try {
        operacionData = JSON.parse(req.body.data);
        console.log('Datos parseados del FormData:', operacionData);
      } catch (e) {
        console.error('Error al parsear JSON del campo data:', e);
        return res.status(400).json({ error: 'Datos JSON inválidos en el campo data' });
      }
    } else {
      // Si no viene con un campo data, los datos están directamente en req.body
      console.log('Procesando datos JSON directamente del body');
      operacionData = req.body;
    }
    
    // Convertir strings numéricos a números para la validación
    if (typeof operacionData.monto === 'string') {
      operacionData.monto = parseFloat(operacionData.monto);
    }
    
    if (typeof operacionData.montoACobrar === 'string') {
      operacionData.montoACobrar = parseFloat(operacionData.montoACobrar);
    }
    
    if (typeof operacionData.cuentaBancariaId === 'string') {
      operacionData.cuentaBancariaId = parseInt(operacionData.cuentaBancariaId);
    }

    // Validar datos
    console.log('Validando datos...');
    const validationResult = OperacionBancariaUpdateSchema.safeParse(operacionData);

    if (!validationResult.success) {
      console.error('Error de validación:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;
    console.log('Datos validados:', data);

    // Si hay cajaId, verificar que la caja existe
    if (data.cajaId) {
      console.log(`Verificando caja con ID ${data.cajaId}...`);
      const caja = await prisma.caja.findUnique({
        where: { id: data.cajaId },
        select: { id: true }
      });

      if (!caja) {
        console.error(`Caja con ID ${data.cajaId} no encontrada`);
        return res.status(404).json({ error: 'Caja no encontrada' });
      }
      console.log('Caja encontrada:', caja);
    }

    // Si es una transferencia y hay cuentaBancariaId, verificar que la cuenta bancaria existe
    if (data.tipo === 'transferencia' && data.cuentaBancariaId) {
      console.log(`Verificando cuenta bancaria con ID ${data.cuentaBancariaId}...`);
      const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
        where: { id: data.cuentaBancariaId }
      });

      if (!cuentaBancaria) {
        console.error(`Cuenta bancaria con ID ${data.cuentaBancariaId} no encontrada`);
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }
      console.log('Cuenta bancaria encontrada:', cuentaBancaria);
    }

    // Procesar archivo si existe
    let rutaComprobante = operacionExistente.rutaComprobante;
    if (req.file) {
      try {
        console.log('Procesando nuevo archivo adjunto...');
        
        // Si ya existía un archivo anterior, eliminarlo
        if (operacionExistente.rutaComprobante) {
          const rutaAnterior = path.join(__dirname, '../../', operacionExistente.rutaComprobante.replace('/', ''));
          console.log(`Intentando eliminar archivo anterior en ${rutaAnterior}...`);
          
          if (fs.existsSync(rutaAnterior)) {
            fs.unlinkSync(rutaAnterior);
            console.log('Archivo anterior eliminado con éxito');
          } else {
            console.log('Archivo anterior no encontrado, continuando...');
          }
        }
        
        // Generar nombre único para el archivo
        const extension = req.file.originalname.split('.').pop();
        const nombreArchivo = `${uuidv4()}.${extension}`;
        const rutaCompleta = path.join(UPLOADS_DIR, nombreArchivo);
        
        console.log(`Guardando nuevo archivo en ${rutaCompleta}...`);
        // Guardar archivo
        fs.writeFileSync(rutaCompleta, req.file.buffer);
        
        // Guardar ruta relativa para acceso desde API
        rutaComprobante = `/uploads/comprobantes/${nombreArchivo}`;
        console.log(`Nuevo archivo guardado con éxito. Ruta relativa: ${rutaComprobante}`);
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        return res.status(500).json({ error: 'Error al procesar el archivo adjunto' });
      }
    }

    // Actualizar la operación bancaria en la base de datos
    console.log('Actualizando operación bancaria en la base de datos...');
    const operacionActualizada = await prisma.operacionBancaria.update({
      where: { id },
      data: {
        tipo: data.tipo,
        monto: data.monto,
        montoACobrar: data.montoACobrar,
        tipoServicio: data.tipoServicio,
        codigoBarrasPos: data.codigoBarrasPos,
        posDescripcion: data.posDescripcion,
        numeroComprobante: data.numeroComprobante,
        cuentaBancariaId: data.cuentaBancariaId,
        cajaId: data.cajaId,
        rutaComprobante
      },
      include: {
        cuentaBancaria: true
      }
    });

    // Verificar si se debe crear o actualizar un movimiento en la tabla movimientos_farmacia
    if (operacionData.crearMovimientoFarmacia === true) {
      try {
        console.log('Verificando si existe un movimiento de farmacia para esta operación...');
        
        // Buscar si ya existe un movimiento para esta operación
        const movimientoExistente = await prisma.movimientoFarmacia.findFirst({
          where: {
            movimientoOrigenId: parseInt(id),
            movimientoOrigenTipo: 'OPERACION_BANCARIA'
          }
        });
        
        // El monto a cobrar siempre es en guaraníes (moneda local)
        const montoFarmacia = data.montoACobrar || data.monto;
        
        // El monto se almacena como negativo para representar un EGRESO
        const montoNegativo = new Decimal(montoFarmacia || 0).negated();
        
        if (movimientoExistente) {
          // Actualizar movimiento existente
          console.log('Actualizando movimiento de farmacia existente...');
          await prisma.movimientoFarmacia.update({
            where: { id: movimientoExistente.id },
            data: {
              concepto: `Operación Bancaria: ${data.tipo === 'pos' ? 'POS' : 'Transferencia'} - ${data.tipoServicio}`,
              monto: montoNegativo,
              ...(req.user?.id ? { usuarioId: req.user.id } : {})
            }
          });
          console.log('Movimiento de farmacia actualizado con éxito');
        } else {
          // Crear nuevo movimiento
          console.log('Creando nuevo movimiento de farmacia...');
          await prisma.movimientoFarmacia.create({
            data: {
              fechaHora: new Date(),
              tipoMovimiento: 'EGRESO',
              concepto: `Operación Bancaria: ${data.tipo === 'pos' ? 'POS' : 'Transferencia'} - ${data.tipoServicio}`,
              movimientoOrigenId: parseInt(id),
              movimientoOrigenTipo: 'OPERACION_BANCARIA',
              monto: montoNegativo,
              monedaCodigo: 'PYG', // Siempre en guaraníes
              estado: 'CONFIRMADO',
              ...(req.user?.id ? { usuarioId: req.user.id } : {})
            }
          });
          console.log('Movimiento de farmacia creado con éxito');
        }
      } catch (error) {
        console.error('Error al procesar movimiento de farmacia:', error);
        // No interrumpimos el proceso si falla la creación del movimiento de farmacia
      }
    }

    console.log('Operación bancaria actualizada con éxito:', operacionActualizada);
    return res.status(200).json(operacionActualizada);
  } catch (error) {
    console.error(`Error al actualizar operación bancaria ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al actualizar operación bancaria' });
  }
};

/**
 * Eliminar una operación bancaria
 */
export const deleteOperacionBancaria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    // Verificar si la operación existe y obtener su ruta de comprobante
    const operacion = await prisma.operacionBancaria.findUnique({
      where: { id },
      select: { id: true, rutaComprobante: true }
    });

    if (!operacion) {
      return res.status(404).json({ error: 'Operación bancaria no encontrada' });
    }

    // Eliminar el archivo de comprobante si existe
    if (operacion.rutaComprobante) {
      try {
        const rutaArchivo = path.join(__dirname, '../../', operacion.rutaComprobante.replace('/', ''));
        if (fs.existsSync(rutaArchivo)) {
          fs.unlinkSync(rutaArchivo);
          console.log(`Archivo eliminado: ${rutaArchivo}`);
        }
      } catch (error) {
        console.error('Error al eliminar archivo de comprobante:', error);
        // Continuamos con la eliminación aunque haya error al eliminar el archivo
      }
    }

    // Eliminar el movimiento en movimientos_farmacia si existe
    try {
      console.log('Buscando movimiento de farmacia relacionado...');
      const movimientoFarmacia = await prisma.movimientoFarmacia.findFirst({
        where: {
          movimientoOrigenId: parseInt(id),
          movimientoOrigenTipo: 'OPERACION_BANCARIA'
        }
      });

      if (movimientoFarmacia) {
        console.log(`Eliminando movimiento de farmacia con ID ${movimientoFarmacia.id}...`);
        await prisma.movimientoFarmacia.delete({
          where: { id: movimientoFarmacia.id }
        });
        console.log('Movimiento de farmacia eliminado');
      }
    } catch (error) {
      console.error('Error al eliminar movimiento de farmacia:', error);
      // Continuamos con la eliminación aunque haya error al eliminar el movimiento de farmacia
    }

    // Eliminar la operación bancaria
    await prisma.operacionBancaria.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error(`Error al eliminar operación bancaria ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al eliminar operación bancaria' });
  }
}; 
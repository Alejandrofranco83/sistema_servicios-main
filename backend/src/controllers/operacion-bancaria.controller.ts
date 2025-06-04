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
  crearMovimientoFarmacia: z.boolean().optional(),
  // Nuevos campos para manejo de monedas
  posMoneda: z.enum(['PYG', 'USD', 'BRL']).optional(),
  montoOriginalEnMonedaPOS: z.number().optional()
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
  
  let rutaComprobante: string | null = null; // Declarar al inicio para estar disponible en catch
  
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

    // Usar transacción para garantizar consistencia entre operación bancaria y movimiento de farmacia
    const resultado = await prisma.$transaction(async (tx) => {
      // Paso 1: Crear la operación bancaria
    console.log('Creando operación bancaria en la base de datos...');
      const nuevaOperacion = await tx.operacionBancaria.create({
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

      // Paso 2: Crear movimiento de farmacia si se requiere
    if (data.crearMovimientoFarmacia === true) {
        console.log('Creando movimiento de farmacia correspondiente...');
        
        // Determinar la moneda y el monto según el tipo de operación
        let monedaMovimiento = 'PYG';
        let montoMovimiento = data.montoACobrar || data.monto || 0;
        let conceptoMovimiento = '';
        
        if (data.tipo === 'pos' && data.posMoneda && data.montoOriginalEnMonedaPOS) {
          // Para operaciones POS con moneda diferente a PYG, usar la moneda del POS
          monedaMovimiento = data.posMoneda;
          
          // Calcular el monto con comisión en la moneda original del POS
          montoMovimiento = data.montoOriginalEnMonedaPOS * 1.06;
          
          console.log(`POS en moneda ${monedaMovimiento}: monto original ${data.montoOriginalEnMonedaPOS}, con comisión: ${montoMovimiento}`);
        } else {
          // Para transferencias o POS en guaraníes, usar guaraníes
          monedaMovimiento = 'PYG';
          montoMovimiento = data.montoACobrar || data.monto || 0;
          
          console.log(`Operación en guaraníes: monto ${montoMovimiento}`);
        }
        
        // Construir concepto descriptivo según el tipo de operación
        if (data.tipo === 'pos') {
          // Para POS: buscar el nombre del dispositivo por código de barras
          let nombrePOS = 'POS Desconocido';
          if (data.codigoBarrasPos) {
            try {
              const dispositivoPOS = await tx.dispositivoPos.findUnique({
                where: { codigoBarras: data.codigoBarrasPos },
                select: { nombre: true }
              });
              if (dispositivoPOS) {
                nombrePOS = dispositivoPOS.nombre;
              }
            } catch (error) {
              console.error('Error al buscar nombre del POS:', error);
            }
          }
          conceptoMovimiento = `POS ${nombrePOS} - ${data.tipoServicio}`;
        } else if (data.tipo === 'transferencia') {
          // Para transferencias: usar información de la cuenta bancaria
          let infoCuentaBancaria = 'Cuenta Desconocida';
          if (data.cuentaBancariaId) {
            try {
              const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                where: { id: data.cuentaBancariaId },
                select: { banco: true, numeroCuenta: true }
              });
              if (cuentaBancaria) {
                infoCuentaBancaria = `${cuentaBancaria.banco} ${cuentaBancaria.numeroCuenta}`;
              }
            } catch (error) {
              console.error('Error al buscar información de cuenta bancaria:', error);
            }
          }
          conceptoMovimiento = `Transferencia ${infoCuentaBancaria} - ${data.tipoServicio}`;
        } else {
          // Fallback para otros tipos
          conceptoMovimiento = `Operación Bancaria: ${data.tipo} - ${data.tipoServicio}`;
        }
        
        // El monto se almacena como negativo para representar un EGRESO
        const montoNegativo = new Decimal(montoMovimiento).negated();
        
        // Crear el movimiento de farmacia dentro de la transacción
        await tx.movimientoFarmacia.create({
          data: {
            fechaHora: new Date(),
            tipoMovimiento: 'EGRESO',
            concepto: conceptoMovimiento,
            movimientoOrigenId: parseInt(nuevaOperacion.id),
            movimientoOrigenTipo: 'OPERACION_BANCARIA',
            monto: montoNegativo,
            monedaCodigo: monedaMovimiento,
            estado: `OPERACION_BANCARIA:${nuevaOperacion.id}`,
            ...(req.user?.id ? { usuarioId: req.user.id } : {})
          }
        });
        
        console.log(`Movimiento de farmacia creado con éxito - Concepto: "${conceptoMovimiento}", Moneda: ${monedaMovimiento}, Monto: ${montoNegativo}`);
      }

      return nuevaOperacion;
    });

    console.log('Operación bancaria creada con éxito:', resultado);
    return res.status(201).json(resultado);
  } catch (error) {
    console.error('Error al crear operación bancaria:', error);
    
    // Si hay un archivo que se guardó y ocurrió un error en la transacción, eliminarlo
    if (rutaComprobante) {
      try {
        const rutaCompleta = path.join(UPLOADS_DIR, path.basename(rutaComprobante));
        if (fs.existsSync(rutaCompleta)) {
          fs.unlinkSync(rutaCompleta);
          console.log('Archivo eliminado debido al error en la transacción');
        }
      } catch (fileError) {
        console.error('Error al eliminar archivo tras fallo en transacción:', fileError);
      }
    }
    
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
    
    // Usar transacción para garantizar consistencia entre operación bancaria y movimiento de farmacia
    const operacionActualizada = await prisma.$transaction(async (tx) => {
      // Paso 1: Actualizar la operación bancaria
      const operacionUpdated = await tx.operacionBancaria.update({
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

      // Paso 2: Crear o actualizar movimiento de farmacia si se requiere
      if (data.crearMovimientoFarmacia === true) {
        console.log('Verificando si existe un movimiento de farmacia para esta operación...');
        
        // Buscar si ya existe un movimiento para esta operación
        const movimientoExistente = await tx.movimientoFarmacia.findFirst({
          where: {
            OR: [
              // Nuevo formato: buscar por estado
              { estado: `OPERACION_BANCARIA:${id}` },
              // Formato anterior: buscar por movimientoOrigenId (compatibilidad)
              {
                movimientoOrigenId: parseInt(id),
                movimientoOrigenTipo: 'OPERACION_BANCARIA'
              }
            ]
          }
        });
        
        // Determinar la moneda y el monto según el tipo de operación
        let monedaMovimiento = 'PYG';
        let montoMovimiento = data.montoACobrar || data.monto || 0;
        let conceptoMovimiento = '';
        
        if (data.tipo === 'pos' && data.posMoneda && data.montoOriginalEnMonedaPOS) {
          // Para operaciones POS con moneda diferente a PYG, usar la moneda del POS
          monedaMovimiento = data.posMoneda;
          
          // Calcular el monto con comisión en la moneda original del POS
          montoMovimiento = data.montoOriginalEnMonedaPOS * 1.06;
          
          console.log(`POS en moneda ${monedaMovimiento}: monto original ${data.montoOriginalEnMonedaPOS}, con comisión: ${montoMovimiento}`);
        } else {
          // Para transferencias o POS en guaraníes, usar guaraníes
          monedaMovimiento = 'PYG';
          montoMovimiento = data.montoACobrar || data.monto || 0;
          
          console.log(`Operación en guaraníes: monto ${montoMovimiento}`);
        }
        
        // Construir concepto descriptivo según el tipo de operación
        if (data.tipo === 'pos') {
          // Para POS: buscar el nombre del dispositivo por código de barras
          let nombrePOS = 'POS Desconocido';
          if (data.codigoBarrasPos) {
            try {
              const dispositivoPOS = await tx.dispositivoPos.findUnique({
                where: { codigoBarras: data.codigoBarrasPos },
                select: { nombre: true }
              });
              if (dispositivoPOS) {
                nombrePOS = dispositivoPOS.nombre;
              }
            } catch (error) {
              console.error('Error al buscar nombre del POS:', error);
            }
          }
          conceptoMovimiento = `POS ${nombrePOS} - ${data.tipoServicio}`;
        } else if (data.tipo === 'transferencia') {
          // Para transferencias: usar información de la cuenta bancaria
          let infoCuentaBancaria = 'Cuenta Desconocida';
          if (data.cuentaBancariaId) {
            try {
              const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                where: { id: data.cuentaBancariaId },
                select: { banco: true, numeroCuenta: true }
              });
              if (cuentaBancaria) {
                infoCuentaBancaria = `${cuentaBancaria.banco} ${cuentaBancaria.numeroCuenta}`;
              }
            } catch (error) {
              console.error('Error al buscar información de cuenta bancaria:', error);
            }
          }
          conceptoMovimiento = `Transferencia ${infoCuentaBancaria} - ${data.tipoServicio}`;
        } else {
          // Fallback para otros tipos
          conceptoMovimiento = `Operación Bancaria: ${data.tipo} - ${data.tipoServicio}`;
        }
        
        // El monto se almacena como negativo para representar un EGRESO
        const montoNegativo = new Decimal(montoMovimiento).negated();
        
        if (movimientoExistente) {
          // Actualizar movimiento existente
          console.log('Actualizando movimiento de farmacia existente...');
          await tx.movimientoFarmacia.update({
            where: { id: movimientoExistente.id },
            data: {
              concepto: conceptoMovimiento,
              monto: montoNegativo,
              monedaCodigo: monedaMovimiento,
              estado: `OPERACION_BANCARIA:${id}`,
              ...(req.user?.id ? { usuarioId: req.user.id } : {})
            }
          });
          console.log(`Movimiento de farmacia actualizado con éxito dentro de la transacción - Concepto: "${conceptoMovimiento}", Moneda: ${monedaMovimiento}, Monto: ${montoNegativo}`);
        } else {
          // Crear nuevo movimiento
          console.log('Creando nuevo movimiento de farmacia...');
          await tx.movimientoFarmacia.create({
            data: {
              fechaHora: new Date(),
              tipoMovimiento: 'EGRESO',
              concepto: conceptoMovimiento,
              movimientoOrigenId: parseInt(id),
              movimientoOrigenTipo: 'OPERACION_BANCARIA',
              monto: montoNegativo,
              monedaCodigo: monedaMovimiento,
              estado: `OPERACION_BANCARIA:${id}`,
              ...(req.user?.id ? { usuarioId: req.user.id } : {})
            }
          });
          console.log(`Movimiento de farmacia creado con éxito dentro de la transacción - Concepto: "${conceptoMovimiento}", Moneda: ${monedaMovimiento}, Monto: ${montoNegativo}`);
        }
      }

      return operacionUpdated;
    });

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

    // Usar una transacción para garantizar consistencia
    await prisma.$transaction(async (tx) => {
      // Paso 1: Eliminar el movimiento en movimientos_farmacia si existe
      console.log('Buscando movimiento de farmacia relacionado...');
      const movimientoFarmacia = await tx.movimientoFarmacia.findFirst({
        where: {
          OR: [
            // Nuevo formato: buscar por estado
            { estado: `OPERACION_BANCARIA:${id}` },
            // Formato anterior: buscar por movimientoOrigenId (compatibilidad)
            {
              movimientoOrigenId: parseInt(id),
              movimientoOrigenTipo: 'OPERACION_BANCARIA'
            }
          ]
        }
      });

      if (movimientoFarmacia) {
        console.log(`Eliminando movimiento de farmacia con ID ${movimientoFarmacia.id}...`);
        await tx.movimientoFarmacia.delete({
          where: { id: movimientoFarmacia.id }
        });
        console.log('Movimiento de farmacia eliminado dentro de la transacción');
      } else {
        console.log('No se encontró movimiento de farmacia relacionado');
      }

      // Paso 2: Eliminar la operación bancaria
      console.log('Eliminando operación bancaria...');
      await tx.operacionBancaria.delete({
        where: { id }
      });
      console.log('Operación bancaria eliminada dentro de la transacción');
    });

    // Solo después de que la transacción sea exitosa, eliminar el archivo de comprobante
    if (operacion.rutaComprobante) {
      try {
        const rutaArchivo = path.join(__dirname, '../../', operacion.rutaComprobante.replace('/', ''));
        if (fs.existsSync(rutaArchivo)) {
          fs.unlinkSync(rutaArchivo);
          console.log(`Archivo eliminado: ${rutaArchivo}`);
        }
      } catch (error) {
        console.error('Error al eliminar archivo de comprobante:', error);
        // No relanzamos el error aquí porque la operación principal ya fue exitosa
      }
    }

    console.log('Operación bancaria y movimiento de farmacia eliminados con éxito');
    return res.status(204).send();
  } catch (error) {
    console.error(`Error al eliminar operación bancaria ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al eliminar operación bancaria' });
  }
}; 
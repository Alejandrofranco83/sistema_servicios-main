import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaz para los detalles del conteo por denominación
interface DetalleDenominacion {
  denominacion: number;
  cantidad: number;
  subtotal: number;
}

// Interfaz para el cuerpo de la solicitud de creación de conteo
interface ConteoRequestBody {
  moneda: string;
  total: number;
  saldo_sistema: number;
  observaciones?: string;
  usuario_id: number;
  detalles: DetalleDenominacion[];
  // Campos adicionales para generar movimientos
  generarMovimiento?: boolean;
  concepto?: string;
}

/**
 * Obtener todos los conteos
 * Nota: Se debe ejecutar 'npx prisma generate' después de agregar los nuevos modelos
 * para que los tipos estén disponibles y se resuelvan los errores de linter.
 */
export const getConteos = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
    const conteos = await prisma.conteo.findMany({
      include: {
        usuario: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_hora: 'desc'
      }
    });

    return res.json(conteos);
  } catch (error) {
    console.error('Error al obtener conteos:', error);
    return res.status(500).json({ error: 'Error al obtener los conteos' });
  }
};

/**
 * Obtener un conteo por ID
 */
export const getConteoById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
    const conteo = await prisma.conteo.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        detalles: true,
        usuario: {
          select: {
            nombre: true
          }
        }
      }
    });

    if (!conteo) {
      return res.status(404).json({ error: 'Conteo no encontrado' });
    }

    return res.json(conteo);
  } catch (error) {
    console.error('Error al obtener conteo por ID:', error);
    return res.status(500).json({ error: 'Error al obtener el conteo' });
  }
};

/**
 * Crear un nuevo conteo
 */
export const createConteo = async (req: Request, res: Response) => {
  const { 
    moneda, 
    total, 
    saldo_sistema, 
    observaciones, 
    usuario_id, 
    detalles,
    generarMovimiento,
    concepto 
  } = req.body as ConteoRequestBody;

  try {
    // Calcular la diferencia
    const diferencia = total - saldo_sistema;
    
    console.log('Creando conteo con datos:', { moneda, total, saldo_sistema, diferencia, observaciones, usuario_id });
    console.log('Detalles del conteo:', detalles);
    
    // Crear el conteo con una transacción para garantizar atomicidad
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro principal del conteo
      // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
      const nuevoConteo = await tx.conteo.create({
        data: {
          moneda,
          total: new Prisma.Decimal(total),
          saldo_sistema: new Prisma.Decimal(saldo_sistema),
          diferencia: new Prisma.Decimal(diferencia),
          observaciones,
          usuario_id
        }
      });
      
      console.log('Conteo creado con ID:', nuevoConteo.id);
      
      // 2. Crear los detalles del conteo
      if (detalles && detalles.length > 0) {
        const detallesData = detalles.map(detalle => ({
          conteo_id: nuevoConteo.id,
          denominacion: new Prisma.Decimal(detalle.denominacion),
          cantidad: detalle.cantidad,
          subtotal: new Prisma.Decimal(detalle.subtotal)
        }));
        
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        await tx.conteoDetalle.createMany({
          data: detallesData
        });
        
        console.log(`${detallesData.length} detalles de conteo creados`);
      }

      // 3. Si se solicita, crear un movimiento en caja mayor
      if (generarMovimiento && diferencia !== 0) {
        const montoDiferencia = Math.abs(diferencia);
        const saldoAnterior = await tx.cajaMayorMovimiento.findFirst({
          where: {
            moneda: moneda
          },
          orderBy: {
            fechaHora: 'desc'
          },
          select: {
            saldoActual: true
          }
        });

        const saldoAnteriorValue = saldoAnterior ? Number(saldoAnterior.saldoActual) : 0;
        
        // Calcular la diferencia real y determinar si es ingreso o egreso
        const diferenciaReal = total - saldoAnteriorValue;
        const esIngreso = diferenciaReal > 0;
        const montoMovimiento = Math.abs(diferenciaReal);

        // Determinar el concepto basado en la diferencia REAL
        const conceptoFinal = concepto || (diferenciaReal > 0 
          ? 'Sobró - Diferencia en arqueo' 
          : 'Faltó - Diferencia en arqueo');
          
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        await tx.cajaMayorMovimiento.create({
          data: {
            fechaHora: new Date(),
            tipo: 'Ajuste Conteo', // Tipo de movimiento específico para conteo
            operacionId: nuevoConteo.id.toString(), // Usamos el ID del conteo como operacionId
            moneda,
            monto: new Prisma.Decimal(montoMovimiento), // Monto es la diferencia real
            esIngreso, // Basado en la diferencia real
            saldoAnterior: new Prisma.Decimal(saldoAnteriorValue), // El último saldo real
            saldoActual: new Prisma.Decimal(total), // El nuevo saldo es el total contado
            concepto: conceptoFinal, // Usamos el concepto basado en diferenciaReal
            usuarioId: usuario_id,
            observaciones
          }
        });
        
        console.log(`Movimiento de caja mayor creado para el conteo ${nuevoConteo.id}. Saldo anterior: ${saldoAnteriorValue}, Saldo actual (conteo): ${total}, Monto ajuste: ${montoMovimiento}`);
      }
      
      // Devolver el conteo creado con sus detalles
      // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
      return tx.conteo.findUnique({
        where: { id: nuevoConteo.id },
        include: { detalles: true }
      });
    });
    
    console.log('Conteo guardado exitosamente:', result);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error al crear conteo. Detalles completos:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Error de Prisma: ${error.message}, Código: ${error.code}`);
      // Errores comunes de Prisma:
      if (error.code === 'P2003') {
        return res.status(400).json({ 
          error: 'Error de clave foránea. Posiblemente el usuario_id no existe.' 
        });
      }
    }
    return res.status(500).json({ error: 'Error al crear el conteo' });
  }
};

/**
 * Actualizar un conteo existente
 */
export const updateConteo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { observaciones, estado } = req.body;

  try {
    // Solo permitir actualizar observaciones y estado
    // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
    const conteoActualizado = await prisma.conteo.update({
      where: {
        id: Number(id)
      },
      data: {
        observaciones,
        estado
      }
    });

    return res.json(conteoActualizado);
  } catch (error) {
    console.error('Error al actualizar conteo:', error);
    return res.status(500).json({ error: 'Error al actualizar el conteo' });
  }
};

/**
 * Anular un conteo
 */
export const anularConteo = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
    const conteoAnulado = await prisma.conteo.update({
      where: {
        id: Number(id)
      },
      data: {
        estado: 'anulado'
      }
    });

    return res.json(conteoAnulado);
  } catch (error) {
    console.error('Error al anular conteo:', error);
    return res.status(500).json({ error: 'Error al anular el conteo' });
  }
};

/**
 * Eliminar un conteo
 */
export const deleteConteo = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // La eliminación en cascada de los detalles está configurada en el esquema
    // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
    await prisma.conteo.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({ message: 'Conteo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar conteo:', error);
    return res.status(500).json({ error: 'Error al eliminar el conteo' });
  }
}; 
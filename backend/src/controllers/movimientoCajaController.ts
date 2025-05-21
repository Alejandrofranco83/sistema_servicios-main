import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllMovimientosConDetalles = async (req: Request, res: Response) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    // Validar parámetros
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros fechaDesde y fechaHasta son obligatorios.',
        error: 'Parámetros de fecha faltantes.'
      });
    }

    // Convertir strings a objetos Date
    const startDate = new Date(fechaDesde as string);
    startDate.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC

    const endDate = new Date(fechaHasta as string);
    endDate.setUTCHours(23, 59, 59, 999); // Fin del día en UTC

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido.',
        error: 'Las fechas proporcionadas no son válidas.'
      });
    }

    // Validar que fechaDesde no sea posterior a fechaHasta
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'La fechaDesde no puede ser posterior a fechaHasta.',
        error: 'Rango de fechas inválido.'
      });
    }

    // Consulta a la base de datos con Prisma
    const movimientos = await prisma.movimientoCaja.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        caja: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              },
            },
            sucursal: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mapear los resultados para darles el formato esperado por el frontend
    const resultadoFormateado = movimientos.map(mov => ({
      id: mov.id,
      createdAt: mov.createdAt.toISOString(),
      cajaId: mov.cajaId,
      operadora: mov.operadora,
      servicio: mov.servicio,
      monto: Number(mov.monto),
      comprobanteUrl: mov.rutaComprobante || null,
      // Preferir el usuario directamente asociado al movimiento
      nombreUsuario: mov.usuario?.nombre || mov.caja?.usuario?.nombre || null,
      nombreSucursal: mov.caja?.sucursal?.nombre || null,
      Caja: {
        Usuario: {
          nombre: mov.caja?.usuario?.nombre || null
        },
        Sucursal: {
          nombre: mov.caja?.sucursal?.nombre || null
        }
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Movimientos obtenidos exitosamente.",
      data: resultadoFormateado
    });

  } catch (error) {
    console.error('Error al obtener movimientos de caja:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la solicitud.',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 
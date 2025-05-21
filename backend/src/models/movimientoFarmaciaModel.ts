import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface MovimientoFarmaciaFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  tipoMovimiento?: string;
  monedaCodigo?: string;
  soloTotal?: boolean;
  page?: number;
  limit?: number;
}

interface GetAllMovimientosFarmaciaResult {
  data: any[]; // Debería ser el tipo MovimientoFarmacia[] pero ajustado para la respuesta
  totalCount: number;
  totalBalancePYG: Decimal;
  totalBalanceUSD: Decimal; // Balance total en USD
  totalBalanceBRL: Decimal; // Balance total en BRL
}

class MovimientoFarmaciaModel {
  
  /**
   * Obtiene cotización vigente para una fecha específica
   * @param fecha - Fecha para buscar la cotización
   * @returns Cotización o null si no se encuentra
   */
  private async getCotizacionByFecha(fecha: Date): Promise<{ valorDolar: Decimal, valorReal: Decimal } | null> {
    try {
      // Primero intentamos encontrar una cotización del mismo día
      const fechaInicioDia = new Date(fecha);
      fechaInicioDia.setHours(0, 0, 0, 0);
      
      const fechaFinDia = new Date(fecha);
      fechaFinDia.setHours(23, 59, 59, 999);
      
      // Buscar cotización del mismo día
      let cotizacion = await prisma.cotizacion.findFirst({
        where: {
          fecha: {
            gte: fechaInicioDia,
            lte: fechaFinDia
          }
        },
        orderBy: {
          fecha: 'desc' // La más reciente del día
        }
      });
      
      // Si no hay cotización del mismo día, buscar la más reciente anterior a la fecha
      if (!cotizacion) {
        cotizacion = await prisma.cotizacion.findFirst({
          where: {
            fecha: {
              lt: fechaInicioDia
            }
          },
          orderBy: {
            fecha: 'desc' // La más reciente anterior a la fecha
          }
        });
      }
      
      // Si todavía no hay, buscar la vigente o la más reciente en general
      if (!cotizacion) {
        cotizacion = await prisma.cotizacion.findFirst({
          where: {
            vigente: true
          }
        }) || await prisma.cotizacion.findFirst({
          orderBy: {
            fecha: 'desc'
          }
        });
      }
      
      return cotizacion;
    } catch (error) {
      console.error('Error al obtener cotización por fecha:', error);
      return null;
    }
  }
  
  /**
   * Obtiene movimientos de farmacia con filtros y paginación
   * @param filters - Filtros y paginación
   * @returns Lista de movimientos, conteo total y balance total PYG
   */
  async getAll(filters: MovimientoFarmaciaFilters = {}): Promise<GetAllMovimientosFarmaciaResult> {
    const { 
      fechaDesde,
      fechaHasta,
      tipoMovimiento,
      monedaCodigo,
      soloTotal = false,
      page = 1,
      limit = 10 // Valor por defecto para limit
    } = filters;

    const skip = (page - 1) * limit;

    // Construir la cláusula Where dinámicamente
    const where: Prisma.MovimientoFarmaciaWhereInput = {};

    if (fechaDesde || fechaHasta) {
      where.fechaHora = {};
      if (fechaDesde) {
        where.fechaHora.gte = new Date(fechaDesde + 'T00:00:00.000Z'); // Inicio del día
      }
      if (fechaHasta) {
        where.fechaHora.lte = new Date(fechaHasta + 'T23:59:59.999Z'); // Fin del día
      }
    }

    if (tipoMovimiento) {
      // En lugar de filtrar solo por tipoMovimiento, también buscar en movimientoOrigenTipo
      where.OR = [
        { tipoMovimiento },
        { movimientoOrigenTipo: tipoMovimiento }
      ];
    }

    // Nuevo: Si se especificó un código de moneda, filtrar solo por esa moneda
    if (monedaCodigo) {
      where.monedaCodigo = monedaCodigo;
    }

    // // Opcional: Excluir movimientos anulados si se implementa
    // where.estado = { not: 'ANULADO' }; 

    try {
      // Si solo queremos el total y un código de moneda específico, simplificamos la consulta
      if (soloTotal && monedaCodigo) {
        // Solo obtener el balance para la moneda específica
        const balanceMoneda = await prisma.movimientoFarmacia.aggregate({
          _sum: {
            monto: true,
          },
          where,
        });

        const totalBalance = balanceMoneda._sum.monto || new Decimal(0);

        return {
          data: [], // No se necesitan los datos para el total
          totalCount: 0, // No es relevante para el total
          totalBalancePYG: monedaCodigo === 'PYG' ? totalBalance : new Decimal(0),
          totalBalanceUSD: monedaCodigo === 'USD' ? totalBalance : new Decimal(0),
          totalBalanceBRL: monedaCodigo === 'BRL' ? totalBalance : new Decimal(0),
        };
      }

      // Ejecutar consultas en paralelo para obtener los datos principales
      const [movimientos, totalCount, balancePYG] = await prisma.$transaction([
        // 1. Obtener los datos paginados
        prisma.movimientoFarmacia.findMany({
          where,
          include: {
            usuario: { // Incluir datos básicos del usuario si es necesario
              select: {
                id: true,
                username: true,
                nombre: true
              }
            }
          },
          orderBy: {
            fechaHora: 'desc' // Ordenar por fecha descendente
          },
          skip,
          take: limit,
        }),
        // 2. Contar el total de registros que coinciden con los filtros
        prisma.movimientoFarmacia.count({ where }),
        // 3. Calcular el balance en PYG directamente
        prisma.movimientoFarmacia.aggregate({
          _sum: {
            monto: true,
          },
          where: {
            ...where,
            monedaCodigo: 'PYG' // Sumar solo Guaraníes
          },
        }),
      ]);

      // 4. Obtener todos los movimientos en USD y BRL para convertirlos a PYG
      const movimientosUSD = await prisma.movimientoFarmacia.findMany({
        where: {
          ...where,
          monedaCodigo: 'USD' 
        },
        select: {
          monto: true,
          fechaHora: true
        }
      });

      const movimientosBRL = await prisma.movimientoFarmacia.findMany({
        where: {
          ...where,
          monedaCodigo: 'BRL'
        },
        select: {
          monto: true,
          fechaHora: true
        }
      });

      // 5. Convertir montos USD a PYG según cotización correspondiente
      let totalUSD = new Decimal(0);
      for (const mov of movimientosUSD) {
        const cotizacion = await this.getCotizacionByFecha(mov.fechaHora);
        if (cotizacion) {
          // Multiplicar monto USD por valorDolar
          const montoPYG = mov.monto.mul(cotizacion.valorDolar);
          totalUSD = totalUSD.add(montoPYG);
        }
      }

      // 6. Convertir montos BRL a PYG según cotización correspondiente
      let totalBRL = new Decimal(0);
      for (const mov of movimientosBRL) {
        const cotizacion = await this.getCotizacionByFecha(mov.fechaHora);
        if (cotizacion) {
          // Multiplicar monto BRL por valorReal
          const montoPYG = mov.monto.mul(cotizacion.valorReal);
          totalBRL = totalBRL.add(montoPYG);
        }
      }

      // 7. Sumar todos los totales para el balance final
      const totalBalancePYG = (balancePYG._sum.monto || new Decimal(0))
        .add(totalUSD)
        .add(totalBRL);

      // Calcular balances específicos por moneda
      // Para USD, calcular el balance sumando directamente los montos sin conversión
      const balanceUSD = await prisma.movimientoFarmacia.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          ...where,
          monedaCodigo: 'USD'
        },
      });
      const totalBalanceUSD = balanceUSD._sum.monto || new Decimal(0);

      // Para BRL, calcular el balance sumando directamente los montos sin conversión
      const balanceBRL = await prisma.movimientoFarmacia.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          ...where,
          monedaCodigo: 'BRL'
        },
      });
      const totalBalanceBRL = balanceBRL._sum.monto || new Decimal(0);

      // Ajustar el tipo de 'monto' en la respuesta si es necesario (ej. a string o number)
      const dataAjustada = movimientos.map(mov => ({
        ...mov,
        monto: mov.monto.toString(), // Convertir Decimal a string para evitar problemas de serialización
      }));

      return {
        data: dataAjustada,
        totalCount,
        totalBalancePYG: totalBalancePYG, // El balance total ya incluye conversiones
        totalBalanceUSD, // Añadir balance en USD
        totalBalanceBRL, // Añadir balance en BRL
      };

    } catch (error) {
      console.error('Error al obtener movimientos de farmacia:', error);
      throw error; // Relanzar para manejo en el controlador
    }
  }

  // --- Podrías añadir otros métodos aquí (getById, create, etc.) si fuera necesario --- 

}

export default new MovimientoFarmaciaModel(); 
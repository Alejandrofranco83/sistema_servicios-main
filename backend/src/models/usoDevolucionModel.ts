import { PrismaClient, Prisma } from '@prisma/client';
import dbUtils from '../utils/dbUtils';
import { Decimal } from '@prisma/client/runtime/library';

// @ts-ignore - Ignoramos errores de tipos en Prisma
const prisma = new PrismaClient();

const FARMACIA_FRANCO_PERSONA_ID = 1; // Definir el ID constante

/**
 * Interfaz para los datos de uso o devolución
 */
interface UsoDevolucionData {
  tipo: 'USO' | 'DEVOLUCION';
  persona_id: number;
  persona_nombre: string;
  guaranies?: number;
  dolares?: number;
  reales?: number;
  motivo: string;
  usuario_id: number;
}

/**
 * Interfaz para filtros de búsqueda
 */
interface UsoDevolucionFilters {
  persona_id?: number;
  tipo?: 'USO' | 'DEVOLUCION';
  fecha_inicio?: string;
  fecha_fin?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interfaz para el saldo de una persona
 */
interface SaldoPersona {
  persona_id: number;
  guaranies: number;
  dolares: number;
  reales: number;
  fecha_actualizacion?: Date;
}

/**
 * Interfaces para los resultados de cancelación
 */
interface CancelacionExitosa {
  success: true;
  message: string;
  data: {
    operacionId: number;
    tipo: string;
    movimientoId?: number;
    saldo: {
      guaranies: number;
      dolares: number;
      reales: number;
    } | null;
  };
}

interface CancelacionFallida {
  success: false;
  status: number;
  message: string;
}

type ResultadoCancelacion = CancelacionExitosa | CancelacionFallida;

/**
 * Modelo para manejar las operaciones de uso y devolución de efectivo
 */
class UsoDevolucionModel {
  /**
   * Crea un nuevo registro de uso o devolución de efectivo
   * @param data - Datos de la operación
   * @returns El registro creado
   */
  async create(data: UsoDevolucionData) {
    const {
      tipo,
      persona_id,
      persona_nombre,
      guaranies = 0,
      dolares = 0,
      reales = 0,
      motivo,
      usuario_id
    } = data;

    const guaraniesNum = BigInt(guaranies);
    const dolaresNum = new Prisma.Decimal(dolares);
    const realesNum = new Prisma.Decimal(reales);
    const fechaHoraActual = new Date(); // Usar la misma fecha/hora para todos los registros

    try {
      return await prisma.$transaction(async (prismaClient: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
        
        // 1. Crear registro usoDevolucion (sin cambios)
        console.log('[DEBUG] Creando registro usoDevolucion...');
        const resultado = await prismaClient.usoDevolucion.create({
          data: {
            tipo,
            persona: { connect: { id: persona_id } },
            persona_nombre,
            guaranies: guaraniesNum,
            dolares: dolaresNum,
            reales: realesNum,
            motivo,
            usuario: { connect: { id: usuario_id } }
          },
          include: { persona: true, usuario: true }
        });
        console.log(`[DEBUG] Registro usoDevolucion creado ID: ${resultado.id}`);

        // 2. LÓGICA CONDICIONAL: Guardar en movimientoFarmacia o saldoPersona
        if (persona_id === FARMACIA_FRANCO_PERSONA_ID) {
          // 2.a Guardar en movimientos_farmacia
          console.log(`[DEBUG] Persona ID ${persona_id} es FARMACIA FRANCO. Guardando en movimientos_farmacia...`);
          const movimientosFarmaciaPromises = [];
          const tipoMovFarmacia = resultado.tipo === 'USO' ? 'INGRESO' : 'EGRESO';
          const estadoMovFarmacia = 'CONFIRMADO';
          const conceptoMovFarmacia = `Ref Uso/Dev ${resultado.id}: ${resultado.motivo}`;

          // Movimiento PYG
          if (guaraniesNum !== BigInt(0)) {
            const montoPYG = new Decimal(tipo === 'USO' ? Math.abs(Number(guaraniesNum)) : -Math.abs(Number(guaraniesNum)));
            movimientosFarmaciaPromises.push(
              prismaClient.movimientoFarmacia.create({
                data: {
                  fechaHora: fechaHoraActual,
                  tipoMovimiento: tipoMovFarmacia,
                  concepto: conceptoMovFarmacia,
                  movimientoOrigenId: resultado.id,
                  movimientoOrigenTipo: 'USO_DEVOLUCION',
                  monto: montoPYG,
                  monedaCodigo: 'PYG',
                  estado: estadoMovFarmacia,
                  usuarioId: usuario_id
                }
              })
            );
          }
          // Movimiento USD
          if (!dolaresNum.isZero()) {
            const montoUSD = tipo === 'USO' ? dolaresNum : dolaresNum.negated();
            movimientosFarmaciaPromises.push(
              prismaClient.movimientoFarmacia.create({
                data: {
                  fechaHora: fechaHoraActual,
                  tipoMovimiento: tipoMovFarmacia,
                  concepto: conceptoMovFarmacia,
                  movimientoOrigenId: resultado.id,
                  movimientoOrigenTipo: 'USO_DEVOLUCION',
                  monto: montoUSD,
                  monedaCodigo: 'USD',
                  estado: estadoMovFarmacia,
                  usuarioId: usuario_id
                }
              })
            );
          }
          // Movimiento BRL
          if (!realesNum.isZero()) {
            const montoBRL = tipo === 'USO' ? realesNum : realesNum.negated();
            movimientosFarmaciaPromises.push(
              prismaClient.movimientoFarmacia.create({
                data: {
                  fechaHora: fechaHoraActual,
                  tipoMovimiento: tipoMovFarmacia,
                  concepto: conceptoMovFarmacia,
                  movimientoOrigenId: resultado.id,
                  movimientoOrigenTipo: 'USO_DEVOLUCION',
                  monto: montoBRL,
                  monedaCodigo: 'BRL',
                  estado: estadoMovFarmacia,
                  usuarioId: usuario_id
                }
              })
            );
          }
          await Promise.all(movimientosFarmaciaPromises);
          console.log('[DEBUG] Movimientos en movimientos_farmacia creados.');

        } else {
          // 2.b Actualizar saldo_persona (lógica original)
          console.log(`[DEBUG] Persona ID ${persona_id} NO es FARMACIA FRANCO. Actualizando saldo_persona...`);
          try {
            // El efecto en saldoPersona es INVERSO al tipo de operación:
            // USO: Persona recibe dinero -> aumenta su saldo (o disminuye su deuda)
            // DEVOLUCION: Persona entrega dinero -> disminuye su saldo (o aumenta su deuda)
            const factorSignoSaldo = tipo === 'USO' ? 1 : -1; 
            const guaraniesInc = BigInt(factorSignoSaldo) * guaraniesNum;
            const dolaresInc = factorSignoSaldo * dolaresNum.toNumber();
            const realesInc = factorSignoSaldo * realesNum.toNumber();

            const upsertResult = await prismaClient.saldoPersona.upsert({
              where: { persona_id },
              update: {
                guaranies: { increment: guaraniesInc },
                dolares: { increment: dolaresInc },
                reales: { increment: realesInc },
                fecha_actualizacion: fechaHoraActual
              },
              create: {
                persona_id,
                guaranies: guaraniesInc,
                dolares: dolaresInc,
                reales: realesInc,
                fecha_creacion: fechaHoraActual,
                fecha_actualizacion: fechaHoraActual
              }
            });
            console.log('[DEBUG] Upsert Saldo Persona completado', upsertResult);
          } catch (saldoError) {
            console.error('[DEBUG] *** ERROR específico al actualizar saldoPersona ***:', saldoError);
            throw saldoError; // Relanzar para abortar la transacción si falla la actualización del saldo
          }
        }

        // 3. Registrar movimientos en caja_mayor (sin cambios, lógica original)
        console.log('[DEBUG] Registrando movimientos en caja_mayor...');
        try {
          // USO: Es un ingreso a Caja Mayor (la persona nos presta)
          // DEVOLUCION: Es un egreso de Caja Mayor (devolvemos a la persona)
          const esIngresoCMM = tipo === 'USO';
          const conceptoCMM = `${tipo === 'USO' ? 'Préstamos de' : 'Devolvemos a'} ${persona_nombre} - ID Op: ${resultado.id}`;

          if (Number(guaraniesNum) > 0) {
             await dbUtils.registrarMovimientoCajaMayor(resultado.id, 'guaranies', Number(guaraniesNum), esIngresoCMM, conceptoCMM, usuario_id, resultado.id);
          }
          if (dolaresNum.greaterThan(0)) { 
            await dbUtils.registrarMovimientoCajaMayor(resultado.id, 'dolares', dolaresNum.toNumber(), esIngresoCMM, conceptoCMM, usuario_id, resultado.id);
          }
          if (realesNum.greaterThan(0)) { 
             await dbUtils.registrarMovimientoCajaMayor(resultado.id, 'reales', realesNum.toNumber(), esIngresoCMM, conceptoCMM, usuario_id, resultado.id);
          }
           console.log('[DEBUG] Movimientos caja_mayor registrados.');
        } catch (cajaError) {
          console.error('[DEBUG] Error al registrar movimientos en caja_mayor:', cajaError);
           throw cajaError; // Relanzar para abortar si falla el registro en caja mayor
        }

        // Retornar resultado (convirtiendo BigInt a Number para el cliente)
        return {
          ...resultado,
          guaranies: Number(resultado.guaranies)
        };
      }); // Fin Transacción
    } catch (error) {
      console.error('Error GENERAL al crear registro de uso/devolución:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las operaciones de uso y devolución
   * @param filters - Filtros para la consulta
   * @returns Lista de operaciones
   */
  async getAll(filters: UsoDevolucionFilters = {}) {
    try {
      // Construir el objeto de filtros para Prisma
      const where: any = {
        anulado: false
      };

      if (filters.persona_id) {
        where.persona_id = filters.persona_id;
      }

      if (filters.tipo) {
        where.tipo = filters.tipo;
      }

      if (filters.fecha_inicio && filters.fecha_fin) {
        where.fecha_creacion = {
          gte: new Date(filters.fecha_inicio),
          lte: new Date(filters.fecha_fin)
        };
      }

      // @ts-ignore - Ignorar errores de tipos en Prisma
      const operaciones = await prisma.usoDevolucion.findMany({
        where,
        include: {
          persona: true,
          usuario: true
        },
        orderBy: {
          fecha_creacion: 'desc'
        },
        take: filters.limit,
        skip: filters.offset
      });

      // Convertir BigInt a número para la respuesta
      return operaciones.map((op: any) => ({
        ...op,
        guaranies: Number(op.guaranies)
      }));
    } catch (error) {
      console.error('Error al obtener registros de uso/devolución:', error);
      throw error;
    }
  }

  /**
   * Obtiene un registro de uso/devolución por su ID
   * @param id - ID del registro
   * @returns Registro encontrado o null
   */
  async getById(id: number) {
    try {
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const operacion = await prisma.usoDevolucion.findUnique({
        where: { id },
        include: {
          persona: true,
          usuario: true
        }
      });

      if (!operacion) return null;

      // Convertir BigInt a número para la respuesta
      return {
        ...operacion,
        guaranies: Number(operacion.guaranies)
      };
    } catch (error) {
      console.error(`Error al obtener registro de uso/devolución ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el saldo actual de una persona
   * @param persona_id - ID de la persona
   * @returns Saldo actual
   */
  async getSaldoPersona(persona_id: number) {
    try {
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const saldo = await prisma.saldoPersona.findUnique({
        where: { persona_id }
      });

      if (!saldo) {
        // Si no existe saldo, devolver valores en cero
        return {
          persona_id,
          guaranies: 0,
          dolares: 0,
          reales: 0
        };
      }

      return {
        ...saldo,
        guaranies: Number(saldo.guaranies)
      };
    } catch (error) {
      console.error(`Error al obtener saldo de persona ID ${persona_id}:`, error);
      throw error;
    }
  }

  /**
   * Anula un registro de uso o devolución
   * @param id - ID del registro a anular
   * @param usuario_id - ID del usuario que realiza la anulación
   * @returns Resultado de la operación
   */
  async anular(id: number, usuario_id: number): Promise<boolean> {
    try {
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const operacion = await prisma.usoDevolucion.findUnique({
        where: { id }
      });

      if (!operacion || operacion.anulado) {
        return false;
      }

      // Comenzar una transacción
      const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Marcar la operación como anulada
        // @ts-ignore - Ignorar errores de tipos en Prisma (puede ser necesario si tx no tiene directamente los modelos)
        await tx.usoDevolucion.update({
          where: { id },
          data: { anulado: true }
        });

        // Revertir el efecto en el saldo según el tipo de operación
        if (operacion.tipo === 'USO') {
          // Restar lo que habíamos sumado
          // @ts-ignore - Ignorar errores de tipos en Prisma
          await tx.saldoPersona.update({
            where: { persona_id: operacion.persona_id },
            data: {
              guaranies: { decrement: Number(operacion.guaranies) },
              dolares: { decrement: Number(operacion.dolares) },
              reales: { decrement: Number(operacion.reales) },
              fecha_actualizacion: new Date()
            }
          });
        } else if (operacion.tipo === 'DEVOLUCION') {
          // Sumar lo que habíamos restado
          // @ts-ignore - Ignorar errores de tipos en Prisma
          await tx.saldoPersona.update({
            where: { persona_id: operacion.persona_id },
            data: {
              guaranies: { increment: Number(operacion.guaranies) },
              dolares: { increment: Number(operacion.dolares) },
              reales: { increment: Number(operacion.reales) },
              fecha_actualizacion: new Date()
            }
          });
        }

        try {
          // Registrar los movimientos de anulación en caja_mayor_movimientos
          // ¡IMPORTANTE! También hay que invertir la lógica aquí al anular
          // Si era USO (ingreso en caja), la anulación es un egreso de caja
          // Si era DEVOLUCION (egreso de caja), la anulación es un ingreso a caja
          const esIngresoAnulacion = operacion.tipo !== 'USO'; // USO-anulación=egreso, DEVOLUCION-anulación=ingreso

          if (Number(operacion.guaranies) > 0) {
            await dbUtils.registrarMovimientoCajaMayor(
              id,
              'guaranies',
              Number(operacion.guaranies),
              esIngresoAnulacion, // Usar lógica invertida correcta para anulación
              `Anulación de ${operacion.tipo === 'USO' ? 'préstamo de' : 'devolución a'} ${operacion.persona_nombre} ID: ${id}`,
              usuario_id,
              id
            );
          }
          if (Number(operacion.dolares) > 0) {
             await dbUtils.registrarMovimientoCajaMayor(
              id,
              'dolares',
              Number(operacion.dolares),
              esIngresoAnulacion, // Usar lógica invertida correcta para anulación
              `Anulación de ${operacion.tipo === 'USO' ? 'préstamo de' : 'devolución a'} ${operacion.persona_nombre} ID: ${id}`,
              usuario_id,
              id
            );
          }
          if (Number(operacion.reales) > 0) {
             await dbUtils.registrarMovimientoCajaMayor(
              id,
              'reales',
              Number(operacion.reales),
              esIngresoAnulacion, // Usar lógica invertida correcta para anulación
              `Anulación de ${operacion.tipo === 'USO' ? 'préstamo de' : 'devolución a'} ${operacion.persona_nombre} ID: ${id}`,
              usuario_id,
              id
            );
          }
        } catch (error) {
          console.error('Error al registrar movimientos de anulación:', error);
          // Continuamos con la transacción aunque falle esto
        }
        
        return true;
      });

      return resultado;
    } catch (error) {
      console.error(`Error al anular registro de uso/devolución ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de operaciones de una persona
   * @param persona_id - ID de la persona
   * @returns Historial de operaciones
   */
  async getHistorialPersona(persona_id: number) {
    try {
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const historial = await prisma.usoDevolucion.findMany({
        where: {
          persona_id,
          anulado: false
        },
        include: {
          usuario: true
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      // Convertir BigInt a número para la respuesta
      return historial.map((op: any) => ({
        ...op,
        guaranies: Number(op.guaranies)
      }));
    } catch (error) {
      console.error(`Error al obtener historial de persona ID ${persona_id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene una operación específica por el ID del movimiento asociado en caja_mayor_movimientos
   * @param movimientoId - ID del movimiento en caja_mayor_movimientos
   * @returns La operación encontrada o null
   */
  async getByMovimientoId(movimientoId: number) {
    try {
      // Primero buscamos el movimiento para obtener información sobre la operación
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const movimiento = await prisma.cajaMayorMovimiento.findFirst({
        where: { 
          id: movimientoId,
          tipo: 'Uso y devolución' 
        }
      });

      if (!movimiento) {
        return null;
      }

      // Criterio de búsqueda base
      const whereCondition: any = {
        OR: []
      };
      
      // Si el movimiento tiene usoDevolucionId, lo usamos como criterio principal
      if (movimiento.usoDevolucionId) {
        whereCondition.OR.push({ id: movimiento.usoDevolucionId });
      }
      
      // Siempre agregamos el criterio de fecha cercana como respaldo
      whereCondition.OR.push({
        AND: [
          { fecha_creacion: { gte: new Date(new Date(movimiento.fechaHora).getTime() - 60000) } }, // 1 minuto antes
          { fecha_creacion: { lte: new Date(new Date(movimiento.fechaHora).getTime() + 60000) } }  // 1 minuto después
        ]
      });

      // Buscar la operación de uso/devolución relacionada
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const operacion = await prisma.usoDevolucion.findFirst({
        where: whereCondition,
        include: {
          persona: true,
          usuario: true
        }
      });

      if (!operacion) {
        return null;
      }

      // Convertir BigInt a número para la respuesta
      return {
        ...operacion,
        guaranies: Number(operacion.guaranies),
        cajaMayorMovimiento: movimiento
      };
    } catch (error) {
      console.error(`Error al obtener operación por movimientoId ${movimientoId}:`, error);
      throw error;
    }
  }

  /**
   * Cancela una operación de uso/devolución generando un movimiento inverso
   * @param id - ID de la operación a cancelar
   * @param usuario_id - ID del usuario que realiza la cancelación
   * @param razon - Razón de la cancelación
   * @returns Objeto con el resultado de la cancelación
   */
  async cancelar(id: number, usuario_id: number, razon: string = 'Cancelación'): Promise<ResultadoCancelacion> {
    try {
      // 1. Buscar y verificar la operación
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const operacion = await prisma.usoDevolucion.findUnique({
        where: { id },
        include: {
          persona: true
        }
      });

      if (!operacion) {
        return {
          success: false as const,
          status: 404,
          message: 'Operación no encontrada'
        };
      }

      if (operacion.anulado) {
        return {
          success: false as const,
          status: 400,
          message: 'Esta operación ya ha sido anulada'
        };
      }

      // 2. Comenzar una transacción
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 3. Marcar la operación original como anulada
        // @ts-ignore - Ignorar errores de tipos en Prisma
        await tx.usoDevolucion.update({
          where: { id },
          data: { anulado: true }
        });

        // 4. Revertir el efecto en el saldo según el tipo de operación
        // En Uso, habíamos aumentado el saldo, por lo que ahora hay que restar
        // En Devolución, habíamos disminuido el saldo, por lo que ahora hay que sumar
        if (operacion.tipo === 'USO') {
          // Restar lo que habíamos sumado
          // @ts-ignore - Ignorar errores de tipos en Prisma
          await tx.saldoPersona.update({
            where: { persona_id: operacion.persona_id },
            data: {
              guaranies: { decrement: Number(operacion.guaranies) },
              dolares: { decrement: Number(operacion.dolares) },
              reales: { decrement: Number(operacion.reales) },
              fecha_actualizacion: new Date()
            }
          });
        } else if (operacion.tipo === 'DEVOLUCION') {
          // Sumar lo que habíamos restado
          // @ts-ignore - Ignorar errores de tipos en Prisma
          await tx.saldoPersona.update({
            where: { persona_id: operacion.persona_id },
            data: {
              guaranies: { increment: Number(operacion.guaranies) },
              dolares: { increment: Number(operacion.dolares) },
              reales: { increment: Number(operacion.reales) },
              fecha_actualizacion: new Date()
            }
          });
        }

        // 5. Crear entrada de movimiento en caja_mayor_movimientos
        let movimientoNuevo;
        try {
          // Para cajaMayorMovimientos, invertimos la lógica del esIngreso:
          // - Si era USO (ingreso de caja), ahora es egreso
          // - Si era DEVOLUCION (egreso de caja), ahora es ingreso
          const concepto = `Cancelación de ${operacion.tipo === 'USO' ? 'préstamo de' : 'devolución a'} ${operacion.persona?.nombreCompleto || 'persona'} ID: ${operacion.id}`;
          const esIngresoMovimiento = operacion.tipo !== 'USO'; // Se invierte la lógica para que la cancelación de USO sea un egreso
          
          console.log('DEBUG - Cancelación - Tipo operación:', operacion.tipo);
          console.log('DEBUG - Cancelación - Es Ingreso Movimiento:', esIngresoMovimiento);

          // Buscar último movimiento para guaraníes
          // @ts-ignore - Ignorar errores de tipos en Prisma
          const ultimoMovGuaranies = await tx.cajaMayorMovimiento.findFirst({
            where: { moneda: 'guaranies' },
            orderBy: { id: 'desc' },
            select: { saldoActual: true }
          });

          // Buscar último movimiento para dólares
          // @ts-ignore - Ignorar errores de tipos en Prisma
          const ultimoMovDolares = await tx.cajaMayorMovimiento.findFirst({
            where: { moneda: 'dolares' },
            orderBy: { id: 'desc' },
            select: { saldoActual: true }
          });

          // Buscar último movimiento para reales
          // @ts-ignore - Ignorar errores de tipos en Prisma
          const ultimoMovReales = await tx.cajaMayorMovimiento.findFirst({
            where: { moneda: 'reales' },
            orderBy: { id: 'desc' },
            select: { saldoActual: true }
          });

          const movimientos = [];

          // Crear movimiento para guaraníes si hay monto
          if (Number(operacion.guaranies) > 0) {
            const saldoAnteriorGs = ultimoMovGuaranies ? Number(ultimoMovGuaranies.saldoActual) : 0;
            const montoGs = Number(operacion.guaranies);
            // Si es USO (que era ingreso), la cancelación es un egreso, por lo que restamos del saldo
            // Si es DEVOLUCION (que era egreso), la cancelación es un ingreso, por lo que sumamos al saldo
            const saldoActualGs = operacion.tipo === 'USO' 
              ? saldoAnteriorGs - montoGs  // Cancelar USO: restar del saldo (egreso)
              : saldoAnteriorGs + montoGs; // Cancelar DEVOLUCION: sumar al saldo (ingreso)

            movimientos.push({
              fechaHora: new Date(),
              tipo: 'Uso y Devolucion',
              operacionId: id.toString(),
              moneda: 'guaranies',
              monto: montoGs,
              esIngreso: esIngresoMovimiento, // USO-cancelación=egreso, DEVOLUCION-cancelación=ingreso
              saldoAnterior: saldoAnteriorGs,
              saldoActual: saldoActualGs,
              concepto,
              usuarioId: usuario_id,
              observaciones: razon,
              usoDevolucionId: id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          // Crear movimiento para dólares si hay monto
          if (Number(operacion.dolares) > 0) {
            const saldoAnteriorUsd = ultimoMovDolares ? Number(ultimoMovDolares.saldoActual) : 0;
            const montoUsd = Number(operacion.dolares);
            // Si es USO (que era ingreso), la cancelación es un egreso, por lo que restamos del saldo
            // Si es DEVOLUCION (que era egreso), la cancelación es un ingreso, por lo que sumamos al saldo
            const saldoActualUsd = operacion.tipo === 'USO' 
              ? saldoAnteriorUsd - montoUsd  // Cancelar USO: restar del saldo (egreso)
              : saldoAnteriorUsd + montoUsd; // Cancelar DEVOLUCION: sumar al saldo (ingreso)

            movimientos.push({
              fechaHora: new Date(),
              tipo: 'Uso y Devolucion',
              operacionId: id.toString(),
              moneda: 'dolares',
              monto: montoUsd,
              esIngreso: esIngresoMovimiento, // USO-cancelación=egreso, DEVOLUCION-cancelación=ingreso
              saldoAnterior: saldoAnteriorUsd,
              saldoActual: saldoActualUsd,
              concepto,
              usuarioId: usuario_id,
              observaciones: razon,
              usoDevolucionId: id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          // Crear movimiento para reales si hay monto
          if (Number(operacion.reales) > 0) {
            const saldoAnteriorBrl = ultimoMovReales ? Number(ultimoMovReales.saldoActual) : 0;
            const montoBrl = Number(operacion.reales);
            // Si es USO (que era ingreso), la cancelación es un egreso, por lo que restamos del saldo
            // Si es DEVOLUCION (que era egreso), la cancelación es un ingreso, por lo que sumamos al saldo
            const saldoActualBrl = operacion.tipo === 'USO' 
              ? saldoAnteriorBrl - montoBrl  // Cancelar USO: restar del saldo (egreso)
              : saldoAnteriorBrl + montoBrl; // Cancelar DEVOLUCION: sumar al saldo (ingreso)

            movimientos.push({
              fechaHora: new Date(),
              tipo: 'Uso y Devolucion',
              operacionId: id.toString(),
              moneda: 'reales',
              monto: montoBrl,
              esIngreso: esIngresoMovimiento, // USO-cancelación=egreso, DEVOLUCION-cancelación=ingreso
              saldoAnterior: saldoAnteriorBrl,
              saldoActual: saldoActualBrl,
              concepto,
              usuarioId: usuario_id,
              observaciones: razon,
              usoDevolucionId: id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          // Crear los movimientos
          // @ts-ignore - Ignorar errores de tipos en Prisma
          const resultadosMovimientos = await Promise.all(movimientos.map(mov => tx.cajaMayorMovimiento.create({ data: mov })));
          movimientoNuevo = resultadosMovimientos[0]; // Guardar el primer movimiento para retornarlo
        } catch (error) {
          console.error('Error al registrar movimientos de cancelación:', error);
          throw error;
        }

        // 6. Recuperar el saldo actualizado
        // @ts-ignore - Ignorar errores de tipos en Prisma
        const saldoActualizado = await tx.saldoPersona.findUnique({
          where: { persona_id: operacion.persona_id }
        });

        return {
          success: true as const,
          message: 'Operación cancelada correctamente',
          data: {
            operacionId: id,
            tipo: operacion.tipo,
            movimientoId: movimientoNuevo?.id,
            saldo: saldoActualizado ? {
              guaranies: Number(saldoActualizado.guaranies),
              dolares: Number(saldoActualizado.dolares),
              reales: Number(saldoActualizado.reales)
            } : null
          }
        };
      });
    } catch (error) {
      console.error(`Error al cancelar operación ID ${id}:`, error);
      return {
        success: false as const,
        status: 500,
        message: error instanceof Error ? error.message : 'Error desconocido al cancelar la operación'
      };
    }
  }

  /**
   * Obtiene todas las personas que tienen algún saldo pendiente (no cero)
   * @returns Lista de saldos de personas con datos de persona incluidos
   */
  async getPersonasConSaldo() {
    try {
      // @ts-ignore - Ignorar errores de tipos en Prisma
      const saldos = await prisma.saldoPersona.findMany({
        where: {
          OR: [
            { guaranies: { not: 0 } },
            { dolares: { not: 0 } },
            { reales: { not: 0 } },
          ],
        },
        include: {
          persona: {
            select: {
              nombreCompleto: true,
              documento: true,
            },
          },
        },
        orderBy: {
          persona: {
            nombreCompleto: 'asc',
          },
        },
      });

      // Mapear para incluir nombre y documento en el objeto principal y convertir BigInt
      return saldos.map(saldo => ({
        ...saldo,
        guaranies: Number(saldo.guaranies),
        nombre_completo: saldo.persona.nombreCompleto,
        documento: saldo.persona.documento,
        // Remover el objeto persona anidado si no se necesita
        persona: undefined,
      }));
    } catch (error) {
      console.error('Error al obtener personas con saldo:', error);
      throw error;
    }
  }
}

export default new UsoDevolucionModel(); 
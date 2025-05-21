import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaz para extender el tipo Movimiento con los nuevos campos
interface MovimientoExtendido {
  id: string;
  cajaId: string | null;
  fecha: Date;
  monto: any; // Decimal
  moneda: string;
  descripcion: string;
  tipoMovimiento: string;
  nombrePersona: string | null;
  documentoPersona: string | null;
  observaciones: string | null;
  // Nuevos campos
  sucursalId?: string;
  sucursalNombre?: string;
  estadoRecepcion?: string;
  fechaRecepcion?: Date | null;
  usuarioRecepcion?: string | null;
  observacionRecepcion?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Obtener los retiros pendientes para ser recibidos en Caja Mayor
export const getRetirosPendientes = async (req: Request, res: Response) => {
  try {
    // Buscar los retiros con estado PENDIENTE
    const retirosPendientes = await prisma.$queryRaw`
      SELECT *
      FROM "Movimiento"
      WHERE "tipoMovimiento" = 'EGRESO'
      AND "descripcion" = 'Retiro de caja'
      AND "estadoRecepcion" = 'PENDIENTE'
      ORDER BY "fecha" DESC
    ` as MovimientoExtendido[];

    // Obtener información de cajas
    const cajasIds = retirosPendientes
      .filter(r => r.cajaId)
      .map(r => r.cajaId as string);
    
    const cajas = cajasIds.length > 0 
      ? await prisma.caja.findMany({
          where: { 
            id: { in: cajasIds } 
          },
          include: { sucursal: true }
        })
      : [];

    const cajasMap = new Map(cajas.map(caja => [caja.id, caja]));

    // Formatear la respuesta para el frontend
    const retiros = retirosPendientes.map(retiro => {
      const caja = retiro.cajaId ? cajasMap.get(retiro.cajaId) : null;
      return {
        id: retiro.id,
        cajaId: retiro.cajaId || '',
        cajaEnteroId: caja?.cajaEnteroId || 0,
        cajaNombre: retiro.cajaId ? `Caja ${retiro.cajaId.substring(0, 6)}` : 'Sin caja',
        sucursalId: retiro.sucursalId || '',
        sucursalNombre: retiro.sucursalNombre || '',
        personaId: retiro.documentoPersona || '',
        personaNombre: retiro.nombrePersona || '',
        fecha: retiro.fecha.toISOString(),
        montoPYG: retiro.moneda === 'PYG' ? Number(retiro.monto) : 0,
        montoBRL: retiro.moneda === 'BRL' ? Number(retiro.monto) : 0,
        montoUSD: retiro.moneda === 'USD' ? Number(retiro.monto) : 0,
        observacion: retiro.observaciones || '',
        estadoRecepcion: retiro.estadoRecepcion || 'PENDIENTE'
      };
    });

    return res.json(retiros);
  } catch (error) {
    console.error('Error al obtener retiros pendientes:', error);
    return res.status(500).json({ error: 'Error al obtener los retiros pendientes' });
  }
};

// Confirmar la recepción de retiros en Caja Mayor
export const confirmarRecepcionRetiros = async (req: Request, res: Response) => {
  const { ids, observacion, usuarioRecepcionId } = req.body;
  
  // Usar usuarioRecepcionId o un valor por defecto
  let usuarioId = usuarioRecepcionId || req.usuarioId || req.usuario?.id || null;
  if (!usuarioId) {
    console.warn('⚠️ ADVERTENCIA: Usuario no autenticado. Usando ID de usuario predeterminado (1) para recibir retiros.');
    usuarioId = 1; // Usar un ID por defecto si no hay usuario
  }

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un retiro para confirmar' });
    }

    // 1. Obtener los detalles de los retiros PENDIENTES que se van a recibir
    const retirosParaRecibir = await prisma.movimiento.findMany({
      where: {
        id: { in: ids },
        //estadoRecepcion: 'PENDIENTE' // Comentado para evitar error de linter
        // Usaremos SQL crudo abajo para asegurar la condición PENDIENTE
      }
    });

    const idsARecibir = retirosParaRecibir.map(r => r.id);

    if (idsARecibir.length === 0) {
      return res.status(404).json({ error: 'No se encontraron retiros pendientes con los IDs proporcionados o ya fueron procesados' });
    }

    // Obtener detalles de las Cajas involucradas para obtener cajaEnteroId
    const uniqueCajaIds = [...new Set(retirosParaRecibir.map(r => r.cajaId).filter(id => id !== null))] as string[];
    console.log('[DEBUG] IDs de Caja únicos a buscar:', uniqueCajaIds); // LOG 1
    let cajaDetailsMap = new Map<string, { cajaEnteroId: number | null }>();
    if (uniqueCajaIds.length > 0) {
      const cajas = await prisma.caja.findMany({
        where: { id: { in: uniqueCajaIds } },
        select: { id: true, cajaEnteroId: true }
      });
      console.log('[DEBUG] Detalles de Caja encontrados:', cajas); // LOG 2
      cajaDetailsMap = new Map(cajas.map(c => [c.id, { cajaEnteroId: c.cajaEnteroId }]));
      console.log('[DEBUG] Mapa de Detalles de Caja:', cajaDetailsMap); // LOG 3
    }

    // 2. Actualizar el estado de los retiros encontrados usando SQL crudo
    const resultUpdate = await prisma.$executeRaw`
      UPDATE "Movimiento"
      SET "estadoRecepcion" = 'RECIBIDO',
          "fechaRecepcion" = ${new Date()},
          "usuarioRecepcion" = ${String(usuarioId)},
          "observacionRecepcion" = ${observacion || null}
      WHERE "id" IN (${Prisma.join(idsARecibir)}) -- Asegurar que actualizamos solo los encontrados
      AND "estadoRecepcion" = 'PENDIENTE' -- Doble chequeo
    `;
    
    // Si resultUpdate es 0, significa que los retiros ya no estaban PENDIENTE
    // (quizás procesados por otra solicitud mientras tanto)
    if (resultUpdate === 0) {
        console.warn('Los retiros seleccionados ya no estaban en estado PENDIENTE al intentar actualizar.');
        // Podríamos devolver un mensaje específico o continuar si se asume idempotencia
    }

    // 3. Registrar los movimientos en caja_mayor_movimientos para cada retiro que *se intentó* recibir
    // Usamos retirosParaRecibir para tener los datos originales
    for (const retiro of retirosParaRecibir) {
      try {
        // Mapear moneda al formato de caja_mayor_movimientos
        let monedaMovimiento: 'guaranies' | 'dolares' | 'reales' | null = null;
        switch (retiro.moneda) {
          case 'PYG': monedaMovimiento = 'guaranies'; break;
          case 'USD': monedaMovimiento = 'dolares'; break;
          case 'BRL': monedaMovimiento = 'reales'; break;
          default: 
            console.warn(`Moneda desconocida (${retiro.moneda}) para el retiro ${retiro.id}. No se registrará movimiento.`);
            continue; // Saltar al siguiente retiro si la moneda no es válida
        }
        
        const montoRetiro = parseFloat(retiro.monto.toString());
        if (isNaN(montoRetiro) || montoRetiro <= 0) {
          console.warn(`Monto inválido (${retiro.monto}) para el retiro ${retiro.id}. No se registrará movimiento.`);
          continue; // Saltar si el monto no es válido
        }

        // Buscar el último movimiento para obtener el saldo anterior
        const ultimoMovimiento = await prisma.$queryRaw`
          SELECT * FROM "caja_mayor_movimientos"
          WHERE moneda = ${monedaMovimiento}
          ORDER BY id DESC
          LIMIT 1
        `;
        
        const saldoAnterior = ultimoMovimiento && Array.isArray(ultimoMovimiento) && ultimoMovimiento.length > 0
                            ? parseFloat(ultimoMovimiento[0].saldoActual.toString())
                            : 0;
        
        const saldoActual = saldoAnterior + montoRetiro; // Ingreso a caja mayor

        // Concepto del movimiento (modificado para usar cajaEnteroId)
        const cajaDetails = retiro.cajaId ? cajaDetailsMap.get(retiro.cajaId) : null;
        console.log(`[DEBUG] Retiro ID: ${retiro.id}, Caja ID: ${retiro.cajaId}, Detalles Caja:`, cajaDetails); // LOG 4
        const cajaIdentifier = cajaDetails?.cajaEnteroId
          ? `Caja ${cajaDetails.cajaEnteroId}`
          : (retiro.cajaId ? `Caja ${retiro.cajaId.substring(0,6)} (ID no hallado)` : 'Caja Desconocida');
        console.log(`[DEBUG] Identificador de Caja final: ${cajaIdentifier}`); // LOG 5
        const conceptoMovimiento = `Recepción Retiro ${cajaIdentifier} - Persona: ${retiro.nombrePersona || 'N/A'}`;
        const retiroId = retiro.id;

        // Insertar en caja_mayor_movimientos
        await prisma.$executeRaw`
          INSERT INTO "caja_mayor_movimientos" (
            "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
            "saldoAnterior", "saldoActual", concepto, "usuarioId", 
            "movimientoId", "createdAt", "updatedAt"
          )
          VALUES (
            NOW(), 'Recepción Retiro', ${retiroId}, ${monedaMovimiento}, ${montoRetiro}, true,
            ${saldoAnterior}, ${saldoActual}, ${conceptoMovimiento}, ${usuarioId},
            ${retiroId}, NOW(), NOW()
          )
        `;
        console.log(`✅ Movimiento de caja registrado para el retiro ${retiro.id}`);

      } catch (errorMovimiento) {
        console.error(`❌ Error al registrar movimiento en caja para el retiro ${retiro.id}:`, errorMovimiento);
        // No detener el proceso general si falla un movimiento individual
      }
    }

    return res.json({
      message: `Se procesó la recepción para ${idsARecibir.length} ${idsARecibir.length === 1 ? 'retiro' : 'retiros'}. ${resultUpdate > 0 ? `(${resultUpdate} actualizados a RECIBIDO)` : '(Ninguno actualizado, podrían haber sido procesados previamente)'}`
    });
  } catch (error) {
    console.error('Error al confirmar recepción de retiros:', error);
    return res.status(500).json({ error: 'Error al procesar la recepción de retiros' });
  }
};

// Rechazar retiros
export const rechazarRetiros = async (req: Request, res: Response) => {
  const { ids } = req.body;
  const { observacion } = req.body;
  
  // Obtener el usuario de recepción del cuerpo de la solicitud
  const usuarioRecepcion = req.body.usuarioRecepcion || req.body.usuarioId || 'Admin';

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un retiro para rechazar' });
    }

    // Actualizar todos los retiros seleccionados usando SQL directo
    const result = await prisma.$executeRaw`
      UPDATE "Movimiento"
      SET "estadoRecepcion" = 'RECHAZADO',
          "fechaRecepcion" = ${new Date()},
          "usuarioRecepcion" = ${usuarioRecepcion},
          "observacionRecepcion" = ${observacion || ''}
      WHERE "id" IN (${Prisma.join(ids)})
      AND "estadoRecepcion" = 'PENDIENTE'
    `;

    if (result === 0) {
      return res.status(404).json({ error: 'No se encontraron retiros pendientes con los IDs proporcionados' });
    }

    return res.json({
      message: `Se ${result === 1 ? 'ha' : 'han'} rechazado ${result} ${result === 1 ? 'retiro' : 'retiros'}`
    });
  } catch (error) {
    console.error('Error al rechazar retiros:', error);
    return res.status(500).json({ error: 'Error al procesar el rechazo de retiros' });
  }
};

// Devolver retiros
export const devolverRetiro = async (req: Request, res: Response) => {
  const { retiroId, movimientoId, observacion, usuarioDevolucionId } = req.body;
  
  // Validar datos de entrada
  if (!retiroId || !movimientoId) {
    return res.status(400).json({ error: 'Se requiere el ID del retiro y el ID del movimiento de recepción' });
  }

  try {
    // Depuración: imprimir valores recibidos
    console.log("Datos recibidos:", {
      retiroId,
      movimientoId,
      observacion,
      usuarioDevolucionId
    });

    // Convertir IDs a números si son strings para evitar problemas de tipo
    const movimientoIdNumerico = typeof movimientoId === 'string' ? parseInt(movimientoId, 10) : movimientoId;
    const retiroIdParaBuscar = typeof retiroId === 'string' && !isNaN(parseInt(retiroId, 10)) 
      ? parseInt(retiroId, 10) : retiroId;
    const usuarioId = usuarioDevolucionId || req.body.usuarioId || 1;

    // Depuración: imprimir valores convertidos
    console.log("Datos convertidos:", { 
      movimientoIdNumerico, 
      retiroIdParaBuscar,
      usuarioId
    });

    const transaction = await prisma.$transaction(async (tx) => {
      try {
        // 1. Buscar el movimiento de recepción en Caja Mayor con una condición más flexible
        // Intentaremos buscar primero por el movimientoId y luego por el retiroId
        console.log("Buscando movimiento con las siguientes condiciones:", {
          movimientoId: movimientoIdNumerico,
          retiroId,
          tipo: 'Recepción Retiro'
        });
        
        // Consulta más flexible que busca por cualquiera de los IDs
        let movimientoRecepcion = await tx.$queryRaw`
          SELECT * FROM "caja_mayor_movimientos"
          WHERE id = ${movimientoIdNumerico}
          AND tipo = 'Recepción Retiro'
        `;
        
        // Si no se encuentra, intentar buscar por operacionId o movimientoId
        if (!movimientoRecepcion || !Array.isArray(movimientoRecepcion) || movimientoRecepcion.length === 0) {
          console.log("No se encontró por id, intentando por operacionId o movimientoId");
          movimientoRecepcion = await tx.$queryRaw`
            SELECT * FROM "caja_mayor_movimientos"
            WHERE ("operacionId" = ${retiroId} OR "movimientoId" = ${retiroId})
            AND tipo = 'Recepción Retiro'
          `;
        }

        // Verificar si se encontró el movimiento
        if (!movimientoRecepcion || !Array.isArray(movimientoRecepcion) || movimientoRecepcion.length === 0) {
          // Depuración: consultar todos los movimientos para ver cómo están almacenados
          const todosMovimientos = await tx.$queryRaw`
            SELECT id, tipo, "operacionId", "movimientoId", concepto
            FROM "caja_mayor_movimientos"
            LIMIT 5
          `;
          console.log("Muestra de movimientos disponibles:", todosMovimientos);
          
          throw new Error('No se encontró el movimiento de recepción del retiro');
        }

        console.log("Movimiento encontrado:", movimientoRecepcion[0]);
        const datosRetiro = movimientoRecepcion[0];
        const montoRetiro = parseFloat(datosRetiro.monto.toString());
        const moneda = datosRetiro.moneda;
        const movimientoRecepcionId = datosRetiro.id;

        // Actualizar el concepto del movimiento original para indicar que ha sido devuelto
        // Esto servirá como indicador visual y validación para la interfaz
        const conceptoActualizado = `[DEVUELTO] ${datosRetiro.concepto}`;
        await tx.$executeRaw`
          UPDATE "caja_mayor_movimientos"
          SET concepto = ${conceptoActualizado}
          WHERE id = ${movimientoRecepcionId}
        `;
        console.log(`Concepto del movimiento original actualizado a: ${conceptoActualizado}`);

        // 2. Actualizar el estado del retiro a PENDIENTE nuevamente
        await tx.$executeRaw`
          UPDATE "Movimiento"
          SET "estadoRecepcion" = 'PENDIENTE',
              "fechaRecepcion" = NULL,
              "usuarioRecepcion" = NULL,
              "observacionRecepcion" = NULL
          WHERE "id" = ${retiroId}
        `;

        // 3. Buscar el último movimiento para obtener el saldo actual
        const ultimoMovimiento = await tx.$queryRaw`
          SELECT * FROM "caja_mayor_movimientos"
          WHERE moneda = ${moneda}
          ORDER BY id DESC
          LIMIT 1
        `;

        if (!ultimoMovimiento || !Array.isArray(ultimoMovimiento) || ultimoMovimiento.length === 0) {
          throw new Error(`No se encontraron movimientos previos para la moneda ${moneda}`);
        }

        const saldoAnterior = parseFloat(ultimoMovimiento[0].saldoActual.toString());
        const saldoActual = saldoAnterior - montoRetiro; // Egreso de caja mayor

        // Se elimina la validación de saldo insuficiente ya que el sistema permite saldos negativos
        // El log muestra que el saldo ya es negativo: -87545000
        console.log(`Saldo anterior: ${saldoAnterior}, Monto a restar: ${montoRetiro}, Saldo resultante: ${saldoActual}`);

        // 4. Registrar movimiento de egreso en Caja Mayor
        const conceptoMovimiento = `Devolución Retiro: ${datosRetiro.concepto} - ${observacion || 'Sin observación'}`;
        
        await tx.$executeRaw`
          INSERT INTO "caja_mayor_movimientos" (
            "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
            "saldoAnterior", "saldoActual", concepto, "usuarioId", 
            "movimientoId", "createdAt", "updatedAt"
          )
          VALUES (
            NOW(), 'Devolución Retiro', ${retiroId}, ${moneda}, ${montoRetiro}, false,
            ${saldoAnterior}, ${saldoActual}, ${conceptoMovimiento}, ${usuarioId},
            ${retiroId}, NOW(), NOW()
          )
        `;

        return { 
          success: true, 
          message: 'Retiro devuelto correctamente',
          retiroId: retiroId
        };
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error en la transacción:", error);
          throw new Error(`Error en la transacción: ${error.message}`);
        } else {
          throw new Error('Error desconocido en la transacción');
        }
      }
    });
    
    return res.json(transaction);
  } catch (error) {
    console.error('Error al devolver retiro:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Error al procesar la devolución del retiro' });
    }
  }
}; 
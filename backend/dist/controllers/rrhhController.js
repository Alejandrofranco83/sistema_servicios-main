"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reabrirMes = exports.finalizarMes = exports.getMesEstado = exports.deleteMovimientoRRHH = exports.getMovimientosRRHH = exports.createMovimientoRRHH = void 0;
// import prisma from '../client'; // Ruta anterior
// import prisma from '../db'; // Intento anterior
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient(); // Instanciar cliente aquí
const tiposMovimientoValidos = [
    'Bonificacion',
    'Descuento',
    'Multa',
    'Compras',
    'Adelanto',
    'Jornales',
    'IPS'
];
const monedasValidas = ['GS', 'USD', 'BRL'];
const createMovimientoRRHH = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Obtener el ID del usuario desde el middleware de autenticación
    const usuarioId = req.usuarioId;
    if (!usuarioId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    const { personaId, mes, anio, tipo, observacion, moneda, monto } = req.body;
    // Convertir observación a mayúsculas
    const observacionMayusculas = observacion ? observacion.toUpperCase() : '';
    // --- Validación básica --- 
    if (!personaId || !mes || !anio || !tipo || !moneda || monto === undefined || monto === null) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }
    if (typeof personaId !== 'number' || typeof mes !== 'number' || typeof anio !== 'number') {
        return res.status(400).json({ message: 'IDs, mes y año deben ser números.' });
    }
    if (!tiposMovimientoValidos.includes(tipo)) {
        return res.status(400).json({ message: `Tipo de movimiento inválido: ${tipo}` });
    }
    if (!monedasValidas.includes(moneda)) {
        return res.status(400).json({ message: `Moneda inválida: ${moneda}` });
    }
    const montoDecimal = new library_1.Decimal(monto);
    if (isNaN(montoDecimal.toNumber())) {
        return res.status(400).json({ message: 'Monto inválido.' });
    }
    // --- Fin Validación --- 
    try {
        // Verificar que la persona exista
        const personaExists = yield prisma.persona.findUnique({
            where: { id: personaId },
        });
        if (!personaExists) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }
        const nuevoMovimiento = yield prisma.movimientoRRHH.create({
            data: {
                personaId,
                mes,
                anio,
                tipo,
                observacion: observacionMayusculas,
                moneda,
                monto: montoDecimal,
                usuarioId: usuarioId,
            },
        });
        // Mapear el campo observacion a descripcion para mantener consistencia en el frontend
        const movimientoResponse = Object.assign(Object.assign({}, nuevoMovimiento), { descripcion: nuevoMovimiento.observacion });
        res.status(201).json(movimientoResponse);
    }
    catch (error) {
        console.error("Error al crear movimiento RRHH:", error);
        // Manejo de errores específicos de Prisma (ej. constraint violation)
        if (error instanceof Error && error.code === 'P2003') { // Foreign key constraint failed
            return res.status(400).json({ message: 'Error de clave foránea. Verifique que la persona y el usuario existan.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al guardar el movimiento.' });
    }
});
exports.createMovimientoRRHH = createMovimientoRRHH;
// --- Nueva función para obtener movimientos --- 
const getMovimientosRRHH = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { personaId } = req.params;
    const { mes, anio } = req.query; // Obtener mes y año de query params
    // Validar IDs y query params
    const numPersonaId = parseInt(personaId, 10);
    const numMes = mes ? parseInt(mes, 10) : undefined;
    const numAnio = anio ? parseInt(anio, 10) : undefined;
    console.log(`[INFO] Consultando movimientos para personaId=${numPersonaId}, mes=${numMes}, anio=${numAnio}`);
    if (isNaN(numPersonaId)) {
        return res.status(400).json({ message: 'El ID de persona debe ser un número.' });
    }
    if (numMes === undefined || isNaN(numMes) || numMes < 1 || numMes > 12) {
        return res.status(400).json({ message: 'El parámetro "mes" es requerido y debe ser un número entre 1 y 12.' });
    }
    if (numAnio === undefined || isNaN(numAnio)) {
        return res.status(400).json({ message: 'El parámetro "anio" es requerido y debe ser un número.' });
    }
    try {
        // Verificar primero si el mes está finalizado
        const resumenMes = yield prisma.$queryRaw `
            SELECT id, finalizado, "cotizaciones_usadas" as "cotizacionesUsadas"
            FROM "resumenes_mes_rrhh"
            WHERE "persona_id" = ${numPersonaId}
            AND mes = ${numMes}
            AND anio = ${numAnio}
        `;
        const mesFinalizado = Array.isArray(resumenMes) && resumenMes.length > 0 && resumenMes[0].finalizado;
        const resumenId = mesFinalizado ? resumenMes[0].id : null;
        const cotizacionesUsadas = mesFinalizado ? resumenMes[0].cotizacionesUsadas : null;
        // Si el mes está finalizado, obtener los datos de la tabla de finalizados
        if (mesFinalizado && resumenId) {
            console.log(`[INFO] Mes finalizado. Obteniendo datos de tabla movimientos_rrhh_finalizados para resumenId=${resumenId}`);
            const movimientosFinalizados = yield prisma.$queryRaw `
                SELECT 
                    id, 
                    fecha, 
                    tipo, 
                    observacion as descripcion, 
                    moneda, 
                    monto,
                    "monto_convertido_gs" as montoConvertidoGS,
                    "persona_id" as "personaId", 
                    mes, 
                    anio
                FROM "movimientos_rrhh_finalizados"
                WHERE "resumen_mes_id" = ${resumenId}
                ORDER BY fecha ASC
            `;
            // Agregar información de monto convertido a los resultados para monedas extranjeras
            const resultadosFormateados = movimientosFinalizados.map(mov => {
                // Si la moneda no es GS/PYG y tenemos el monto convertido, lo incluimos
                if ((mov.moneda !== 'GS' && mov.moneda !== 'PYG') && mov.montoConvertidoGS) {
                    return Object.assign(Object.assign({}, mov), { montoConvertidoGS: mov.montoConvertidoGS.toString() });
                }
                return mov;
            });
            // Agregar información del resumen
            const resumenCompleto = yield prisma.$queryRaw `
                SELECT 
                    "total_gs" as "totalGS",
                    "total_usd" as "totalUSD",
                    "total_brl" as "totalBRL",
                    "total_final_gs" as "totalFinalGS"
                FROM "resumenes_mes_rrhh"
                WHERE id = ${resumenId}
            `;
            return res.status(200).json({
                movimientos: resultadosFormateados,
                mesFinalizado: true,
                resumen: resumenCompleto.length > 0 ? {
                    totalGS: resumenCompleto[0].totalGS.toString(),
                    totalUSD: resumenCompleto[0].totalUSD.toString(),
                    totalBRL: resumenCompleto[0].totalBRL.toString(),
                    totalFinalGS: resumenCompleto[0].totalFinalGS.toString(),
                    // Desglose del cálculo
                    calculo: {
                        totalGS: resumenCompleto[0].totalGS.toString(),
                        totalUSDconvertido: resumenCompleto[0].totalUSD.toNumber() !== 0 && cotizacionesUsadas
                            ? (resumenCompleto[0].totalUSD.times(((_a = cotizacionesUsadas.find((c) => c.moneda === 'USD')) === null || _a === void 0 ? void 0 : _a.valor) || 0)).toString()
                            : "0",
                        totalBRLconvertido: resumenCompleto[0].totalBRL.toNumber() !== 0 && cotizacionesUsadas
                            ? (resumenCompleto[0].totalBRL.times(((_b = cotizacionesUsadas.find((c) => c.moneda === 'BRL')) === null || _b === void 0 ? void 0 : _b.valor) || 0)).toString()
                            : "0",
                    }
                } : null,
                cotizaciones: cotizacionesUsadas
            });
        }
        // Si NO está finalizado, continuamos con la lógica original
        console.log(`[INFO] Mes NO finalizado. Obteniendo datos de tablas originales.`);
        // Preparamos las fechas para filtro
        const primerDiaMes = new Date(numAnio, numMes - 1, 1);
        const ultimoDiaMes = new Date(numAnio, numMes, 0);
        // Primero, comprobamos si la persona tiene IPS
        const personaIps = yield prisma.$queryRaw `
            SELECT * FROM "PersonaIPS"
            WHERE "personaId" = ${numPersonaId}
            AND estado = 'ACTIVO'
        `;
        console.log('[DEBUG] IPS encontrado:', Array.isArray(personaIps) && personaIps.length > 0 ? 'Sí' : 'No');
        // Obtener el sueldo mínimo vigente
        const sueldoMinimo = yield prisma.$queryRaw `
            SELECT * FROM "SueldoMinimo"
            WHERE vigente = true
            ORDER BY fecha DESC
            LIMIT 1
        `;
        console.log('[DEBUG] Sueldo mínimo encontrado:', Array.isArray(sueldoMinimo) && sueldoMinimo.length > 0 ? 'Sí' : 'No');
        // Usar consultas directas en lugar de transacciones para compatibilidad
        // 1. Obtener los movimientos RRHH
        const movimientos = yield prisma.movimientoRRHH.findMany({
            where: {
                personaId: numPersonaId,
                mes: numMes,
                anio: numAnio,
            },
            orderBy: {
                fecha: 'asc',
            },
        });
        console.log('[DEBUG] Movimientos RRHH encontrados:', movimientos.length);
        // 2. Obtener los vales que vencen en el mes seleccionado
        const vales = yield prisma.vale.findMany({
            where: {
                persona_id: numPersonaId,
                fecha_vencimiento: {
                    gte: primerDiaMes,
                    lte: ultimoDiaMes,
                },
            },
            orderBy: {
                fecha_vencimiento: 'asc',
            },
        });
        console.log('[DEBUG] Vales encontrados:', vales.length);
        // 3. Obtener el sueldo correspondiente al mes/año
        const sueldo = yield prisma.sueldo.findUnique({
            where: {
                personaId_mes_anio: {
                    personaId: numPersonaId,
                    mes: numMes,
                    anio: numAnio
                }
            }
        });
        console.log('[DEBUG] Sueldo encontrado:', sueldo ? 'Sí' : 'No');
        // 4. Convertir los vales al formato de movimientos
        const valesComoMovimientos = vales.map((vale) => ({
            id: `vale-${vale.id}`, // Prefijo para diferenciar
            fecha: vale.fecha_vencimiento.toISOString(),
            tipo: 'Vale',
            descripcion: `${vale.motivo} - Vence: ${vale.fecha_vencimiento.toLocaleDateString('es-PY')}`,
            moneda: vale.moneda,
            monto: vale.monto.toString(), // Convertir Decimal a string
            personaId: vale.persona_id,
            mes: numMes,
            anio: numAnio,
            // Campos adicionales que podrían ser útiles
            numeroVale: vale.numero,
            estadoVale: vale.estado,
        }));
        // 5. Convertir sueldo (si existe) al formato de movimiento
        const sueldoComoMovimiento = sueldo ? [{
                id: `sueldo-${sueldo.id}`, // Prefijo para diferenciar
                fecha: primerDiaMes.toISOString(), // Primer día del mes como fecha
                tipo: 'Sueldo',
                descripcion: `Sueldo correspondiente al ${getNombreMes(numMes)} ${numAnio}`,
                moneda: 'GS', // Asumimos que los sueldos son en guaraníes
                monto: sueldo.monto.toString(),
                personaId: numPersonaId,
                mes: numMes,
                anio: numAnio
            }] : [];
        // 6. Crear movimiento de IPS si la persona está registrada
        let ipsComoMovimiento = [];
        if (Array.isArray(personaIps) && personaIps.length > 0 && Array.isArray(sueldoMinimo) && sueldoMinimo.length > 0) {
            // Calcular el 9% del sueldo mínimo
            const montoIps = new library_1.Decimal(sueldoMinimo[0].valor).mul(0.09);
            ipsComoMovimiento = [{
                    id: `ips-${numPersonaId}-${numMes}-${numAnio}`,
                    fecha: primerDiaMes.toISOString(),
                    tipo: 'IPS',
                    descripcion: `Aporte IPS (9% del sueldo mínimo)`,
                    moneda: 'GS',
                    monto: montoIps.mul(-1).toString(), // Se muestra como valor negativo
                    personaId: numPersonaId,
                    mes: numMes,
                    anio: numAnio
                }];
        }
        console.log('[DEBUG] IPS encontrado:', ipsComoMovimiento.length > 0 ? 'Sí' : 'No');
        // 7. Combinar todos los movimientos
        const todosLosMovimientos = [
            ...movimientos.map(m => (Object.assign(Object.assign({}, m), { monto: m.monto.toString(), descripcion: m.observacion || '' }))),
            ...valesComoMovimientos,
            ...sueldoComoMovimiento,
            ...ipsComoMovimiento
        ];
        console.log('[DEBUG] Total de movimientos combinados:', todosLosMovimientos.length);
        // 8. Ordenar por fecha
        todosLosMovimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        res.status(200).json({
            movimientos: todosLosMovimientos,
            mesFinalizado: false,
        });
        console.log('[DEBUG] Respuesta enviada correctamente');
    }
    catch (error) {
        console.error("Error al obtener movimientos:", error);
        res.status(500).json({ message: 'Error interno al obtener los movimientos.' });
    }
});
exports.getMovimientosRRHH = getMovimientosRRHH;
// Función auxiliar para obtener el nombre del mes
function getNombreMes(mes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1]; // Ajustar para array base-0
}
const deleteMovimientoRRHH = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    // Obtener el ID del usuario desde el middleware de autenticación
    const usuarioId = req.usuarioId;
    if (!usuarioId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    if (isNaN(numId)) {
        return res.status(400).json({ message: 'El ID del movimiento debe ser un número.' });
    }
    try {
        // Verificar si el movimiento existe
        const movimientoExistente = yield prisma.movimientoRRHH.findUnique({
            where: { id: numId }
        });
        if (!movimientoExistente) {
            return res.status(404).json({ message: `No se encontró el movimiento con ID ${numId}.` });
        }
        // Eliminar el movimiento
        yield prisma.movimientoRRHH.delete({
            where: { id: numId }
        });
        res.status(200).json({ message: 'Movimiento eliminado correctamente.' });
    }
    catch (error) {
        console.error("Error al eliminar movimiento RRHH:", error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el movimiento.' });
    }
});
exports.deleteMovimientoRRHH = deleteMovimientoRRHH;
// --- Verificar si un mes está finalizado ---
const getMesEstado = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { personaId } = req.params;
    const { mes, anio } = req.query;
    // Validar parámetros
    const numPersonaId = parseInt(personaId, 10);
    const numMes = mes ? parseInt(mes, 10) : undefined;
    const numAnio = anio ? parseInt(anio, 10) : undefined;
    if (isNaN(numPersonaId) || isNaN(numMes) || isNaN(numAnio)) {
        return res.status(400).json({ message: 'Parámetros inválidos.' });
    }
    try {
        // Verificar si existe un resumen finalizado para este mes/año/persona
        const resumenMes = yield prisma.$queryRaw `
            SELECT id, finalizado, fecha_finalizacion as "fechaFinalizacion", usuario_finaliza_id as "usuarioFinalizaId" 
            FROM resumenes_mes_rrhh
            WHERE persona_id = ${numPersonaId}
            AND mes = ${numMes}
            AND anio = ${numAnio}
        `;
        const resumenEncontrado = Array.isArray(resumenMes) && resumenMes.length > 0 ? resumenMes[0] : null;
        return res.status(200).json({
            finalizado: resumenEncontrado ? resumenEncontrado.finalizado : false,
            fechaFinalizacion: (resumenEncontrado === null || resumenEncontrado === void 0 ? void 0 : resumenEncontrado.fechaFinalizacion) || null,
            usuarioFinalizaId: (resumenEncontrado === null || resumenEncontrado === void 0 ? void 0 : resumenEncontrado.usuarioFinalizaId) || null
        });
    }
    catch (error) {
        console.error("Error al verificar estado del mes:", error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
exports.getMesEstado = getMesEstado;
// Finalizar mes
const finalizarMes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // Obtener el ID del usuario desde el middleware de autenticación
        const usuarioId = req.usuarioId;
        if (!usuarioId) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }
        const { personaId, mes, anio, cotizaciones } = req.body;
        const numPersonaId = parseInt(personaId, 10);
        const numMes = parseInt(mes, 10);
        const numAnio = parseInt(anio, 10);
        // Recibir saldos por moneda desde el frontend (si se proporcionan)
        const saldosPorMoneda = req.body.saldos || {};
        // Verificar datos
        if (!numPersonaId || !numMes || !numAnio) {
            return res.status(400).json({ message: 'Datos incompletos para finalizar el mes.' });
        }
        // Verificar que el mes no esté ya finalizado
        const resumenExistente = yield prisma.$queryRaw `
            SELECT id, finalizado
            FROM resumenes_mes_rrhh
            WHERE persona_id = ${numPersonaId}
            AND mes = ${numMes}
            AND anio = ${numAnio}
        `;
        if (Array.isArray(resumenExistente) && resumenExistente.length > 0 && resumenExistente[0].finalizado) {
            return res.status(400).json({ message: 'El mes ya está finalizado.' });
        }
        // 1. Calcular totales y montos convertidos
        let totalGS = new library_1.Decimal(saldosPorMoneda['GS'] || saldosPorMoneda['PYG'] || 0);
        let totalUSD = new library_1.Decimal(saldosPorMoneda['USD'] || 0);
        let totalBRL = new library_1.Decimal(saldosPorMoneda['BRL'] || 0);
        // Calcular el total final en guaraníes
        let totalFinalGS = new library_1.Decimal(totalGS);
        // Sumar los montos convertidos de otras monedas
        if (totalUSD.toNumber() !== 0) {
            const cotizacionUSD = ((_a = cotizaciones.find((c) => c.moneda === 'USD')) === null || _a === void 0 ? void 0 : _a.valor) || 0;
            // Conservar el signo (si es negativo, seguirá siendo negativo después de la conversión)
            totalFinalGS = totalFinalGS.plus(totalUSD.times(cotizacionUSD));
        }
        if (totalBRL.toNumber() !== 0) {
            const cotizacionBRL = ((_b = cotizaciones.find((c) => c.moneda === 'BRL')) === null || _b === void 0 ? void 0 : _b.valor) || 0;
            // Calcular la conversión correctamente, manteniendo el signo
            const brlEnGs = totalBRL.times(cotizacionBRL);
            totalFinalGS = totalFinalGS.plus(brlEnGs);
            console.log(`[DEBUG] Conversión detallada BRL: ${totalBRL} * ${cotizacionBRL} = ${brlEnGs} => Total ahora: ${totalFinalGS}`);
        }
        // Verificar el cálculo con un log para depuración
        console.log(`[DEBUG] Cálculo total final: ${totalGS} (GS) + ${totalUSD} (USD) * ${((_c = cotizaciones.find((c) => c.moneda === 'USD')) === null || _c === void 0 ? void 0 : _c.valor) || 0} + ${totalBRL} (BRL) * ${((_d = cotizaciones.find((c) => c.moneda === 'BRL')) === null || _d === void 0 ? void 0 : _d.valor) || 0} = ${totalFinalGS}`);
        // 2. Crear o actualizar el resumen del mes
        let resumenId;
        // Verificar si ya existe un registro (reabierto anteriormente)
        if (Array.isArray(resumenExistente) && resumenExistente.length > 0) {
            // Actualizar el registro existente
            yield prisma.$executeRaw `
                UPDATE resumenes_mes_rrhh
                SET
                    fecha_finalizacion = ${new Date()},
                    finalizado = true,
                    usuario_finaliza_id = ${usuarioId},
                    cotizaciones_usadas = ${JSON.stringify(cotizaciones)}::jsonb,
                    total_gs = ${totalGS},
                    total_usd = ${totalUSD},
                    total_brl = ${totalBRL},
                    total_final_gs = ${totalFinalGS},
                    "updatedAt" = NOW()
                WHERE id = ${resumenExistente[0].id}
            `;
            // Eliminar los movimientos finalizados previos asociados a este resumen
            yield prisma.$executeRaw `
                DELETE FROM movimientos_rrhh_finalizados
                WHERE resumen_mes_id = ${resumenExistente[0].id}
            `;
            resumenId = resumenExistente[0].id;
            console.log(`[INFO] Actualizando resumen existente con ID: ${resumenId}`);
        }
        else {
            // Crear un nuevo registro si no existe
            const resumenCreado = yield prisma.$queryRaw `
                INSERT INTO resumenes_mes_rrhh (
                    persona_id, 
                    mes, 
                    anio, 
                    fecha_finalizacion, 
                    finalizado, 
                    usuario_finaliza_id, 
                    cotizaciones_usadas, 
                    total_gs, 
                    total_usd, 
                    total_brl, 
                    total_final_gs,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    ${numPersonaId}, 
                    ${numMes}, 
                    ${numAnio}, 
                    ${new Date()}, 
                    true, 
                    ${usuarioId}, 
                    ${JSON.stringify(cotizaciones)}::jsonb, 
                    ${totalGS}, 
                    ${totalUSD}, 
                    ${totalBRL}, 
                    ${totalFinalGS},
                    NOW(),
                    NOW()
                )
                RETURNING id
            `;
            resumenId = Array.isArray(resumenCreado) && resumenCreado.length > 0 ? resumenCreado[0].id : null;
            console.log(`[INFO] Creando nuevo resumen con ID: ${resumenId}`);
        }
        if (!resumenId) {
            throw new Error('No se pudo crear o actualizar el resumen del mes');
        }
        // 2. Obtener todos los movimientos del mes
        const movimientos = yield prisma.movimientoRRHH.findMany({
            where: {
                personaId: numPersonaId,
                mes: numMes,
                anio: numAnio,
            }
        });
        // Obtener los vales para este mes
        const primerDiaMes = new Date(numAnio, numMes - 1, 1);
        const ultimoDiaMes = new Date(numAnio, numMes, 0);
        // Obtener los vales que vencen en el mes seleccionado
        const vales = yield prisma.vale.findMany({
            where: {
                persona_id: numPersonaId,
                fecha_vencimiento: {
                    gte: primerDiaMes,
                    lte: ultimoDiaMes,
                },
            }
        });
        // Obtener el sueldo correspondiente al mes/año
        const sueldo = yield prisma.sueldo.findUnique({
            where: {
                personaId_mes_anio: {
                    personaId: numPersonaId,
                    mes: numMes,
                    anio: numAnio
                }
            }
        });
        // Obtener la información de IPS
        const personaIps = yield prisma.$queryRaw `
            SELECT * FROM "PersonaIPS"
            WHERE "personaId" = ${numPersonaId}
            AND estado = 'ACTIVO'
        `;
        const sueldoMinimo = yield prisma.$queryRaw `
            SELECT * FROM "SueldoMinimo"
            WHERE vigente = true
            ORDER BY fecha DESC
            LIMIT 1
        `;
        // 3. Guardar los movimientos RRHH finalizados
        for (const mov of movimientos) {
            // Si es una moneda extranjera, calcular su valor en guaraníes
            let montoConvertido = null;
            if (mov.moneda !== 'GS' && mov.moneda !== 'PYG') {
                const cotizacion = cotizaciones.find((c) => c.moneda === mov.moneda);
                if (cotizacion) {
                    montoConvertido = new library_1.Decimal(mov.monto).times(cotizacion.valor);
                }
            }
            // Usar SQL directo para insertar en la tabla de movimientos finalizados
            yield prisma.$executeRaw `
                INSERT INTO movimientos_rrhh_finalizados (
                    resumen_mes_id,
                    movimiento_orig_id,
                    persona_id,
                    mes,
                    anio,
                    fecha,
                    tipo,
                    observacion,
                    moneda,
                    monto,
                    monto_convertido_gs,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    ${resumenId},
                    ${mov.id},
                    ${mov.personaId},
                    ${mov.mes},
                    ${mov.anio},
                    ${mov.fecha},
                    ${mov.tipo},
                    ${mov.observacion},
                    ${mov.moneda},
                    ${mov.monto},
                    ${montoConvertido},
                    NOW(),
                    NOW()
                )
            `;
        }
        // 4. Guardar los vales como movimientos finalizados
        for (const vale of vales) {
            // Si es una moneda extranjera, calcular su valor en guaraníes
            let montoConvertido = null;
            if (vale.moneda !== 'GS' && vale.moneda !== 'PYG') {
                const cotizacion = cotizaciones.find((c) => c.moneda === vale.moneda);
                if (cotizacion) {
                    montoConvertido = new library_1.Decimal(vale.monto).times(cotizacion.valor);
                }
            }
            yield prisma.$executeRaw `
                INSERT INTO movimientos_rrhh_finalizados (
                    resumen_mes_id,
                    movimiento_orig_id,
                    persona_id,
                    mes,
                    anio,
                    fecha,
                    tipo,
                    observacion,
                    moneda,
                    monto,
                    monto_convertido_gs,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    ${resumenId},
                    ${null},
                    ${vale.persona_id},
                    ${numMes},
                    ${numAnio},
                    ${vale.fecha_vencimiento},
                    ${'Vale'},
                    ${vale.motivo + ' - Vence: ' + vale.fecha_vencimiento.toLocaleDateString('es-PY')},
                    ${vale.moneda},
                    ${vale.monto},
                    ${montoConvertido},
                    NOW(),
                    NOW()
                )
            `;
        }
        // 5. Guardar el sueldo si existe
        if (sueldo) {
            yield prisma.$executeRaw `
                INSERT INTO movimientos_rrhh_finalizados (
                    resumen_mes_id,
                    movimiento_orig_id,
                    persona_id,
                    mes,
                    anio,
                    fecha,
                    tipo,
                    observacion,
                    moneda,
                    monto,
                    monto_convertido_gs,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    ${resumenId},
                    ${null},
                    ${sueldo.personaId},
                    ${numMes},
                    ${numAnio},
                    ${primerDiaMes},
                    ${'Sueldo'},
                    ${'Sueldo correspondiente al ' + getNombreMes(numMes) + ' ' + numAnio},
                    ${'GS'},
                    ${sueldo.monto},
                    ${null},
                    NOW(),
                    NOW()
                )
            `;
        }
        // 6. Guardar el IPS si corresponde
        if (Array.isArray(personaIps) && personaIps.length > 0 && Array.isArray(sueldoMinimo) && sueldoMinimo.length > 0) {
            // Calcular el 9% del sueldo mínimo
            const montoIps = new library_1.Decimal(sueldoMinimo[0].valor).mul(0.09).mul(-1);
            yield prisma.$executeRaw `
                INSERT INTO movimientos_rrhh_finalizados (
                    resumen_mes_id,
                    movimiento_orig_id,
                    persona_id,
                    mes,
                    anio,
                    fecha,
                    tipo,
                    observacion,
                    moneda,
                    monto,
                    monto_convertido_gs,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    ${resumenId},
                    ${null},
                    ${numPersonaId},
                    ${numMes},
                    ${numAnio},
                    ${primerDiaMes},
                    ${'IPS'},
                    ${'Aporte IPS (9% del sueldo mínimo)'},
                    ${'GS'},
                    ${montoIps},
                    ${null},
                    NOW(),
                    NOW()
                )
            `;
        }
        // 7. Devolver el resultado
        return res.status(200).json({
            message: 'Mes finalizado correctamente.',
            resumenId: resumenId,
            resumen: {
                totalGS: totalGS.toString(),
                totalUSD: totalUSD.toString(),
                totalBRL: totalBRL.toString(),
                totalFinalGS: totalFinalGS.toString()
            }
        });
    }
    catch (error) {
        console.error("Error al finalizar mes en RRHH:", error);
        return res.status(500).json({ message: 'Error interno al finalizar el mes.' });
    }
});
exports.finalizarMes = finalizarMes;
// --- Reabrir un mes finalizado ---
const reabrirMes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const usuarioId = req.usuarioId;
    if (!usuarioId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    const { personaId, mes, anio } = req.body;
    // Validación de datos
    if (!personaId || !mes || !anio) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }
    try {
        // Verificar si el mes está finalizado
        const resumenExistente = yield prisma.$queryRaw `
            SELECT id, finalizado
            FROM resumenes_mes_rrhh
            WHERE persona_id = ${personaId}
            AND mes = ${mes}
            AND anio = ${anio}
        `;
        const resumen = Array.isArray(resumenExistente) && resumenExistente.length > 0 ? resumenExistente[0] : null;
        if (!resumen || !resumen.finalizado) {
            return res.status(400).json({ message: 'El mes no está finalizado o no existe.' });
        }
        // Actualizar el estado del resumen usando SQL directo
        yield prisma.$executeRaw `
            UPDATE resumenes_mes_rrhh
            SET 
                finalizado = false,
                fecha_reapertura = ${new Date()},
                usuario_reabre_id = ${usuarioId},
                "updatedAt" = NOW()
            WHERE id = ${resumen.id}
        `;
        // Obtener el resumen actualizado
        const resumenActualizado = yield prisma.$queryRaw `
            SELECT * FROM resumenes_mes_rrhh
            WHERE id = ${resumen.id}
        `;
        res.status(200).json({
            message: 'Mes reabierto correctamente',
            resumen: Array.isArray(resumenActualizado) && resumenActualizado.length > 0 ? resumenActualizado[0] : null
        });
    }
    catch (error) {
        console.error("Error al reabrir mes:", error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
exports.reabrirMes = reabrirMes;
// Podrías añadir aquí funciones para obtener movimientos, actualizar, eliminar, etc.
// export const getMovimientosRRHHByPersona = async (req: Request, res: Response) => { ... } 
//# sourceMappingURL=rrhhController.js.map
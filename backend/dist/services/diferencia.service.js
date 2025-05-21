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
exports.calcularDiferenciasEnCajas = exports.calcularComparacionesSaldosServicios = exports.calcularComparacionesMaletines = void 0;
const client_1 = require("@prisma/client"); // Importar Prisma para Decimal
const prisma = new client_1.PrismaClient();
// Función auxiliar para convertir Decimal a number
function decimalToNumber(decimal) {
    if (decimal === null || decimal === undefined)
        return 0;
    return decimal.toNumber();
}
/**
 * Calcula la diferencia entre dos objetos SaldoMoneda.
 */
const calcularDiferenciaSaldos = (saldoInicial, saldoFinal) => ({
    PYG: saldoInicial.PYG - saldoFinal.PYG,
    USD: saldoInicial.USD - saldoFinal.USD,
    BRL: saldoInicial.BRL - saldoFinal.BRL,
});
/**
 * Determina si hay alguna diferencia (!= 0) en un objeto SaldoMoneda.
 */
const tieneDif = (diferencias) => {
    return diferencias.PYG !== 0 || diferencias.USD !== 0 || diferencias.BRL !== 0;
};
/**
 * Obtiene y calcula las comparaciones de saldo entre cajas consecutivas del mismo maletín.
 */
const calcularComparacionesMaletines = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log("Calculando comparaciones de maletines...");
    const selectFields = {
        id: true,
        cajaEnteroId: true,
        maletinId: true,
        fechaApertura: true,
        fechaCierre: true,
        saldoInicialPYG: true,
        saldoInicialUSD: true,
        saldoInicialBRL: true,
        saldoFinalPYG: true,
        saldoFinalUSD: true,
        saldoFinalBRL: true,
        usuarioId: true
    };
    const cajas = yield prisma.caja.findMany({
        select: selectFields,
        orderBy: [
            { maletinId: 'asc' },
            { fechaApertura: 'asc' },
        ],
    });
    console.log(`Se encontraron ${cajas.length} cajas para análisis de maletines.`);
    const comparaciones = [];
    let cajaAnteriorDelMaletin = null;
    for (const cajaActual of cajas) {
        if (!cajaActual.maletinId)
            continue;
        if (!cajaAnteriorDelMaletin || cajaAnteriorDelMaletin.maletinId !== cajaActual.maletinId) {
            cajaAnteriorDelMaletin = cajaActual;
            continue;
        }
        const saldoInicialActual = {
            PYG: decimalToNumber(cajaActual.saldoInicialPYG),
            USD: decimalToNumber(cajaActual.saldoInicialUSD),
            BRL: decimalToNumber(cajaActual.saldoInicialBRL)
        };
        const saldoFinalAnterior = cajaAnteriorDelMaletin ? {
            PYG: decimalToNumber(cajaAnteriorDelMaletin.saldoFinalPYG),
            USD: decimalToNumber(cajaAnteriorDelMaletin.saldoFinalUSD),
            BRL: decimalToNumber(cajaAnteriorDelMaletin.saldoFinalBRL)
        } : undefined;
        if (cajaAnteriorDelMaletin.fechaCierre && saldoFinalAnterior && cajaActual.fechaApertura) {
            const diferencias = calcularDiferenciaSaldos(saldoInicialActual, saldoFinalAnterior);
            const hayDiferencia = tieneDif(diferencias);
            const infoAnterior = {
                id: cajaAnteriorDelMaletin.id,
                cajaEnteroId: (_a = cajaAnteriorDelMaletin.cajaEnteroId) !== null && _a !== void 0 ? _a : 0,
                maletinId: cajaAnteriorDelMaletin.maletinId,
                fechaCierre: cajaAnteriorDelMaletin.fechaCierre.toISOString(),
                saldoFinal: { total: saldoFinalAnterior },
                usuarioId: cajaAnteriorDelMaletin.usuarioId
            };
            const infoSiguiente = {
                id: cajaActual.id,
                cajaEnteroId: (_b = cajaActual.cajaEnteroId) !== null && _b !== void 0 ? _b : 0,
                maletinId: cajaActual.maletinId,
                fechaApertura: cajaActual.fechaApertura.toISOString(),
                saldoInicial: { total: saldoInicialActual },
                usuarioId: cajaActual.usuarioId
            };
            comparaciones.push({
                cajaAnterior: infoAnterior,
                cajaSiguiente: infoSiguiente,
                diferencias: diferencias,
                tieneDiferencia: hayDiferencia,
            });
        }
        else {
            console.warn(`Saltando comparación por falta de datos entre caja ${cajaAnteriorDelMaletin.cajaEnteroId} y ${cajaActual.cajaEnteroId}`);
        }
        cajaAnteriorDelMaletin = cajaActual;
    }
    comparaciones.sort((a, b) => {
        const dateA = a.cajaAnterior.fechaCierre ? new Date(a.cajaAnterior.fechaCierre).getTime() : 0;
        const dateB = b.cajaAnterior.fechaCierre ? new Date(b.cajaAnterior.fechaCierre).getTime() : 0;
        return dateB - dateA;
    });
    console.log(`Se calcularon ${comparaciones.length} comparaciones de maletines.`);
    return comparaciones;
});
exports.calcularComparacionesMaletines = calcularComparacionesMaletines;
/**
 * Obtiene y calcula las comparaciones de saldos de servicios entre cajas cerradas consecutivas por sucursal.
 */
const calcularComparacionesSaldosServicios = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    console.log("Calculando comparaciones de saldos de servicios por sucursal...");
    const cajas = yield prisma.caja.findMany({
        select: {
            id: true,
            cajaEnteroId: true,
            sucursalId: true,
            sucursal: {
                select: {
                    id: true,
                    nombre: true,
                }
            },
            fechaApertura: true,
            fechaCierre: true,
            servicios: true, // JSON inicial
            serviciosFinal: true, // JSON final
            estado: true
        },
        orderBy: [
            { sucursalId: 'asc' },
            { fechaApertura: 'asc' }, // Ordenar por fecha de apertura para secuencia correcta
        ],
    });
    console.log(`Se encontraron ${cajas.length} cajas para análisis de servicios.`);
    const comparaciones = [];
    let cajaAnteriorDeSucursal = null;
    for (const cajaActual of cajas) {
        if (!cajaAnteriorDeSucursal || cajaAnteriorDeSucursal.sucursalId !== cajaActual.sucursalId) {
            cajaAnteriorDeSucursal = cajaActual;
            continue;
        }
        if (cajaAnteriorDeSucursal.estado !== 'cerrada') {
            console.log(`Saltando comparación: Caja anterior ${cajaAnteriorDeSucursal.cajaEnteroId} no está cerrada.`);
            cajaAnteriorDeSucursal = cajaActual;
            continue;
        }
        const saldosFinalesAnterior = parseJSONSafely(cajaAnteriorDeSucursal.serviciosFinal);
        const saldosInicialesActual = parseJSONSafely(cajaActual.servicios);
        const totalFinalAnterior = calcularTotalServicios(saldosFinalesAnterior);
        const totalInicialActual = calcularTotalServicios(saldosInicialesActual);
        const diferenciaTotal = totalInicialActual - totalFinalAnterior;
        const hayDiferencia = diferenciaTotal !== 0;
        const infoAnterior = {
            id: cajaAnteriorDeSucursal.id,
            cajaEnteroId: (_a = cajaAnteriorDeSucursal.cajaEnteroId) !== null && _a !== void 0 ? _a : 0,
            sucursalId: cajaAnteriorDeSucursal.sucursalId,
            sucursalNombre: (_b = cajaAnteriorDeSucursal.sucursal) === null || _b === void 0 ? void 0 : _b.nombre, // Añadir nombre
            fechaCierre: (_c = cajaAnteriorDeSucursal.fechaCierre) === null || _c === void 0 ? void 0 : _c.toISOString(),
            saldosServicios: saldosFinalesAnterior,
        };
        const infoSiguiente = {
            id: cajaActual.id,
            cajaEnteroId: (_d = cajaActual.cajaEnteroId) !== null && _d !== void 0 ? _d : 0,
            sucursalId: cajaActual.sucursalId,
            sucursalNombre: (_e = cajaActual.sucursal) === null || _e === void 0 ? void 0 : _e.nombre, // Añadir nombre
            fechaApertura: (_f = cajaActual.fechaApertura) === null || _f === void 0 ? void 0 : _f.toISOString(),
            saldosServicios: saldosInicialesActual,
        };
        comparaciones.push({
            cajaAnterior: infoAnterior,
            cajaSiguiente: infoSiguiente,
            diferenciaTotalPYG: diferenciaTotal,
            tieneDiferencia: hayDiferencia,
        });
        cajaAnteriorDeSucursal = cajaActual;
    }
    comparaciones.sort((a, b) => {
        const dateA = a.cajaAnterior.fechaCierre ? new Date(a.cajaAnterior.fechaCierre).getTime() : 0;
        const dateB = b.cajaAnterior.fechaCierre ? new Date(b.cajaAnterior.fechaCierre).getTime() : 0;
        if (dateA === 0 && dateB !== 0)
            return 1;
        if (dateB === 0 && dateA !== 0)
            return -1;
        return dateB - dateA;
    });
    console.log(`Se calcularon ${comparaciones.length} comparaciones de saldos de servicios.`);
    return comparaciones;
});
exports.calcularComparacionesSaldosServicios = calcularComparacionesSaldosServicios;
// Función auxiliar para parsear JSON de forma segura
const parseJSONSafely = (jsonString) => {
    if (!jsonString || typeof jsonString !== 'string') {
        // Si no es string (podría ser null o ya un objeto si Prisma lo manejó), devolverlo o un array vacío
        return Array.isArray(jsonString) ? jsonString : [];
    }
    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : []; // Asegurar que sea un array
    }
    catch (e) {
        console.error("Error al parsear JSON de servicios:", e);
        return []; // Devolver array vacío en caso de error
    }
};
// Función auxiliar para calcular el total de saldos de servicios
const calcularTotalServicios = (saldos) => {
    if (!Array.isArray(saldos))
        return 0;
    return saldos.reduce((total, servicio) => total + (Number(servicio.monto) || 0), 0);
};
/**
 * Obtiene y calcula las diferencias entre saldos declarados y calculados al cierre de cada caja.
 */
const calcularDiferenciasEnCajas = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    console.log("Calculando diferencias internas en cajas...");
    const cajasCerradas = yield prisma.caja.findMany({
        where: {
            estado: 'cerrada',
            fechaCierre: { not: null }, // Asegurar que tenga fecha de cierre
            // Asegurar que tenga saldos finales declarados? Depende de la lógica de negocio
            // detallesDenominacionFinal: { not: Prisma.JsonNull }, 
            // serviciosFinal: { not: Prisma.JsonNull },
        },
        select: {
            id: true,
            cajaEnteroId: true,
            sucursalId: true,
            sucursal: { select: { nombre: true } },
            maletinId: true,
            fechaApertura: true,
            fechaCierre: true,
            estado: true,
            // Saldos calculados por el sistema (directos del modelo)
            saldoFinalPYG: true,
            saldoFinalUSD: true,
            saldoFinalBRL: true,
            // Saldos declarados (JSON)
            detallesDenominacionFinal: true,
            serviciosFinal: true,
            // Movimientos para calcular total servicios sistema
            // Asumiendo que MovimientoCaja contiene los servicios
            movimientos: {
                select: {
                    monto: true,
                    // Podríamos necesitar moneda si los movimientos de servicio no son solo PYG
                }
            }
        },
        orderBy: {
            fechaCierre: 'desc', // Mostrar las más recientes primero
        },
    });
    console.log(`Se encontraron ${cajasCerradas.length} cajas cerradas para análisis interno.`);
    const comparaciones = [];
    for (const caja of cajasCerradas) {
        // 1. Saldos Declarados
        const denomFinalDeclarado = parseJSONSafely(caja.detallesDenominacionFinal);
        const servFinalDeclarado = parseJSONSafely(caja.serviciosFinal);
        const declaradoPYG = (_b = (_a = denomFinalDeclarado === null || denomFinalDeclarado === void 0 ? void 0 : denomFinalDeclarado.total) === null || _a === void 0 ? void 0 : _a.PYG) !== null && _b !== void 0 ? _b : 0;
        const declaradoUSD = (_d = (_c = denomFinalDeclarado === null || denomFinalDeclarado === void 0 ? void 0 : denomFinalDeclarado.total) === null || _c === void 0 ? void 0 : _c.USD) !== null && _d !== void 0 ? _d : 0;
        const declaradoBRL = (_f = (_e = denomFinalDeclarado === null || denomFinalDeclarado === void 0 ? void 0 : denomFinalDeclarado.total) === null || _e === void 0 ? void 0 : _e.BRL) !== null && _f !== void 0 ? _f : 0;
        const declaradoServiciosPYG = calcularTotalServicios(servFinalDeclarado);
        // 2. Saldos Sistema
        const sistemaPYG = decimalToNumber(caja.saldoFinalPYG);
        const sistemaUSD = decimalToNumber(caja.saldoFinalUSD);
        const sistemaBRL = decimalToNumber(caja.saldoFinalBRL);
        // Calcular total servicios sistema (Asumiendo que movimientos son solo PYG)
        // ¡¡¡ IMPORTANTE: Ajustar esta lógica si es necesario !!!
        const sistemaServiciosPYG = caja.movimientos.reduce((sum, mov) => sum + decimalToNumber(mov.monto), 0);
        // 3. Calcular Diferencias
        const diffPYG = declaradoPYG - sistemaPYG;
        const diffUSD = declaradoUSD - sistemaUSD;
        const diffBRL = declaradoBRL - sistemaBRL;
        const diffServicios = declaradoServiciosPYG - sistemaServiciosPYG;
        const tieneDif = diffPYG !== 0 || diffUSD !== 0 || diffBRL !== 0 || diffServicios !== 0;
        const comparacionDetallada = {
            PYG: { declarado: declaradoPYG, sistema: sistemaPYG, diferencia: diffPYG },
            USD: { declarado: declaradoUSD, sistema: sistemaUSD, diferencia: diffUSD },
            BRL: { declarado: declaradoBRL, sistema: sistemaBRL, diferencia: diffBRL },
            ServiciosPYG: { declarado: declaradoServiciosPYG, sistema: sistemaServiciosPYG, diferencia: diffServicios },
        };
        comparaciones.push({
            id: caja.id,
            cajaEnteroId: (_g = caja.cajaEnteroId) !== null && _g !== void 0 ? _g : 0,
            sucursalId: caja.sucursalId,
            sucursalNombre: (_h = caja.sucursal) === null || _h === void 0 ? void 0 : _h.nombre,
            maletinId: caja.maletinId,
            fechaApertura: (_j = caja.fechaApertura) === null || _j === void 0 ? void 0 : _j.toISOString(),
            fechaCierre: (_k = caja.fechaCierre) === null || _k === void 0 ? void 0 : _k.toISOString(), // Sabemos que no es null por el where
            estadoCaja: caja.estado,
            comparacion: comparacionDetallada,
            tieneDiferencia: tieneDif,
        });
    }
    console.log(`Se calcularon ${comparaciones.length} comparaciones internas de caja.`);
    return comparaciones;
});
exports.calcularDiferenciasEnCajas = calcularDiferenciasEnCajas;
//# sourceMappingURL=diferencia.service.js.map
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
exports.devolverRetiro = exports.rechazarRetiro = exports.recibirRetiros = exports.getRetirosPendientes = void 0;
const database_1 = require("../database");
/**
 * Obtiene la lista de retiros pendientes
 */
const getRetirosPendientes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const retiros = yield database_1.db.query(`SELECT r.*, c.nombre as cajaNombre, s.nombre as sucursalNombre, p.nombre as personaNombre
       FROM retiros r
       LEFT JOIN cajas c ON r.cajaId = c.id
       LEFT JOIN sucursales s ON r.sucursalId = s.id
       LEFT JOIN personas p ON r.personaId = p.id
       WHERE r.estadoRecepcion = 'PENDIENTE'
       ORDER BY r.fecha DESC`);
        return res.json(retiros);
    }
    catch (error) {
        console.error('Error al obtener retiros pendientes:', error);
        return res.status(500).json({ error: 'Error al obtener los retiros pendientes' });
    }
});
exports.getRetirosPendientes = getRetirosPendientes;
/**
 * Recibe uno o varios retiros en Caja Mayor
 */
const recibirRetiros = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids, observacion, usuarioRecepcionId } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0 || !usuarioRecepcionId) {
            return res.status(400).json({ error: 'Datos inválidos para recibir retiros' });
        }
        yield database_1.db.beginTransaction();
        try {
            for (const retiroId of ids) {
                // 1. Obtener información del retiro
                const retiroInfo = yield database_1.db.query('SELECT * FROM retiros WHERE id = ?', [retiroId]);
                if (!retiroInfo || retiroInfo.length === 0) {
                    throw new Error(`Retiro con ID ${retiroId} no encontrado`);
                }
                const retiro = retiroInfo[0];
                // 2. Actualizar estado del retiro a RECIBIDO
                yield database_1.db.query('UPDATE retiros SET estadoRecepcion = ?, fechaRecepcion = NOW(), usuarioRecepcion = ?, observacionRecepcion = ? WHERE id = ?', ['RECIBIDO', usuarioRecepcionId, observacion, retiroId]);
                // 3. Crear movimiento de ingreso en Caja Mayor
                const moneda = retiro.montoPYG > 0 ? 'guaranies' : (retiro.montoBRL > 0 ? 'reales' : 'dolares');
                const monto = retiro.montoPYG > 0 ? retiro.montoPYG : (retiro.montoBRL > 0 ? retiro.montoBRL : retiro.montoUSD);
                yield database_1.db.query(`INSERT INTO caja_mayor_movimientos 
           (tipo, concepto, monto, moneda, esIngreso, operacionId, fechaHora, usuarioId, observaciones) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`, [
                    'Recepción Retiro',
                    `Recepción Retiro Caja ${retiro.cajaNombre || retiro.cajaId} - Persona: ${retiro.personaNombre || 'Desconocido'}`,
                    monto,
                    moneda,
                    true, // Es un ingreso
                    retiroId, // UUID del retiro
                    usuarioRecepcionId,
                    observacion
                ]);
            }
            yield database_1.db.commit();
            return res.status(200).json({
                success: true,
                message: `${ids.length} retiro(s) recibido(s) correctamente`,
                ids
            });
        }
        catch (error) {
            yield database_1.db.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error('Error al recibir retiros:', error);
        return res.status(500).json({ error: error.message || 'Error al procesar la recepción de retiros' });
    }
});
exports.recibirRetiros = recibirRetiros;
/**
 * Rechaza un retiro en Caja Mayor
 */
const rechazarRetiro = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { retiroId, observacion, usuarioRechazoId } = req.body;
        if (!retiroId || !usuarioRechazoId) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }
        yield database_1.db.beginTransaction();
        try {
            // Actualizar estado del retiro a RECHAZADO
            yield database_1.db.query('UPDATE retiros SET estadoRecepcion = ?, fechaRechazo = NOW(), usuarioRechazo = ?, observacionRechazo = ? WHERE id = ?', ['RECHAZADO', usuarioRechazoId, observacion, retiroId]);
            yield database_1.db.commit();
            return res.status(200).json({
                success: true,
                message: 'Retiro rechazado correctamente',
                retiroId
            });
        }
        catch (error) {
            yield database_1.db.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error('Error al rechazar retiro:', error);
        return res.status(500).json({ error: 'Error interno al procesar el rechazo del retiro' });
    }
});
exports.rechazarRetiro = rechazarRetiro;
/**
 * Procesa la devolución de un retiro previamente recibido en Caja Mayor
 * Cambia el estado del retiro de RECIBIDO a PENDIENTE y registra un egreso en Caja Mayor
 */
const devolverRetiro = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { retiroId, movimientoId, observacion, usuarioDevolucionId } = req.body;
        if (!retiroId || !usuarioDevolucionId) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }
        // Buscar el retiro recibido en Caja Mayor
        const movimientoRecepcion = yield database_1.db.query('SELECT * FROM caja_mayor_movimientos WHERE operacionId = ? AND tipo = ?', [retiroId, 'Recepción Retiro']);
        if (!movimientoRecepcion || movimientoRecepcion.length === 0) {
            return res.status(404).json({ error: 'Retiro no encontrado o no recibido en Caja Mayor' });
        }
        // Obtener detalles del movimiento de recepción
        const movimientoInfo = movimientoRecepcion[0];
        // Iniciar transacción
        yield database_1.db.beginTransaction();
        try {
            // 1. Actualizar estado del retiro a PENDIENTE
            yield database_1.db.query('UPDATE retiros SET estadoRecepcion = ?, observacionDevolucion = ?, usuarioDevolucionId = ?, fechaDevolucion = NOW() WHERE id = ?', ['PENDIENTE', observacion, usuarioDevolucionId, retiroId]);
            // 2. Crear movimiento de egreso en Caja Mayor
            yield database_1.db.query(`INSERT INTO caja_mayor_movimientos 
         (tipo, concepto, monto, moneda, esIngreso, operacionId, fechaHora, usuarioId, observaciones) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`, [
                'Devolución Retiro',
                `Devolución del Retiro (${movimientoInfo.concepto || retiroId})`,
                movimientoInfo.monto,
                movimientoInfo.moneda,
                false, // Es un egreso
                retiroId, // Mismo UUID
                usuarioDevolucionId,
                observacion
            ]);
            // Confirmar transacción
            yield database_1.db.commit();
            return res.status(200).json({
                success: true,
                message: 'Retiro devuelto correctamente',
                retiroId
            });
        }
        catch (error) {
            // Revertir transacción en caso de error
            yield database_1.db.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error('Error al devolver retiro:', error);
        return res.status(500).json({ error: 'Error interno al procesar la devolución del retiro' });
    }
});
exports.devolverRetiro = devolverRetiro;
//# sourceMappingURL=cajasMayorController.js.map
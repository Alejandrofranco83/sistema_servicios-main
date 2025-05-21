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
exports.cancelarCambioMoneda = exports.getCambiosMonedaByUsuario = exports.getCambiosMonedaByCaja = exports.createCambioMoneda = exports.getCambioMonedaById = exports.getCambiosMoneda = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Mapeo de monedas entre el sistema y la base de datos
const mapearMoneda = (moneda) => {
    switch (moneda) {
        case 'PYG': return 'guaranies';
        case 'USD': return 'dolares';
        case 'BRL': return 'reales';
        default: return 'guaranies';
    }
};
// Obtener todos los cambios de moneda
const getCambiosMoneda = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cambiosMoneda = yield prisma.cambioMoneda.findMany({
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        username: true
                    }
                },
                caja: {
                    select: {
                        id: true,
                        sucursal: {
                            select: {
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
        return res.json(cambiosMoneda);
    }
    catch (error) {
        console.error('Error al obtener cambios de moneda:', error);
        return res.status(500).json({ error: 'Error al obtener los cambios de moneda' });
    }
});
exports.getCambiosMoneda = getCambiosMoneda;
// Obtener un cambio de moneda por su ID
const getCambioMonedaById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const cambioMoneda = yield prisma.cambioMoneda.findUnique({
            where: { id },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        username: true
                    }
                },
                caja: {
                    select: {
                        id: true,
                        sucursal: {
                            select: {
                                nombre: true,
                                codigo: true
                            }
                        }
                    }
                }
            }
        });
        if (!cambioMoneda) {
            return res.status(404).json({ error: 'Cambio de moneda no encontrado' });
        }
        return res.json(cambioMoneda);
    }
    catch (error) {
        console.error('Error al obtener cambio de moneda:', error);
        return res.status(500).json({ error: 'Error al obtener el cambio de moneda' });
    }
});
exports.getCambioMonedaById = getCambioMonedaById;
// Crear un nuevo cambio de moneda
const createCambioMoneda = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { monedaOrigen, monedaDestino, monto, cotizacion, resultado, observacion, cajaId, usuarioId } = req.body;
    try {
        // Validaciones
        if (!monedaOrigen || !monedaDestino || !monto || !cotizacion || !resultado || !observacion) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        // Verificar que las monedas sean válidas
        const monedas = ['PYG', 'USD', 'BRL'];
        if (!monedas.includes(monedaOrigen) || !monedas.includes(monedaDestino)) {
            return res.status(400).json({ error: 'Moneda no válida' });
        }
        // Verificar que las monedas sean diferentes
        if (monedaOrigen === monedaDestino) {
            return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
        }
        // Utilizar una transacción para asegurar que ambos registros se creen juntos
        return yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Crear datos para la creación del cambio de moneda
            const dataCambio = {
                monedaOrigen,
                monedaDestino,
                monto,
                cotizacion,
                resultado,
                observacion,
                fecha: new Date()
            };
            // Agregar cajaId y usuarioId solo si están presentes
            if (cajaId) {
                dataCambio.cajaId = cajaId;
            }
            if (usuarioId) {
                dataCambio.usuarioId = usuarioId;
            }
            // Crear el cambio de moneda
            const nuevoCambioMoneda = yield prismaClient.cambioMoneda.create({
                data: dataCambio
            });
            // Registrar los movimientos en la tabla caja_mayor_movimientos para ambas monedas
            // 1. Movimiento de salida (origen)
            const monedaOrigenFormatted = mapearMoneda(monedaOrigen);
            // Buscar el último movimiento para obtener el saldo anterior (origen)
            const ultimoMovimientoOrigen = yield prismaClient.cajaMayorMovimiento.findFirst({
                where: { moneda: monedaOrigenFormatted },
                orderBy: { id: 'desc' }
            });
            const saldoAnteriorOrigen = ultimoMovimientoOrigen ? parseFloat(ultimoMovimientoOrigen.saldoActual.toString()) : 0;
            const montoNumerico = parseFloat(monto.toString());
            const saldoActualOrigen = saldoAnteriorOrigen - montoNumerico; // Una salida resta al saldo
            // Registrar el movimiento de salida
            yield prismaClient.cajaMayorMovimiento.create({
                data: {
                    fechaHora: new Date(),
                    tipo: 'Cambio',
                    operacionId: nuevoCambioMoneda.id,
                    moneda: monedaOrigenFormatted,
                    monto: montoNumerico,
                    esIngreso: false, // Es una salida
                    saldoAnterior: saldoAnteriorOrigen,
                    saldoActual: saldoActualOrigen,
                    concepto: `Cambio de ${monedaOrigen} a ${monedaDestino}`,
                    usuarioId: usuarioId || 1, // Valor por defecto
                    cambioMonedaId: nuevoCambioMoneda.id
                }
            });
            // 2. Movimiento de entrada (destino)
            const monedaDestinoFormatted = mapearMoneda(monedaDestino);
            // Buscar el último movimiento para obtener el saldo anterior (destino)
            const ultimoMovimientoDestino = yield prismaClient.cajaMayorMovimiento.findFirst({
                where: { moneda: monedaDestinoFormatted },
                orderBy: { id: 'desc' }
            });
            const saldoAnteriorDestino = ultimoMovimientoDestino ? parseFloat(ultimoMovimientoDestino.saldoActual.toString()) : 0;
            const resultadoNumerico = parseFloat(resultado.toString());
            const saldoActualDestino = saldoAnteriorDestino + resultadoNumerico; // Una entrada suma al saldo
            // Registrar el movimiento de entrada
            yield prismaClient.cajaMayorMovimiento.create({
                data: {
                    fechaHora: new Date(),
                    tipo: 'Cambio',
                    operacionId: nuevoCambioMoneda.id,
                    moneda: monedaDestinoFormatted,
                    monto: resultadoNumerico,
                    esIngreso: true, // Es una entrada
                    saldoAnterior: saldoAnteriorDestino,
                    saldoActual: saldoActualDestino,
                    concepto: `Cambio de ${monedaOrigen} a ${monedaDestino}`,
                    usuarioId: usuarioId || 1, // Valor por defecto
                    cambioMonedaId: nuevoCambioMoneda.id
                }
            });
            return res.status(201).json(nuevoCambioMoneda);
        }));
    }
    catch (error) {
        console.error('Error al crear cambio de moneda:', error);
        return res.status(500).json({ error: 'Error al crear el cambio de moneda' });
    }
});
exports.createCambioMoneda = createCambioMoneda;
// Obtener cambios de moneda por caja
const getCambiosMonedaByCaja = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cajaId } = req.params;
    try {
        const cambiosMoneda = yield prisma.cambioMoneda.findMany({
            where: { cajaId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        username: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        return res.json(cambiosMoneda);
    }
    catch (error) {
        console.error('Error al obtener cambios de moneda por caja:', error);
        return res.status(500).json({ error: 'Error al obtener los cambios de moneda' });
    }
});
exports.getCambiosMonedaByCaja = getCambiosMonedaByCaja;
// Obtener cambios de moneda por usuario
const getCambiosMonedaByUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { usuarioId } = req.params;
    try {
        const cambiosMoneda = yield prisma.cambioMoneda.findMany({
            where: { usuarioId: parseInt(usuarioId) },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        username: true
                    }
                },
                caja: {
                    select: {
                        id: true,
                        sucursal: {
                            select: {
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
        return res.json(cambiosMoneda);
    }
    catch (error) {
        console.error('Error al obtener cambios de moneda por usuario:', error);
        return res.status(500).json({ error: 'Error al obtener los cambios de moneda por usuario' });
    }
});
exports.getCambiosMonedaByUsuario = getCambiosMonedaByUsuario;
// Cancelar un cambio de moneda
const cancelarCambioMoneda = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { observacion, usuarioId } = req.body;
    const usuarioIdNum = usuarioId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 1; // Usar el usuario autenticado o uno por defecto
    try {
        // Primero buscar el cambio para asegurarnos que existe y no está cancelado
        const cambio = yield prisma.cambioMoneda.findUnique({
            where: { id }
        });
        console.log(`Intentando cancelar cambio [${id}]:`, JSON.stringify(cambio, null, 2));
        if (!cambio) {
            return res.status(404).json({ error: 'Cambio de moneda no encontrado' });
        }
        // Verificar si ya está cancelado solo por la observación
        const esCancelado = cambio.observacion.includes('Cancelado:');
        console.log(`Verificación de cancelación: observación incluye 'Cancelado:' = ${esCancelado}`);
        if (esCancelado) {
            return res.status(400).json({
                error: 'Este cambio ya ha sido cancelado',
                detalles: {
                    observacionIncluye: esCancelado,
                    observacion: cambio.observacion
                }
            });
        }
        // Realizar todo en una transacción
        return yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Marcar el cambio como cancelado (usando cajaId como null y anotando en observación)
            const cambioCancelado = yield prismaClient.cambioMoneda.update({
                where: { id },
                data: {
                    cajaId: null, // Usar null en lugar de 'cancelado'
                    observacion: cambio.observacion + ' | Cancelado: ' + (observacion || 'Sin observación')
                }
            });
            // 2. Buscar los movimientos originales asociados a este cambio
            const movimientosOriginales = yield prismaClient.cajaMayorMovimiento.findMany({
                where: {
                    cambioMonedaId: id,
                    tipo: 'Cambio'
                }
            });
            if (movimientosOriginales.length !== 2) {
                throw new Error('No se encontraron los movimientos correctos para este cambio');
            }
            const movimientoOrigen = movimientosOriginales.find(mov => !mov.esIngreso);
            const movimientoDestino = movimientosOriginales.find(mov => mov.esIngreso);
            if (!movimientoOrigen || !movimientoDestino) {
                throw new Error('No se encontraron los movimientos de origen y destino');
            }
            // 3. Crear movimientos opuestos para cancelar los originales
            // Para cada moneda, necesitamos crear un movimiento en sentido opuesto
            // 3.1 Buscar el último saldo para la moneda de origen
            const ultimoMovimientoOrigen = yield prismaClient.cajaMayorMovimiento.findFirst({
                where: { moneda: movimientoOrigen.moneda },
                orderBy: { id: 'desc' }
            });
            const saldoAnteriorOrigen = ultimoMovimientoOrigen ? parseFloat(ultimoMovimientoOrigen.saldoActual.toString()) : 0;
            const montoOrigen = parseFloat(movimientoOrigen.monto.toString());
            const saldoActualOrigen = saldoAnteriorOrigen + montoOrigen; // Devolver el dinero (ingreso)
            // 3.2 Crear movimiento de cancelación para la moneda de origen (ingreso)
            const movimientoCancelacionOrigen = yield prismaClient.cajaMayorMovimiento.create({
                data: {
                    fechaHora: new Date(),
                    tipo: 'Cambio',
                    operacionId: `${id}_cancelado`,
                    moneda: movimientoOrigen.moneda,
                    monto: montoOrigen,
                    esIngreso: true, // Opuesto al original (ingreso)
                    saldoAnterior: saldoAnteriorOrigen,
                    saldoActual: saldoActualOrigen,
                    concepto: `Cancelación de cambio #${id}`,
                    usuarioId: usuarioIdNum,
                    cambioMonedaId: id
                }
            });
            // 3.3 Buscar el último saldo para la moneda de destino
            const ultimoMovimientoDestino = yield prismaClient.cajaMayorMovimiento.findFirst({
                where: { moneda: movimientoDestino.moneda },
                orderBy: { id: 'desc' }
            });
            const saldoAnteriorDestino = ultimoMovimientoDestino ? parseFloat(ultimoMovimientoDestino.saldoActual.toString()) : 0;
            const montoDestino = parseFloat(movimientoDestino.monto.toString());
            const saldoActualDestino = saldoAnteriorDestino - montoDestino; // Quitar el dinero (egreso)
            // 3.4 Crear movimiento de cancelación para la moneda de destino (egreso)
            const movimientoCancelacionDestino = yield prismaClient.cajaMayorMovimiento.create({
                data: {
                    fechaHora: new Date(),
                    tipo: 'Cambio',
                    operacionId: `${id}_cancelado`,
                    moneda: movimientoDestino.moneda,
                    monto: montoDestino,
                    esIngreso: false, // Opuesto al original (egreso)
                    saldoAnterior: saldoAnteriorDestino,
                    saldoActual: saldoActualDestino,
                    concepto: `Cancelación de cambio #${id}`,
                    usuarioId: usuarioIdNum,
                    cambioMonedaId: id
                }
            });
            return res.json({
                mensaje: 'Cambio cancelado exitosamente',
                cambioCancelado,
                movimientoCancelacionOrigen,
                movimientoCancelacionDestino
            });
        }));
    }
    catch (error) {
        console.error('Error al cancelar cambio de moneda:', error);
        return res.status(500).json({
            error: error.message || 'Error al cancelar el cambio de moneda. Por favor, intente nuevamente.'
        });
    }
});
exports.cancelarCambioMoneda = cancelarCambioMoneda;
//# sourceMappingURL=cambio-moneda.controller.js.map
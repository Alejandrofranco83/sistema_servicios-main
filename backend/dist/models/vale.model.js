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
exports.ValeModel = void 0;
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
exports.ValeModel = {
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.findMany({
            include: {
                persona: true,
                usuario_creador: true
            },
            orderBy: {
                fecha_emision: 'desc'
            }
        });
    }),
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.findUnique({
            where: { id },
            include: {
                persona: true,
                usuario_creador: true
            }
        });
    }),
    findByPersona: (personaId) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.findMany({
            where: { persona_id: personaId },
            include: {
                usuario_creador: true
            },
            orderBy: {
                fecha_emision: 'desc'
            }
        });
    }),
    findPendientes: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.findMany({
            where: { estado: 'pendiente' },
            include: {
                persona: true,
                usuario_creador: true
            },
            orderBy: {
                fecha_vencimiento: 'asc'
            }
        });
    }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        // Generar un número único para el vale si no se proporciona
        if (!data.numero) {
            // Podemos generar un número basado en la fecha y un contador
            const date = new Date();
            const año = date.getFullYear().toString().substring(2); // últimos 2 dígitos del año
            const mes = (date.getMonth() + 1).toString().padStart(2, '0');
            const dia = date.getDate().toString().padStart(2, '0');
            // Obtener el último vale para generar un número secuencial
            const ultimoVale = yield prisma.vale.findFirst({
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const secuencial = ultimoVale ?
                (parseInt(ultimoVale.numero.split('-')[1]) + 1).toString().padStart(4, '0') :
                '0001';
            data.numero = `V${año}${mes}${dia}-${secuencial}`;
        }
        // Utilizar una transacción para asegurar que ambos registros se creen juntos
        return prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Crear el vale
            const nuevoVale = yield prismaClient.vale.create({
                data: Object.assign(Object.assign({}, data), { monto: typeof data.monto === 'number' ? data.monto : parseFloat(String(data.monto)), estado: 'pendiente', fecha_emision: new Date() }),
                include: {
                    persona: true,
                    usuario_creador: true
                }
            });
            // 2. Obtener el saldo actual para la moneda correspondiente
            const monedaMovimiento = mapearMoneda(data.moneda);
            // Buscar el último movimiento de caja mayor para obtener el saldo anterior
            const ultimoMovimiento = yield prismaClient.cajaMayorMovimiento.findFirst({
                where: { moneda: monedaMovimiento },
                orderBy: { id: 'desc' }
            });
            const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual.toString()) : 0;
            const montoVale = parseFloat(nuevoVale.monto.toString());
            const saldoActual = saldoAnterior - montoVale; // Un vale es un egreso, por lo que resta al saldo
            // 3. Registrar el movimiento en la tabla caja_mayor_movimientos
            yield prismaClient.cajaMayorMovimiento.create({
                data: {
                    fechaHora: new Date(),
                    tipo: 'Vales',
                    operacionId: nuevoVale.id,
                    moneda: monedaMovimiento,
                    monto: nuevoVale.monto,
                    esIngreso: false, // Un vale es un egreso (salida de dinero)
                    saldoAnterior,
                    saldoActual,
                    concepto: `Vale a ${nuevoVale.persona_nombre}`,
                    usuarioId: nuevoVale.usuario_creador_id,
                    valeId: nuevoVale.id
                }
            });
            // 4. Crear registro en movimientos_farmacia
            // El monto se almacena como negativo para representar un EGRESO
            const montoNegativo = typeof nuevoVale.monto === 'number'
                ? -nuevoVale.monto
                : parseFloat(String(nuevoVale.monto)) * -1;
            // Extraer un número compatible con INT4 (tomamos solo los últimos dígitos)
            // Si no hay dígitos, generamos un ID numérico aleatorio pequeño
            const idNumerico = () => {
                // Extraer solo los dígitos del ID
                const soloDigitos = nuevoVale.id.replace(/\D/g, '');
                if (soloDigitos.length > 0) {
                    // Tomar solo los últimos 5 dígitos para asegurar que quepa en INT4
                    return parseInt(soloDigitos.slice(-5)) ||
                        // Fallback: generar un número aleatorio si no se puede convertir
                        Math.floor(Math.random() * 1000000);
                }
                else {
                    // Si no hay dígitos, generar un ID aleatorio (< 1 millón)
                    return Math.floor(Math.random() * 1000000);
                }
            };
            yield prismaClient.movimientoFarmacia.create({
                data: {
                    fechaHora: new Date(),
                    tipoMovimiento: 'EGRESO',
                    concepto: `Vale a ${nuevoVale.persona_nombre}`,
                    movimientoOrigenId: idNumerico(),
                    movimientoOrigenTipo: 'VALE',
                    monto: montoNegativo,
                    monedaCodigo: data.moneda,
                    estado: 'CONFIRMADO',
                    usuarioId: nuevoVale.usuario_creador_id
                }
            });
            return nuevoVale;
        }));
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.update({
            where: { id },
            data,
            include: {
                persona: true,
                usuario_creador: true
            }
        });
    }),
    marcarCobrado: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.update({
            where: { id },
            data: {
                estado: 'cobrado',
                fecha_cobro: new Date()
            }
        });
    }),
    marcarAnulado: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.update({
            where: { id },
            data: {
                estado: 'anulado'
            }
        });
    }),
    marcarImpreso: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.update({
            where: { id },
            data: {
                impreso: true
            }
        });
    }),
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.vale.delete({
            where: { id }
        });
    }),
    findByMovimientoId: (movimientoId) => __awaiter(void 0, void 0, void 0, function* () {
        // Buscamos primero el movimiento para obtener la referencia al vale
        const movimiento = yield prisma.cajaMayorMovimiento.findUnique({
            where: { id: movimientoId }
        });
        if (!movimiento || !movimiento.valeId) {
            return null;
        }
        // Luego buscamos el vale con todos sus detalles
        return prisma.vale.findUnique({
            where: { id: movimiento.valeId },
            include: {
                persona: true,
                usuario_creador: true
            }
        });
    }),
    cancelarVale: (id, motivo, movimientoId, usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Obtener el vale que se va a cancelar
            const vale = yield prismaClient.vale.findUnique({
                where: { id }
            });
            if (!vale || vale.estado !== 'pendiente') {
                throw new Error('El vale no existe o no está pendiente');
            }
            // 2. Obtener el movimiento original
            const movimientoOriginal = yield prismaClient.cajaMayorMovimiento.findUnique({
                where: { id: movimientoId }
            });
            if (!movimientoOriginal) {
                throw new Error('No se encontró el movimiento original');
            }
            // 3. Marcar el vale como cancelado
            const valeCancelado = yield prismaClient.vale.update({
                where: { id },
                data: {
                    estado: 'cancelado',
                    // No usar fecha_cancelacion si no existe en el modelo
                }
            });
            // 4. Obtener el último saldo para la moneda
            const ultimoMovimiento = yield prismaClient.cajaMayorMovimiento.findFirst({
                where: { moneda: movimientoOriginal.moneda },
                orderBy: { id: 'desc' }
            });
            const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual.toString()) : 0;
            const montoVale = parseFloat(vale.monto.toString());
            const saldoActual = saldoAnterior + montoVale; // Cancelar un vale es un ingreso (devuelve el dinero)
            // 5. Crear el movimiento de cancelación (opuesto al original)
            const movimientoCancelacion = yield prismaClient.cajaMayorMovimiento.create({
                data: {
                    fechaHora: new Date(),
                    tipo: 'Vales',
                    operacionId: `${vale.id}_cancelado`,
                    moneda: movimientoOriginal.moneda,
                    monto: vale.monto,
                    esIngreso: true, // Cancelar un vale es un ingreso (opuesto al original)
                    saldoAnterior,
                    saldoActual,
                    concepto: `Vale cancelado: ${vale.persona_nombre} - ${new Date().toLocaleDateString()}`,
                    usuarioId,
                    valeId: vale.id
                }
            });
            // 6. Buscar si existe un movimiento en movimientos_farmacia para este vale
            // Para buscar, necesitamos buscar por tipo sin el ID específico
            const movimientosRelacionados = yield prismaClient.movimientoFarmacia.findMany({
                where: {
                    movimientoOrigenTipo: 'VALE',
                    concepto: { contains: vale.persona_nombre }
                },
                orderBy: { fechaHora: 'desc' },
                take: 5 // Tomamos los 5 más recientes para verificar
            });
            // 7. Si existen movimientos relacionados, eliminar los que coincidan con el patrón
            if (movimientosRelacionados.length > 0) {
                // Elegimos el más reciente que coincida
                const movimientoAEliminar = movimientosRelacionados[0];
                if (movimientoAEliminar) {
                    yield prismaClient.movimientoFarmacia.delete({
                        where: {
                            id: movimientoAEliminar.id
                        }
                    });
                }
            }
            return { valeCancelado, movimientoCancelacion };
        }));
    }),
    // Obtener estadísticas de vales
    getEstadisticas: () => __awaiter(void 0, void 0, void 0, function* () {
        const valesPendientes = yield prisma.vale.count({
            where: { estado: 'pendiente' }
        });
        const valesCobrados = yield prisma.vale.count({
            where: { estado: 'cobrado' }
        });
        const valesAnulados = yield prisma.vale.count({
            where: { estado: 'anulado' }
        });
        const montoTotalPendientePYG = yield prisma.vale.aggregate({
            where: {
                estado: 'pendiente',
                moneda: 'PYG'
            },
            _sum: {
                monto: true
            }
        });
        const montoTotalPendienteUSD = yield prisma.vale.aggregate({
            where: {
                estado: 'pendiente',
                moneda: 'USD'
            },
            _sum: {
                monto: true
            }
        });
        const montoTotalPendienteBRL = yield prisma.vale.aggregate({
            where: {
                estado: 'pendiente',
                moneda: 'BRL'
            },
            _sum: {
                monto: true
            }
        });
        return {
            valesPendientes,
            valesCobrados,
            valesAnulados,
            montoTotalPendientePYG: montoTotalPendientePYG._sum.monto || 0,
            montoTotalPendienteUSD: montoTotalPendienteUSD._sum.monto || 0,
            montoTotalPendienteBRL: montoTotalPendienteBRL._sum.monto || 0
        };
    })
};
//# sourceMappingURL=vale.model.js.map
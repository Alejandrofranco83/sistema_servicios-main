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
exports.deleteConteo = exports.anularConteo = exports.updateConteo = exports.createConteo = exports.getConteoById = exports.getConteos = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Obtener todos los conteos
 * Nota: Se debe ejecutar 'npx prisma generate' después de agregar los nuevos modelos
 * para que los tipos estén disponibles y se resuelvan los errores de linter.
 */
const getConteos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        const conteos = yield prisma.conteo.findMany({
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
    }
    catch (error) {
        console.error('Error al obtener conteos:', error);
        return res.status(500).json({ error: 'Error al obtener los conteos' });
    }
});
exports.getConteos = getConteos;
/**
 * Obtener un conteo por ID
 */
const getConteoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        const conteo = yield prisma.conteo.findUnique({
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
    }
    catch (error) {
        console.error('Error al obtener conteo por ID:', error);
        return res.status(500).json({ error: 'Error al obtener el conteo' });
    }
});
exports.getConteoById = getConteoById;
/**
 * Crear un nuevo conteo
 */
const createConteo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { moneda, total, saldo_sistema, observaciones, usuario_id, detalles, generarMovimiento, concepto } = req.body;
    try {
        // Calcular la diferencia
        const diferencia = total - saldo_sistema;
        console.log('Creando conteo con datos:', { moneda, total, saldo_sistema, diferencia, observaciones, usuario_id });
        console.log('Detalles del conteo:', detalles);
        // Crear el conteo con una transacción para garantizar atomicidad
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Crear el registro principal del conteo
            // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
            const nuevoConteo = yield tx.conteo.create({
                data: {
                    moneda,
                    total: new client_1.Prisma.Decimal(total),
                    saldo_sistema: new client_1.Prisma.Decimal(saldo_sistema),
                    diferencia: new client_1.Prisma.Decimal(diferencia),
                    observaciones,
                    usuario_id
                }
            });
            console.log('Conteo creado con ID:', nuevoConteo.id);
            // 2. Crear los detalles del conteo
            if (detalles && detalles.length > 0) {
                const detallesData = detalles.map(detalle => ({
                    conteo_id: nuevoConteo.id,
                    denominacion: new client_1.Prisma.Decimal(detalle.denominacion),
                    cantidad: detalle.cantidad,
                    subtotal: new client_1.Prisma.Decimal(detalle.subtotal)
                }));
                // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
                yield tx.conteoDetalle.createMany({
                    data: detallesData
                });
                console.log(`${detallesData.length} detalles de conteo creados`);
            }
            // 3. Si se solicita, crear un movimiento en caja mayor
            if (generarMovimiento && diferencia !== 0) {
                const montoDiferencia = Math.abs(diferencia);
                const saldoAnterior = yield tx.cajaMayorMovimiento.findFirst({
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
                yield tx.cajaMayorMovimiento.create({
                    data: {
                        fechaHora: new Date(),
                        tipo: 'Ajuste Conteo', // Tipo de movimiento específico para conteo
                        operacionId: nuevoConteo.id.toString(), // Usamos el ID del conteo como operacionId
                        moneda,
                        monto: new client_1.Prisma.Decimal(montoMovimiento), // Monto es la diferencia real
                        esIngreso, // Basado en la diferencia real
                        saldoAnterior: new client_1.Prisma.Decimal(saldoAnteriorValue), // El último saldo real
                        saldoActual: new client_1.Prisma.Decimal(total), // El nuevo saldo es el total contado
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
        }));
        console.log('Conteo guardado exitosamente:', result);
        return res.status(201).json(result);
    }
    catch (error) {
        console.error('Error al crear conteo. Detalles completos:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
});
exports.createConteo = createConteo;
/**
 * Actualizar un conteo existente
 */
const updateConteo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { observaciones, estado } = req.body;
    try {
        // Solo permitir actualizar observaciones y estado
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        const conteoActualizado = yield prisma.conteo.update({
            where: {
                id: Number(id)
            },
            data: {
                observaciones,
                estado
            }
        });
        return res.json(conteoActualizado);
    }
    catch (error) {
        console.error('Error al actualizar conteo:', error);
        return res.status(500).json({ error: 'Error al actualizar el conteo' });
    }
});
exports.updateConteo = updateConteo;
/**
 * Anular un conteo
 */
const anularConteo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        const conteoAnulado = yield prisma.conteo.update({
            where: {
                id: Number(id)
            },
            data: {
                estado: 'anulado'
            }
        });
        return res.json(conteoAnulado);
    }
    catch (error) {
        console.error('Error al anular conteo:', error);
        return res.status(500).json({ error: 'Error al anular el conteo' });
    }
});
exports.anularConteo = anularConteo;
/**
 * Eliminar un conteo
 */
const deleteConteo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // La eliminación en cascada de los detalles está configurada en el esquema
        // @ts-ignore - Ignoramos temporalmente el error de tipo hasta que se genere el cliente Prisma
        yield prisma.conteo.delete({
            where: {
                id: Number(id)
            }
        });
        return res.json({ message: 'Conteo eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar conteo:', error);
        return res.status(500).json({ error: 'Error al eliminar el conteo' });
    }
});
exports.deleteConteo = deleteConteo;
//# sourceMappingURL=conteo.controller.js.map
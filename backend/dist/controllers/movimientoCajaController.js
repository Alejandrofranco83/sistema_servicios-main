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
exports.getAllMovimientosConDetalles = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllMovimientosConDetalles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const startDate = new Date(fechaDesde);
        startDate.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC
        const endDate = new Date(fechaHasta);
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
        const movimientos = yield prisma.movimientoCaja.findMany({
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
        const resultadoFormateado = movimientos.map(mov => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return ({
                id: mov.id,
                createdAt: mov.createdAt.toISOString(),
                cajaId: mov.cajaId,
                operadora: mov.operadora,
                servicio: mov.servicio,
                monto: Number(mov.monto),
                comprobanteUrl: mov.rutaComprobante || null,
                // Preferir el usuario directamente asociado al movimiento
                nombreUsuario: ((_a = mov.usuario) === null || _a === void 0 ? void 0 : _a.nombre) || ((_c = (_b = mov.caja) === null || _b === void 0 ? void 0 : _b.usuario) === null || _c === void 0 ? void 0 : _c.nombre) || null,
                nombreSucursal: ((_e = (_d = mov.caja) === null || _d === void 0 ? void 0 : _d.sucursal) === null || _e === void 0 ? void 0 : _e.nombre) || null,
                Caja: {
                    Usuario: {
                        nombre: ((_g = (_f = mov.caja) === null || _f === void 0 ? void 0 : _f.usuario) === null || _g === void 0 ? void 0 : _g.nombre) || null
                    },
                    Sucursal: {
                        nombre: ((_j = (_h = mov.caja) === null || _h === void 0 ? void 0 : _h.sucursal) === null || _j === void 0 ? void 0 : _j.nombre) || null
                    }
                }
            });
        });
        return res.status(200).json({
            success: true,
            message: "Movimientos obtenidos exitosamente.",
            data: resultadoFormateado
        });
    }
    catch (error) {
        console.error('Error al obtener movimientos de caja:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar la solicitud.',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.getAllMovimientosConDetalles = getAllMovimientosConDetalles;
//# sourceMappingURL=movimientoCajaController.js.map
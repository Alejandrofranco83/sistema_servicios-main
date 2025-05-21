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
exports.CotizacionModel = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.CotizacionModel = {
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.cotizacion.findMany({
            include: {
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });
    }),
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.cotizacion.findUnique({
            where: { id },
            include: {
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
    }),
    findVigente: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.cotizacion.findFirst({
            where: { vigente: true },
            include: {
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
    }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        // Primero desactivamos todas las cotizaciones vigentes
        yield prisma.cotizacion.updateMany({
            where: { vigente: true },
            data: { vigente: false }
        });
        // Luego creamos la nueva cotización
        return prisma.cotizacion.create({
            data,
            include: {
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        // Si se está marcando como vigente, desactivamos las demás
        if (data.valorDolar || data.valorReal) {
            yield prisma.cotizacion.updateMany({
                where: { vigente: true },
                data: { vigente: false }
            });
        }
        return prisma.cotizacion.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { vigente: true // Al actualizar, siempre se marca como vigente
             }),
            include: {
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
    }),
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        // Verificar si la cotización a eliminar es la vigente
        const cotizacion = yield prisma.cotizacion.findUnique({
            where: { id }
        });
        if (cotizacion === null || cotizacion === void 0 ? void 0 : cotizacion.vigente) {
            throw new Error('No se puede eliminar la cotización vigente');
        }
        return prisma.cotizacion.delete({
            where: { id }
        });
    })
};
//# sourceMappingURL=cotizacion.model.js.map
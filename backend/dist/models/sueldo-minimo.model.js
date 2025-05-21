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
exports.SueldoMinimoModel = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.SueldoMinimoModel = {
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldoMinimo.findMany({
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
        return prisma.sueldoMinimo.findUnique({
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
        return prisma.sueldoMinimo.findFirst({
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
        // Primero desactivamos todos los sueldos mínimos vigentes
        yield prisma.sueldoMinimo.updateMany({
            where: { vigente: true },
            data: { vigente: false }
        });
        // Luego creamos el nuevo sueldo mínimo
        return prisma.sueldoMinimo.create({
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
        // Si se está actualizando el valor, desactivamos los demás
        if (data.valor) {
            yield prisma.sueldoMinimo.updateMany({
                where: { vigente: true },
                data: { vigente: false }
            });
        }
        return prisma.sueldoMinimo.update({
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
        // Verificar si el sueldo mínimo a eliminar es el vigente
        const sueldoMinimo = yield prisma.sueldoMinimo.findUnique({
            where: { id }
        });
        if (sueldoMinimo === null || sueldoMinimo === void 0 ? void 0 : sueldoMinimo.vigente) {
            throw new Error('No se puede eliminar el sueldo mínimo vigente');
        }
        return prisma.sueldoMinimo.delete({
            where: { id }
        });
    })
};
//# sourceMappingURL=sueldo-minimo.model.js.map
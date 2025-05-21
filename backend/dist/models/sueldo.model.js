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
exports.SueldoModel = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.SueldoModel = {
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.findMany({
            include: {
                persona: true
            },
            orderBy: {
                anio: 'desc',
                mes: 'desc'
            }
        });
    }),
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.findUnique({
            where: { id },
            include: {
                persona: true
            }
        });
    }),
    findByPersona: (personaId) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.findMany({
            where: { personaId },
            orderBy: {
                anio: 'desc',
                mes: 'desc'
            },
            include: {
                persona: true
            }
        });
    }),
    findByMesAnio: (mes, anio) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.findMany({
            where: {
                mes,
                anio
            },
            include: {
                persona: true
            },
            orderBy: {
                personaId: 'asc'
            }
        });
    }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.create({
            data,
            include: {
                persona: true
            }
        });
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.update({
            where: { id },
            data,
            include: {
                persona: true
            }
        });
    }),
    // Actualiza o crea un sueldo si no existe
    upsert: (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { personaId, mes, anio, monto } = data;
        return prisma.sueldo.upsert({
            where: {
                personaId_mes_anio: {
                    personaId,
                    mes,
                    anio
                }
            },
            update: {
                monto
            },
            create: {
                personaId,
                mes,
                anio,
                monto
            },
            include: {
                persona: true
            }
        });
    }),
    // Crea o actualiza múltiples sueldos en una transacción
    guardarMultiples: (sueldos) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.$transaction(sueldos.map(sueldo => {
            const { personaId, mes, anio, monto } = sueldo;
            return prisma.sueldo.upsert({
                where: {
                    personaId_mes_anio: {
                        personaId,
                        mes,
                        anio
                    }
                },
                update: {
                    monto
                },
                create: {
                    personaId,
                    mes,
                    anio,
                    monto
                }
            });
        }));
    }),
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.sueldo.delete({
            where: { id }
        });
    })
};
//# sourceMappingURL=sueldo.model.js.map
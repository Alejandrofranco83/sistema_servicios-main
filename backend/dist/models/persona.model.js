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
exports.PersonaModel = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.PersonaModel = {
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.findMany();
    }),
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.findUnique({
            where: { id },
        });
    }),
    findByTipo: (tipo) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.findMany({
            where: { tipo },
            orderBy: {
                nombreCompleto: 'asc'
            }
        });
    }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.create({
            data,
        });
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.update({
            where: { id },
            data,
        });
    }),
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.delete({
            where: { id },
        });
    }),
    search: (query) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.persona.findMany({
            where: {
                OR: [
                    { nombreCompleto: { contains: query, mode: 'insensitive' } },
                    { documento: { contains: query, mode: 'insensitive' } }
                ]
            },
            orderBy: {
                nombreCompleto: 'asc'
            }
        });
    })
};
//# sourceMappingURL=persona.model.js.map
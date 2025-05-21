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
exports.UsuarioModel = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.UsuarioModel = {
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.usuario.findMany({
            include: {
                persona: true,
            },
        });
    }),
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.usuario.findUnique({
            where: { id },
            include: {
                persona: true,
            },
        });
    }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        // Si no hay contraseña, establecer una predeterminada
        if (!data.password) {
            data.password = '123'; // Contraseña temporal
        }
        // Verificar que la persona existe si se proporciona personaId
        if (data.personaId) {
            const persona = yield prisma.persona.findUnique({
                where: { id: data.personaId },
            });
            if (!persona) {
                throw new Error('La persona seleccionada no existe');
            }
            if (persona.tipo !== 'Funcionario' && persona.tipo !== 'Vip') {
                throw new Error('Solo se pueden crear usuarios para personas de tipo Funcionario o Vip');
            }
            // Verificar que la persona no tenga ya un usuario asignado
            const existingUser = yield prisma.usuario.findUnique({
                where: { personaId: data.personaId },
            });
            if (existingUser) {
                throw new Error('Esta persona ya tiene un usuario asignado');
            }
        }
        // Crear el objeto de datos base
        const createData = {
            username: data.username,
            password: data.password,
        };
        // Agregar campos opcionales
        if (data.nombre)
            createData.nombre = data.nombre;
        if (data.email)
            createData.email = data.email;
        if (data.activo !== undefined)
            createData.activo = data.activo;
        // Conectar relaciones
        if (data.personaId) {
            createData.persona = {
                connect: { id: data.personaId }
            };
        }
        if (data.rolId) {
            createData.rol = {
                connect: { id: data.rolId }
            };
        }
        return prisma.usuario.create({
            data: createData,
            include: {
                persona: true,
            },
        });
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        // Si se está actualizando personaId, realizar las mismas validaciones que en create
        if (data.personaId) {
            const persona = yield prisma.persona.findUnique({
                where: { id: data.personaId },
            });
            if (!persona) {
                throw new Error('La persona seleccionada no existe');
            }
            if (persona.tipo !== 'Funcionario' && persona.tipo !== 'Vip') {
                throw new Error('Solo se pueden asignar usuarios a personas de tipo Funcionario o Vip');
            }
            // Verificar que la nueva persona no tenga ya un usuario asignado
            const existingUser = yield prisma.usuario.findUnique({
                where: { personaId: data.personaId },
            });
            if (existingUser && existingUser.id !== id) {
                throw new Error('Esta persona ya tiene un usuario asignado');
            }
        }
        // Crear objeto de actualización
        const updateData = {};
        // Agregar campos simples
        if (data.username)
            updateData.username = data.username;
        if (data.password)
            updateData.password = data.password;
        if (data.nombre)
            updateData.nombre = data.nombre;
        if (data.email)
            updateData.email = data.email;
        if (data.activo !== undefined)
            updateData.activo = data.activo;
        // Conectar relaciones
        if (data.personaId) {
            updateData.persona = {
                connect: { id: data.personaId }
            };
        }
        if (data.rolId) {
            updateData.rol = {
                connect: { id: data.rolId }
            };
        }
        return prisma.usuario.update({
            where: { id },
            data: updateData,
            include: {
                persona: true,
            },
        });
    }),
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.usuario.delete({
            where: { id },
        });
    }),
    resetPassword: (id) => __awaiter(void 0, void 0, void 0, function* () {
        // Aquí normalmente encriptarías la contraseña antes de guardarla
        // Por ahora, solo para demostración, guardamos "123" directamente
        return prisma.usuario.update({
            where: { id },
            data: {
                password: '123'
            }
        });
    }),
};
//# sourceMappingURL=usuario.model.js.map
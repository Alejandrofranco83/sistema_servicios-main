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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioController = void 0;
const usuario_model_1 = require("../models/usuario.model");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UsuarioController {
}
exports.UsuarioController = UsuarioController;
_a = UsuarioController;
// Obtener todos los usuarios
UsuarioController.getUsuarios = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usuarios = yield prisma.usuario.findMany({
            include: {
                persona: true,
                rol: {
                    include: {
                        permisos: true
                    }
                }
            }
        });
        res.json(usuarios);
        return;
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
        return;
    }
});
// Obtener un usuario por ID
UsuarioController.getUsuarioById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const usuario = yield prisma.usuario.findUnique({
            where: { id: Number(id) },
            include: {
                persona: true,
                rol: {
                    include: {
                        permisos: true
                    }
                }
            }
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
        return;
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
        return;
    }
});
UsuarioController.getAllUsuarios = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usuarios = yield usuario_model_1.UsuarioModel.findAll();
        return res.json(usuarios);
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
UsuarioController.createUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, personaId, nombre, rolId } = req.body;
        // Validar datos
        if (!username || !personaId || !nombre) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }
        // Verificar si ya existe un usuario con el mismo username
        const existingUser = yield prisma.usuario.findUnique({
            where: {
                username
            }
        });
        if (existingUser) {
            return res.status(400).json({ error: "Ya existe un usuario con ese nombre de usuario" });
        }
        // Crear usuario
        const usuario = yield prisma.usuario.create({
            data: {
                username,
                nombre,
                password: 'TEMP_PASSWORD', // Contraseña temporal que debe ser cambiada
                persona: {
                    connect: {
                        id: personaId
                    }
                },
                rol: {
                    connect: {
                        id: rolId || 1 // Si no hay rolId, conectar al rol ID 1 por defecto
                    }
                }
            }
        });
        return res.status(201).json(usuario);
    }
    catch (error) {
        console.error("Error al crear usuario:", error);
        return res.status(500).json({ error: "Error al crear usuario" });
    }
});
UsuarioController.updateUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const usuarioData = req.body;
        const usuarioActualizado = yield usuario_model_1.UsuarioModel.update(id, usuarioData);
        return res.json(usuarioActualizado);
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        // Manejar errores de validación personalizados
        if (error.message) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
UsuarioController.deleteUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield usuario_model_1.UsuarioModel.delete(id);
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
UsuarioController.resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield usuario_model_1.UsuarioModel.resetPassword(id);
        return res.status(200).json({ message: 'Contraseña reseteada exitosamente' });
    }
    catch (error) {
        console.error('Error al resetear contraseña:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
//# sourceMappingURL=usuario.controller.js.map
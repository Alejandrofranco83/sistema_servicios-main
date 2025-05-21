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
exports.PermisoController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PermisoController {
    constructor() {
        // Obtener todos los permisos
        this.getPermisos = (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const permisos = yield prisma.permiso.findMany();
                res.json(permisos);
                return;
            }
            catch (error) {
                console.error('Error al obtener permisos:', error);
                res.status(500).json({ error: 'Error al obtener permisos' });
                return;
            }
        });
        // Crear un nuevo permiso
        this.createPermiso = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { modulo, pantalla, descripcion } = req.body;
                if (!modulo || !pantalla) {
                    return res.status(400).json({ error: 'Módulo y pantalla son requeridos' });
                }
                // Verificar si ya existe un permiso similar
                const permisoExistente = yield prisma.permiso.findFirst({
                    where: {
                        modulo,
                        pantalla
                    }
                });
                if (permisoExistente) {
                    return res.status(400).json({ error: 'Ya existe un permiso para este módulo y pantalla' });
                }
                // Crear el permiso
                const permiso = yield prisma.permiso.create({
                    data: {
                        modulo,
                        pantalla,
                        descripcion
                    }
                });
                res.status(201).json(permiso);
                return;
            }
            catch (error) {
                console.error('Error al crear permiso:', error);
                res.status(500).json({ error: 'Error al crear permiso' });
                return;
            }
        });
        // Actualizar un permiso existente
        this.updatePermiso = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { modulo, pantalla, descripcion } = req.body;
                // Verificar si existe el permiso
                const permisoExistente = yield prisma.permiso.findUnique({
                    where: { id: Number(id) }
                });
                if (!permisoExistente) {
                    return res.status(404).json({ error: 'Permiso no encontrado' });
                }
                // Verificar si ya existe otro permiso con la misma combinación de módulo y pantalla
                if (modulo && pantalla) {
                    const duplicado = yield prisma.permiso.findFirst({
                        where: {
                            modulo,
                            pantalla,
                            NOT: {
                                id: Number(id)
                            }
                        }
                    });
                    if (duplicado) {
                        return res.status(400).json({ error: 'Ya existe un permiso para este módulo y pantalla' });
                    }
                }
                // Actualizar el permiso
                const permisoActualizado = yield prisma.permiso.update({
                    where: { id: Number(id) },
                    data: {
                        modulo: modulo || undefined,
                        pantalla: pantalla || undefined,
                        descripcion: descripcion || undefined
                    }
                });
                res.json(permisoActualizado);
                return;
            }
            catch (error) {
                console.error('Error al actualizar permiso:', error);
                res.status(500).json({ error: 'Error al actualizar permiso' });
                return;
            }
        });
        // Eliminar un permiso
        this.deletePermiso = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                // Verificar si el permiso está asignado a algún rol
                const rolesConPermiso = yield prisma.rol.findMany({
                    where: {
                        permisos: {
                            some: {
                                id: Number(id)
                            }
                        }
                    }
                });
                if (rolesConPermiso.length > 0) {
                    return res.status(400).json({
                        error: 'No se puede eliminar este permiso porque está asignado a roles'
                    });
                }
                // Eliminar el permiso
                yield prisma.permiso.delete({
                    where: { id: Number(id) }
                });
                res.json({ message: 'Permiso eliminado correctamente' });
                return;
            }
            catch (error) {
                console.error('Error al eliminar permiso:', error);
                res.status(500).json({ error: 'Error al eliminar permiso' });
                return;
            }
        });
    }
}
exports.PermisoController = PermisoController;
//# sourceMappingURL=permiso.controller.js.map
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
exports.RolController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class RolController {
    constructor() {
        // Obtener todos los roles
        this.getRoles = (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const roles = yield prisma.rol.findMany({
                    include: {
                        permisos: true
                    }
                });
                res.json(roles);
            }
            catch (error) {
                console.error('Error al obtener roles:', error);
                res.status(500).json({ error: 'Error al obtener roles' });
            }
        });
        // Obtener un rol por ID
        this.getRolById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const rol = yield prisma.rol.findUnique({
                    where: { id: Number(id) },
                    include: {
                        permisos: true
                    }
                });
                if (!rol) {
                    return res.status(404).json({ error: 'Rol no encontrado' });
                }
                res.json(rol);
                return;
            }
            catch (error) {
                console.error('Error al obtener rol:', error);
                res.status(500).json({ error: 'Error al obtener rol' });
                return;
            }
        });
        // Crear un nuevo rol
        this.createRol = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { nombre, descripcion, permisos } = req.body;
                if (!nombre) {
                    return res.status(400).json({ error: 'El nombre del rol es requerido' });
                }
                // Verificar si ya existe un rol con el mismo nombre
                const rolExistente = yield prisma.rol.findUnique({
                    where: { nombre }
                });
                if (rolExistente) {
                    return res.status(400).json({ error: 'Ya existe un rol con este nombre' });
                }
                // Crear el rol
                const rol = yield prisma.rol.create({
                    data: {
                        nombre,
                        descripcion,
                        permisos: {
                            connect: Array.isArray(permisos) ? permisos.map(p => ({ id: p.id })) : []
                        }
                    },
                    include: {
                        permisos: true
                    }
                });
                res.status(201).json(rol);
                return;
            }
            catch (error) {
                console.error('Error al crear rol:', error);
                res.status(500).json({ error: 'Error al crear rol' });
                return;
            }
        });
        // Actualizar un rol existente
        this.updateRol = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { nombre, descripcion, permisos } = req.body;
                console.log('Actualizando rol ID:', id);
                console.log('Datos recibidos:', { nombre, descripcion, permisos });
                // Verificar si existe el rol
                const rolExistente = yield prisma.rol.findUnique({
                    where: { id: Number(id) }
                });
                if (!rolExistente) {
                    return res.status(404).json({ error: 'Rol no encontrado' });
                }
                // Verificar si el nombre ya está en uso por otro rol
                if (nombre && nombre !== rolExistente.nombre) {
                    const nombreExistente = yield prisma.rol.findUnique({
                        where: { nombre }
                    });
                    if (nombreExistente) {
                        return res.status(400).json({ error: 'Ya existe un rol con este nombre' });
                    }
                }
                // Extraer solo los IDs de los permisos
                let permisosIds = [];
                if (permisos) {
                    if (Array.isArray(permisos)) {
                        // Si es un array, podría ser un array de objetos o un array de IDs
                        permisosIds = permisos.map(p => {
                            if (typeof p === 'number') {
                                return p;
                            }
                            else if (p && typeof p === 'object' && 'id' in p) {
                                return p.id;
                            }
                            console.error('Formato de permiso incorrecto:', p);
                            return null;
                        }).filter(id => id !== null);
                    }
                    else {
                        console.error('Formato de permisos incorrecto, se esperaba un array:', permisos);
                    }
                }
                console.log('IDs de permisos extraídos:', permisosIds);
                // Actualizar el rol
                const rolActualizado = yield prisma.rol.update({
                    where: { id: Number(id) },
                    data: {
                        nombre: nombre || undefined,
                        descripcion: descripcion !== undefined ? descripcion : undefined,
                        permisos: {
                            // Desconectar todos los permisos actuales
                            set: [],
                            // Conectar los nuevos permisos
                            connect: permisosIds.map(permId => ({ id: permId }))
                        }
                    },
                    include: {
                        permisos: true
                    }
                });
                console.log('Rol actualizado correctamente:', rolActualizado);
                console.log('Permisos asignados:', rolActualizado.permisos.map(p => `${p.id} - ${p.modulo}/${p.pantalla}`));
                res.json(rolActualizado);
                return;
            }
            catch (error) {
                console.error('Error al actualizar rol:', error);
                res.status(500).json({ error: 'Error al actualizar rol' });
                return;
            }
        });
        // Eliminar un rol
        this.deleteRol = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                // Verificar si existen usuarios con este rol
                const usuariosConRol = yield prisma.usuario.findMany({
                    where: { rolId: Number(id) }
                });
                if (usuariosConRol.length > 0) {
                    return res.status(400).json({
                        error: 'No se puede eliminar este rol porque hay usuarios asignados a él'
                    });
                }
                // Eliminar el rol
                yield prisma.rol.delete({
                    where: { id: Number(id) }
                });
                res.json({ message: 'Rol eliminado correctamente' });
                return;
            }
            catch (error) {
                console.error('Error al eliminar rol:', error);
                res.status(500).json({ error: 'Error al eliminar rol' });
                return;
            }
        });
    }
}
exports.RolController = RolController;
//# sourceMappingURL=rol.controller.js.map
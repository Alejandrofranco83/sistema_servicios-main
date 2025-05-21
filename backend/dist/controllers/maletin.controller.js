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
exports.getMaletinesBySucursal = exports.deleteMaletin = exports.updateMaletin = exports.createMaletin = exports.getMaletinById = exports.getMaletines = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Obtener todos los maletines
const getMaletines = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Accediendo a getMaletines - inicio de función');
    try {
        const maletines = yield prisma.maletin.findMany({
            include: {
                sucursal: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                        email: true
                    }
                }
            }
        });
        // Convertir los IDs numéricos a string para mantener compatibilidad con el frontend
        const maletinesFormateados = maletines.map(maletin => (Object.assign(Object.assign({}, maletin), { id: String(maletin.id), sucursalId: String(maletin.sucursalId), sucursal: maletin.sucursal ? Object.assign(Object.assign({}, maletin.sucursal), { id: String(maletin.sucursal.id) }) : undefined })));
        return res.json(maletinesFormateados);
    }
    catch (error) {
        console.error('Error al obtener maletines:', error);
        return res.status(500).json({ error: 'Error al obtener los maletines' });
    }
});
exports.getMaletines = getMaletines;
// Obtener un maletín por ID
const getMaletinById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const maletin = yield prisma.maletin.findUnique({
            where: { id: parseInt(id) },
            include: {
                sucursal: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                        email: true
                    }
                }
            }
        });
        if (!maletin) {
            return res.status(404).json({ error: 'Maletín no encontrado' });
        }
        // Convertir los IDs numéricos a string para mantener compatibilidad con el frontend
        const maletinFormateado = Object.assign(Object.assign({}, maletin), { id: String(maletin.id), sucursalId: String(maletin.sucursalId), sucursal: maletin.sucursal ? Object.assign(Object.assign({}, maletin.sucursal), { id: String(maletin.sucursal.id) }) : undefined });
        return res.json(maletinFormateado);
    }
    catch (error) {
        console.error(`Error al obtener maletín ${id}:`, error);
        return res.status(500).json({ error: 'Error al obtener el maletín' });
    }
});
exports.getMaletinById = getMaletinById;
// Crear un nuevo maletín
const createMaletin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Recibido en createMaletin:', req.body);
    const { codigo, sucursalId } = req.body;
    try {
        // Verificar que se recibieron los datos necesarios
        if (!codigo) {
            console.error('Error: Código no proporcionado');
            return res.status(400).json({ error: 'El código del maletín es requerido' });
        }
        if (!sucursalId) {
            console.error('Error: SucursalId no proporcionado');
            return res.status(400).json({ error: 'La sucursal es requerida' });
        }
        // Verificar si el código ya existe
        const maletinExistente = yield prisma.maletin.findFirst({
            where: { codigo }
        });
        if (maletinExistente) {
            console.error(`Error: El código ${codigo} ya existe`);
            return res.status(400).json({ error: 'El código de maletín ya existe' });
        }
        // Verificar si la sucursal existe
        const sucursalExistente = yield prisma.sucursal.findUnique({
            where: { id: parseInt(sucursalId) }
        });
        if (!sucursalExistente) {
            console.error(`Error: Sucursal ${sucursalId} no encontrada`);
            return res.status(400).json({ error: 'La sucursal especificada no existe' });
        }
        console.log('Creando maletín con:', { codigo, sucursalId, sucursal: sucursalExistente.nombre });
        // Crear el nuevo maletín en la base de datos
        const nuevoMaletin = yield prisma.maletin.create({
            data: {
                codigo,
                sucursalId: parseInt(sucursalId)
            },
            include: {
                sucursal: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                        email: true
                    }
                }
            }
        });
        console.log('Maletín creado exitosamente:', nuevoMaletin);
        // Formatear la respuesta para mantener compatibilidad con el frontend
        const maletinRespuesta = Object.assign(Object.assign({}, nuevoMaletin), { id: String(nuevoMaletin.id), sucursalId: String(nuevoMaletin.sucursalId), sucursal: nuevoMaletin.sucursal ? Object.assign(Object.assign({}, nuevoMaletin.sucursal), { id: String(nuevoMaletin.sucursal.id) }) : undefined });
        return res.status(201).json(maletinRespuesta);
    }
    catch (error) {
        console.error('Error interno al crear maletín:', error);
        return res.status(500).json({ error: 'Error al crear el maletín', details: String(error) });
    }
});
exports.createMaletin = createMaletin;
// Actualizar un maletín existente
const updateMaletin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { codigo, sucursalId } = req.body;
    try {
        // Verificar que se proporcionaron datos para actualizar
        if (!codigo && !sucursalId) {
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
        }
        // Verificar si el maletín existe
        const maletinExistente = yield prisma.maletin.findUnique({
            where: { id: parseInt(id) }
        });
        if (!maletinExistente) {
            return res.status(404).json({ error: 'Maletín no encontrado' });
        }
        // Si se está actualizando el código, verificar que no exista otro maletín con ese código
        if (codigo && codigo !== maletinExistente.codigo) {
            const codigoExistente = yield prisma.maletin.findFirst({
                where: {
                    codigo,
                    id: { not: parseInt(id) }
                }
            });
            if (codigoExistente) {
                return res.status(400).json({ error: 'El código de maletín ya está en uso' });
            }
        }
        // Si se está actualizando la sucursal, verificar que exista
        if (sucursalId) {
            const sucursalExistente = yield prisma.sucursal.findUnique({
                where: { id: parseInt(sucursalId) }
            });
            if (!sucursalExistente) {
                return res.status(400).json({ error: 'La sucursal especificada no existe' });
            }
        }
        // Actualizar el maletín
        const maletinActualizado = yield prisma.maletin.update({
            where: { id: parseInt(id) },
            data: {
                codigo: codigo || undefined,
                sucursalId: sucursalId ? parseInt(sucursalId) : undefined
            },
            include: {
                sucursal: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                        email: true
                    }
                }
            }
        });
        // Formatear la respuesta para mantener compatibilidad con el frontend
        const maletinRespuesta = Object.assign(Object.assign({}, maletinActualizado), { id: String(maletinActualizado.id), sucursalId: String(maletinActualizado.sucursalId), sucursal: maletinActualizado.sucursal ? Object.assign(Object.assign({}, maletinActualizado.sucursal), { id: String(maletinActualizado.sucursal.id) }) : undefined });
        return res.json(maletinRespuesta);
    }
    catch (error) {
        console.error(`Error al actualizar maletín ${id}:`, error);
        return res.status(500).json({ error: 'Error al actualizar el maletín' });
    }
});
exports.updateMaletin = updateMaletin;
// Eliminar un maletín
const deleteMaletin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si el maletín existe
        const maletinExistente = yield prisma.maletin.findUnique({
            where: { id: parseInt(id) }
        });
        if (!maletinExistente) {
            return res.status(404).json({ error: 'Maletín no encontrado' });
        }
        // Verificar si el maletín está siendo usado por alguna caja
        const cajasAsociadas = yield prisma.caja.findFirst({
            where: { maletinId: parseInt(id) }
        });
        if (cajasAsociadas) {
            return res.status(400).json({
                error: 'No se puede eliminar el maletín porque está siendo utilizado por una o más cajas'
            });
        }
        // Eliminar el maletín
        yield prisma.maletin.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ message: 'Maletín eliminado correctamente' });
    }
    catch (error) {
        console.error(`Error al eliminar maletín ${id}:`, error);
        return res.status(500).json({ error: 'Error al eliminar el maletín' });
    }
});
exports.deleteMaletin = deleteMaletin;
// Obtener maletines por sucursal
const getMaletinesBySucursal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sucursalId } = req.params;
    try {
        const maletines = yield prisma.maletin.findMany({
            where: { sucursalId: parseInt(sucursalId) },
            include: {
                sucursal: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                        email: true
                    }
                }
            }
        });
        // Formatear la respuesta para mantener compatibilidad con el frontend
        const maletinesFormateados = maletines.map(maletin => (Object.assign(Object.assign({}, maletin), { id: String(maletin.id), sucursalId: String(maletin.sucursalId), sucursal: maletin.sucursal ? Object.assign(Object.assign({}, maletin.sucursal), { id: String(maletin.sucursal.id) }) : undefined })));
        return res.json(maletinesFormateados);
    }
    catch (error) {
        console.error(`Error al obtener maletines por sucursal ${sucursalId}:`, error);
        return res.status(500).json({ error: 'Error al obtener los maletines por sucursal' });
    }
});
exports.getMaletinesBySucursal = getMaletinesBySucursal;
//# sourceMappingURL=maletin.controller.js.map
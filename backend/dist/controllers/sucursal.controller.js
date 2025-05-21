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
exports.deleteSucursal = exports.updateSucursal = exports.createSucursal = exports.getSucursalById = exports.getSucursales = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Obtener todas las sucursales
const getSucursales = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Accediendo a getSucursales - inicio de función');
    try {
        const sucursales = yield prisma.sucursal.findMany({
            include: {
                maletines: true
            }
        });
        // Convertir los IDs numéricos a string para mantener compatibilidad con el frontend
        const sucursalesFormateadas = sucursales.map(sucursal => (Object.assign(Object.assign({}, sucursal), { id: String(sucursal.id), maletines: sucursal.maletines.map(maletin => (Object.assign(Object.assign({}, maletin), { id: String(maletin.id), sucursalId: String(maletin.sucursalId) }))) })));
        return res.json(sucursalesFormateadas);
    }
    catch (error) {
        console.error('Error al obtener sucursales:', error);
        return res.status(500).json({ error: 'Error al obtener las sucursales', details: String(error) });
    }
});
exports.getSucursales = getSucursales;
// Obtener una sucursal por ID
const getSucursalById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const sucursal = yield prisma.sucursal.findUnique({
            where: { id: parseInt(id) },
            include: {
                maletines: true
            }
        });
        if (!sucursal) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }
        // Formatear la respuesta para mantener compatibilidad con el frontend
        const sucursalFormateada = Object.assign(Object.assign({}, sucursal), { id: String(sucursal.id), maletines: sucursal.maletines.map(maletin => (Object.assign(Object.assign({}, maletin), { id: String(maletin.id), sucursalId: String(maletin.sucursalId) }))) });
        return res.json(sucursalFormateada);
    }
    catch (error) {
        console.error(`Error al obtener sucursal ${id}:`, error);
        return res.status(500).json({ error: 'Error al obtener la sucursal' });
    }
});
exports.getSucursalById = getSucursalById;
// Crear una nueva sucursal
const createSucursal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, codigo, direccion, telefono, email } = req.body;
    try {
        // Verificar si el código ya existe
        const sucursalExistente = yield prisma.sucursal.findFirst({
            where: { codigo }
        });
        if (sucursalExistente) {
            return res.status(400).json({ error: 'El código de sucursal ya existe' });
        }
        // Crear la nueva sucursal en la base de datos
        const nuevaSucursal = yield prisma.sucursal.create({
            data: {
                nombre,
                codigo,
                direccion,
                telefono,
                email
            }
        });
        // Formatear la respuesta para mantener compatibilidad con el frontend
        const sucursalFormateada = Object.assign(Object.assign({}, nuevaSucursal), { id: String(nuevaSucursal.id), maletines: [] });
        return res.status(201).json(sucursalFormateada);
    }
    catch (error) {
        console.error('Error al crear sucursal:', error);
        return res.status(500).json({ error: 'Error al crear la sucursal' });
    }
});
exports.createSucursal = createSucursal;
// Actualizar una sucursal existente
const updateSucursal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, codigo, direccion, telefono, email } = req.body;
    try {
        // Verificar si la sucursal existe
        const sucursalExistente = yield prisma.sucursal.findUnique({
            where: { id: parseInt(id) }
        });
        if (!sucursalExistente) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }
        // Verificar si el nuevo código ya existe en otra sucursal
        if (codigo && codigo !== sucursalExistente.codigo) {
            const codigoExistente = yield prisma.sucursal.findFirst({
                where: {
                    codigo,
                    id: { not: parseInt(id) }
                }
            });
            if (codigoExistente) {
                return res.status(400).json({ error: 'El código de sucursal ya está en uso' });
            }
        }
        // Actualizar la sucursal
        const sucursalActualizada = yield prisma.sucursal.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                codigo,
                direccion,
                telefono,
                email
            },
            include: {
                maletines: true
            }
        });
        // Formatear la respuesta para mantener compatibilidad con el frontend
        const sucursalFormateada = Object.assign(Object.assign({}, sucursalActualizada), { id: String(sucursalActualizada.id), maletines: sucursalActualizada.maletines.map(maletin => (Object.assign(Object.assign({}, maletin), { id: String(maletin.id), sucursalId: String(maletin.sucursalId) }))) });
        return res.json(sucursalFormateada);
    }
    catch (error) {
        console.error(`Error al actualizar sucursal ${id}:`, error);
        return res.status(500).json({ error: 'Error al actualizar la sucursal' });
    }
});
exports.updateSucursal = updateSucursal;
// Eliminar una sucursal
const deleteSucursal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si la sucursal existe
        const sucursalExistente = yield prisma.sucursal.findUnique({
            where: { id: parseInt(id) },
            include: {
                maletines: true
            }
        });
        if (!sucursalExistente) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }
        // Verificar si la sucursal tiene maletines asociados
        if (sucursalExistente.maletines.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar la sucursal porque tiene maletines asociados',
                maletinesCount: sucursalExistente.maletines.length
            });
        }
        // Eliminar la sucursal
        yield prisma.sucursal.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ message: 'Sucursal eliminada correctamente' });
    }
    catch (error) {
        console.error(`Error al eliminar sucursal ${id}:`, error);
        return res.status(500).json({ error: 'Error al eliminar la sucursal' });
    }
});
exports.deleteSucursal = deleteSucursal;
//# sourceMappingURL=sucursal.controller.js.map
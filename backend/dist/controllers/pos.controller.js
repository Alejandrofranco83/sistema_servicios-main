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
exports.deletePos = exports.updatePos = exports.createPos = exports.getPosByCodigoBarras = exports.getPosById = exports.getAllPos = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Esquema de validación para crear/actualizar dispositivo POS
const PosSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido'),
    codigoBarras: zod_1.z.string().min(1, 'El código de barras es requerido'),
    cuentaBancariaId: zod_1.z.number({
        required_error: 'El ID de la cuenta bancaria es requerido',
        invalid_type_error: 'El ID de la cuenta bancaria debe ser un número'
    })
});
/**
 * Obtener todos los dispositivos POS
 */
const getAllPos = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dispositivos = yield prisma.dispositivoPos.findMany({
            include: {
                cuentaBancaria: true
            }
        });
        return res.status(200).json(dispositivos);
    }
    catch (error) {
        console.error('Error al obtener dispositivos POS:', error);
        return res.status(500).json({ error: 'Error al obtener dispositivos POS' });
    }
});
exports.getAllPos = getAllPos;
/**
 * Obtener un dispositivo POS por ID
 */
const getPosById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const dispositivo = yield prisma.dispositivoPos.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                cuentaBancaria: true
            }
        });
        if (!dispositivo) {
            return res.status(404).json({ error: 'Dispositivo POS no encontrado' });
        }
        return res.status(200).json(dispositivo);
    }
    catch (error) {
        console.error(`Error al obtener dispositivo POS ${req.params.id}:`, error);
        return res.status(500).json({ error: 'Error al obtener dispositivo POS' });
    }
});
exports.getPosById = getPosById;
/**
 * Obtener un dispositivo POS por código de barras
 */
const getPosByCodigoBarras = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { codigo } = req.params;
        if (!codigo) {
            return res.status(400).json({ error: 'Código de barras requerido' });
        }
        const dispositivo = yield prisma.dispositivoPos.findUnique({
            where: {
                codigoBarras: codigo
            },
            include: {
                cuentaBancaria: true
            }
        });
        if (!dispositivo) {
            return res.status(404).json({ error: 'Dispositivo POS no encontrado con ese código de barras' });
        }
        return res.status(200).json(dispositivo);
    }
    catch (error) {
        console.error(`Error al obtener dispositivo POS con código ${req.params.codigo}:`, error);
        return res.status(500).json({ error: 'Error al obtener dispositivo POS' });
    }
});
exports.getPosByCodigoBarras = getPosByCodigoBarras;
/**
 * Crear un nuevo dispositivo POS
 */
const createPos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validationResult = PosSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        // Verificar que la cuenta bancaria existe
        const cuentaBancaria = yield prisma.cuentaBancaria.findUnique({
            where: { id: data.cuentaBancariaId }
        });
        if (!cuentaBancaria) {
            return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
        }
        // Verificar que el código de barras no esté duplicado
        const existingPos = yield prisma.dispositivoPos.findUnique({
            where: { codigoBarras: data.codigoBarras }
        });
        if (existingPos) {
            return res.status(400).json({ error: 'Ya existe un dispositivo POS con ese código de barras' });
        }
        // Crear el dispositivo POS
        const nuevoPOS = yield prisma.dispositivoPos.create({
            data,
            include: {
                cuentaBancaria: true
            }
        });
        return res.status(201).json(nuevoPOS);
    }
    catch (error) {
        console.error('Error al crear dispositivo POS:', error);
        return res.status(500).json({ error: 'Error al crear dispositivo POS' });
    }
});
exports.createPos = createPos;
/**
 * Actualizar un dispositivo POS existente
 */
const updatePos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const validationResult = PosSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        // Verificar que el dispositivo POS existe
        const dispositivoExistente = yield prisma.dispositivoPos.findUnique({
            where: { id: parseInt(id) }
        });
        if (!dispositivoExistente) {
            return res.status(404).json({ error: 'Dispositivo POS no encontrado' });
        }
        // Verificar que la cuenta bancaria existe
        const cuentaBancaria = yield prisma.cuentaBancaria.findUnique({
            where: { id: data.cuentaBancariaId }
        });
        if (!cuentaBancaria) {
            return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
        }
        // Verificar que el código de barras no esté duplicado (si se está cambiando)
        if (data.codigoBarras !== dispositivoExistente.codigoBarras) {
            const existingPos = yield prisma.dispositivoPos.findUnique({
                where: { codigoBarras: data.codigoBarras }
            });
            if (existingPos) {
                return res.status(400).json({ error: 'Ya existe un dispositivo POS con ese código de barras' });
            }
        }
        // Actualizar el dispositivo POS
        const dispositivoActualizado = yield prisma.dispositivoPos.update({
            where: { id: parseInt(id) },
            data,
            include: {
                cuentaBancaria: true
            }
        });
        return res.status(200).json(dispositivoActualizado);
    }
    catch (error) {
        console.error(`Error al actualizar dispositivo POS ${req.params.id}:`, error);
        return res.status(500).json({ error: 'Error al actualizar dispositivo POS' });
    }
});
exports.updatePos = updatePos;
/**
 * Eliminar un dispositivo POS
 */
const deletePos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        // Verificar que el dispositivo POS existe
        const dispositivo = yield prisma.dispositivoPos.findUnique({
            where: { id: parseInt(id) }
        });
        if (!dispositivo) {
            return res.status(404).json({ error: 'Dispositivo POS no encontrado' });
        }
        // Eliminar el dispositivo POS
        yield prisma.dispositivoPos.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ message: 'Dispositivo POS eliminado correctamente' });
    }
    catch (error) {
        console.error(`Error al eliminar dispositivo POS ${req.params.id}:`, error);
        return res.status(500).json({ error: 'Error al eliminar dispositivo POS' });
    }
});
exports.deletePos = deletePos;
//# sourceMappingURL=pos.controller.js.map
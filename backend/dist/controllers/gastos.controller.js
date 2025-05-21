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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSucursales = exports.deleteGasto = exports.updateGasto = exports.createGasto = exports.getGastoById = exports.getGastos = exports.upload = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
// Configuración para la subida de comprobantes
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/comprobantes');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});
exports.upload = (0, multer_1.default)({ storage });
// Obtener todos los gastos con posibilidad de filtros
const getGastos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fechaDesde, fechaHasta, categoriaId, subcategoriaId, sucursalId, moneda } = req.query;
        const filters = {};
        if (fechaDesde && fechaHasta) {
            filters.fecha = {
                gte: new Date(fechaDesde),
                lte: new Date(fechaHasta)
            };
        }
        else if (fechaDesde) {
            filters.fecha = { gte: new Date(fechaDesde) };
        }
        else if (fechaHasta) {
            filters.fecha = { lte: new Date(fechaHasta) };
        }
        if (categoriaId)
            filters.categoriaId = parseInt(categoriaId);
        if (subcategoriaId)
            filters.subcategoriaId = parseInt(subcategoriaId);
        if (sucursalId && sucursalId !== 'null') {
            filters.sucursalId = parseInt(sucursalId);
        }
        else if (sucursalId === 'null') {
            filters.sucursalId = null; // Caso para "General/Adm"
        }
        if (moneda)
            filters.moneda = moneda;
        const gastos = yield prisma.gasto.findMany({
            where: filters,
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        res.json(gastos);
    }
    catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).json({ error: 'Error al obtener los gastos' });
    }
});
exports.getGastos = getGastos;
// Obtener un gasto por su ID
const getGastoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const gasto = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) },
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        res.json(gasto);
    }
    catch (error) {
        console.error('Error al obtener gasto:', error);
        res.status(500).json({ error: 'Error al obtener el gasto' });
    }
});
exports.getGastoById = getGastoById;
// Crear un nuevo gasto
const createGasto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fecha, descripcion, monto, moneda, categoriaId, subcategoriaId, sucursalId, observaciones } = req.body;
        // Verificar que el usuario es válido
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Crear el gasto
        const gasto = yield prisma.gasto.create({
            data: {
                fecha: fecha ? new Date(fecha) : new Date(),
                descripcion,
                monto: parseFloat(monto),
                moneda: moneda || 'GS',
                categoriaId: parseInt(categoriaId),
                subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
                sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
                comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : null,
                observaciones,
                usuarioId: userId
            },
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
        res.status(201).json(gasto);
    }
    catch (error) {
        console.error('Error al crear gasto:', error);
        res.status(500).json({ error: 'Error al crear el gasto' });
    }
});
exports.createGasto = createGasto;
// Actualizar un gasto existente
const updateGasto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { fecha, descripcion, monto, moneda, categoriaId, subcategoriaId, sucursalId, observaciones } = req.body;
        // Verificar que el gasto existe
        const gastoExistente = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) }
        });
        if (!gastoExistente) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        // Actualizar el gasto
        const gasto = yield prisma.gasto.update({
            where: { id: parseInt(id) },
            data: {
                fecha: fecha ? new Date(fecha) : undefined,
                descripcion,
                monto: monto ? parseFloat(monto) : undefined,
                moneda,
                categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
                subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
                sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
                comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : undefined,
                observaciones
            },
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
        res.json(gasto);
    }
    catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).json({ error: 'Error al actualizar el gasto' });
    }
});
exports.updateGasto = updateGasto;
// Eliminar un gasto
const deleteGasto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar que el gasto existe
        const gasto = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) }
        });
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        // Si hay un comprobante, eliminarlo del sistema de archivos
        if (gasto.comprobante) {
            const filePath = path_1.default.join(__dirname, '../../', gasto.comprobante);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Eliminar el gasto
        yield prisma.gasto.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Gasto eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar gasto:', error);
        res.status(500).json({ error: 'Error al eliminar el gasto' });
    }
});
exports.deleteGasto = deleteGasto;
// Obtener todas las sucursales
const getSucursales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sucursales = yield prisma.sucursal.findMany({
            orderBy: { nombre: 'asc' }
        });
        res.json(sucursales);
    }
    catch (error) {
        console.error('Error al obtener sucursales:', error);
        res.status(500).json({ error: 'Error al obtener las sucursales' });
    }
});
exports.getSucursales = getSucursales;
//# sourceMappingURL=gastos.controller.js.map
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
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Aplicar autenticación a todas las rutas
router.use(auth_1.default);
// Rutas para categorías de gastos
router.get('/categorias-gastos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categorias = yield prisma.categoriaGasto.findMany({
            orderBy: {
                nombre: 'asc'
            }
        });
        res.json(categorias);
    }
    catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
}));
router.get('/categorias-gastos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const categoria = yield prisma.categoriaGasto.findUnique({
            where: { id: Number(id) },
            include: {
                subcategorias: true
            }
        });
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json(categoria);
    }
    catch (error) {
        console.error('Error al obtener categoría:', error);
        res.status(500).json({ error: 'Error al obtener la categoría' });
    }
}));
router.post('/categorias-gastos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, activo = true } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    try {
        // Verificar si ya existe una categoría con el mismo nombre
        const existente = yield prisma.categoriaGasto.findFirst({
            where: { nombre: { equals: nombre, mode: 'insensitive' } }
        });
        if (existente) {
            return res.status(400).json({ error: 'Ya existe una categoría con este nombre' });
        }
        const nuevaCategoria = yield prisma.categoriaGasto.create({
            data: {
                nombre,
                activo
            }
        });
        res.status(201).json(nuevaCategoria);
    }
    catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
}));
router.put('/categorias-gastos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, activo } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    try {
        // Verificar si la categoría existe
        const categoria = yield prisma.categoriaGasto.findUnique({
            where: { id: Number(id) }
        });
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        // Verificar si ya existe otra categoría con el mismo nombre
        const existente = yield prisma.categoriaGasto.findFirst({
            where: {
                nombre: { equals: nombre, mode: 'insensitive' },
                id: { not: Number(id) }
            }
        });
        if (existente) {
            return res.status(400).json({ error: 'Ya existe otra categoría con este nombre' });
        }
        const categoriaActualizada = yield prisma.categoriaGasto.update({
            where: { id: Number(id) },
            data: {
                nombre,
                activo
            }
        });
        res.json(categoriaActualizada);
    }
    catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
}));
router.delete('/categorias-gastos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si la categoría existe
        const categoria = yield prisma.categoriaGasto.findUnique({
            where: { id: Number(id) }
        });
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        // Eliminar la categoría (las subcategorías se eliminan automáticamente por la relación Cascade)
        yield prisma.categoriaGasto.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Categoría eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
}));
// Rutas para subcategorías de gastos
router.get('/subcategorias-gastos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subcategorias = yield prisma.subcategoriaGasto.findMany({
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: [
                {
                    categoria: {
                        nombre: 'asc'
                    }
                },
                {
                    nombre: 'asc'
                }
            ]
        });
        // Formatear para el frontend
        const formattedSubcategorias = subcategorias.map(sub => ({
            id: sub.id,
            nombre: sub.nombre,
            categoriaId: sub.categoriaId,
            categoriaNombre: sub.categoria.nombre,
            activo: sub.activo,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
        }));
        res.json(formattedSubcategorias);
    }
    catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ error: 'Error al obtener las subcategorías' });
    }
}));
router.get('/subcategorias-gastos/categoria/:categoriaId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoriaId } = req.params;
    try {
        const subcategorias = yield prisma.subcategoriaGasto.findMany({
            where: {
                categoriaId: Number(categoriaId)
            },
            orderBy: {
                nombre: 'asc'
            }
        });
        res.json(subcategorias);
    }
    catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ error: 'Error al obtener las subcategorías' });
    }
}));
router.get('/subcategorias-gastos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const subcategoria = yield prisma.subcategoriaGasto.findUnique({
            where: { id: Number(id) },
            include: {
                categoria: true
            }
        });
        if (!subcategoria) {
            return res.status(404).json({ error: 'Subcategoría no encontrada' });
        }
        res.json(subcategoria);
    }
    catch (error) {
        console.error('Error al obtener subcategoría:', error);
        res.status(500).json({ error: 'Error al obtener la subcategoría' });
    }
}));
router.post('/subcategorias-gastos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, categoriaId, activo = true } = req.body;
    if (!nombre || !categoriaId) {
        return res.status(400).json({ error: 'El nombre y la categoría son obligatorios' });
    }
    try {
        // Verificar si la categoría existe
        const categoria = yield prisma.categoriaGasto.findUnique({
            where: { id: Number(categoriaId) }
        });
        if (!categoria) {
            return res.status(404).json({ error: 'La categoría seleccionada no existe' });
        }
        // Verificar si ya existe una subcategoría con el mismo nombre en la misma categoría
        const existente = yield prisma.subcategoriaGasto.findFirst({
            where: {
                nombre: { equals: nombre, mode: 'insensitive' },
                categoriaId: Number(categoriaId)
            }
        });
        if (existente) {
            return res.status(400).json({ error: 'Ya existe una subcategoría con este nombre en la misma categoría' });
        }
        const nuevaSubcategoria = yield prisma.subcategoriaGasto.create({
            data: {
                nombre,
                categoriaId: Number(categoriaId),
                activo
            }
        });
        res.status(201).json(nuevaSubcategoria);
    }
    catch (error) {
        console.error('Error al crear subcategoría:', error);
        res.status(500).json({ error: 'Error al crear la subcategoría' });
    }
}));
router.put('/subcategorias-gastos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, categoriaId, activo } = req.body;
    if (!nombre || !categoriaId) {
        return res.status(400).json({ error: 'El nombre y la categoría son obligatorios' });
    }
    try {
        // Verificar si la subcategoría existe
        const subcategoria = yield prisma.subcategoriaGasto.findUnique({
            where: { id: Number(id) }
        });
        if (!subcategoria) {
            return res.status(404).json({ error: 'Subcategoría no encontrada' });
        }
        // Verificar si la categoría existe
        const categoria = yield prisma.categoriaGasto.findUnique({
            where: { id: Number(categoriaId) }
        });
        if (!categoria) {
            return res.status(404).json({ error: 'La categoría seleccionada no existe' });
        }
        // Verificar si ya existe otra subcategoría con el mismo nombre en la misma categoría
        const existente = yield prisma.subcategoriaGasto.findFirst({
            where: {
                nombre: { equals: nombre, mode: 'insensitive' },
                categoriaId: Number(categoriaId),
                id: { not: Number(id) }
            }
        });
        if (existente) {
            return res.status(400).json({ error: 'Ya existe otra subcategoría con este nombre en la misma categoría' });
        }
        const subcategoriaActualizada = yield prisma.subcategoriaGasto.update({
            where: { id: Number(id) },
            data: {
                nombre,
                categoriaId: Number(categoriaId),
                activo
            }
        });
        res.json(subcategoriaActualizada);
    }
    catch (error) {
        console.error('Error al actualizar subcategoría:', error);
        res.status(500).json({ error: 'Error al actualizar la subcategoría' });
    }
}));
router.delete('/subcategorias-gastos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si la subcategoría existe
        const subcategoria = yield prisma.subcategoriaGasto.findUnique({
            where: { id: Number(id) }
        });
        if (!subcategoria) {
            return res.status(404).json({ error: 'Subcategoría no encontrada' });
        }
        // Eliminar la subcategoría
        yield prisma.subcategoriaGasto.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Subcategoría eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar subcategoría:', error);
        res.status(500).json({ error: 'Error al eliminar la subcategoría' });
    }
}));
exports.default = router;
//# sourceMappingURL=categorias-gastos.routes.js.map
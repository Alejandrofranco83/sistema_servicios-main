const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasGastosController');
const subcategoriasController = require('../controllers/subcategoriasGastosController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateJWT);

// Rutas para categorías de gastos
router.get('/categorias-gastos', categoriasController.getCategorias);
router.get('/categorias-gastos/:id', categoriasController.getCategoriaById);
router.post('/categorias-gastos', categoriasController.createCategoria);
router.put('/categorias-gastos/:id', categoriasController.updateCategoria);
router.delete('/categorias-gastos/:id', categoriasController.deleteCategoria);

// Rutas para subcategorías de gastos
router.get('/subcategorias-gastos', subcategoriasController.getSubcategorias);
router.get('/subcategorias-gastos/categoria/:categoriaId', subcategoriasController.getSubcategoriasByCategoria);
router.get('/subcategorias-gastos/:id', subcategoriasController.getSubcategoriaById);
router.post('/subcategorias-gastos', subcategoriasController.createSubcategoria);
router.put('/subcategorias-gastos/:id', subcategoriasController.updateSubcategoria);
router.delete('/subcategorias-gastos/:id', subcategoriasController.deleteSubcategoria);

module.exports = router; 
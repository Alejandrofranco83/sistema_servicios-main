"use strict";
const express = require('express');
const router = express.Router();
const lucroController = require('../controllers/lucroController');
const { protect, authorize } = require('../middleware/authMiddleware');
// Ruta base: /api/lucros
/**
 * @route   GET /api/lucros
 * @desc    Obtener todos los lucros con posibilidad de filtrado
 * @access  Private (SALDOS_MONETARIOS, LUCRO_VER)
 */
router.get('/', protect, authorize('SALDOS_MONETARIOS', 'LUCRO_VER'), lucroController.obtenerLucros);
/**
 * @route   GET /api/lucros/resumen
 * @desc    Obtener resumen por categoría
 * @access  Private (SALDOS_MONETARIOS, LUCRO_VER)
 */
router.get('/resumen', protect, authorize('SALDOS_MONETARIOS', 'LUCRO_VER'), lucroController.obtenerResumenPorCategoria);
/**
 * @route   GET /api/lucros/calcular
 * @desc    Calcular lucros al vuelo sin guardar
 * @access  Private (SALDOS_MONETARIOS, LUCRO_VER)
 */
router.get('/calcular', protect, authorize('SALDOS_MONETARIOS', 'LUCRO_VER'), lucroController.calcularLucros);
/**
 * @route   POST /api/lucros/calcular
 * @desc    Calcular y guardar lucros en la base de datos
 * @access  Private (SALDOS_MONETARIOS, LUCRO_EDITAR)
 */
router.post('/calcular', protect, authorize('SALDOS_MONETARIOS', 'LUCRO_EDITAR'), lucroController.calcularYGuardarLucros);
/**
 * @route   GET /api/lucros/exportar
 * @desc    Exportar lucros a Excel
 * @access  Private (SALDOS_MONETARIOS, LUCRO_EXPORTAR)
 */
router.get('/exportar', protect, authorize('SALDOS_MONETARIOS', 'LUCRO_EXPORTAR'), lucroController.exportarExcel);
module.exports = router;
//# sourceMappingURL=lucroRoutes.js.map
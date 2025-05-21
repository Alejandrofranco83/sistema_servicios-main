"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diferencias_controller_1 = require("../controllers/diferencias.controller");
// Usar import por defecto
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/diferencias/maletines/comparaciones:
 *   get:
 *     summary: Obtiene las comparaciones de saldos entre cajas consecutivas por maletín
 *     tags: [Diferencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comparaciones de maletines ordenada por fecha descendente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ComparacionMaletin' # Asume que tienes definición en Swagger
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/maletines/comparaciones', auth_1.default, diferencias_controller_1.getComparacionesMaletines);
/**
 * @swagger
 * /api/diferencias/saldos-servicios/comparaciones:
 *   get:
 *     summary: Obtiene las comparaciones de saldos de servicios entre cajas cerradas consecutivas por sucursal
 *     tags: [Diferencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comparaciones de saldos de servicios ordenada por fecha descendente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comparaciones:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ComparacionSaldosServicios' # Definir este schema
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/saldos-servicios/comparaciones', auth_1.default, diferencias_controller_1.getComparacionesSaldosServicios);
/**
 * @swagger
 * /api/diferencias/en-caja/comparaciones:
 *   get:
 *     summary: Obtiene las diferencias entre saldos declarados y calculados al cierre de cada caja.
 *     tags: [Diferencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comparaciones internas de cajas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comparaciones:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ComparacionEnCaja' # Definir este schema
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/en-caja/comparaciones', auth_1.default, diferencias_controller_1.getDiferenciasEnCajas);
exports.default = router;
//# sourceMappingURL=diferencias.routes.js.map
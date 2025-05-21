import { Router } from 'express';
import { getComparacionesMaletines, getComparacionesSaldosServicios, getDiferenciasEnCajas } from '../controllers/diferencias.controller';
// Usar import por defecto
import authenticateToken from '../middleware/auth'; 

const router = Router();

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
router.get('/maletines/comparaciones', authenticateToken, getComparacionesMaletines);

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
router.get('/saldos-servicios/comparaciones', authenticateToken, getComparacionesSaldosServicios);

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
router.get('/en-caja/comparaciones', authenticateToken, getDiferenciasEnCajas);

export default router; 
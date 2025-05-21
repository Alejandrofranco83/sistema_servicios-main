import express from 'express';
import { WenoGsController } from '../controllers/weno-gs.controller';

console.log('[DEBUG] Cargando weno-gs.routes.ts...');

const router = express.Router();

// Endpoint para obtener movimientos de Wepa Gs filtrados por fecha
router.get('/movimientos', WenoGsController.obtenerMovimientos);

// Endpoint para obtener un comprobante específico
router.get('/comprobante/:nombreArchivo', WenoGsController.obtenerComprobante);

// Endpoint para listar todos los comprobantes disponibles (para depuración)
router.get('/listar-comprobantes', WenoGsController.listarComprobantes);

// Endpoint de depuración para desarrollo
router.get('/debug-movimientos', WenoGsController.debugObtenerTodosMovimientos);

// Endpoint para obtener balance global (total a depositar)
router.get('/balance-global', WenoGsController.obtenerBalanceGlobal);

console.log('[DEBUG] Exportando router desde weno-gs.routes.ts');

export default router; 
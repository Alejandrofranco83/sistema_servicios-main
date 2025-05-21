import express from 'express';
import { WepaUsdController } from '../controllers/wepa-usd.controller';

console.log('[DEBUG] Cargando wepa-usd.routes.ts...');

const router = express.Router();

// Endpoint para obtener el balance global (totalADepositar)
router.get('/balance-global', WepaUsdController.getBalanceGlobal);

// Endpoint para obtener movimientos de Wepa USD filtrados por fecha
router.get('/movimientos', WepaUsdController.obtenerMovimientos);

// Endpoint para obtener un comprobante específico
router.get('/comprobante/:nombreArchivo', WepaUsdController.obtenerComprobante);

// Endpoint para listar todos los comprobantes disponibles (para depuración)
router.get('/listar-comprobantes', WepaUsdController.listarComprobantes);

// Endpoint de depuración para desarrollo
router.get('/debug-movimientos', WepaUsdController.debugObtenerTodosMovimientos);

console.log('[DEBUG] Exportando router desde wepa-usd.routes.ts');

export default router; 
import express from 'express';
import { AquipagoController } from '../controllers/aquipago.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

console.log('[DEBUG] Cargando aquipago.routes.ts...');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(isAuthenticated);

// Rutas para operaciones de Aqui Pago
router.get('/movimientos', AquipagoController.obtenerMovimientos);
router.get('/comprobante/:nombreArchivo', AquipagoController.obtenerComprobante);

// Ruta temporal para debug
router.get('/debug-movimientos', AquipagoController.debugObtenerTodosMovimientos);

console.log('[DEBUG] Exportando router desde aquipago.routes.ts');
export default router; 
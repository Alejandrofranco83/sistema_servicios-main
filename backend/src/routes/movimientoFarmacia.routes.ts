import { Router } from 'express';
import MovimientoFarmaciaController from '../controllers/movimientoFarmaciaController';

console.log('[DEBUG] Cargando movimientoFarmacia.routes.ts...'); 

const router = Router();

// Ruta para obtener todos los movimientos de farmacia (con filtros y paginación)
router.get('/', MovimientoFarmaciaController.getAll);

console.log('[DEBUG] Exportando router desde movimientoFarmacia.routes.ts');
export default router; 
import { Router } from 'express';
import { getAllMovimientosConDetalles } from '../controllers/movimientoCajaController';

const router = Router();

// Endpoint para obtener movimientos filtrados por fecha
router.get('/all-movimientos', getAllMovimientosConDetalles);

export default router; 
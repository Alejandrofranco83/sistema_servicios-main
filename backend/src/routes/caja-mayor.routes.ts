import { Router } from 'express';
import * as cajaMayorController from '../controllers/caja-mayor.controller';

const router = Router();

// Rutas para la gestión de retiros en Caja Mayor
router.get('/retiros/pendientes', cajaMayorController.getRetirosPendientes);
router.post('/retiros/recibir', cajaMayorController.confirmarRecepcionRetiros);
router.post('/retiros/rechazar', cajaMayorController.rechazarRetiros);
router.post('/retiros/devolver', cajaMayorController.devolverRetiro);

export default router; 
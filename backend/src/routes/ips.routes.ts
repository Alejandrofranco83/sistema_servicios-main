import { Router } from 'express';
import * as ipsController from '../controllers/ipsController';

const router = Router();

// Rutas para la gestión de IPS
router.get('/personas', ipsController.getPersonasIPS);
router.post('/agregar', ipsController.agregarPersonaIPS);
router.patch('/:id/estado', ipsController.actualizarEstadoIPS);
router.delete('/eliminar/:id', ipsController.eliminarPersonaIPS);

export default router; 
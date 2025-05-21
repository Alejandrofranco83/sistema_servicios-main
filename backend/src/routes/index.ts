import express from 'express';

// Importar rutas de notificaciones
import notificacionRoutes from './notificacion.routes';

const router = express.Router();

// Añadir rutas de notificaciones
router.use('/notificaciones', notificacionRoutes);

export default router; 
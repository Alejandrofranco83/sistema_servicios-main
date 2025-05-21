import express from 'express';
import { CotizacionExternaController } from '../controllers/cotizacion-externa.controller';

const router = express.Router();

// Ruta para obtener cotizaciones de Cambios Alberdi
router.get('/cambios-alberdi', CotizacionExternaController.getCambiosAlberdi);

export default router; 
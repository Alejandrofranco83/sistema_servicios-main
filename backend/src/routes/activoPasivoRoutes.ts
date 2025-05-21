import express from 'express';
import ResumenActivoPasivoController from '../controllers/resumenActivoPasivoController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Obtener el efectivo en cajas para el componente ActivoPasivo
router.get('/efectivo-en-cajas', ResumenActivoPasivoController.getEfectivoEnCajas);

// Obtener los saldos de servicios de todas las sucursales
router.get('/saldos-servicios', ResumenActivoPasivoController.getSaldosServicios);

// Obtener resumen completo para el componente ActivoPasivo (pendiente de implementación)
router.get('/resumen-completo', ResumenActivoPasivoController.getResumenCompleto);

export default router; 
import { Router } from 'express';
import { CotizacionController } from '../controllers/cotizacion.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = Router();

// Rutas públicas (sin necesidad de autenticación)
router.get('/vigente', CotizacionController.getCotizacionVigente);

// Rutas protegidas (requieren autenticación)
router.get('/', isAuthenticated, CotizacionController.getCotizaciones);
router.get('/:id', isAuthenticated, CotizacionController.getCotizacionById);

// Rutas protegidas con permisos específicos
router.post(
  '/',
  isAuthenticated,
  hasPermission('Configuracion', 'Crear'),
  CotizacionController.createCotizacion
);

router.put(
  '/:id',
  isAuthenticated,
  hasPermission('Configuracion', 'Editar'),
  CotizacionController.updateCotizacion
);

router.delete(
  '/:id',
  isAuthenticated,
  hasPermission('Configuracion', 'Eliminar'),
  CotizacionController.deleteCotizacion
);

export default router; 
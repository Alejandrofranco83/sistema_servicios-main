import { Router } from 'express';
import { SueldoMinimoController } from '../controllers/sueldo-minimo.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = Router();

// Rutas públicas (sin necesidad de autenticación)
router.get('/vigente', SueldoMinimoController.getSueldoMinimoVigente);

// Rutas protegidas (requieren autenticación)
router.get('/', isAuthenticated, SueldoMinimoController.getSueldosMinimos);
router.get('/:id', isAuthenticated, SueldoMinimoController.getSueldoMinimoById);

// Rutas protegidas con permisos específicos
router.post(
  '/',
  isAuthenticated,
  hasPermission('CONFIGURACION', 'SUELDO_MINIMO'),
  SueldoMinimoController.createSueldoMinimo
);

router.put(
  '/:id',
  isAuthenticated,
  hasPermission('CONFIGURACION', 'SUELDO_MINIMO'),
  SueldoMinimoController.updateSueldoMinimo
);

router.delete(
  '/:id',
  isAuthenticated,
  hasPermission('CONFIGURACION', 'SUELDO_MINIMO'),
  SueldoMinimoController.deleteSueldoMinimo
);

export default router; 
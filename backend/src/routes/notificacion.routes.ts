import { Router } from 'express';
import { NotificacionController } from '../controllers/notificacion.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = Router();

// Rutas públicas (sin autenticación)
router.get('/vigentes', NotificacionController.getNotificaciones);

// Rutas protegidas (requieren autenticación)
router.use(isAuthenticated);

// Rutas para obtener notificaciones del usuario autenticado
router.get('/mis-notificaciones', NotificacionController.getMisNotificaciones);
router.get('/mis-notificaciones/no-leidas', NotificacionController.getMisNotificacionesNoLeidas);
router.get('/mis-notificaciones/contador', NotificacionController.contarMisNotificacionesNoLeidas);

// Rutas para marcar notificaciones como leídas
router.put('/:id/leer', NotificacionController.marcarComoLeida);
router.put('/leer-todas', NotificacionController.marcarTodasComoLeidas);

// Rutas para crear notificaciones (requieren permisos específicos)
router.post('/', 
  hasPermission('NOTIFICACIONES', 'CREAR'), 
  NotificacionController.createNotificacion
);
router.post('/para-usuario', 
  hasPermission('NOTIFICACIONES', 'CREAR'), 
  NotificacionController.createNotificacionForUsuario
);
router.post('/para-rol', 
  hasPermission('NOTIFICACIONES', 'CREAR'), 
  NotificacionController.createNotificacionForRol
);

// Rutas para eliminar notificaciones (requieren permisos específicos)
router.delete('/:id', 
  hasPermission('NOTIFICACIONES', 'ELIMINAR'), 
  NotificacionController.deleteNotificacion
);

// Ruta para actualizar notificaciones (requiere permiso)
router.put('/:id', 
  hasPermission('NOTIFICACIONES', 'ACTUALIZAR'), 
  NotificacionController.updateNotificacion
);

export default router; 
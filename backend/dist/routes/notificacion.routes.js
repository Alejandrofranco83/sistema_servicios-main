"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificacion_controller_1 = require("../controllers/notificacion.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
// Rutas públicas (sin autenticación)
router.get('/vigentes', notificacion_controller_1.NotificacionController.getNotificaciones);
// Rutas protegidas (requieren autenticación)
router.use(auth_middleware_1.isAuthenticated);
// Rutas para obtener notificaciones del usuario autenticado
router.get('/mis-notificaciones', notificacion_controller_1.NotificacionController.getMisNotificaciones);
router.get('/mis-notificaciones/no-leidas', notificacion_controller_1.NotificacionController.getMisNotificacionesNoLeidas);
router.get('/mis-notificaciones/contador', notificacion_controller_1.NotificacionController.contarMisNotificacionesNoLeidas);
// Rutas para marcar notificaciones como leídas
router.put('/:id/leer', notificacion_controller_1.NotificacionController.marcarComoLeida);
router.put('/leer-todas', notificacion_controller_1.NotificacionController.marcarTodasComoLeidas);
// Rutas para crear notificaciones (requieren permisos específicos)
router.post('/', (0, permission_middleware_1.hasPermission)('NOTIFICACIONES', 'CREAR'), notificacion_controller_1.NotificacionController.createNotificacion);
router.post('/para-usuario', (0, permission_middleware_1.hasPermission)('NOTIFICACIONES', 'CREAR'), notificacion_controller_1.NotificacionController.createNotificacionForUsuario);
router.post('/para-rol', (0, permission_middleware_1.hasPermission)('NOTIFICACIONES', 'CREAR'), notificacion_controller_1.NotificacionController.createNotificacionForRol);
// Rutas para eliminar notificaciones (requieren permisos específicos)
router.delete('/:id', (0, permission_middleware_1.hasPermission)('NOTIFICACIONES', 'ELIMINAR'), notificacion_controller_1.NotificacionController.deleteNotificacion);
// Ruta para actualizar notificaciones (requiere permiso)
router.put('/:id', (0, permission_middleware_1.hasPermission)('NOTIFICACIONES', 'ACTUALIZAR'), notificacion_controller_1.NotificacionController.updateNotificacion);
exports.default = router;
//# sourceMappingURL=notificacion.routes.js.map
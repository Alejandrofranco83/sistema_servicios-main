"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cotizacion_controller_1 = require("../controllers/cotizacion.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
// Rutas públicas (sin necesidad de autenticación)
router.get('/vigente', cotizacion_controller_1.CotizacionController.getCotizacionVigente);
// Rutas protegidas (requieren autenticación)
router.get('/', auth_middleware_1.isAuthenticated, cotizacion_controller_1.CotizacionController.getCotizaciones);
router.get('/:id', auth_middleware_1.isAuthenticated, cotizacion_controller_1.CotizacionController.getCotizacionById);
// Rutas protegidas con permisos específicos
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Crear'), cotizacion_controller_1.CotizacionController.createCotizacion);
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Editar'), cotizacion_controller_1.CotizacionController.updateCotizacion);
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Eliminar'), cotizacion_controller_1.CotizacionController.deleteCotizacion);
exports.default = router;
//# sourceMappingURL=cotizacion.routes.js.map
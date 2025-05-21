"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sueldo_minimo_controller_1 = require("../controllers/sueldo-minimo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
// Rutas públicas (sin necesidad de autenticación)
router.get('/vigente', sueldo_minimo_controller_1.SueldoMinimoController.getSueldoMinimoVigente);
// Rutas protegidas (requieren autenticación)
router.get('/', auth_middleware_1.isAuthenticated, sueldo_minimo_controller_1.SueldoMinimoController.getSueldosMinimos);
router.get('/:id', auth_middleware_1.isAuthenticated, sueldo_minimo_controller_1.SueldoMinimoController.getSueldoMinimoById);
// Rutas protegidas con permisos específicos
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CONFIGURACION', 'SUELDO_MINIMO'), sueldo_minimo_controller_1.SueldoMinimoController.createSueldoMinimo);
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CONFIGURACION', 'SUELDO_MINIMO'), sueldo_minimo_controller_1.SueldoMinimoController.updateSueldoMinimo);
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CONFIGURACION', 'SUELDO_MINIMO'), sueldo_minimo_controller_1.SueldoMinimoController.deleteSueldoMinimo);
exports.default = router;
//# sourceMappingURL=sueldo-minimo.routes.js.map
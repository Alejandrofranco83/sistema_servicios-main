"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ipsController_1 = require("../controllers/ipsController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('[DEBUG] Cargando ipsRoutes.ts...'); // Log de depuración
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(auth_middleware_1.isAuthenticated);
// Rutas para las operaciones de IPS
router.get('/personas', ipsController_1.getPersonasIPS);
router.post('/agregar', ipsController_1.agregarPersonaIPS);
router.put('/actualizar/:id', ipsController_1.actualizarEstadoIPS);
router.delete('/eliminar/:id', ipsController_1.eliminarPersonaIPS);
exports.default = router;
//# sourceMappingURL=ipsRoutes.js.map
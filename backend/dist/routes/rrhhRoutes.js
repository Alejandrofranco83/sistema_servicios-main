"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rrhhController_1 = require("../controllers/rrhhController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// Importa tu middleware de autenticación aquí. Ejemplo:
// import { authenticateToken } from '../middleware/authMiddleware';
console.log('[DEBUG] Cargando rrhhRoutes.ts...'); // <-- Log de depuración
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(auth_middleware_1.isAuthenticated);
// Rutas para los movimientos RRHH
router.post('/movimientos', rrhhController_1.createMovimientoRRHH);
// Obtener movimientos por persona, mes y año
router.get('/movimientos/:personaId', rrhhController_1.getMovimientosRRHH);
// Eliminar movimiento
router.delete('/movimientos/:id', rrhhController_1.deleteMovimientoRRHH);
// Rutas para finalización de mes
router.get('/estado-mes/:personaId', rrhhController_1.getMesEstado);
router.post('/finalizar-mes', rrhhController_1.finalizarMes);
router.post('/reabrir-mes', rrhhController_1.reabrirMes);
// Puedes añadir más rutas de RRHH aquí
// router.get('/movimientos/:personaId', authenticateToken, getMovimientosRRHHByPersona);
exports.default = router;
//# sourceMappingURL=rrhhRoutes.js.map
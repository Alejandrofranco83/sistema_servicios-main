"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumenActivoPasivoController_1 = __importDefault(require("../controllers/resumenActivoPasivoController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Rutas protegidas que requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// Obtener el efectivo en cajas para el componente ActivoPasivo
router.get('/efectivo-en-cajas', resumenActivoPasivoController_1.default.getEfectivoEnCajas);
// Obtener los saldos de servicios de todas las sucursales
router.get('/saldos-servicios', resumenActivoPasivoController_1.default.getSaldosServicios);
// Obtener resumen completo para el componente ActivoPasivo (pendiente de implementación)
router.get('/resumen-completo', resumenActivoPasivoController_1.default.getResumenCompleto);
exports.default = router;
//# sourceMappingURL=activoPasivoRoutes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aquipago_controller_1 = require("../controllers/aquipago.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('[DEBUG] Cargando aquipago.routes.ts...');
const router = express_1.default.Router();
// Middleware de autenticación para todas las rutas
router.use(auth_middleware_1.isAuthenticated);
// Rutas para operaciones de Aqui Pago
router.get('/movimientos', aquipago_controller_1.AquipagoController.obtenerMovimientos);
router.get('/comprobante/:nombreArchivo', aquipago_controller_1.AquipagoController.obtenerComprobante);
// Ruta temporal para debug
router.get('/debug-movimientos', aquipago_controller_1.AquipagoController.debugObtenerTodosMovimientos);
console.log('[DEBUG] Exportando router desde aquipago.routes.ts');
exports.default = router;
//# sourceMappingURL=aquipago.routes.js.map
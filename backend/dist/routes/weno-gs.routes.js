"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const weno_gs_controller_1 = require("../controllers/weno-gs.controller");
console.log('[DEBUG] Cargando weno-gs.routes.ts...');
const router = express_1.default.Router();
// Endpoint para obtener movimientos de Wepa Gs filtrados por fecha
router.get('/movimientos', weno_gs_controller_1.WenoGsController.obtenerMovimientos);
// Endpoint para obtener un comprobante específico
router.get('/comprobante/:nombreArchivo', weno_gs_controller_1.WenoGsController.obtenerComprobante);
// Endpoint para listar todos los comprobantes disponibles (para depuración)
router.get('/listar-comprobantes', weno_gs_controller_1.WenoGsController.listarComprobantes);
// Endpoint de depuración para desarrollo
router.get('/debug-movimientos', weno_gs_controller_1.WenoGsController.debugObtenerTodosMovimientos);
// Endpoint para obtener balance global (total a depositar)
router.get('/balance-global', weno_gs_controller_1.WenoGsController.obtenerBalanceGlobal);
console.log('[DEBUG] Exportando router desde weno-gs.routes.ts');
exports.default = router;
//# sourceMappingURL=weno-gs.routes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wepa_usd_controller_1 = require("../controllers/wepa-usd.controller");
console.log('[DEBUG] Cargando wepa-usd.routes.ts...');
const router = express_1.default.Router();
// Endpoint para obtener el balance global (totalADepositar)
router.get('/balance-global', wepa_usd_controller_1.WepaUsdController.getBalanceGlobal);
// Endpoint para obtener movimientos de Wepa USD filtrados por fecha
router.get('/movimientos', wepa_usd_controller_1.WepaUsdController.obtenerMovimientos);
// Endpoint para obtener un comprobante específico
router.get('/comprobante/:nombreArchivo', wepa_usd_controller_1.WepaUsdController.obtenerComprobante);
// Endpoint para listar todos los comprobantes disponibles (para depuración)
router.get('/listar-comprobantes', wepa_usd_controller_1.WepaUsdController.listarComprobantes);
// Endpoint de depuración para desarrollo
router.get('/debug-movimientos', wepa_usd_controller_1.WepaUsdController.debugObtenerTodosMovimientos);
console.log('[DEBUG] Exportando router desde wepa-usd.routes.ts');
exports.default = router;
//# sourceMappingURL=wepa-usd.routes.js.map
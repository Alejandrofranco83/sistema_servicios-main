"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const movimientoFarmaciaController_1 = __importDefault(require("../controllers/movimientoFarmaciaController"));
console.log('[DEBUG] Cargando movimientoFarmacia.routes.ts...');
const router = (0, express_1.Router)();
// Ruta para obtener todos los movimientos de farmacia (con filtros y paginación)
router.get('/', movimientoFarmaciaController_1.default.getAll);
console.log('[DEBUG] Exportando router desde movimientoFarmacia.routes.ts');
exports.default = router;
//# sourceMappingURL=movimientoFarmacia.routes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const maletin_controller_1 = require("../controllers/maletin.controller");
const router = express_1.default.Router();
// Rutas públicas para desarrollo
router.get('/', maletin_controller_1.getMaletines);
router.get('/sucursal/:sucursalId', maletin_controller_1.getMaletinesBySucursal);
router.get('/:id', maletin_controller_1.getMaletinById);
router.post('/', maletin_controller_1.createMaletin);
router.put('/:id', maletin_controller_1.updateMaletin);
router.delete('/:id', maletin_controller_1.deleteMaletin);
exports.default = router;
//# sourceMappingURL=maletin.routes.js.map
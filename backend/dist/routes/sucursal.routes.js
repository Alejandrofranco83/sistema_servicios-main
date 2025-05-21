"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sucursal_controller_1 = require("../controllers/sucursal.controller");
const router = express_1.default.Router();
// Rutas públicas para desarrollo
router.get('/', sucursal_controller_1.getSucursales);
router.get('/:id', sucursal_controller_1.getSucursalById);
router.post('/', sucursal_controller_1.createSucursal);
router.put('/:id', sucursal_controller_1.updateSucursal);
router.delete('/:id', sucursal_controller_1.deleteSucursal);
exports.default = router;
//# sourceMappingURL=sucursal.routes.js.map
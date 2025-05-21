"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cuenta_bancaria_controller_1 = require("../controllers/cuenta-bancaria.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// Obtener todas las cuentas bancarias
router.get('/', auth_middleware_1.isAuthenticated, cuenta_bancaria_controller_1.getAllCuentasBancarias);
// Obtener una cuenta bancaria por ID
router.get('/:id', auth_middleware_1.isAuthenticated, cuenta_bancaria_controller_1.getCuentaBancariaById);
// Crear una nueva cuenta bancaria
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'CuentasBancarias'), cuenta_bancaria_controller_1.createCuentaBancaria);
// Actualizar una cuenta bancaria existente
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'CuentasBancarias'), cuenta_bancaria_controller_1.updateCuentaBancaria);
// Eliminar una cuenta bancaria
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'CuentasBancarias'), cuenta_bancaria_controller_1.deleteCuentaBancaria);
exports.default = router;
//# sourceMappingURL=cuenta-bancaria.routes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const banco_controller_1 = require("../controllers/banco.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// Obtener todos los bancos
router.get('/', auth_middleware_1.isAuthenticated, banco_controller_1.getAllBancos);
// Obtener un banco por ID
router.get('/:id', auth_middleware_1.isAuthenticated, banco_controller_1.getBancoById);
// Crear un nuevo banco
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Bancos'), banco_controller_1.createBanco);
// Actualizar un banco existente
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Bancos'), banco_controller_1.updateBanco);
// Eliminar un banco
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Bancos'), banco_controller_1.deleteBanco);
exports.default = router;
//# sourceMappingURL=banco.routes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pos_controller_1 = require("../controllers/pos.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// Obtener todos los dispositivos POS
router.get('/', auth_middleware_1.isAuthenticated, pos_controller_1.getAllPos);
// Obtener un dispositivo POS por código de barras
router.get('/codigo/:codigo', auth_middleware_1.isAuthenticated, pos_controller_1.getPosByCodigoBarras);
// Obtener un dispositivo POS por ID
router.get('/id/:id', auth_middleware_1.isAuthenticated, pos_controller_1.getPosById);
// Crear un nuevo dispositivo POS
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Pos'), pos_controller_1.createPos);
// Actualizar un dispositivo POS existente
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Pos'), pos_controller_1.updatePos);
// Eliminar un dispositivo POS
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuracion', 'Pos'), pos_controller_1.deletePos);
exports.default = router;
//# sourceMappingURL=pos.routes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usuario_controller_1 = require("../controllers/usuario.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// Rutas protegidas que requieren autenticación y permisos específicos
// El módulo es 'Configuración' y las acciones son 'Ver', 'Crear', 'Editar', 'Eliminar'
// Obtener todos los usuarios - Requiere permiso 'Ver'
router.get('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuración', 'Ver'), usuario_controller_1.UsuarioController.getUsuarios);
// Obtener un usuario por ID - Requiere permiso 'Ver'
router.get('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuración', 'Ver'), usuario_controller_1.UsuarioController.getUsuarioById);
// Crear un nuevo usuario - Requiere permiso 'Crear'
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuración', 'Crear'), usuario_controller_1.UsuarioController.createUsuario);
// Actualizar un usuario - Requiere permiso 'Editar'
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuración', 'Editar'), usuario_controller_1.UsuarioController.updateUsuario);
// Eliminar un usuario - Requiere permiso 'Eliminar'
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuración', 'Eliminar'), usuario_controller_1.UsuarioController.deleteUsuario);
// Resetear contraseña - Requiere permiso 'Editar'
router.post('/:id/reset-password', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Configuración', 'Editar'), usuario_controller_1.UsuarioController.resetPassword);
exports.default = router;
//# sourceMappingURL=usuario.routes.js.map
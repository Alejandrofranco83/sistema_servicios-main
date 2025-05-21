"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const deposito_bancario_controller_1 = require("../controllers/deposito-bancario.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// Configuración de multer para la carga de archivos
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Obtener todos los depósitos bancarios
router.get('/', auth_middleware_1.isAuthenticated, deposito_bancario_controller_1.getAllDepositosBancarios);
// Obtener un depósito bancario por ID
router.get('/:id', auth_middleware_1.isAuthenticated, deposito_bancario_controller_1.getDepositoBancarioById);
// Obtener un depósito bancario por ID de movimiento
router.get('/por-movimiento/:movimientoId', auth_middleware_1.isAuthenticated, deposito_bancario_controller_1.getDepositoBancarioPorMovimiento);
// Crear un nuevo depósito bancario
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CajaMayor', 'DepositoBancario'), upload.single('comprobante'), deposito_bancario_controller_1.createDepositoBancario);
// Actualizar un depósito bancario existente
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CajaMayor', 'DepositoBancario'), upload.single('comprobante'), deposito_bancario_controller_1.updateDepositoBancario);
// Eliminar un depósito bancario
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CajaMayor', 'DepositoBancario'), deposito_bancario_controller_1.deleteDepositoBancario);
// Cancelar un depósito bancario (marcar como anulado)
router.post('/cancelar/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('CajaMayor', 'DepositoBancario'), deposito_bancario_controller_1.cancelarDepositoBancario);
exports.default = router;
//# sourceMappingURL=deposito-bancario.routes.js.map
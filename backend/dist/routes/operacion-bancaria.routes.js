"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const operacion_bancaria_controller_1 = require("../controllers/operacion-bancaria.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Crear una función de middleware que convierta AuthRequest a Request
const convertAuthRequest = (handler) => {
    return (req, res, next) => {
        return handler(req, res).catch(next);
    };
};
// Configuración de multer para subida de archivos
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dir = path_1.default.join(__dirname, '../../uploads/comprobantes');
        // Crear el directorio si no existe
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'comprobante-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
// Ruta de prueba para verificar que el router funciona
router.get('/status', (_req, res) => {
    res.status(200).json({ message: 'API de operaciones bancarias funcionando correctamente' });
});
// Obtener todas las operaciones bancarias
router.get('/', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getAllOperacionesBancarias);
// Obtener una operación bancaria por ID
router.get('/:id', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionBancariaById);
// Crear una nueva operación bancaria
router.post('/', auth_middleware_1.isAuthenticated, upload.single('comprobante'), convertAuthRequest(operacion_bancaria_controller_1.createOperacionBancaria));
// Actualizar una operación bancaria
router.put('/:id', auth_middleware_1.isAuthenticated, upload.single('comprobante'), convertAuthRequest(operacion_bancaria_controller_1.updateOperacionBancaria));
// Eliminar una operación bancaria
router.delete('/:id', auth_middleware_1.isAuthenticated, convertAuthRequest(operacion_bancaria_controller_1.deleteOperacionBancaria));
// Obtener operaciones bancarias por caja
router.get('/caja/:cajaId', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionesBancariasByCajaId);
exports.default = router;
//# sourceMappingURL=operacion-bancaria.routes.js.map
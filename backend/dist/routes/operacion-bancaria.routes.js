"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const operacion_bancaria_controller_1 = require("../controllers/operacion-bancaria.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
// Crear una función de middleware que convierta AuthRequest a Request
const convertAuthRequest = (handler) => {
    return (req, res, next) => {
        return handler(req, res).catch(next);
    };
};
// Configuración de multer para subida de archivos
// Utilizamos memoryStorage para guardar el archivo en memoria
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB límite
    }
});
const router = (0, express_1.Router)();
// Ruta de prueba para verificar que el router funciona
router.get('/status', (_req, res) => {
    res.status(200).json({ message: 'API de operaciones bancarias funcionando correctamente' });
});
// ================================
// RUTAS ESPECÍFICAS - DEBEN IR PRIMERO
// ================================
// Obtener operaciones bancarias para control con filtros avanzados
router.get('/control', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionesBancariasParaControl);
// Obtener sucursales para filtros
router.get('/sucursales', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getSucursales);
// Obtener cuentas bancarias para filtros
router.get('/cuentas-bancarias', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getCuentasBancarias);
// Obtener cajas para filtros
router.get('/cajas', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getCajas);
// Obtener usuarios para filtros
router.get('/usuarios', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getUsuarios);
// Obtener operaciones bancarias por caja (ruta específica)
router.get('/caja/:cajaId', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionesBancariasByCajaId);
// ================================
// RUTAS CON PARÁMETROS
// ================================
// Actualizar verificación de operación bancaria
router.patch('/:id/verificacion', auth_middleware_1.isAuthenticated, convertAuthRequest(operacion_bancaria_controller_1.updateVerificacionOperacionBancaria));
// Obtener una operación bancaria por ID
router.get('/:id', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionBancariaById);
// Actualizar una operación bancaria
router.put('/:id', auth_middleware_1.isAuthenticated, upload.single('comprobante'), convertAuthRequest(operacion_bancaria_controller_1.updateOperacionBancaria));
// Eliminar una operación bancaria
router.delete('/:id', auth_middleware_1.isAuthenticated, convertAuthRequest(operacion_bancaria_controller_1.deleteOperacionBancaria));
// ================================
// RUTAS GENERALES
// ================================
// Obtener todas las operaciones bancarias
router.get('/', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getAllOperacionesBancarias);
// Crear una nueva operación bancaria
router.post('/', auth_middleware_1.isAuthenticated, upload.single('comprobante'), convertAuthRequest(operacion_bancaria_controller_1.createOperacionBancaria));
exports.default = router;
//# sourceMappingURL=operacion-bancaria.routes.js.map
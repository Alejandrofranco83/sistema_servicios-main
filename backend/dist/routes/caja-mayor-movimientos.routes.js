"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const caja_mayor_movimientos_controller_1 = require("../controllers/caja-mayor-movimientos.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// Obtener todos los datos de caja mayor (saldos, movimientos, resumen)
// router.get('/', 
//   isAuthenticated,
//   hasPermission('Caja Mayor', 'Ver'),
//   CajaMayorMovimientosController.getDatosCaja // Revisar si aún se usa
// );
// Listar todos los movimientos (con paginación)
router.get('/movimientos', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), caja_mayor_movimientos_controller_1.CajaMayorMovimientosController.getMovimientos);
// Listar movimientos por moneda (con paginación)
router.get('/movimientos/:moneda', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), caja_mayor_movimientos_controller_1.CajaMayorMovimientosController.getMovimientos);
// Crear nuevo movimiento - Exactamente como lo espera el frontend
router.post('/movimientos', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Crear'), caja_mayor_movimientos_controller_1.CajaMayorMovimientosController.createMovimiento);
// Obtener solo los saldos actuales
router.get('/saldos', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), caja_mayor_movimientos_controller_1.CajaMayorMovimientosController.getSaldosActuales);
// Obtener solo los tipos únicos
router.get('/tipos', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), caja_mayor_movimientos_controller_1.CajaMayorMovimientosController.getTiposUnicos);
// Obtener un movimiento específico por su ID
router.get('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), caja_mayor_movimientos_controller_1.CajaMayorMovimientosController.obtenerMovimientoPorId);
exports.default = router;
//# sourceMappingURL=caja-mayor-movimientos.routes.js.map
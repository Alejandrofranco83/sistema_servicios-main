"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const caja_controller_1 = require("../controllers/caja.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = express_1.default.Router();
// Rutas públicas para desarrollo
router.get('/', caja_controller_1.getCajas);
router.get('/:id', caja_controller_1.getCajaById);
router.get('/sucursal/:sucursalId', caja_controller_1.getCajasBySucursal);
router.post('/', caja_controller_1.abrirCaja);
router.put('/:id/cerrar', caja_controller_1.cerrarCaja);
router.put('/:id/datos-apertura', caja_controller_1.actualizarDatosApertura);
router.get('/:id/datos-cierre', caja_controller_1.obtenerDatosCierre);
router.put('/:id/datos-cierre', caja_controller_1.actualizarDatosCierre);
router.post('/:id/movimiento', caja_controller_1.agregarMovimiento);
router.post('/:id/comprobante', upload_middleware_1.uploadMiddleware.single('comprobante'), caja_controller_1.agregarComprobante);
router.get('/:id/comprobante/:comprobanteId', caja_controller_1.obtenerComprobante);
router.get('/:id/retiros', caja_controller_1.getRetirosByCaja);
router.post('/:cajaId/retiros', caja_controller_1.createRetiro);
router.delete('/retiros/:retiroId', caja_controller_1.deleteRetiro);
router.get('/:id/pagos', caja_controller_1.getPagosByCaja);
router.post('/:id/pagos', upload_middleware_1.uploadMiddleware.single('comprobante'), caja_controller_1.createPago);
router.put('/pagos/:pagoId', upload_middleware_1.uploadMiddleware.single('comprobante'), caja_controller_1.updatePago);
router.delete('/pagos/:pagoId', caja_controller_1.deletePago);
router.get('/:id/operaciones-bancarias', caja_controller_1.getOperacionesBancariasByCaja);
router.get('/:id/movimiento', caja_controller_1.obtenerMovimientos);
router.put('/:id/comprobante/:tipoComprobante', upload_middleware_1.uploadMiddleware.single('comprobante'), caja_controller_1.actualizarComprobante);
router.post('/:id/comprobantes/batch', upload_middleware_1.uploadMiddleware.array('comprobantes', 20), caja_controller_1.agregarComprobantesBatch);
exports.default = router;
//# sourceMappingURL=caja.routes.js.map
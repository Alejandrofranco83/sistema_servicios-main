"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pago_servicio_controller_1 = require("../controllers/pago-servicio.controller");
const router = (0, express_1.Router)();
// Rutas para pagos de servicios
router.post('/pagos-servicios', pago_servicio_controller_1.upload.single('comprobante'), pago_servicio_controller_1.crearPagoServicio);
router.get('/pagos-servicios', pago_servicio_controller_1.obtenerPagosServicios);
router.get('/pagos-servicios/:id', pago_servicio_controller_1.obtenerPagoServicioPorId);
router.put('/pagos-servicios/:id', pago_servicio_controller_1.upload.single('comprobante'), pago_servicio_controller_1.actualizarPagoServicio);
router.patch('/pagos-servicios/:id/estado', pago_servicio_controller_1.cambiarEstadoPagoServicio);
router.delete('/pagos-servicios/:id', pago_servicio_controller_1.eliminarPagoServicio);
exports.default = router;
//# sourceMappingURL=pago-servicio.routes.js.map
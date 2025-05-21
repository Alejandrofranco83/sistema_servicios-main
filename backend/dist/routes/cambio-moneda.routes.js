"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cambio_moneda_controller_1 = require("../controllers/cambio-moneda.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Crear una función de middleware que convierta AuthenticatedRequest a Request
const convertAuthRequest = (handler) => {
    return (req, res, next) => {
        return handler(req, res).catch(next);
    };
};
const router = (0, express_1.Router)();
// Rutas protegidas con token de autenticación
router.get('/', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambiosMoneda);
router.get('/:id', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambioMonedaById);
router.post('/', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.createCambioMoneda);
router.post('/cancelar/:id', authMiddleware_1.authenticateToken, convertAuthRequest(cambio_moneda_controller_1.cancelarCambioMoneda));
router.get('/caja/:cajaId', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambiosMonedaByCaja);
router.get('/usuario/:usuarioId', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambiosMonedaByUsuario);
exports.default = router;
//# sourceMappingURL=cambio-moneda.routes.js.map
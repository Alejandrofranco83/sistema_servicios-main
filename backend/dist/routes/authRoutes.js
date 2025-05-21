"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Middleware para depuración
router.use((req, _, next) => {
    console.log(`Petición recibida en auth: ${req.method} ${req.path}`);
    console.log('Body:', req.body);
    next();
});
// Rutas de autenticación
router.post('/login', authController_1.login);
router.post('/cambiar-password', authController_1.cambiarPassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map
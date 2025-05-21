"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Ruta para crear el administrador inicial (POST)
router.post('/create-admin', userController_1.createInitialAdmin);
// Ruta GET para pruebas (temporal)
router.get('/create-admin-test', userController_1.createInitialAdmin);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map
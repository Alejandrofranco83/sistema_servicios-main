"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const movimientoCajaController_1 = require("../controllers/movimientoCajaController");
const router = (0, express_1.Router)();
// Endpoint para obtener movimientos filtrados por fecha
router.get('/all-movimientos', movimientoCajaController_1.getAllMovimientosConDetalles);
exports.default = router;
//# sourceMappingURL=movimientoCaja.routes.js.map
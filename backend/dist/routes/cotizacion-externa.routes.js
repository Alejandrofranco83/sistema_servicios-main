"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cotizacion_externa_controller_1 = require("../controllers/cotizacion-externa.controller");
const router = express_1.default.Router();
// Ruta para obtener cotizaciones de Cambios Alberdi
router.get('/cambios-alberdi', cotizacion_externa_controller_1.CotizacionExternaController.getCambiosAlberdi);
exports.default = router;
//# sourceMappingURL=cotizacion-externa.routes.js.map
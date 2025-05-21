"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Importar rutas de notificaciones
const notificacion_routes_1 = __importDefault(require("./notificacion.routes"));
const router = express_1.default.Router();
// Añadir rutas de notificaciones
router.use('/notificaciones', notificacion_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
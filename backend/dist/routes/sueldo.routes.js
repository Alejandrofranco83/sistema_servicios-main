"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sueldo_controller_1 = require("../controllers/sueldo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Aplicar middleware de autenticación a todas las rutas
router.use(auth_middleware_1.isAuthenticated);
// Rutas para la gestión de sueldos
router.get('/', sueldo_controller_1.SueldoController.getAllSueldos);
router.get('/:id', sueldo_controller_1.SueldoController.getSueldoById);
router.get('/persona/:personaId', sueldo_controller_1.SueldoController.getSueldosByPersona);
router.get('/:anio/:mes', sueldo_controller_1.SueldoController.getSueldosByMesAnio);
router.post('/', sueldo_controller_1.SueldoController.createSueldo);
router.post('/guardar', sueldo_controller_1.SueldoController.guardarSueldos);
router.put('/:id', sueldo_controller_1.SueldoController.updateSueldo);
router.delete('/:id', sueldo_controller_1.SueldoController.deleteSueldo);
exports.default = router;
//# sourceMappingURL=sueldo.routes.js.map
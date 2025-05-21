"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usoDevolucionController_1 = __importDefault(require("../controllers/usoDevolucionController"));
const express_validator_1 = require("express-validator");
const auth_1 = __importDefault(require("../middleware/auth"));
// console.log('[DEBUG] *** Módulo usoDevolucionRoutes.ts cargado (SIMPLIFICADO) ***'); 
const router = express_1.default.Router();
// Ruta de prueba simple
/* // Código de prueba comentado
router.get('/test-ruta', (req, res) => {
  console.log('[DEBUG] *** Ruta /test-ruta de usoDevolucionRoutes alcanzada ***');
  res.json({ message: 'Ruta de prueba de Uso/Devolución OK' });
});
*/
// Código original 
// Middleware para verificar autenticación
router.use(auth_1.default);
// Validaciones para crear uso o devolución
const validateUsoDevolucion = [
    (0, express_validator_1.body)('tipo')
        .isIn(['USO', 'DEVOLUCION'])
        .withMessage('El tipo debe ser USO o DEVOLUCION'),
    (0, express_validator_1.body)('persona_id')
        .isInt({ min: 1 })
        .withMessage('Debe especificar un ID de persona válido'),
    (0, express_validator_1.body)('persona_nombre')
        .notEmpty()
        .withMessage('Debe especificar el nombre de la persona'),
    (0, express_validator_1.body)('guaranies')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El monto en guaraníes debe ser un número entero positivo'),
    (0, express_validator_1.body)('dolares')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El monto en dólares debe ser un número positivo'),
    (0, express_validator_1.body)('reales')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El monto en reales debe ser un número positivo'),
    (0, express_validator_1.body)('motivo')
        .notEmpty()
        .withMessage('Debe especificar un motivo para la operación')
];
// Rutas
// Crear una nueva operación de uso o devolución
router.post('/', validateUsoDevolucion, usoDevolucionController_1.default.create);
// Obtener todas las operaciones (con filtros opcionales)
router.get('/', usoDevolucionController_1.default.getAll);
// Obtener una operación específica
router.get('/:id', usoDevolucionController_1.default.getById);
// Anular una operación
router.put('/:id/anular', usoDevolucionController_1.default.anular);
// Obtener el saldo de una persona
router.get('/saldo/persona/:id', usoDevolucionController_1.default.getSaldoPersona);
// Obtener el historial de operaciones de una persona
router.get('/historial/persona/:id', usoDevolucionController_1.default.getHistorialPersona);
// NUEVAS RUTAS
// Obtener todas las personas con saldo pendiente
router.get('/saldos/personas', usoDevolucionController_1.default.getPersonasConSaldo);
// Obtener operación por ID de movimiento
router.get('/por-movimiento/:movimientoId', usoDevolucionController_1.default.getPorMovimiento);
// Cancelar operación (crea un movimiento inverso)
router.post('/cancelar/:id', usoDevolucionController_1.default.cancelar);
exports.default = router;
//# sourceMappingURL=usoDevolucionRoutes.js.map
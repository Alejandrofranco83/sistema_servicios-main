const express = require('express');
const router = express.Router();
const usoDevolucionController = require('../controllers/usoDevolucionController');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Middleware para verificar autenticación
router.use(authMiddleware);

// Validaciones para crear uso o devolución
const validateUsoDevolucion = [
  body('tipo')
    .isIn(['USO', 'DEVOLUCION'])
    .withMessage('El tipo debe ser USO o DEVOLUCION'),
  body('persona_id')
    .isInt({ min: 1 })
    .withMessage('Debe especificar un ID de persona válido'),
  body('persona_nombre')
    .notEmpty()
    .withMessage('Debe especificar el nombre de la persona'),
  body('guaranies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El monto en guaraníes debe ser un número entero positivo'),
  body('dolares')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto en dólares debe ser un número positivo'),
  body('reales')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto en reales debe ser un número positivo'),
  body('motivo')
    .notEmpty()
    .withMessage('Debe especificar un motivo para la operación')
];

// Rutas

// Crear una nueva operación de uso o devolución
router.post('/', validateUsoDevolucion, usoDevolucionController.create);

// Obtener todas las operaciones (con filtros opcionales)
router.get('/', usoDevolucionController.getAll);

// Obtener una operación específica
router.get('/:id', usoDevolucionController.getById);

// Anular una operación
router.put('/:id/anular', usoDevolucionController.anular);

// Obtener el saldo de una persona
router.get('/saldo/persona/:id', usoDevolucionController.getSaldoPersona);

// Obtener el historial de operaciones de una persona
router.get('/historial/persona/:id', usoDevolucionController.getHistorialPersona);

module.exports = router; 
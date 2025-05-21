import express from 'express';
import usoDevolucionController from '../controllers/usoDevolucionController';
import { body } from 'express-validator';
import authMiddleware from '../middleware/auth';

// console.log('[DEBUG] *** Módulo usoDevolucionRoutes.ts cargado (SIMPLIFICADO) ***'); 

const router = express.Router();

// Ruta de prueba simple
/* // Código de prueba comentado
router.get('/test-ruta', (req, res) => {
  console.log('[DEBUG] *** Ruta /test-ruta de usoDevolucionRoutes alcanzada ***');
  res.json({ message: 'Ruta de prueba de Uso/Devolución OK' });
});
*/

// Código original 
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

// NUEVAS RUTAS

// Obtener todas las personas con saldo pendiente
router.get('/saldos/personas', usoDevolucionController.getPersonasConSaldo);

// Obtener operación por ID de movimiento
router.get('/por-movimiento/:movimientoId', usoDevolucionController.getPorMovimiento);

// Cancelar operación (crea un movimiento inverso)
router.post('/cancelar/:id', usoDevolucionController.cancelar);

export default router; 
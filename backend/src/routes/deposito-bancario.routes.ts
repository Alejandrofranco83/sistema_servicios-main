import express from 'express';
import multer from 'multer';
import { 
  getAllDepositosBancarios, 
  getDepositoBancarioById, 
  createDepositoBancario, 
  updateDepositoBancario, 
  deleteDepositoBancario,
  getDepositoBancarioPorMovimiento,
  cancelarDepositoBancario
} from '../controllers/deposito-bancario.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// Configuración de multer para la carga de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Obtener todos los depósitos bancarios
router.get('/', isAuthenticated, getAllDepositosBancarios);

// Obtener un depósito bancario por ID
router.get('/:id', isAuthenticated, getDepositoBancarioById);

// Obtener un depósito bancario por ID de movimiento
router.get('/por-movimiento/:movimientoId', isAuthenticated, getDepositoBancarioPorMovimiento);

// Crear un nuevo depósito bancario
router.post('/', isAuthenticated, hasPermission('CajaMayor', 'DepositoBancario'), upload.single('comprobante'), createDepositoBancario);

// Actualizar un depósito bancario existente
router.put('/:id', isAuthenticated, hasPermission('CajaMayor', 'DepositoBancario'), upload.single('comprobante'), updateDepositoBancario);

// Eliminar un depósito bancario
router.delete('/:id', isAuthenticated, hasPermission('CajaMayor', 'DepositoBancario'), deleteDepositoBancario);

// Cancelar un depósito bancario (marcar como anulado)
router.post('/cancelar/:id', isAuthenticated, hasPermission('CajaMayor', 'DepositoBancario'), cancelarDepositoBancario);

export default router; 
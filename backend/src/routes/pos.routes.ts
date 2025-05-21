import express from 'express';
import { 
  getAllPos, 
  getPosById, 
  createPos, 
  updatePos, 
  deletePos,
  getPosByCodigoBarras
} from '../controllers/pos.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// Obtener todos los dispositivos POS
router.get('/', isAuthenticated, getAllPos);

// Obtener un dispositivo POS por código de barras
router.get('/codigo/:codigo', isAuthenticated, getPosByCodigoBarras);

// Obtener un dispositivo POS por ID
router.get('/id/:id', isAuthenticated, getPosById);

// Crear un nuevo dispositivo POS
router.post('/', isAuthenticated, hasPermission('Configuracion', 'Pos'), createPos);

// Actualizar un dispositivo POS existente
router.put('/:id', isAuthenticated, hasPermission('Configuracion', 'Pos'), updatePos);

// Eliminar un dispositivo POS
router.delete('/:id', isAuthenticated, hasPermission('Configuracion', 'Pos'), deletePos);

export default router; 
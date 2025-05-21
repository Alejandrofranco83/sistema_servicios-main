import express from 'express';
import { 
  getAllBancos, 
  getBancoById, 
  createBanco, 
  updateBanco, 
  deleteBanco 
} from '../controllers/banco.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// Obtener todos los bancos
router.get('/', isAuthenticated, getAllBancos);

// Obtener un banco por ID
router.get('/:id', isAuthenticated, getBancoById);

// Crear un nuevo banco
router.post('/', isAuthenticated, hasPermission('Configuracion', 'Bancos'), createBanco);

// Actualizar un banco existente
router.put('/:id', isAuthenticated, hasPermission('Configuracion', 'Bancos'), updateBanco);

// Eliminar un banco
router.delete('/:id', isAuthenticated, hasPermission('Configuracion', 'Bancos'), deleteBanco);

export default router; 
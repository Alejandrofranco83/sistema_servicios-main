import express from 'express';
import { 
  getAllCuentasBancarias, 
  getCuentaBancariaById, 
  createCuentaBancaria, 
  updateCuentaBancaria, 
  deleteCuentaBancaria 
} from '../controllers/cuenta-bancaria.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// Obtener todas las cuentas bancarias
router.get('/', isAuthenticated, getAllCuentasBancarias);

// Obtener una cuenta bancaria por ID
router.get('/:id', isAuthenticated, getCuentaBancariaById);

// Crear una nueva cuenta bancaria
router.post('/', isAuthenticated, hasPermission('Configuracion', 'CuentasBancarias'), createCuentaBancaria);

// Actualizar una cuenta bancaria existente
router.put('/:id', isAuthenticated, hasPermission('Configuracion', 'CuentasBancarias'), updateCuentaBancaria);

// Eliminar una cuenta bancaria
router.delete('/:id', isAuthenticated, hasPermission('Configuracion', 'CuentasBancarias'), deleteCuentaBancaria);

export default router; 
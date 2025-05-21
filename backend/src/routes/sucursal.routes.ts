import express from 'express';
import { 
  getSucursales, 
  getSucursalById, 
  createSucursal, 
  updateSucursal, 
  deleteSucursal 
} from '../controllers/sucursal.controller';

const router = express.Router();

// Rutas públicas para desarrollo
router.get('/', getSucursales);
router.get('/:id', getSucursalById);
router.post('/', createSucursal);
router.put('/:id', updateSucursal);
router.delete('/:id', deleteSucursal);

export default router; 
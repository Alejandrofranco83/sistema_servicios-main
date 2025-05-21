import express from 'express';
import { 
  getMaletines, 
  getMaletinById, 
  createMaletin, 
  updateMaletin, 
  deleteMaletin,
  getMaletinesBySucursal
} from '../controllers/maletin.controller';

const router = express.Router();

// Rutas públicas para desarrollo
router.get('/', getMaletines);
router.get('/sucursal/:sucursalId', getMaletinesBySucursal);
router.get('/:id', getMaletinById);
router.post('/', createMaletin);
router.put('/:id', updateMaletin);
router.delete('/:id', deleteMaletin);

export default router; 
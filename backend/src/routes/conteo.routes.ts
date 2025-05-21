import { Router } from 'express';
import * as conteoController from '../controllers/conteo.controller';

const router = Router();

// Rutas para la gestión de conteos de moneda
router.get('/', conteoController.getConteos);
router.get('/:id', conteoController.getConteoById);
router.post('/', conteoController.createConteo);
router.put('/:id', conteoController.updateConteo);
router.patch('/:id/anular', conteoController.anularConteo);
router.delete('/:id', conteoController.deleteConteo);

export default router; 
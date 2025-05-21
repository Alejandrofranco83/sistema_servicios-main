import { Router } from 'express';
import { createInitialAdmin } from '../controllers/userController';

const router = Router();

// Ruta para crear el administrador inicial (POST)
router.post('/create-admin', createInitialAdmin);

// Ruta GET para pruebas (temporal)
router.get('/create-admin-test', createInitialAdmin);

export default router; 
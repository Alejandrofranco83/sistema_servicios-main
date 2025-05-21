import { Router } from 'express';
import { login, cambiarPassword } from '../controllers/authController';

const router = Router();

// Middleware para depuración
router.use((req, _, next) => {
  console.log(`Petición recibida en auth: ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});

// Rutas de autenticación
router.post('/login', login);
router.post('/cambiar-password', cambiarPassword);

export default router; 
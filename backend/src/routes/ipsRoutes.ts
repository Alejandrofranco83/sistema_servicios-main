import { Router } from 'express';
import { 
  getPersonasIPS, 
  agregarPersonaIPS, 
  actualizarEstadoIPS, 
  eliminarPersonaIPS 
} from '../controllers/ipsController';
import { isAuthenticated } from '../middlewares/auth.middleware';

console.log('[DEBUG] Cargando ipsRoutes.ts...'); // Log de depuración

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);

// Rutas para las operaciones de IPS
router.get('/personas', getPersonasIPS);
router.post('/agregar', agregarPersonaIPS);
router.put('/actualizar/:id', actualizarEstadoIPS);
router.delete('/eliminar/:id', eliminarPersonaIPS);

export default router; 
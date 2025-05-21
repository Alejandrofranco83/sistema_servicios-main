import { Router } from 'express';
import { 
    createMovimientoRRHH, 
    getMovimientosRRHH, 
    deleteMovimientoRRHH,
    getMesEstado,
    finalizarMes,
    reabrirMes
} from '../controllers/rrhhController';
import { isAuthenticated } from '../middlewares/auth.middleware';
// Importa tu middleware de autenticación aquí. Ejemplo:
// import { authenticateToken } from '../middleware/authMiddleware';

console.log('[DEBUG] Cargando rrhhRoutes.ts...'); // <-- Log de depuración

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);

// Rutas para los movimientos RRHH
router.post('/movimientos', createMovimientoRRHH);

// Obtener movimientos por persona, mes y año
router.get('/movimientos/:personaId', getMovimientosRRHH);

// Eliminar movimiento
router.delete('/movimientos/:id', deleteMovimientoRRHH);

// Rutas para finalización de mes
router.get('/estado-mes/:personaId', getMesEstado);
router.post('/finalizar-mes', finalizarMes);
router.post('/reabrir-mes', reabrirMes);

// Puedes añadir más rutas de RRHH aquí
// router.get('/movimientos/:personaId', authenticateToken, getMovimientosRRHHByPersona);

export default router; 
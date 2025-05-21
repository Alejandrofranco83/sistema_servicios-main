import { Router } from 'express';
import {
  getCambiosMoneda,
  getCambioMonedaById,
  createCambioMoneda,
  getCambiosMonedaByCaja,
  getCambiosMonedaByUsuario,
  cancelarCambioMoneda
} from '../controllers/cambio-moneda.controller';
import { authenticateToken as verificarToken } from '../middlewares/authMiddleware';

// Extendemos Request para que sea compatible con el tipo que usamos
import { Request, Response, NextFunction } from 'express';

// Crear una función de middleware que convierta AuthenticatedRequest a Request
const convertAuthRequest = (
  handler: (req: any, res: Response) => Promise<Response>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
};

const router = Router();

// Rutas protegidas con token de autenticación
router.get('/', verificarToken, getCambiosMoneda);
router.get('/:id', verificarToken, getCambioMonedaById);
router.post('/', verificarToken, createCambioMoneda);
router.post('/cancelar/:id', verificarToken, convertAuthRequest(cancelarCambioMoneda));
router.get('/caja/:cajaId', verificarToken, getCambiosMonedaByCaja);
router.get('/usuario/:usuarioId', verificarToken, getCambiosMonedaByUsuario);

export default router; 
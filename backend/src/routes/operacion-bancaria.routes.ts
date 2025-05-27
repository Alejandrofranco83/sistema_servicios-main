import { Router } from 'express';
import { 
  getAllOperacionesBancarias, 
  getOperacionBancariaById, 
  createOperacionBancaria, 
  updateOperacionBancaria, 
  deleteOperacionBancaria,
  getOperacionesBancariasByCajaId
} from '../controllers/operacion-bancaria.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Extendemos Request para que sea compatible con el tipo que usamos
import { Request, Response, NextFunction } from 'express';

// Crear una función de middleware que convierta AuthRequest a Request
const convertAuthRequest = (
  handler: (req: any, res: Response) => Promise<Response>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
};

// Configuración de multer para subida de archivos
// Utilizamos memoryStorage para guardar el archivo en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  }
});

const router = Router();

// Ruta de prueba para verificar que el router funciona
router.get('/status', (_req, res) => {
  res.status(200).json({ message: 'API de operaciones bancarias funcionando correctamente' });
});

// Obtener todas las operaciones bancarias
router.get('/', isAuthenticated, getAllOperacionesBancarias);

// Obtener una operación bancaria por ID
router.get('/:id', isAuthenticated, getOperacionBancariaById);

// Crear una nueva operación bancaria
router.post('/', isAuthenticated, upload.single('comprobante'), convertAuthRequest(createOperacionBancaria));

// Actualizar una operación bancaria
router.put('/:id', isAuthenticated, upload.single('comprobante'), convertAuthRequest(updateOperacionBancaria));

// Eliminar una operación bancaria
router.delete('/:id', isAuthenticated, convertAuthRequest(deleteOperacionBancaria));

// Obtener operaciones bancarias por caja
router.get('/caja/:cajaId', isAuthenticated, getOperacionesBancariasByCajaId);

export default router; 
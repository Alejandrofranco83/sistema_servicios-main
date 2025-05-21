import { Router } from 'express';
import { 
  crearPagoServicio, 
  obtenerPagosServicios, 
  obtenerPagoServicioPorId, 
  actualizarPagoServicio, 
  eliminarPagoServicio,
  cambiarEstadoPagoServicio,
  upload
} from '../controllers/pago-servicio.controller';

const router = Router();

// Rutas para pagos de servicios
router.post('/pagos-servicios', upload.single('comprobante'), crearPagoServicio);
router.get('/pagos-servicios', obtenerPagosServicios);
router.get('/pagos-servicios/:id', obtenerPagoServicioPorId);
router.put('/pagos-servicios/:id', upload.single('comprobante'), actualizarPagoServicio);
router.patch('/pagos-servicios/:id/estado', cambiarEstadoPagoServicio);
router.delete('/pagos-servicios/:id', eliminarPagoServicio);

export default router; 
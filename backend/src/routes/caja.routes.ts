import express from 'express';
import { 
  getCajas, 
  getCajaById, 
  getCajasBySucursal,
  abrirCaja, 
  cerrarCaja,
  agregarMovimiento,
  agregarComprobante,
  getRetirosByCaja,
  createRetiro,
  deleteRetiro,
  getPagosByCaja,
  createPago,
  deletePago,
  updatePago,
  getOperacionesBancariasByCaja,
  obtenerMovimientos,
  actualizarDatosApertura,
  obtenerComprobante,
  obtenerDatosCierre,
  actualizarDatosCierre,
  actualizarComprobante,
  agregarComprobantesBatch
} from '../controllers/caja.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = express.Router();

// Rutas públicas para desarrollo
router.get('/', getCajas);
router.get('/:id', getCajaById);
router.get('/sucursal/:sucursalId', getCajasBySucursal);
router.post('/', abrirCaja);
router.put('/:id/cerrar', cerrarCaja);
router.put('/:id/datos-apertura', actualizarDatosApertura);
router.get('/:id/datos-cierre', obtenerDatosCierre);
router.put('/:id/datos-cierre', actualizarDatosCierre);
router.post('/:id/movimiento', agregarMovimiento);
router.post('/:id/comprobante', uploadMiddleware.single('comprobante'), agregarComprobante);
router.get('/:id/comprobante/:comprobanteId', obtenerComprobante);
router.get('/:id/retiros', getRetirosByCaja);
router.post('/:cajaId/retiros', createRetiro);
router.delete('/retiros/:retiroId', deleteRetiro);
router.get('/:id/pagos', getPagosByCaja);
router.post('/:id/pagos', uploadMiddleware.single('comprobante'), createPago);
router.put('/pagos/:pagoId', uploadMiddleware.single('comprobante'), updatePago);
router.delete('/pagos/:pagoId', deletePago);
router.get('/:id/operaciones-bancarias', getOperacionesBancariasByCaja);
router.get('/:id/movimiento', obtenerMovimientos);
router.put('/:id/comprobante/:tipoComprobante', uploadMiddleware.single('comprobante'), actualizarComprobante);
router.post('/:id/comprobantes/batch', uploadMiddleware.array('comprobantes', 20), agregarComprobantesBatch);

export default router; 
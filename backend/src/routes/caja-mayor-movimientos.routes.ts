import express from 'express';
import { CajaMayorMovimientosController } from '../controllers/caja-mayor-movimientos.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// Obtener todos los datos de caja mayor (saldos, movimientos, resumen)
// router.get('/', 
//   isAuthenticated,
//   hasPermission('Caja Mayor', 'Ver'),
//   CajaMayorMovimientosController.getDatosCaja // Revisar si aún se usa
// );

// Listar todos los movimientos (con paginación)
router.get('/movimientos', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  CajaMayorMovimientosController.getMovimientos
);

// Listar movimientos por moneda (con paginación)
router.get('/movimientos/:moneda', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  CajaMayorMovimientosController.getMovimientos
);

// Crear nuevo movimiento - Exactamente como lo espera el frontend
router.post('/movimientos', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Crear'),
  CajaMayorMovimientosController.createMovimiento
);

// Obtener solo los saldos actuales
router.get('/saldos', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  CajaMayorMovimientosController.getSaldosActuales
);

// Obtener solo los tipos únicos
router.get('/tipos', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  CajaMayorMovimientosController.getTiposUnicos
);

// Obtener un movimiento específico por su ID
router.get('/:id', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  CajaMayorMovimientosController.obtenerMovimientoPorId
);

export default router; 
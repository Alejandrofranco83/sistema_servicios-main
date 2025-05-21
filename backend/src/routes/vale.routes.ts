import { Router } from 'express';
import { ValeController } from '../controllers/vale.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = Router();

// El módulo es 'Caja Mayor' y las acciones son 'Ver', 'Crear', 'Editar', 'Eliminar'

// Obtener estadísticas de vales
router.get('/estadisticas', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  ValeController.getEstadisticasVales
);

// Obtener vales pendientes
router.get('/pendientes', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  ValeController.getValesPendientes
);

// Obtener vales por persona
router.get('/persona/:personaId', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  ValeController.getValesByPersona
);

// Obtener un vale por ID de movimiento (IMPORTANTE: esta ruta debe ir ANTES de /:id)
router.get('/por-movimiento/:movimientoId', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  ValeController.getValeByMovimientoId
);

// Cancelar un vale (IMPORTANTE: esta ruta debe ir ANTES de /:id)
router.post('/cancelar/:id', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Editar'),
  ValeController.cancelarVale
);

// Marcar vale como cobrado
router.patch('/:id/cobrar', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Editar'),
  ValeController.marcarValeCobrado
);

// Marcar vale como anulado
router.patch('/:id/anular', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Editar'),
  ValeController.marcarValeAnulado
);

// Marcar vale como impreso
router.patch('/:id/imprimir', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Editar'),
  ValeController.marcarValeImpreso
);

// Obtener todos los vales
router.get('/', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  ValeController.getAllVales
);

// Obtener un vale por ID
router.get('/:id', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Ver'),
  ValeController.getValeById
);

// Crear un nuevo vale
router.post('/', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Crear'),
  ValeController.createVale
);

// Actualizar un vale
router.put('/:id', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Editar'),
  ValeController.updateVale
);

// Eliminar un vale
router.delete('/:id', 
  isAuthenticated,
  hasPermission('Caja Mayor', 'Eliminar'),
  ValeController.deleteVale
);

export default router; 
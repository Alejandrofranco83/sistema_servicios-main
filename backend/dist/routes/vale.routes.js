"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vale_controller_1 = require("../controllers/vale.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
// El módulo es 'Caja Mayor' y las acciones son 'Ver', 'Crear', 'Editar', 'Eliminar'
// Obtener estadísticas de vales
router.get('/estadisticas', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), vale_controller_1.ValeController.getEstadisticasVales);
// Obtener vales pendientes
router.get('/pendientes', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), vale_controller_1.ValeController.getValesPendientes);
// Obtener vales por persona
router.get('/persona/:personaId', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), vale_controller_1.ValeController.getValesByPersona);
// Obtener un vale por ID de movimiento (IMPORTANTE: esta ruta debe ir ANTES de /:id)
router.get('/por-movimiento/:movimientoId', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), vale_controller_1.ValeController.getValeByMovimientoId);
// Cancelar un vale (IMPORTANTE: esta ruta debe ir ANTES de /:id)
router.post('/cancelar/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Editar'), vale_controller_1.ValeController.cancelarVale);
// Marcar vale como cobrado
router.patch('/:id/cobrar', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Editar'), vale_controller_1.ValeController.marcarValeCobrado);
// Marcar vale como anulado
router.patch('/:id/anular', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Editar'), vale_controller_1.ValeController.marcarValeAnulado);
// Marcar vale como impreso
router.patch('/:id/imprimir', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Editar'), vale_controller_1.ValeController.marcarValeImpreso);
// Obtener todos los vales
router.get('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), vale_controller_1.ValeController.getAllVales);
// Obtener un vale por ID
router.get('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Ver'), vale_controller_1.ValeController.getValeById);
// Crear un nuevo vale
router.post('/', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Crear'), vale_controller_1.ValeController.createVale);
// Actualizar un vale
router.put('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Editar'), vale_controller_1.ValeController.updateVale);
// Eliminar un vale
router.delete('/:id', auth_middleware_1.isAuthenticated, (0, permission_middleware_1.hasPermission)('Caja Mayor', 'Eliminar'), vale_controller_1.ValeController.deleteVale);
exports.default = router;
//# sourceMappingURL=vale.routes.js.map
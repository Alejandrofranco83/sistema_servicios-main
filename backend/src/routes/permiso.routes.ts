import { Router } from 'express';
import { PermisoController } from '../controllers/permiso.controller';

const router = Router();
const controller = new PermisoController();

// Obtener todos los permisos
router.get('/', controller.getPermisos);

// Crear un nuevo permiso
router.post('/', controller.createPermiso);

// Actualizar un permiso existente
router.put('/:id', controller.updatePermiso);

// Eliminar un permiso
router.delete('/:id', controller.deletePermiso);

export default router; 
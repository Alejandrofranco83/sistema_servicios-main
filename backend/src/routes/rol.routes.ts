import { Router } from 'express';
import { RolController } from '../controllers/rol.controller';

const router = Router();
const controller = new RolController();

// Obtener todos los roles
router.get('/', controller.getRoles);

// Obtener un rol por su ID
router.get('/:id', controller.getRolById);

// Crear un nuevo rol
router.post('/', controller.createRol);

// Actualizar un rol existente
router.put('/:id', controller.updateRol);

// Eliminar un rol
router.delete('/:id', controller.deleteRol);

export default router; 
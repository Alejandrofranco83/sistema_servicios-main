import express from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// Rutas protegidas que requieren autenticación y permisos específicos
// El módulo es 'Configuración' y las acciones son 'Ver', 'Crear', 'Editar', 'Eliminar'

// Obtener todos los usuarios - Requiere permiso 'Ver'
router.get('/', 
  isAuthenticated,
  hasPermission('Configuración', 'Ver'),
  UsuarioController.getUsuarios
);

// Obtener un usuario por ID - Requiere permiso 'Ver'
router.get('/:id', 
  isAuthenticated,
  hasPermission('Configuración', 'Ver'),
  UsuarioController.getUsuarioById
);

// Crear un nuevo usuario - Requiere permiso 'Crear'
router.post('/', 
  isAuthenticated,
  hasPermission('Configuración', 'Crear'),
  UsuarioController.createUsuario
);

// Actualizar un usuario - Requiere permiso 'Editar'
router.put('/:id', 
  isAuthenticated,
  hasPermission('Configuración', 'Editar'),
  UsuarioController.updateUsuario
);

// Eliminar un usuario - Requiere permiso 'Eliminar'
router.delete('/:id', 
  isAuthenticated,
  hasPermission('Configuración', 'Eliminar'),
  UsuarioController.deleteUsuario
);

// Resetear contraseña - Requiere permiso 'Editar'
router.post('/:id/reset-password', 
  isAuthenticated,
  hasPermission('Configuración', 'Editar'),
  UsuarioController.resetPassword
);

export default router; 
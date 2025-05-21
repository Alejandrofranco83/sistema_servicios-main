"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permiso_controller_1 = require("../controllers/permiso.controller");
const router = (0, express_1.Router)();
const controller = new permiso_controller_1.PermisoController();
// Obtener todos los permisos
router.get('/', controller.getPermisos);
// Crear un nuevo permiso
router.post('/', controller.createPermiso);
// Actualizar un permiso existente
router.put('/:id', controller.updatePermiso);
// Eliminar un permiso
router.delete('/:id', controller.deletePermiso);
exports.default = router;
//# sourceMappingURL=permiso.routes.js.map
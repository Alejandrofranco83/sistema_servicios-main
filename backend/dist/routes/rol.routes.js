"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rol_controller_1 = require("../controllers/rol.controller");
const router = (0, express_1.Router)();
const controller = new rol_controller_1.RolController();
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
exports.default = router;
//# sourceMappingURL=rol.routes.js.map
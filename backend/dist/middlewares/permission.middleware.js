"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.hasModuleAccess = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Middleware para verificar si el usuario tiene permiso para acceder a un módulo específico
 * @param modulo - El módulo al que se intenta acceder
 */
const hasModuleAccess = (modulo) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.rolId) {
                return res.status(401).json({ message: 'No estás autenticado' });
            }
            // Buscar el rol del usuario con sus permisos
            const rol = yield prisma.rol.findUnique({
                where: { id: req.rolId },
                include: { permisos: true }
            });
            if (!rol) {
                return res.status(403).json({ message: 'Rol no encontrado' });
            }
            // Verificar si el rol incluye permisos para el módulo especificado
            const tienePermiso = rol.permisos.some((permiso) => permiso.modulo.toLowerCase() === modulo.toLowerCase());
            if (!tienePermiso) {
                return res.status(403).json({
                    message: `No tienes permiso para acceder al módulo ${modulo}`
                });
            }
            next();
            return;
        }
        catch (error) {
            console.error('Error en la verificación de permisos:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
    });
};
exports.hasModuleAccess = hasModuleAccess;
/**
 * Middleware para verificar si el usuario tiene permisos para realizar una acción específica en un módulo
 * @param modulo - El módulo al que se intenta acceder
 * @param pantalla - La pantalla o acción específica (Ver, Crear, Editar, Eliminar)
 */
const hasPermission = (modulo, pantalla) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.rolId) {
                return res.status(401).json({ message: 'No estás autenticado' });
            }
            // Buscar el rol del usuario con sus permisos
            const rol = yield prisma.rol.findUnique({
                where: { id: req.rolId },
                include: { permisos: true }
            });
            if (!rol) {
                return res.status(403).json({ message: 'Rol no encontrado' });
            }
            // Si es administrador, permitir todo
            if (rol.nombre === 'ADMINISTRADOR') {
                next();
                return;
            }
            // Verificar si el rol incluye el permiso específico
            const tienePermiso = rol.permisos.some((permiso) => permiso.modulo.toLowerCase() === modulo.toLowerCase() &&
                permiso.pantalla.toLowerCase() === pantalla.toLowerCase());
            if (!tienePermiso) {
                return res.status(403).json({
                    message: `No tienes permiso para ${pantalla} en el módulo ${modulo}`
                });
            }
            next();
            return;
        }
        catch (error) {
            console.error('Error en la verificación de permisos:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
    });
};
exports.hasPermission = hasPermission;
//# sourceMappingURL=permission.middleware.js.map
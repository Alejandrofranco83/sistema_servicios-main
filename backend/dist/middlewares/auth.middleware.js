"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.isAuthenticated = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const usuario_model_1 = require("../models/usuario.model");
/**
 * Middleware para verificar si el usuario está autenticado
 */
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener el token del header de autorización
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No hay token de autenticación' });
        }
        const token = authHeader.split(' ')[1];
        // Verificar el token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_muy_seguro');
            // Buscar el usuario por ID
            const usuario = yield usuario_model_1.UsuarioModel.findById(decoded.id);
            if (!usuario) {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }
            // Añadir el usuario y su rol a la solicitud
            req.usuario = usuario;
            req.usuarioId = usuario.id;
            req.rolId = usuario.rolId;
            next();
            return;
        }
        catch (error) {
            console.error('Error al verificar token:', error);
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }
    }
    catch (error) {
        console.error('Error en middleware de autenticación:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.isAuthenticated = isAuthenticated;
//# sourceMappingURL=auth.middleware.js.map
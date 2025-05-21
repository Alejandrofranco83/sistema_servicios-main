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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cambiarPassword = exports.login = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        console.log('Buscando usuario:', username);
        // Buscar todos los usuarios para depuración
        try {
            const allUsers = yield prisma.usuario.findMany();
            console.log(`Total usuarios encontrados: ${allUsers.length}`);
            for (const user of allUsers) {
                console.log(`- Usuario: ${user.username}, ID: ${user.id}`);
            }
        }
        catch (error) {
            console.error('Error al listar usuarios:', error);
        }
        // Buscar el usuario con sus permisos usando Prisma directamente
        try {
            const usuario = yield prisma.usuario.findFirst({
                where: {
                    username: {
                        equals: username.toUpperCase(),
                        mode: 'insensitive'
                    }
                },
                include: {
                    persona: true,
                    rol: {
                        include: {
                            permisos: true
                        }
                    }
                }
            });
            if (!usuario) {
                console.log('Usuario no encontrado');
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }
            console.log('Usuario encontrado:', usuario.username);
            // Verificar la contraseña
            // Por ahora compararemos directamente porque en el sistema inicial las contraseñas no están hasheadas
            if (password !== usuario.password) {
                console.log('Contraseña incorrecta');
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }
            console.log('Contraseña correcta');
            // Generar el token JWT
            const token = jwt.sign({
                id: usuario.id,
                username: usuario.username,
                rolId: usuario.rolId
            }, process.env.JWT_SECRET || 'tu_secreto_muy_seguro', { expiresIn: '24h' });
            // Enviar respuesta sin la contraseña
            const { password: _ } = usuario, usuarioSinPassword = __rest(usuario, ["password"]);
            return res.json({
                token,
                user: usuarioSinPassword
            });
        }
        catch (error) {
            console.error('Error al buscar usuario:', error);
            return res.status(500).json({ message: 'Error al iniciar sesión' });
        }
    }
    catch (error) {
        console.error('Error general en login:', error);
        return res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});
exports.login = login;
const cambiarPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, oldPassword, newPassword } = req.body;
        if (!username || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }
        // Buscar el usuario con Prisma
        const usuario = yield prisma.usuario.findFirst({
            where: {
                username: {
                    equals: username.toUpperCase(),
                    mode: 'insensitive'
                }
            }
        });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Verificar la contraseña actual
        if (oldPassword !== usuario.password) {
            return res.status(401).json({ message: 'Contraseña actual incorrecta' });
        }
        // Actualizar la contraseña
        yield prisma.usuario.update({
            where: { id: usuario.id },
            data: { password: newPassword }
        });
        return res.json({ message: 'Contraseña actualizada con éxito' });
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
});
exports.cambiarPassword = cambiarPassword;
//# sourceMappingURL=authController.js.map
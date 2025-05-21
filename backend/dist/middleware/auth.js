"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    var _a;
    console.log('[DEBUG][Auth] Middleware ejecutado.');
    // Obtener el token del header
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    console.log(`[DEBUG][Auth] Token recibido: ${token ? 'Sí' : 'No'}`); // No loguear el token completo por seguridad
    if (!token) {
        console.log('[DEBUG][Auth] No hay token. Enviando 401.');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        console.log('[DEBUG][Auth] Intentando verificar token...');
        const secret = process.env.JWT_SECRET || 'secret';
        // console.log(`[DEBUG][Auth] Usando secreto: ${secret}`); // Descomentar solo si es seguro
        const decoded = jsonwebtoken_1.default.verify(token, secret); // Cambiado userId a id en el tipo esperado
        console.log('[DEBUG][Auth] Token verificado. Decodificado:', decoded);
        if (decoded && decoded.id) {
            req.user = { id: decoded.id };
            console.log(`[DEBUG][Auth] Usuario ID ${decoded.id} añadido a req.user.`);
            next();
        }
        else {
            console.error('[DEBUG][Auth] Token decodificado pero sin id. Enviando 401.', decoded);
            res.status(401).json({ message: 'Token payload inválido' });
        }
    }
    catch (err) {
        console.error('[DEBUG][Auth] Error al verificar token:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
exports.default = authMiddleware;
//# sourceMappingURL=auth.js.map
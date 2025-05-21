import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// console.log('[DEBUG] *** Módulo authMiddleware cargado ***'); 

// Definir una interfaz que extienda la Request de Express para incluir la propiedad user
interface AuthenticatedRequest extends Request {
  user?: { id: number }; // O la estructura que tenga tu payload de JWT
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('[DEBUG][Auth] Middleware ejecutado.');
  // Obtener el token del header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log(`[DEBUG][Auth] Token recibido: ${token ? 'Sí' : 'No'}`); // No loguear el token completo por seguridad

  if (!token) {
    console.log('[DEBUG][Auth] No hay token. Enviando 401.');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    console.log('[DEBUG][Auth] Intentando verificar token...');
    const secret = process.env.JWT_SECRET || 'secret';
    // console.log(`[DEBUG][Auth] Usando secreto: ${secret}`); // Descomentar solo si es seguro
    const decoded = jwt.verify(token, secret) as { id: number; /* otros campos? */ }; // Cambiado userId a id en el tipo esperado
    console.log('[DEBUG][Auth] Token verificado. Decodificado:', decoded);
    
    if (decoded && decoded.id) {
      req.user = { id: decoded.id };
      console.log(`[DEBUG][Auth] Usuario ID ${decoded.id} añadido a req.user.`);
      next();
    } else {
      console.error('[DEBUG][Auth] Token decodificado pero sin id. Enviando 401.', decoded);
      res.status(401).json({ message: 'Token payload inválido' });
    }

  } catch (err) {
    console.error('[DEBUG][Auth] Error al verificar token:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware; 
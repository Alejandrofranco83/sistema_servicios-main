import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario.model';

// Extender la interfaz de Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: any;
      usuarioId?: number;
      rolId?: number | null;
    }
  }
}

/**
 * Middleware para verificar si el usuario está autenticado
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No hay token de autenticación' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar el token
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_muy_seguro');
      
      // Buscar el usuario por ID
      const usuario = await UsuarioModel.findById(decoded.id);
      
      if (!usuario) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }
      
      // Añadir el usuario y su rol a la solicitud
      req.usuario = usuario;
      req.usuarioId = usuario.id;
      req.rolId = usuario.rolId;
      
      next();
      return;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}; 
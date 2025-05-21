import { Request, Response, NextFunction } from 'express';

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
 * En modo de desarrollo, permite todas las peticiones sin verificación
 */
export const authenticateToken = async (req: Request, _res: Response, next: NextFunction): Promise<Response | void> => {
  // Para pruebas, directamente asignamos un usuario administrador
  req.usuario = {
    id: 1,
    username: 'admin',
    rolId: 1
  };
  req.usuarioId = 1;
  req.rolId = 1;
  
  next();
  return;

  // Código original comentado
  /* try {
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
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id }
      });
      
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
  } */
};

/**
 * Middleware para verificar si el usuario tiene permisos para realizar una acción específica en un módulo
 * En modo de desarrollo, permite todos los permisos
 */
export const checkPermission = (_modulo: string, _pantalla: string) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    // Para pruebas, permitimos todas las acciones
    next();
    return;

    // Código original comentado
    /* try {
      if (!req.rolId) {
        return res.status(401).json({ message: 'No estás autenticado' });
      }
      
      // Buscar el rol del usuario con sus permisos
      const rol = await prisma.rol.findUnique({
        where: { id: req.rolId },
        include: { permisos: true }
      });
      
      if (!rol) {
        return res.status(403).json({ message: 'Rol no encontrado' });
      }
      
      // Si es administrador o PRUEBA, permitir todo
      if (rol.nombre === 'ADMINISTRADOR' || rol.nombre === 'PRUEBA') {
        next();
        return;
      }
      
      // Verificar si el rol incluye el permiso específico
      const tienePermiso = rol.permisos.some(permiso => 
        permiso.modulo.toLowerCase() === modulo.toLowerCase() && 
        permiso.pantalla.toLowerCase() === pantalla.toLowerCase()
      );
      
      if (!tienePermiso) {
        return res.status(403).json({ 
          message: `No tienes permiso para ${pantalla} en el módulo ${modulo}` 
        });
      }
      
      next();
      return;
    } catch (error) {
      console.error('Error en la verificación de permisos:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    } */
  };
}; 
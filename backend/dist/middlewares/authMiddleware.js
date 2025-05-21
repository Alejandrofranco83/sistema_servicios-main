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
exports.checkPermission = exports.authenticateToken = void 0;
/**
 * Middleware para verificar si el usuario está autenticado
 * En modo de desarrollo, permite todas las peticiones sin verificación
 */
const authenticateToken = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.authenticateToken = authenticateToken;
/**
 * Middleware para verificar si el usuario tiene permisos para realizar una acción específica en un módulo
 * En modo de desarrollo, permite todos los permisos
 */
const checkPermission = (_modulo, _pantalla) => {
    return (_req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    });
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=authMiddleware.js.map
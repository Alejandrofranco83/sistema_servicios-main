const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la autenticación del usuario
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const auth = (req, res, next) => {
  try {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No se proporcionó un token de autenticación válido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secrettemporario');
    
    // Asignar el usuario decodificado a la solicitud
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error en el middleware de autenticación:', error);
    return res.status(401).json({ message: 'Token no válido o expirado' });
  }
};

module.exports = auth; 
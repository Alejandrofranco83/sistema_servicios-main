import fs from 'fs';
import path from 'path';

// Tipo para los niveles de log
type LogLevel = 'info' | 'error' | 'warning' | 'debug';

/**
 * Función para crear un log en un archivo
 * @param level Nivel del log (info, error, warning, debug)
 * @param message Mensaje del log
 * @param data Datos adicionales para el log
 */
export const crearLog = (level: LogLevel, message: string, data?: any): void => {
  try {
    // Obtener fecha y hora actual
    const fecha = new Date();
    const fechaFormateada = fecha.toISOString();
    
    // Crear directorio de logs si no existe
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Nombre del archivo de log según el día actual
    const nombreArchivo = `${fecha.toISOString().split('T')[0]}.log`;
    const rutaArchivo = path.join(logDir, nombreArchivo);
    
    // Formatear el mensaje de log
    let logMessage = `[${fechaFormateada}] [${level.toUpperCase()}] ${message}`;
    
    // Agregar datos adicionales si existen
    if (data) {
      if (data instanceof Error) {
        logMessage += `\nError: ${data.message}\nStack: ${data.stack}`;
      } else {
        try {
          logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        } catch (error) {
          logMessage += `\nData: [No serializable]`;
        }
      }
    }
    
    // Agregar salto de línea al final
    logMessage += '\n\n';
    
    // Escribir en el archivo
    fs.appendFileSync(rutaArchivo, logMessage);
    
    // Si es un error, también mostrarlo en la consola
    if (level === 'error') {
      console.error(logMessage);
    }
  } catch (error) {
    console.error('Error al escribir log:', error);
  }
}; 
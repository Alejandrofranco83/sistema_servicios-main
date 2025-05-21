"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearLog = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Función para crear un log en un archivo
 * @param level Nivel del log (info, error, warning, debug)
 * @param message Mensaje del log
 * @param data Datos adicionales para el log
 */
const crearLog = (level, message, data) => {
    try {
        // Obtener fecha y hora actual
        const fecha = new Date();
        const fechaFormateada = fecha.toISOString();
        // Crear directorio de logs si no existe
        const logDir = path_1.default.join(__dirname, '../../logs');
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
        // Nombre del archivo de log según el día actual
        const nombreArchivo = `${fecha.toISOString().split('T')[0]}.log`;
        const rutaArchivo = path_1.default.join(logDir, nombreArchivo);
        // Formatear el mensaje de log
        let logMessage = `[${fechaFormateada}] [${level.toUpperCase()}] ${message}`;
        // Agregar datos adicionales si existen
        if (data) {
            if (data instanceof Error) {
                logMessage += `\nError: ${data.message}\nStack: ${data.stack}`;
            }
            else {
                try {
                    logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
                }
                catch (error) {
                    logMessage += `\nData: [No serializable]`;
                }
            }
        }
        // Agregar salto de línea al final
        logMessage += '\n\n';
        // Escribir en el archivo
        fs_1.default.appendFileSync(rutaArchivo, logMessage);
        // Si es un error, también mostrarlo en la consola
        if (level === 'error') {
            console.error(logMessage);
        }
    }
    catch (error) {
        console.error('Error al escribir log:', error);
    }
};
exports.crearLog = crearLog;
//# sourceMappingURL=logger.js.map
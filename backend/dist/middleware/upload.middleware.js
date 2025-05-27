"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Definir la ruta de la carpeta de subidas relativa a la raíz del proyecto
const uploadsDirRootRelative = 'uploads';
const uploadsDir = path_1.default.join(__dirname, '..', '..', uploadsDirRootRelative); // Ajustar ruta para que esté en la raíz del backend
// Asegurarnos que la carpeta uploads exista
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Directorio de subidas creado en: ${uploadsDir}`);
}
else {
    console.log(`Directorio de subidas ya existe en: ${uploadsDir}`);
}
// Filtro para aceptar solo imágenes
const fileFilter = (_req, file, cb) => {
    // Verificar si es una imagen
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('El archivo debe ser una imagen')); // Añadir 'as any' para compatibilidad
    }
};
// Crear el middleware de multer con memoryStorage para guardar en memoria
exports.uploadMiddleware = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Usar memoryStorage en lugar de diskStorage
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite de tamaño
    },
    fileFilter: fileFilter
});
// Función para obtener la URL base para los archivos (en producción sería diferente)
// Esta función ya no es necesaria aquí si construimos la URL relativa en el controlador
/*
export const getFileUrl = (filename: string): string => {
  return `${process.env.API_URL || 'http://localhost:3001'}/uploads/${filename}`;
};
*/ 
//# sourceMappingURL=upload.middleware.js.map
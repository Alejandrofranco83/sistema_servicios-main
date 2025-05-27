import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// Definir la ruta de la carpeta de subidas relativa a la raíz del proyecto
const uploadsDirRootRelative = 'uploads';
const uploadsDir = path.join(__dirname, '..', '..', uploadsDirRootRelative); // Ajustar ruta para que esté en la raíz del backend

// Asegurarnos que la carpeta uploads exista
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Directorio de subidas creado en: ${uploadsDir}`);
} else {
  console.log(`Directorio de subidas ya existe en: ${uploadsDir}`);
}

// Filtro para aceptar solo imágenes
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Verificar si es una imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen') as any); // Añadir 'as any' para compatibilidad
  }
};

// Crear el middleware de multer con memoryStorage para guardar en memoria
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // Usar memoryStorage en lugar de diskStorage
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
import express from 'express';
import { upload, getGastos, getGastoById, createGasto, updateGasto, deleteGasto, getSucursales } from '../controllers/gastos.controller';
import authMiddleware from '../middleware/auth';
import { Router } from 'express';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ruta para visualizar comprobantes sin requerir autenticación
router.get('/gastos/comprobante/:nombreArchivo', (req: Request, res: Response) => {
  try {
    const { nombreArchivo } = req.params;
    
    if (!nombreArchivo) {
      return res.status(400).json({ error: 'El nombre del archivo es requerido' });
    }
    
    console.log(`[DEBUG] Solicitando comprobante: ${nombreArchivo}`);
    
    // Construir varias posibles rutas donde podría estar el archivo
    const rutasComprobante = [
      path.join(__dirname, '../../uploads/comprobantes', nombreArchivo),
      path.join(process.cwd(), 'uploads/comprobantes', nombreArchivo),
      path.join(process.cwd(), '../uploads/comprobantes', nombreArchivo),
      path.join(__dirname, '../../../uploads/comprobantes', nombreArchivo),
      // Ruta absoluta mencionada por el usuario
      path.join('C:/Users/User/Documents/sistema servicios/backend/uploads/comprobantes', nombreArchivo)
    ];
    
    console.log('[DEBUG] Buscando archivo en las siguientes rutas:');
    rutasComprobante.forEach((ruta, i) => {
      console.log(`[${i}] ${ruta} - Existe: ${fs.existsSync(ruta)}`);
    });
    
    // Buscar el archivo en las posibles rutas
    let rutaArchivo = '';
    for (const ruta of rutasComprobante) {
      if (fs.existsSync(ruta)) {
        rutaArchivo = ruta;
        console.log(`[DEBUG] ¡Archivo encontrado en: ${rutaArchivo}!`);
        break;
      }
    }
    
    if (!rutaArchivo) {
      console.error(`[ERROR] Comprobante no encontrado: ${nombreArchivo}`);
      console.error('[ERROR] Rutas probadas:', rutasComprobante);
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }
    
    // Determinar el tipo de archivo
    const ext = path.extname(rutaArchivo).toLowerCase();
    let contentType = 'application/octet-stream'; // Tipo por defecto
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    }
    
    // Configurar cabeceras para visualización inline
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
    
    // Enviar el archivo
    return fs.createReadStream(rutaArchivo).pipe(res);
    
  } catch (error) {
    console.error('[ERROR] Error al obtener comprobante:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Aplicar middleware de autenticación a todas las rutas excepto la de comprobantes
router.use(authMiddleware);

// Rutas para gastos
router.get('/gastos', getGastos);
router.get('/gastos/:id', getGastoById);
router.post('/gastos', upload.single('comprobante'), createGasto);
router.put('/gastos/:id', upload.single('comprobante'), updateGasto);
router.delete('/gastos/:id', deleteGasto);

// Ruta para obtener sucursales (para el selector)
router.get('/sucursales', getSucursales);

export default router; 
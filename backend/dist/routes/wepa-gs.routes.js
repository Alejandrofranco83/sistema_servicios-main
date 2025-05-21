const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const wepaGsController = require('../controllers/wepaGsController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/contratos-wepa-gs');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'contrato-wepa-gs-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite: 10MB
});

// Usamos el middleware de autenticación que se nos pasará como función
module.exports = function(authMiddleware) {
  
  // Obtener configuración actual
  router.get('/actual', authMiddleware, wepaGsController.getCurrentConfig);

  // Obtener historial de configuraciones
  router.get('/historial', authMiddleware, wepaGsController.getConfigHistory);

  // Crear nueva configuración
  router.post('/',
    authMiddleware,
    upload.single('contratoFile'),
    [
      check('cuentaBancariaId', 'El ID de la cuenta bancaria es requerido').notEmpty().isInt(),
      check('limiteCredito', 'El límite de crédito es requerido').notEmpty(),
      check('fechaInicioVigencia', 'La fecha de inicio de vigencia es requerida').notEmpty().isDate(),
      check('fechaFinVigencia', 'La fecha de fin de vigencia es requerida').notEmpty().isDate()
    ],
    wepaGsController.createConfig
  );

  // Descargar contrato
  router.get('/:id/contrato', authMiddleware, wepaGsController.downloadContrato);

  return router;
}; 
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Configuración de almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/contratos-wepa-usd');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'contrato-wepa-usd-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite: 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido. Se aceptan: ' + allowedTypes.join(', ')));
    }
  }
});

// Obtener la configuración actual de Wepa USD
exports.getCurrentConfig = async (req, res) => {
  try {
    const config = await prisma.wepaUsdConfig.findFirst({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cuentaBancaria: true,
        usuario: true
      }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'No hay configuración registrada para Wepa USD' });
    }
    
    return res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración actual de Wepa USD:', error);
    return res.status(500).json({ message: 'Error al obtener la configuración' });
  }
};

// Obtener historial de configuraciones de Wepa USD
exports.getConfigHistory = async (req, res) => {
  try {
    const historial = await prisma.wepaUsdConfig.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cuentaBancaria: true,
        usuario: true
      }
    });
    
    return res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial de configuraciones de Wepa USD:', error);
    return res.status(500).json({ message: 'Error al obtener el historial de configuraciones' });
  }
};

// Crear nueva configuración de Wepa USD
exports.createConfig = async (req, res) => {
  // Depuración: Ver usuario en la solicitud
  console.log('[DEBUG] Ejecutando createConfig para WepaUsd');
  console.log('[DEBUG] Usuario en req.user:', req.user);
  console.log('[DEBUG] Datos recibidos en req.body:', req.body);
  console.log('[DEBUG] Archivo recibido:', req.file ? 'Sí' : 'No');
  
  try {
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Si se subió un archivo, eliminarlo ya que hay errores
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      cuentaBancariaId,
      limiteCredito,
      fechaInicioVigencia,
      fechaFinVigencia
    } = req.body;
    
    // Validar que la cuenta bancaria exista
    const cuentaExiste = await prisma.cuentaBancaria.findUnique({
      where: { id: parseInt(cuentaBancariaId) }
    });
    
    if (!cuentaExiste) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'La cuenta bancaria seleccionada no existe' });
    }
    
    // Crear nueva configuración - Nota: usamos parseFloat para limiteCredito para evitar el error con BigInt
    const nuevaConfig = {
      cuentaBancariaId: parseInt(cuentaBancariaId),
      limiteCredito: parseFloat(limiteCredito.replace(/\./g, '')),
      fechaInicioVigencia: new Date(fechaInicioVigencia),
      fechaFinVigencia: new Date(fechaFinVigencia),
      usuarioId: req.user.id
    };
    
    // Si se subió un archivo, guardar información
    if (req.file) {
      nuevaConfig.nombreArchivoContrato = req.file.originalname;
      nuevaConfig.pathArchivoContrato = req.file.path;
    }
    
    // Guardar en la base de datos con Prisma
    const config = await prisma.wepaUsdConfig.create({
      data: nuevaConfig,
      include: {
        cuentaBancaria: true,
        usuario: true
      }
    });
    
    // Convertir BigInt a String para la respuesta JSON si es necesario
    const configJSON = JSON.parse(
      JSON.stringify(config, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    
    return res.status(201).json(configJSON);
  } catch (error) {
    console.error('Error al crear configuración de Wepa USD:', error);
    
    // Si se subió un archivo, eliminarlo en caso de error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: 'Error al guardar la configuración' });
  }
};

// Descargar contrato de Wepa USD
exports.downloadContrato = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la configuración
    const config = await prisma.wepaUsdConfig.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }
    
    if (!config.pathArchivoContrato || !config.nombreArchivoContrato) {
      return res.status(404).json({ message: 'No hay contrato registrado para esta configuración' });
    }
    
    // Verificar que el archivo exista
    if (!fs.existsSync(config.pathArchivoContrato)) {
      return res.status(404).json({ message: 'El archivo no se encuentra en el servidor' });
    }
    
    // Enviar el archivo
    res.download(config.pathArchivoContrato, config.nombreArchivoContrato);
  } catch (error) {
    console.error('Error al descargar contrato de Wepa USD:', error);
    return res.status(500).json({ message: 'Error al descargar el contrato' });
  }
}; 
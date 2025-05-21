const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Configuración de almacenamiento de archivos
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

// Obtener la configuración actual de Wepa GS
exports.getCurrentConfig = async (req, res) => {
  try {
    const config = await prisma.wepaGsConfig.findFirst({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cuentaBancaria: true,
        usuario: true
      }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'No hay configuración registrada para Wepa GS' });
    }
    
    return res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración actual de Wepa GS:', error);
    return res.status(500).json({ message: 'Error al obtener la configuración' });
  }
};

// Obtener historial de configuraciones de Wepa GS
exports.getConfigHistory = async (req, res) => {
  try {
    const historial = await prisma.wepaGsConfig.findMany({
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
    console.error('Error al obtener historial de configuraciones de Wepa GS:', error);
    return res.status(500).json({ message: 'Error al obtener el historial de configuraciones' });
  }
};

// Crear nueva configuración de Wepa GS
exports.createConfig = async (req, res) => {
  // Depuración: Ver usuario en la solicitud
  console.log('[DEBUG] Ejecutando createConfig para WepaGs');
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
    
    // Crear nueva configuración
    const nuevaConfig = {
      cuentaBancariaId: parseInt(cuentaBancariaId),
      limiteCredito: parseFloat(limiteCredito.replace(/\./g, '')),
      fechaInicioVigencia: new Date(fechaInicioVigencia),
      fechaFinVigencia: new Date(fechaFinVigencia),
      usuarioId: req.user.id // Usando req.user en lugar de req.usuario
    };
    
    // Si se subió un archivo, guardar información
    if (req.file) {
      nuevaConfig.nombreArchivoContrato = req.file.originalname;
      nuevaConfig.pathArchivoContrato = req.file.path;
    }
    
    // Guardar en la base de datos con Prisma
    const config = await prisma.wepaGsConfig.create({
      data: nuevaConfig,
      include: {
        cuentaBancaria: true,
        usuario: true
      }
    });
    
    // Convertir BigInt a String para la respuesta JSON
    const configJSON = JSON.parse(
      JSON.stringify(config, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    
    return res.status(201).json(configJSON);
  } catch (error) {
    console.error('Error al crear configuración de Wepa GS:', error);
    
    // Si se subió un archivo, eliminarlo en caso de error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: 'Error al guardar la configuración' });
  }
};

// Descargar contrato de Wepa GS
exports.downloadContrato = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la configuración
    const config = await prisma.wepaGsConfig.findUnique({
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
    console.error('Error al descargar contrato de Wepa GS:', error);
    return res.status(500).json({ message: 'Error al descargar el contrato' });
  }
};

// Obtener el balance global de Wepa GS (totalADepositar)
exports.getBalanceGlobal = async (req, res) => {
  try {
    console.log('[DEBUG] Obteniendo balance global de Wepa GS');
    
    // 1. Obtener la configuración actual de Wepa GS para saber la cuenta bancaria
    const wepaGsConfig = await prisma.wepaGsConfig.findFirst({
      orderBy: {
        fechaCreacion: 'desc'
      }
    });

    if (!wepaGsConfig || !wepaGsConfig.cuentaBancariaId) {
      console.warn('[WARN] No hay configuración de Wepa GS disponible o no tiene cuenta bancaria asignada');
    } else {
      console.log(`[DEBUG] Usando cuentaBancariaId: ${wepaGsConfig.cuentaBancariaId} para buscar depósitos.`);
    }

    // 2. Calcular sumas globales (histórico completo)
    // Suma de pagos (ingresos)
    const sumaPagosGlobal = await prisma.movimientoCaja.aggregate({
      _sum: {
        monto: true,
      },
      where: {
        operadora: {
          equals: 'wepaGs',
          mode: 'insensitive',
        },
        servicio: {
          equals: 'pagos',
          mode: 'insensitive',
        },
      },
    });

    // Suma de retiros (salidas directas de caja)
    const sumaRetirosGlobal = await prisma.movimientoCaja.aggregate({
      _sum: {
        monto: true,
      },
      where: {
        operadora: {
          equals: 'wepaGs',
          mode: 'insensitive',
        },
        servicio: {
          equals: 'retiros',
          mode: 'insensitive',
        },
      },
    });
    
    // Suma de depósitos bancarios (si tenemos configuración)
    const sumaDepositosGlobal = wepaGsConfig?.cuentaBancariaId ? await prisma.depositoBancario.aggregate({
      _sum: {
        monto: true,
      },
      where: {
        cuentaBancariaId: wepaGsConfig.cuentaBancariaId,
        // Filtrar depósitos cancelados
        OR: [
          { observacion: null },
          {
            NOT: {
              observacion: {
                contains: 'CANCELADO',
                mode: 'insensitive'
              }
            }
          }
        ]
      },
    }) : { _sum: { monto: null } };

    // 3. Calcular el total a depositar global
    const totalADepositarGlobal = 
      (sumaPagosGlobal._sum.monto?.toNumber() || 0) - 
      (sumaRetirosGlobal._sum.monto?.toNumber() || 0) - 
      (sumaDepositosGlobal._sum.monto?.toNumber() || 0);

    console.log('[DEBUG] Cálculo de balance global:');
    console.log(`- Pagos: ${sumaPagosGlobal._sum.monto?.toNumber() || 0}`);
    console.log(`- Retiros: ${sumaRetirosGlobal._sum.monto?.toNumber() || 0}`);
    console.log(`- Depósitos: ${sumaDepositosGlobal._sum.monto?.toNumber() || 0}`);
    console.log(`- Total a Depositar: ${totalADepositarGlobal}`);

    // 4. Enviar respuesta
    return res.status(200).json({
      totalADepositar: totalADepositarGlobal
    });
  } catch (error) {
    console.error('Error al obtener balance global de Wepa GS:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}; 
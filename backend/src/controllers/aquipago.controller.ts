import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

console.log('[DEBUG] Cargando controlador aquipago.controller.ts...');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/contratos'); // Ajusta la ruta si es necesario

// Asegurarse de que el directorio de subidas exista
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log(`[DEBUG] Creando directorio de uploads en: ${UPLOADS_DIR}`);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('[DEBUG] Directorio de uploads creado con éxito.');
} else {
  console.log(`[DEBUG] Directorio de uploads ya existe en: ${UPLOADS_DIR}`);
}

export const createAquipagoConfig = async (req: Request, res: Response) => {
  console.log('[DEBUG] Ejecutando createAquipagoConfig...');
  console.log('[DEBUG] Body recibido:', req.body);
  console.log('[DEBUG] Archivo recibido:', req.file ? 'Sí' : 'No');
  
  const { cuentaBancariaId, limiteCredito, fechaInicioVigencia, fechaFinVigencia } = req.body;
  // @ts-ignore // Asumiendo que tienes un middleware que añade el usuario al request
  const usuarioId = req.user?.id; 
  const file = req.file; // Multer añade el archivo aquí

  if (!usuarioId) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }
  
  if (!cuentaBancariaId || !limiteCredito || !fechaInicioVigencia || !fechaFinVigencia) {
     return res.status(400).json({ message: 'Faltan campos obligatorios.' });
  }

  try {
    const data: Prisma.AquipagoConfigCreateInput = {
      cuentaBancaria: { connect: { id: parseInt(cuentaBancariaId) } },
      limiteCredito: new Prisma.Decimal(limiteCredito.replace(/\./g, '')), // Eliminar puntos de miles
      fechaInicioVigencia: new Date(fechaInicioVigencia),
      fechaFinVigencia: new Date(fechaFinVigencia),
      usuario: { connect: { id: usuarioId } },
      fechaCreacion: new Date(), // Aseguramos fecha de creación
    };

    if (file) {
      data.nombreArchivoContrato = file.originalname;
      data.pathArchivoContrato = file.path; // Multer (con DiskStorage) guarda la ruta completa
    }

    const nuevaConfig = await prisma.aquipagoConfig.create({ data });
    res.status(201).json(nuevaConfig);
  } catch (error) {
    console.error("Error al crear configuración Aquipago:", error);
    // Limpiar archivo subido si la transacción falla
    if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Manejar errores específicos de Prisma (ej. foreign key constraint)
        if (error.code === 'P2003' || error.code === 'P2025') {
             return res.status(400).json({ message: 'Error de referencia: La cuenta bancaria o el usuario no existen.' });
        }
    }
    res.status(500).json({ message: 'Error interno del servidor al crear la configuración.' });
  }
};

export const getLatestAquipagoConfig = async (req: Request, res: Response) => {
  console.log('[DEBUG] Ejecutando getLatestAquipagoConfig...');
  
  try {
    const latestConfig = await prisma.aquipagoConfig.findFirst({
      orderBy: {
        fechaCreacion: 'desc',
      },
      include: { // Incluir datos relacionados si es necesario en el frontend
        cuentaBancaria: true,
        usuario: { select: { id: true, username: true, nombre: true } } // No enviar datos sensibles
      }
    });

    if (!latestConfig) {
      return res.status(404).json({ message: 'No se encontró configuración de Aquipago.' });
    }
    res.status(200).json(latestConfig);
  } catch (error) {
    console.error("Error al obtener la última configuración Aquipago:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getAquipagoConfigHistory = async (req: Request, res: Response) => {
  console.log('[DEBUG] Ejecutando getAquipagoConfigHistory...');
  
  try {
    const history = await prisma.aquipagoConfig.findMany({
      orderBy: {
        fechaCreacion: 'desc',
      },
       include: { 
        cuentaBancaria: true,
        usuario: { select: { id: true, username: true, nombre: true } }
      }
    });
    res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial de Aquipago:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Opcional: Endpoint para descargar el archivo del contrato
export const downloadContrato = async (req: Request, res: Response) => {
  console.log('[DEBUG] Ejecutando downloadContrato con id:', req.params.id);
  
  const { id } = req.params;
  try {
        const config = await prisma.aquipagoConfig.findUnique({
            where: { id: parseInt(id) },
        });

        if (!config || !config.pathArchivoContrato || !config.nombreArchivoContrato) {
            return res.status(404).json({ message: 'Configuración o archivo no encontrado.' });
        }

        if (!fs.existsSync(config.pathArchivoContrato)) {
             console.error(`Archivo no encontrado en el path: ${config.pathArchivoContrato}`);
             return res.status(404).json({ message: 'Archivo físico no encontrado en el servidor.' });
        }

        // Establecer cabeceras para la descarga
        res.setHeader('Content-Disposition', `attachment; filename="${config.nombreArchivoContrato}"`);
        // Podrías querer establecer Content-Type si conoces el tipo de archivo
        // res.setHeader('Content-Type', 'application/pdf'); // Ejemplo

        const fileStream = fs.createReadStream(config.pathArchivoContrato);
        fileStream.pipe(res);

    } catch (error) {
        console.error("Error al descargar el contrato:", error);
        res.status(500).json({ message: 'Error interno del servidor al descargar el archivo.' });
    }
};

/**
 * Controlador para gestionar las operaciones relacionadas con Aqui Pago
 */
export const AquipagoController = {
  /**
   * Obtiene los movimientos de Aqui Pago filtrados por fecha
   * Agrupa los pagos y retiros por caja
   */
  obtenerMovimientos: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      console.log('=== DIAGNÓSTICO BACKEND - FILTRO FECHAS AQUIPAGO ===');
      console.log('Parámetros recibidos:');
      console.log('  - fechaInicio (query):', fechaInicio, typeof fechaInicio);
      console.log('  - fechaFin (query):', fechaFin, typeof fechaFin);

      if (!fechaInicio || !fechaFin) {
        console.log('❌ Faltan parámetros de fecha');
        return res.status(400).json({ error: 'Las fechas de inicio y fin son requeridas' });
      }

      // Convertir fechas de string a Date, asegurando UTC
      const [startYear, startMonth, startDay] = (fechaInicio as string).split('-').map(Number);
      const [endYear, endMonth, endDay] = (fechaFin as string).split('-').map(Number);

      console.log('Parsing de fechas:');
      console.log('  - startYear, startMonth, startDay:', startYear, startMonth, startDay);
      console.log('  - endYear, endMonth, endDay:', endYear, endMonth, endDay);

      // Validar parseo básico
      if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
        console.log('❌ Error en parseo de fechas');
        return res.status(400).json({ error: 'Formato de fecha inválido (YYYY-MM-DD esperado)' });
      }

      // Inicio del día de inicio en UTC
      const fechaInicioUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));

      // Inicio del DÍA SIGUIENTE al día de fin en UTC
      const fechaFinOriginalUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0, 0));
      const fechaFinSiguienteUTC = new Date(fechaFinOriginalUTC);
      fechaFinSiguienteUTC.setUTCDate(fechaFinOriginalUTC.getUTCDate() + 1); // Usar setUTCDate

      console.log('Fechas UTC construidas:');
      console.log('  - fechaInicioUTC:', fechaInicioUTC.toISOString());
      console.log('  - fechaFinOriginalUTC:', fechaFinOriginalUTC.toISOString());
      console.log('  - fechaFinSiguienteUTC (para filtro):', fechaFinSiguienteUTC.toISOString());

      // Validar que las fechas construidas sean válidas (opcional pero bueno)
      if (isNaN(fechaInicioUTC.getTime()) || isNaN(fechaFinSiguienteUTC.getTime())) {
        console.log('❌ Fechas UTC inválidas');
        return res.status(400).json({ error: 'Fechas inválidas resultantes' });
      }
      
      // Log de depuración de fechas para Prisma (usando las nuevas fechas UTC)
      console.log(`[DEBUG] Prisma Query - Fechas UTC: gte ${fechaInicioUTC.toISOString()} , lt ${fechaFinSiguienteUTC.toISOString()}`);

      // 1. Obtener la configuración actual de Aquipago para conocer la cuenta bancaria
      console.log('Buscando configuración de Aquipago...');
      const aquipagoConfig = await prisma.aquipagoConfig.findFirst({
        orderBy: {
          fechaCreacion: 'desc'
        }
      });

      if (!aquipagoConfig || !aquipagoConfig.cuentaBancariaId) {
        console.warn('[WARN] No hay configuración de Aquipago disponible o no tiene cuenta bancaria asignada');
      } else {
        // ---> [NUEVO] Log para cuenta bancaria ID usada
        console.log(`[DEBUG] Usando cuentaBancariaId: ${aquipagoConfig.cuentaBancariaId} para buscar depósitos.`);
      }

      console.log('Ejecutando query Prisma para movimientos...');
      console.log('Filtros de Prisma:');
      console.log('  - fecha.gte:', fechaInicioUTC.toISOString());
      console.log('  - fecha.lt:', fechaFinSiguienteUTC.toISOString());
      console.log('  - operadora: aquiPago (insensitive)');
      console.log('  - servicio.in: [pagos, retiros] (insensitive)');

      // 2. Obtener movimientos relacionados con Aqui Pago usando los campos correctos y fechas UTC
      const movimientos = await prisma.movimientoCaja.findMany({
        where: {
          fecha: {
            gte: fechaInicioUTC,    // Usar fecha UTC
            lt: fechaFinSiguienteUTC, // Usar fecha UTC
          },
          // Usamos equals con mode insensitive para 'aquiPago'
          operadora: {
            equals: 'aquiPago',
            mode: 'insensitive',
          },
          // Usamos el campo 'servicio' para filtrar
          servicio: {
            in: ['pagos', 'retiros'], // Usamos los valores vistos en el log
            mode: 'insensitive', // Por si acaso
          }
        },
        include: {
          caja: { // Incluimos datos de la caja relacionada
            include: {
              sucursal: true, // Incluir datos de sucursal
              usuario: true // Incluir datos de usuario
            }
          }
        },
        orderBy: {
          fecha: 'desc',
        },
      });
      
      // ---> [NUEVO] Log para cantidad de movimientos encontrados
      console.log(`[DEBUG] Encontrados ${movimientos.length} movimientos de caja para Aquipago`);

      if (movimientos.length > 0) {
        console.log('Primeros 5 movimientos encontrados:');
        movimientos.slice(0, 5).forEach((mov, index) => {
          console.log(`  [${index}] ID: ${mov.id}, Fecha: ${mov.fecha.toISOString()}, Servicio: ${mov.servicio}, Monto: ${mov.monto}, Operadora: ${mov.operadora}`);
        });
      }

      // ----> [INICIO] Añadir mapeo explícito para movimientos
      const movimientosFormateados = movimientos.map(mov => ({
        id: mov.id,
        fecha: mov.fecha.toISOString(), // Enviar como ISO string
        // Formatear info de caja según lo esperado por el frontend
        cajaId: mov.caja ? mov.caja.id.toString() : 'N/A', 
        numeroEntero: mov.caja ? mov.caja.cajaEnteroId : undefined,
        sucursal: mov.caja?.sucursal?.nombre || 'N/A',
        usuario: mov.caja?.usuario?.username || 'N/A',
        // --- Asegurar que 'servicio' se incluye --- 
        servicio: mov.servicio, 
        // --- Asegurar que 'monto' se incluye y es número ---
        monto: mov.monto.toNumber(), // Convertir Decimal a number
        operadora: mov.operadora,
        rutaComprobante: mov.rutaComprobante, // Incluir ruta
      }));
      // <---- [FIN] Añadir mapeo explícito para movimientos

      console.log('Ejecutando query Prisma para depósitos...');
      // 3. Obtener depósitos bancarios (usando fechas UTC y filtro OR para observacion)
      const depositos = aquipagoConfig?.cuentaBancariaId ? await prisma.depositoBancario.findMany({
        where: {
          fecha: {
            gte: fechaInicioUTC,
            lt: fechaFinSiguienteUTC,
          },
          cuentaBancariaId: aquipagoConfig.cuentaBancariaId,
          // ---> [MODIFICACIÓN] Usar OR para incluir NULL o no cancelados
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
        orderBy: {
          fecha: 'desc',
        },
      }) : [];

      // ---> [NUEVO] Log para depósitos crudos encontrados
      console.log(`[DEBUG] Depósitos crudos encontrados por Prisma (${depositos.length}):`, depositos);

      console.log(`[DEBUG] Encontrados ${depositos.length} depósitos bancarios para Aquipago`);
      
      if (depositos.length > 0) {
        console.log('Primeros 3 depósitos encontrados:');
        depositos.slice(0, 3).forEach((dep, index) => {
          console.log(`  [${index}] ID: ${dep.id}, Fecha: ${dep.fecha.toISOString()}, Monto: ${dep.monto}, Observación: ${dep.observacion}`);
        });
      }
      
      // Formatear los depósitos para el frontend
      const depositosFormateados = depositos.map(deposito => {
        // Extraer el nombre del comprobante para mostrar
        let numeroComprobante = deposito.numeroBoleta || '';
        
        // Si el número de comprobante está vacío, tratar de extraerlo del nombre del archivo
        if (!numeroComprobante && deposito.rutaComprobante) {
          const nombreArchivo = deposito.rutaComprobante.split('/').pop() || '';
          // Si el nombre del archivo sigue un patrón como deposito_XXXX_fecha.jpg
          const match = nombreArchivo.match(/deposito_([^_]+)/);
          if (match && match[1]) {
            numeroComprobante = match[1];
          }
        }
        
        return {
          id: deposito.id,
          fecha: deposito.fecha.toISOString(),
          numeroDeposito: deposito.numeroBoleta || numeroComprobante || `${deposito.id}`,
          monto: Number(deposito.monto),
          cuentaBancariaId: deposito.cuentaBancariaId,
          observacion: deposito.observacion,
          rutaComprobante: deposito.rutaComprobante,
          numeroComprobante: numeroComprobante
        };
      });

      console.log('Calculando totales del rango de fechas...');
      // Calcular totales del RANGO DE FECHAS
      let totalPagosEnRango = 0;
      let totalRetirosEnRango = 0;

      movimientos.forEach(mov => {
        // Usamos los movimientos del rango para estos totales
        if (mov.servicio.toLowerCase() === 'pagos') {
          totalPagosEnRango += mov.monto.toNumber();
        } else if (mov.servicio.toLowerCase() === 'retiros') {
          totalRetirosEnRango += mov.monto.toNumber();
        }
      });

      const totalDepositosEnRango = depositos.reduce((sum, d) => sum + d.monto.toNumber(), 0);

      console.log('Totales calculados del rango:');
      console.log('  - totalPagosEnRango:', totalPagosEnRango);
      console.log('  - totalRetirosEnRango:', totalRetirosEnRango);
      console.log('  - totalDepositosEnRango:', totalDepositosEnRango);

      console.log('Calculando totales globales (históricos)...');
      // ---> [INICIO] Calcular Balance GLOBAL (Total a Depositar Histórico)
      const sumaPagosGlobal = await prisma.movimientoCaja.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          operadora: {
            equals: 'aquiPago',
            mode: 'insensitive',
          },
          servicio: {
            equals: 'pagos',
            mode: 'insensitive',
          },
        },
      });

      const sumaRetirosGlobal = await prisma.movimientoCaja.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          operadora: {
            equals: 'aquiPago',
            mode: 'insensitive',
          },
          servicio: {
            equals: 'retiros',
            mode: 'insensitive',
          },
        },
      });
      
      // Sumar Depósitos Globales asociados a la cuenta de Aquipago (si existe config y filtro OR)
      const sumaDepositosGlobal = aquipagoConfig?.cuentaBancariaId ? await prisma.depositoBancario.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          cuentaBancariaId: aquipagoConfig.cuentaBancariaId,
          // ---> [MODIFICACIÓN] Usar OR para incluir NULL o no cancelados
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
      
      const totalADepositarGlobal = 
        (sumaPagosGlobal._sum.monto?.toNumber() || 0) - 
        (sumaRetirosGlobal._sum.monto?.toNumber() || 0) - 
        (sumaDepositosGlobal._sum.monto?.toNumber() || 0);
      // <--- [FIN] Calcular Balance GLOBAL

      console.log('Totales globales calculados:');
      console.log('  - sumaPagosGlobal:', sumaPagosGlobal._sum.monto?.toNumber() || 0);
      console.log('  - sumaRetirosGlobal:', sumaRetirosGlobal._sum.monto?.toNumber() || 0);
      console.log('  - sumaDepositosGlobal:', sumaDepositosGlobal._sum.monto?.toNumber() || 0);
      console.log('  - totalADepositarGlobal:', totalADepositarGlobal);

      const respuesta = {
        movimientos: movimientosFormateados,
        depositos: depositosFormateados,
        // Totales del rango de fechas
        totalPagos: totalPagosEnRango, 
        totalRetiros: totalRetirosEnRango,
        totalDepositos: totalDepositosEnRango,
        // Total a depositar GLOBAL (Histórico)
        totalADepositar: totalADepositarGlobal, 
      };

      console.log('Respuesta final:');
      console.log('  - movimientos.length:', respuesta.movimientos.length);
      console.log('  - depositos.length:', respuesta.depositos.length);
      console.log('  - totalPagos:', respuesta.totalPagos);
      console.log('  - totalRetiros:', respuesta.totalRetiros);
      console.log('  - totalDepositos:', respuesta.totalDepositos);
      console.log('  - totalADepositar:', respuesta.totalADepositar);
      console.log('=== FIN DIAGNÓSTICO BACKEND AQUIPAGO ===');

      // Enviar la respuesta
      res.status(200).json(respuesta);

    } catch (error) {
      console.error('❌ Error al obtener movimientos de Aqui Pago:', error);
      console.error('Stack trace:', (error as Error)?.stack);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Obtiene un comprobante específico de Aqui Pago
   */
  obtenerComprobante: async (req: Request, res: Response) => {
    try {
      // Extrae el parámetro de la URL con manejo especial para rutas con dobles barras
      let { nombreArchivo } = req.params;
      
      // Corregir el problema de doble barra que puede llegar en la URL
      if (!nombreArchivo) {
        nombreArchivo = req.url.split('/comprobante/')[1] || '';
        console.log('[DEBUG] Nombre de archivo obtenido de la URL completa:', nombreArchivo);
      }
      
      if (!nombreArchivo) {
        return res.status(400).json({ message: 'Nombre de archivo no proporcionado' });
      }

      // Normalizar la ruta (reemplazar backslashes por forward slashes)
      let rutaArchivo = nombreArchivo.replace(/\\/g, '/');
      
      // Eliminar múltiples slashes consecutivos
      rutaArchivo = rutaArchivo.replace(/\/+/g, '/');
      
      // Asegurarnos que no empiece con slash
      while (rutaArchivo.startsWith('/')) {
        rutaArchivo = rutaArchivo.substring(1);
      }
      
      console.log('[DEBUG] Buscando archivo normalizado:', rutaArchivo);
      
      // Definir posibles rutas donde puede estar el archivo
      const posiblesRutas = [
        path.join(process.cwd(), 'uploads', rutaArchivo),
        path.join(process.cwd(), 'uploads', 'comprobantes', rutaArchivo),
        path.join(__dirname, '../../uploads', rutaArchivo),
        path.join(__dirname, '../../uploads/comprobantes', rutaArchivo),
        path.join(process.cwd(), '..', 'uploads', rutaArchivo),
        path.join(process.cwd(), '..', 'uploads', 'comprobantes', rutaArchivo)
      ];
      
      console.log('[DEBUG] Posibles rutas a verificar:');
      posiblesRutas.forEach((ruta, i) => console.log(`[${i}] ${ruta}`));
      
      // Verificar cada ruta hasta encontrar el archivo
      let rutaEncontrada = null;
      for (const ruta of posiblesRutas) {
        if (fs.existsSync(ruta)) {
          rutaEncontrada = ruta;
          console.log('[DEBUG] Archivo encontrado en:', rutaEncontrada);
          break;
        }
      }
      
      if (!rutaEncontrada) {
        console.error('[ERROR] Archivo no encontrado en ninguna ubicación:', rutaArchivo);
        console.error('[ERROR] Rutas probadas:', posiblesRutas);
        return res.status(404).json({ message: 'Archivo no encontrado' });
      }
      
      // Determinar el tipo MIME basado en la extensión
      const ext = path.extname(rutaEncontrada).toLowerCase();
      let contentType = 'application/octet-stream'; // Default
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(rutaEncontrada)}"`);
      
      return fs.createReadStream(rutaEncontrada).pipe(res);
    } catch (error) {
      console.error('[ERROR] Error al obtener comprobante:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * [DEBUG] Obtiene y muestra en consola los últimos movimientos de caja
   */
  debugObtenerTodosMovimientos: async (req: Request, res: Response) => {
    console.log('[DEBUG] Ejecutando debugObtenerTodosMovimientos...');
    try {
      const ultimosMovimientos = await prisma.movimientoCaja.findMany({
        take: 20, // Traemos solo los últimos 20 para no sobrecargar
        orderBy: {
          fecha: 'desc',
        },
        include: { // Incluimos relaciones para ver qué datos traen
          caja: {
            include: {
              sucursal: true,
              usuario: true
            }
          }
        }
      });

      console.log('--- [DEBUG] Últimos 20 MovimientoCaja Registros: ---');
      console.log(JSON.stringify(ultimosMovimientos, null, 2)); // Imprime en formato JSON legible
      console.log('--- [DEBUG] Fin de los registros ---');

      return res.status(200).json({ 
        mensaje: 'Datos de MovimientoCaja mostrados en la consola del servidor.',
        cantidad: ultimosMovimientos.length 
      });
    } catch (error) {
      console.error('[DEBUG] Error al obtener todos los movimientos de caja:', error);
      return res.status(500).json({ error: 'Error interno al obtener datos para debug' });
    }
  }
};

export default AquipagoController;

console.log('[DEBUG] Controlador aquipago.controller.ts cargado exitosamente.'); 
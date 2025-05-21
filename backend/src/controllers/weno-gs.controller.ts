import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

console.log('[DEBUG] Cargando controlador weno-gs.controller.ts...');

const prisma = new PrismaClient();
// Definir rutas para comprobantes
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/comprobantes');
const UPLOADS_ROOT_DIR = path.join(__dirname, '../../../uploads');

// Asegurarse de que los directorios de comprobantes existan
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log(`[DEBUG] Creando directorio de comprobantes en: ${UPLOADS_DIR}`);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('[DEBUG] Directorio de comprobantes creado con éxito.');
} else {
  console.log(`[DEBUG] Directorio de comprobantes ya existe en: ${UPLOADS_DIR}`);
}

/**
 * Controlador para gestionar las operaciones relacionadas con Wepa Gs (wepaGuaranies)
 */
export const WenoGsController = {
  /**
   * Obtiene los movimientos de Wepa Gs filtrados por fecha
   * Agrupa los pagos y retiros por caja
   */
  obtenerMovimientos: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: 'Las fechas de inicio y fin son requeridas' });
      }

      // Convertir fechas de string a Date, asegurando UTC
      const [startYear, startMonth, startDay] = (fechaInicio as string).split('-').map(Number);
      const [endYear, endMonth, endDay] = (fechaFin as string).split('-').map(Number);

      // Validar parseo básico
      if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
        return res.status(400).json({ error: 'Formato de fecha inválido (YYYY-MM-DD esperado)' });
      }

      // Inicio del día de inicio en UTC
      const fechaInicioUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));

      // Inicio del DÍA SIGUIENTE al día de fin en UTC
      const fechaFinOriginalUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0, 0));
      const fechaFinSiguienteUTC = new Date(fechaFinOriginalUTC);
      fechaFinSiguienteUTC.setUTCDate(fechaFinOriginalUTC.getUTCDate() + 1); // Usar setUTCDate

      // Validar que las fechas construidas sean válidas
      if (isNaN(fechaInicioUTC.getTime()) || isNaN(fechaFinSiguienteUTC.getTime())) {
        return res.status(400).json({ error: 'Fechas inválidas resultantes' });
      }
      
      // Log de depuración de fechas para Prisma
      console.log(`[DEBUG] Prisma Query - Fechas UTC: gte ${fechaInicioUTC.toISOString()} , lt ${fechaFinSiguienteUTC.toISOString()}`);

      // 1. Obtener la configuración actual de Wepa Gs para conocer la cuenta bancaria
      const wenoGsConfig = await prisma.wepaGsConfig.findFirst({
        orderBy: {
          fechaCreacion: 'desc'
        }
      });

      if (!wenoGsConfig || !wenoGsConfig.cuentaBancariaId) {
        console.warn('[WARN] No hay configuración de Wepa Gs disponible o no tiene cuenta bancaria asignada');
      } else {
        console.log(`[DEBUG] Usando cuentaBancariaId: ${wenoGsConfig.cuentaBancariaId} para buscar depósitos.`);
        
        // Log adicional para depuración: verificar si esta cuenta tiene depósitos
        const totalDepositos = await prisma.depositoBancario.count({
          where: {
            cuentaBancariaId: wenoGsConfig.cuentaBancariaId
          }
        });
        console.log(`[DEBUG] Total de depósitos encontrados para la cuenta ${wenoGsConfig.cuentaBancariaId}: ${totalDepositos}`);
      }

      // 2. Obtener movimientos relacionados con Wepa Gs usando los campos correctos y fechas UTC
      const movimientos = await prisma.movimientoCaja.findMany({
        where: {
          fecha: {
            gte: fechaInicioUTC,
            lt: fechaFinSiguienteUTC,
          },
          operadora: {
            equals: 'wepaGuaranies',
            mode: 'insensitive',
          },
          servicio: {
            in: ['pagos', 'retiros'],
            mode: 'insensitive',
          }
        },
        include: {
          caja: {
            include: {
              sucursal: true,
              usuario: true
            }
          }
        },
        orderBy: {
          fecha: 'desc',
        },
      });
      
      console.log(`[DEBUG] Encontrados ${movimientos.length} movimientos de caja para Wepa Gs`);

      // Mapeo de movimientos
      const movimientosFormateados = movimientos.map(mov => ({
        id: mov.id,
        fecha: mov.fecha.toISOString(),
        cajaId: mov.caja ? mov.caja.id.toString() : 'N/A',
        numeroEntero: mov.caja ? mov.caja.cajaEnteroId : undefined,
        sucursal: mov.caja?.sucursal?.nombre || 'N/A',
        usuario: mov.caja?.usuario?.username || 'N/A',
        servicio: mov.servicio,
        monto: mov.monto.toNumber(),
        operadora: mov.operadora,
        estado: 'ACTIVO', // Por defecto se asume activo
        rutaComprobante: mov.rutaComprobante,
      }));

      // 3. Obtener depósitos bancarios relacionados con la cuenta bancaria de Wepa Gs
      const depositos = (wenoGsConfig?.cuentaBancariaId) ? await prisma.depositoBancario.findMany({
        where: {
          fecha: {
            gte: fechaInicioUTC,
            lt: fechaFinSiguienteUTC,
          },
          cuentaBancariaId: wenoGsConfig.cuentaBancariaId,
          // Eliminar el filtro de observación para mostrar todos los depósitos de la cuenta
          // OR: [
          //   { observacion: { contains: 'WENO', mode: 'insensitive' } },
          //   { observacion: { contains: 'WEPA', mode: 'insensitive' } },
          // ]
        },
        orderBy: {
          fecha: 'desc',
        },
      }) : [];

      console.log(`[DEBUG] Encontrados ${depositos.length} depósitos para Wepa Gs`);
      
      // Log detallado de los depósitos para depuración
      if (depositos.length > 0) {
        console.log('[DEBUG] Detalles de depósitos encontrados:');
        depositos.forEach((deposito, index) => {
          console.log(`[DEBUG] Depósito ${index + 1}:`, {
            id: deposito.id,
            fecha: deposito.fecha.toISOString(),
            monto: deposito.monto.toString(),
            numeroBoleta: deposito.numeroBoleta,
            cuentaBancariaId: deposito.cuentaBancariaId,
            observacion: deposito.observacion
          });
        });
      }

      // Mapeo de depósitos
      const depositosFormateados = depositos.map(d => ({
        id: parseInt(d.id), // Convertir a number si viene como string
        fecha: d.fecha.toISOString(),
        numeroDeposito: d.numeroBoleta,
        numeroComprobante: d.numeroBoleta, // Usar el mismo valor si no hay un campo específico
        monto: d.monto.toNumber(),
        cuentaBancariaId: d.cuentaBancariaId,
        observacion: d.observacion,
        rutaComprobante: d.rutaComprobante,
      }));

      // Calcular totales
      const totalPagos = movimientosFormateados
        .filter(m => m.servicio === 'pagos')
        .reduce((sum, m) => sum + m.monto, 0);
      
      const totalRetiros = movimientosFormateados
        .filter(m => m.servicio === 'retiros')
        .reduce((sum, m) => sum + m.monto, 0);
      
      const totalDepositos = depositosFormateados
        .reduce((sum, d) => sum + d.monto, 0);
      
      // Calcular total a depositar (pagos - retiros - depósitos)
      const totalADepositar = totalPagos - totalRetiros - totalDepositos;

      // Devolver la respuesta con todos los datos
      return res.status(200).json({
        movimientos: movimientosFormateados,
        depositos: depositosFormateados,
        totalPagos,
        totalRetiros,
        totalDepositos,
        totalADepositar
      });

    } catch (error) {
      console.error('Error al obtener movimientos de Wepa Gs:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Obtiene un comprobante a partir del nombre de archivo
   */
  obtenerComprobante: async (req: Request, res: Response) => {
    try {
      const { nombreArchivo } = req.params;

      if (!nombreArchivo) {
        return res.status(400).json({ error: 'El nombre del archivo es requerido' });
      }

      console.log(`[DEBUG] Solicitando comprobante: ${nombreArchivo}`);

      // Construir la ruta completa del archivo
      let rutaArchivo = '';

      // Permitir diferentes localizaciones de archivos - AMPLIADO CON MÁS RUTAS
      const posiblesRutas = [
        path.join(UPLOADS_DIR, nombreArchivo),
        path.join(UPLOADS_ROOT_DIR, nombreArchivo), // Añadir búsqueda directamente en uploads
        path.join(UPLOADS_DIR, '..', nombreArchivo),
        nombreArchivo, // Ruta absoluta si se proporciona
      ];

      // Log de todas las rutas que se intentarán
      console.log('[DEBUG] Intentando buscar el archivo en las siguientes rutas:');
      posiblesRutas.forEach(ruta => console.log(`- ${ruta}`));

      // Verificar cada posible ruta
      for (const ruta of posiblesRutas) {
        console.log(`[DEBUG] Verificando existencia de: ${ruta}`);
        if (fs.existsSync(ruta)) {
          rutaArchivo = ruta;
          console.log(`[DEBUG] ¡Archivo encontrado en: ${ruta}!`);
          break;
        }
      }

      if (!rutaArchivo) {
        console.error(`Comprobante no encontrado: ${nombreArchivo}`);
        return res.status(404).json({ error: 'Comprobante no encontrado' });
      }

      // Enviar el archivo
      return res.sendFile(rutaArchivo);

    } catch (error) {
      console.error('Error al obtener comprobante:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Método de depuración para obtener todos los movimientos sin filtros
   * Solo para desarrollo
   */
  debugObtenerTodosMovimientos: async (req: Request, res: Response) => {
    try {
      const movimientos = await prisma.movimientoCaja.findMany({
        where: {
          operadora: {
            equals: 'wepaGuaranies',
            mode: 'insensitive', 
          }
        },
        take: 50, // Limitar a 50 registros para depuración
        orderBy: {
          fecha: 'desc',
        },
      });

      return res.status(200).json({
        count: movimientos.length,
        movimientos
      });
    } catch (error) {
      console.error('Error en depuración de Wepa Gs:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Lista todos los archivos disponibles en la carpeta de comprobantes
   * Para depuración
   */
  listarComprobantes: async (_req: Request, res: Response) => {
    try {
      const archivosComprobantes: string[] = [];
      const carpetas = [UPLOADS_DIR, UPLOADS_ROOT_DIR];
      
      // Función recursiva para explorar carpetas
      const explorarCarpeta = (carpeta: string, prefijo: string = '') => {
        try {
          if (!fs.existsSync(carpeta)) {
            console.log(`[DEBUG] Carpeta no existe: ${carpeta}`);
            return;
          }
          
          const archivos = fs.readdirSync(carpeta);
          
          archivos.forEach(archivo => {
            const rutaCompleta = path.join(carpeta, archivo);
            const rutaRelativa = prefijo ? `${prefijo}/${archivo}` : archivo;
            
            try {
              const stat = fs.statSync(rutaCompleta);
              if (stat.isDirectory()) {
                // Si es un directorio, explorar recursivamente
                explorarCarpeta(rutaCompleta, rutaRelativa);
              } else {
                // Si es un archivo, añadir a la lista
                archivosComprobantes.push(rutaRelativa);
              }
            } catch (err) {
              console.error(`Error al procesar archivo ${rutaCompleta}:`, err);
            }
          });
        } catch (err) {
          console.error(`Error al listar carpeta ${carpeta}:`, err);
        }
      };
      
      // Explorar cada carpeta
      carpetas.forEach((carpeta, index) => {
        console.log(`[DEBUG] Explorando carpeta ${index+1}: ${carpeta}`);
        const nombreCarpeta = path.basename(carpeta);
        explorarCarpeta(carpeta, nombreCarpeta);
      });
      
      return res.status(200).json({
        directorios: carpetas,
        archivos: archivosComprobantes
      });
    } catch (error) {
      console.error('Error al listar comprobantes:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Obtiene el balance global de Wepa Gs (totalADepositar independiente del rango de fechas)
   */
  obtenerBalanceGlobal: async (_req: Request, res: Response) => {
    try {
      console.log('[DEBUG] Obteniendo balance global de Wepa Gs');
      
      // 1. Obtener la configuración actual de Wepa Gs para conocer la cuenta bancaria
      const wenoGsConfig = await prisma.wepaGsConfig.findFirst({
        orderBy: {
          fechaCreacion: 'desc'
        }
      });

      if (!wenoGsConfig || !wenoGsConfig.cuentaBancariaId) {
        console.warn('[WARN] No hay configuración de Wepa Gs disponible o no tiene cuenta bancaria asignada');
      } else {
        console.log(`[DEBUG] Usando cuentaBancariaId: ${wenoGsConfig.cuentaBancariaId} para buscar depósitos globales.`);
      }

      // 2. Calcular sumas globales (histórico completo)
      // Suma de pagos (ingresos)
      const sumaPagosGlobal = await prisma.movimientoCaja.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          operadora: {
            equals: 'wepaGuaranies',
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
            equals: 'wepaGuaranies',
            mode: 'insensitive',
          },
          servicio: {
            equals: 'retiros',
            mode: 'insensitive',
          },
        },
      });
      
      // Suma de depósitos bancarios (si tenemos configuración)
      const sumaDepositosGlobal = wenoGsConfig?.cuentaBancariaId ? await prisma.depositoBancario.aggregate({
        _sum: {
          monto: true,
        },
        where: {
          cuentaBancariaId: wenoGsConfig.cuentaBancariaId,
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
      console.error('Error al obtener balance global de Wepa Gs:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

console.log('[DEBUG] Controlador weno-gs.controller.ts cargado exitosamente.'); 
import { Request, Response } from 'express';
import { CajaMayorModel, MovimientoCajaInput } from '../models/cajaMayor.model';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const CajaMayorMovimientosController = {
  // Obtener movimientos por moneda
  getMovimientosByMoneda: async (req: Request, res: Response) => {
    console.log('Ejecutando getMovimientosByMoneda', req.params, req.query);
    const { moneda } = req.params;
    // Leer el parámetro limit de la query string
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    try {
      if (!moneda || (moneda !== 'guaranies' && moneda !== 'dolares' && moneda !== 'reales')) {
        return res.status(400).json({ error: 'Moneda inválida' });
      }
      
      const movimientos = await CajaMayorModel.findByMoneda(moneda, limit);
      return res.json(movimientos);
    } catch (error) {
      console.error(`Error al obtener movimientos de moneda ${moneda}:`, error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  
  // Crear un nuevo movimiento
  createMovimiento: async (req: Request, res: Response) => {
    console.log('Ejecutando createMovimiento', req.body);
    const data: MovimientoCajaInput = req.body;
    
    try {
      // Validar campos requeridos
      if (!data.tipo || !data.concepto || !data.moneda || !data.monto || !data.operacion || !data.usuario_id) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos',
          detalle: 'Se requieren tipo, concepto, moneda, monto, operacion y usuario_id',
          recibido: data
        });
      }
      
      // Validar tipos de datos
      if (typeof data.monto !== 'number' || data.monto <= 0) {
        return res.status(400).json({ error: 'El monto debe ser un número mayor a cero' });
      }
      
      if (data.operacion !== 'ingreso' && data.operacion !== 'egreso') {
        return res.status(400).json({ error: 'La operación debe ser "ingreso" o "egreso"' });
      }
      
      if (data.moneda !== 'guaranies' && data.moneda !== 'dolares' && data.moneda !== 'reales') {
        return res.status(400).json({ error: 'La moneda debe ser "guaranies", "dolares" o "reales"' });
      }
      
      // Procesar el movimiento
      console.log('Datos validados correctamente, intentando crear movimiento...');
      const nuevoMovimiento = await CajaMayorModel.create(data);
      console.log('Movimiento creado:', nuevoMovimiento);
      
      return res.status(201).json(nuevoMovimiento);
    } catch (error) {
      console.error('Error al crear movimiento en caja mayor:', error);
      return res.status(500).json({ 
        error: 'Error al registrar el movimiento en caja mayor',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },
  
  // Obtener datos de caja
  getDatosCaja: async (_req: Request, res: Response) => {
    console.log('Ejecutando getDatosCaja');
    try {
      // Obtener saldos actuales
      const saldoActual = await CajaMayorModel.getSaldos();
      
      // Obtener resumen del mes (ingresos y egresos)
      const { ingresosMes, egresosMes } = await CajaMayorModel.getResumenMes();
      
      // Obtener todos los movimientos, limitando a 12 por moneda
      // Ya que solo mostraremos los filtrados por moneda en el frontend
      const guaraniesMovs = await CajaMayorModel.findByMoneda('guaranies', 12);
      const dolaresMovs = await CajaMayorModel.findByMoneda('dolares', 12);
      const realesMovs = await CajaMayorModel.findByMoneda('reales', 12);
      
      // Combinar todos los movimientos
      const movimientos = [...guaraniesMovs, ...dolaresMovs, ...realesMovs];
      
      // Devolver todos los datos juntos
      return res.json({
        saldoActual,
        ingresosMes,
        egresosMes,
        movimientos
      });
    } catch (error) {
      console.error('Error al obtener datos de caja mayor:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Nuevo método para obtener solo los saldos actuales
  getSaldosActuales: async (_req: Request, res: Response) => {
    console.log('Ejecutando getSaldosActuales');
    try {
      const saldos = await CajaMayorModel.getSaldos();
      return res.json(saldos);
    } catch (error) {
      console.error('Error al obtener saldos actuales de caja mayor:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener un movimiento específico por su ID
  getMovimientoById: async (req: Request, res: Response) => {
    console.log('Ejecutando getMovimientoById', req.params);
    const { id } = req.params;
    
    try {
      const movimientoId = parseInt(id, 10);
      
      if (isNaN(movimientoId)) {
        return res.status(400).json({ error: 'ID de movimiento inválido' });
      }
      
      const movimiento = await CajaMayorModel.findById(movimientoId);
      
      if (!movimiento) {
        return res.status(404).json({ error: 'Movimiento no encontrado' });
      }
      
      return res.json(movimiento);
    } catch (error) {
      console.error(`Error al obtener movimiento por ID:`, error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener un movimiento específico por ID usando Prisma
  obtenerMovimientoPorId: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ error: 'ID de movimiento inválido' });
      }
      
      const movimientoId = parseInt(id, 10);
      
      // Consulta SQL para obtener un movimiento por ID
      const query = `
        SELECT * FROM "caja_mayor_movimientos"
        WHERE id = $1
      `;
      
      const result = await prisma.$queryRawUnsafe(query, movimientoId);
      
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return res.status(404).json({ error: 'Movimiento no encontrado' });
      }
      
      const movimiento = Array.isArray(result) ? result[0] : result;
      
      res.json(movimiento);
    } catch (error: any) {
      console.error('Error al obtener movimiento por ID:', error);
      res.status(500).json({ 
        error: 'Error al obtener el movimiento', 
        details: error.message 
      });
    }
  },

  /**
   * Obtener movimientos de caja mayor con filtros, paginación y ordenación.
   * Usada por las rutas GET /api/caja_mayor_movimientos[/:moneda]
   */
  getMovimientos: async (req: Request, res: Response) => {
    const { moneda } = req.params;
    const { 
      limit,
      page = 1,
      pageSize = 50,
      sortOrder = 'desc',
      fechaDesde, 
      fechaHasta,
      tipo,
      concepto
    } = req.query;

    // Validar y convertir parámetros de paginación
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = limit ? parseInt(limit as string, 10) : parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;
    
    // Validar orden
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    console.log(`Ejecutando getMovimientos paginado con filtros`, { 
      moneda, pageNum, pageSizeNum, skip, order, fechaDesde, fechaHasta, tipo, concepto 
    });

    try {
      // Configuración del include (igual que antes)
      const includeRelations: Prisma.CajaMayorMovimientoInclude = {
        usuario: {
          select: { username: true, nombre: true }
        },
        deposito: { 
          select: { rutaComprobante: true }
        }
      };

      // Condiciones de búsqueda (igual que antes)
      const whereConditions: Prisma.CajaMayorMovimientoWhereInput = {};
      if (moneda) {
        whereConditions.moneda = moneda;
      }
      
      // Filtro por rango de fechas
      if (fechaDesde || fechaHasta) {
        whereConditions.fechaHora = {};
        if (fechaDesde) {
          whereConditions.fechaHora.gte = new Date(fechaDesde as string);
        }
        if (fechaHasta) {
          // La fechaHasta ya viene ajustada desde el frontend al final del día
          whereConditions.fechaHora.lte = new Date(fechaHasta as string);
        }
      }
      
      // Filtro por tipo (búsqueda parcial, insensible a mayúsculas)
      if (tipo) {
        whereConditions.tipo = {
          contains: tipo as string,
          mode: 'insensitive', 
        };
      }
      
      // Filtro por concepto (búsqueda parcial, insensible a mayúsculas)
      if (concepto) {
        whereConditions.concepto = {
          contains: concepto as string,
          mode: 'insensitive', 
        };
      }

      // --- OBTENER MOVIMIENTOS PAGINADOS (con filtros) ---
      const movimientos = await prisma.cajaMayorMovimiento.findMany({
        where: whereConditions, // Aplicar todos los filtros
        orderBy: {
          fechaHora: order 
        },
        skip: skip,        
        take: pageSizeNum,  
        include: includeRelations
      });

      // --- OBTENER EL TOTAL DE MOVIMIENTOS (con filtros) ---
      const totalMovimientos = await prisma.cajaMayorMovimiento.count({
        where: whereConditions, // Aplicar los mismos filtros al conteo
      });

      // Mapear resultados (igual que antes)
      const movimientosFinales = movimientos.map(mov => {
        const movimientoConRuta = { ...mov };
        if (mov.deposito) {
          (movimientoConRuta as any).rutaComprobante = mov.deposito.rutaComprobante || null;
        } else {
          (movimientoConRuta as any).rutaComprobante = null;
        }
        delete (movimientoConRuta as any).deposito;
        return movimientoConRuta;
      });

      // Devolver movimientos y total
      res.status(200).json({
        movimientos: movimientosFinales,
        total: totalMovimientos,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(totalMovimientos / pageSizeNum)
      });

    } catch (error: any) {
      console.error('Error al obtener movimientos de caja mayor paginados:', error);
      res.status(500).json({ error: 'Error interno al obtener movimientos', details: error.message });
    }
  },

  /**
   * Obtener lista de tipos de movimiento únicos
   */
  getTiposUnicos: async (_req: Request, res: Response) => {
    try {
      const tipos = await prisma.cajaMayorMovimiento.findMany({
        distinct: ['tipo'], // Obtener valores distintos de la columna 'tipo'
        select: {
          tipo: true, // Seleccionar solo la columna 'tipo'
        },
        orderBy: {
          tipo: 'asc', // Ordenar alfabéticamente
        },
      });
      
      // Extraer solo los strings del resultado
      const tiposArray = tipos.map(t => t.tipo);
      
      res.status(200).json(tiposArray);

    } catch (error: any) {
      console.error('Error al obtener tipos únicos de movimiento:', error);
      res.status(500).json({ error: 'Error interno al obtener tipos', details: error.message });
    }
  }
}; 
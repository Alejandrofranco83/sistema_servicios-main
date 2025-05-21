"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CajaMayorMovimientosController = void 0;
const cajaMayor_model_1 = require("../models/cajaMayor.model");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.CajaMayorMovimientosController = {
    // Obtener movimientos por moneda
    getMovimientosByMoneda: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Ejecutando getMovimientosByMoneda', req.params, req.query);
        const { moneda } = req.params;
        // Leer el parámetro limit de la query string
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        try {
            if (!moneda || (moneda !== 'guaranies' && moneda !== 'dolares' && moneda !== 'reales')) {
                return res.status(400).json({ error: 'Moneda inválida' });
            }
            const movimientos = yield cajaMayor_model_1.CajaMayorModel.findByMoneda(moneda, limit);
            return res.json(movimientos);
        }
        catch (error) {
            console.error(`Error al obtener movimientos de moneda ${moneda}:`, error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Crear un nuevo movimiento
    createMovimiento: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Ejecutando createMovimiento', req.body);
        const data = req.body;
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
            const nuevoMovimiento = yield cajaMayor_model_1.CajaMayorModel.create(data);
            console.log('Movimiento creado:', nuevoMovimiento);
            return res.status(201).json(nuevoMovimiento);
        }
        catch (error) {
            console.error('Error al crear movimiento en caja mayor:', error);
            return res.status(500).json({
                error: 'Error al registrar el movimiento en caja mayor',
                detalle: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }),
    // Obtener datos de caja
    getDatosCaja: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Ejecutando getDatosCaja');
        try {
            // Obtener saldos actuales
            const saldoActual = yield cajaMayor_model_1.CajaMayorModel.getSaldos();
            // Obtener resumen del mes (ingresos y egresos)
            const { ingresosMes, egresosMes } = yield cajaMayor_model_1.CajaMayorModel.getResumenMes();
            // Obtener todos los movimientos, limitando a 12 por moneda
            // Ya que solo mostraremos los filtrados por moneda en el frontend
            const guaraniesMovs = yield cajaMayor_model_1.CajaMayorModel.findByMoneda('guaranies', 12);
            const dolaresMovs = yield cajaMayor_model_1.CajaMayorModel.findByMoneda('dolares', 12);
            const realesMovs = yield cajaMayor_model_1.CajaMayorModel.findByMoneda('reales', 12);
            // Combinar todos los movimientos
            const movimientos = [...guaraniesMovs, ...dolaresMovs, ...realesMovs];
            // Devolver todos los datos juntos
            return res.json({
                saldoActual,
                ingresosMes,
                egresosMes,
                movimientos
            });
        }
        catch (error) {
            console.error('Error al obtener datos de caja mayor:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Nuevo método para obtener solo los saldos actuales
    getSaldosActuales: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Ejecutando getSaldosActuales');
        try {
            const saldos = yield cajaMayor_model_1.CajaMayorModel.getSaldos();
            return res.json(saldos);
        }
        catch (error) {
            console.error('Error al obtener saldos actuales de caja mayor:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Obtener un movimiento específico por su ID
    getMovimientoById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Ejecutando getMovimientoById', req.params);
        const { id } = req.params;
        try {
            const movimientoId = parseInt(id, 10);
            if (isNaN(movimientoId)) {
                return res.status(400).json({ error: 'ID de movimiento inválido' });
            }
            const movimiento = yield cajaMayor_model_1.CajaMayorModel.findById(movimientoId);
            if (!movimiento) {
                return res.status(404).json({ error: 'Movimiento no encontrado' });
            }
            return res.json(movimiento);
        }
        catch (error) {
            console.error(`Error al obtener movimiento por ID:`, error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Obtener un movimiento específico por ID usando Prisma
    obtenerMovimientoPorId: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const result = yield prisma.$queryRawUnsafe(query, movimientoId);
            if (!result || (Array.isArray(result) && result.length === 0)) {
                return res.status(404).json({ error: 'Movimiento no encontrado' });
            }
            const movimiento = Array.isArray(result) ? result[0] : result;
            res.json(movimiento);
        }
        catch (error) {
            console.error('Error al obtener movimiento por ID:', error);
            res.status(500).json({
                error: 'Error al obtener el movimiento',
                details: error.message
            });
        }
    }),
    /**
     * Obtener movimientos de caja mayor con filtros, paginación y ordenación.
     * Usada por las rutas GET /api/caja_mayor_movimientos[/:moneda]
     */
    getMovimientos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { moneda } = req.params;
        const { limit, page = 1, pageSize = 50, sortOrder = 'desc', fechaDesde, fechaHasta, tipo, concepto } = req.query;
        // Validar y convertir parámetros de paginación
        const pageNum = parseInt(page, 10);
        const pageSizeNum = limit ? parseInt(limit, 10) : parseInt(pageSize, 10);
        const skip = (pageNum - 1) * pageSizeNum;
        // Validar orden
        const order = sortOrder === 'asc' ? 'asc' : 'desc';
        console.log(`Ejecutando getMovimientos paginado con filtros`, {
            moneda, pageNum, pageSizeNum, skip, order, fechaDesde, fechaHasta, tipo, concepto
        });
        try {
            // Configuración del include (igual que antes)
            const includeRelations = {
                usuario: {
                    select: { username: true, nombre: true }
                },
                deposito: {
                    select: { rutaComprobante: true }
                }
            };
            // Condiciones de búsqueda (igual que antes)
            const whereConditions = {};
            if (moneda) {
                whereConditions.moneda = moneda;
            }
            // Filtro por rango de fechas
            if (fechaDesde || fechaHasta) {
                whereConditions.fechaHora = {};
                if (fechaDesde) {
                    whereConditions.fechaHora.gte = new Date(fechaDesde);
                }
                if (fechaHasta) {
                    // La fechaHasta ya viene ajustada desde el frontend al final del día
                    whereConditions.fechaHora.lte = new Date(fechaHasta);
                }
            }
            // Filtro por tipo (búsqueda parcial, insensible a mayúsculas)
            if (tipo) {
                whereConditions.tipo = {
                    contains: tipo,
                    mode: 'insensitive',
                };
            }
            // Filtro por concepto (búsqueda parcial, insensible a mayúsculas)
            if (concepto) {
                whereConditions.concepto = {
                    contains: concepto,
                    mode: 'insensitive',
                };
            }
            // --- OBTENER MOVIMIENTOS PAGINADOS (con filtros) ---
            const movimientos = yield prisma.cajaMayorMovimiento.findMany({
                where: whereConditions, // Aplicar todos los filtros
                orderBy: {
                    fechaHora: order
                },
                skip: skip,
                take: pageSizeNum,
                include: includeRelations
            });
            // --- OBTENER EL TOTAL DE MOVIMIENTOS (con filtros) ---
            const totalMovimientos = yield prisma.cajaMayorMovimiento.count({
                where: whereConditions, // Aplicar los mismos filtros al conteo
            });
            // Mapear resultados (igual que antes)
            const movimientosFinales = movimientos.map(mov => {
                const movimientoConRuta = Object.assign({}, mov);
                if (mov.deposito) {
                    movimientoConRuta.rutaComprobante = mov.deposito.rutaComprobante || null;
                }
                else {
                    movimientoConRuta.rutaComprobante = null;
                }
                delete movimientoConRuta.deposito;
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
        }
        catch (error) {
            console.error('Error al obtener movimientos de caja mayor paginados:', error);
            res.status(500).json({ error: 'Error interno al obtener movimientos', details: error.message });
        }
    }),
    /**
     * Obtener lista de tipos de movimiento únicos
     */
    getTiposUnicos: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const tipos = yield prisma.cajaMayorMovimiento.findMany({
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
        }
        catch (error) {
            console.error('Error al obtener tipos únicos de movimiento:', error);
            res.status(500).json({ error: 'Error interno al obtener tipos', details: error.message });
        }
    })
};
//# sourceMappingURL=caja-mayor-movimientos.controller.js.map
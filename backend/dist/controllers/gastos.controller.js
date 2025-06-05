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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGastoCajaMayor = exports.deleteGastoCajaMayor = exports.getSucursales = exports.deleteGasto = exports.updateGasto = exports.createGasto = exports.getGastoById = exports.getGastos = exports.upload = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
// Configuración para la subida de comprobantes
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/comprobantes');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});
exports.upload = (0, multer_1.default)({ storage });
// Función auxiliar para mapear moneda de gastos a formato de caja mayor
const mapearMonedaCajaMayor = (monedaGasto) => {
    switch (monedaGasto) {
        case 'GS':
        case 'PYG':
            return 'guaranies';
        case 'USD':
            return 'dolares';
        case 'BRL':
            return 'reales';
        default:
            return 'guaranies';
    }
};
// Función auxiliar para mapear moneda de gastos a formato de farmacia
const mapearMonedaFarmacia = (monedaGasto) => {
    switch (monedaGasto) {
        case 'GS':
            return 'PYG';
        case 'USD':
            return 'USD';
        case 'BRL':
            return 'BRL';
        default:
            return 'PYG';
    }
};
// Función auxiliar para verificar si un gasto sale de caja mayor
const verificarGastoSaleDeCajaMayor = (gastoId) => __awaiter(void 0, void 0, void 0, function* () {
    const movimiento = yield prisma.cajaMayorMovimiento.findFirst({
        where: {
            operacionId: gastoId.toString(),
            tipo: 'Gasto'
        }
    });
    return !!movimiento;
});
// Obtener todos los gastos con posibilidad de filtros
const getGastos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fechaDesde, fechaHasta, categoriaId, subcategoriaId, sucursalId, moneda } = req.query;
        const filters = {};
        if (fechaDesde && fechaHasta) {
            filters.fecha = {
                gte: new Date(fechaDesde),
                lte: new Date(fechaHasta)
            };
        }
        else if (fechaDesde) {
            filters.fecha = { gte: new Date(fechaDesde) };
        }
        else if (fechaHasta) {
            filters.fecha = { lte: new Date(fechaHasta) };
        }
        if (categoriaId)
            filters.categoriaId = parseInt(categoriaId);
        if (subcategoriaId)
            filters.subcategoriaId = parseInt(subcategoriaId);
        if (sucursalId && sucursalId !== 'null') {
            filters.sucursalId = parseInt(sucursalId);
        }
        else if (sucursalId === 'null') {
            filters.sucursalId = null; // Caso para "General/Adm"
        }
        if (moneda)
            filters.moneda = moneda;
        const gastos = yield prisma.gasto.findMany({
            where: filters,
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        // Verificar para cada gasto si sale de caja mayor
        const gastosConInfo = yield Promise.all(gastos.map((gasto) => __awaiter(void 0, void 0, void 0, function* () {
            const saleDeCajaMayor = yield verificarGastoSaleDeCajaMayor(gasto.id);
            return Object.assign(Object.assign({}, gasto), { saleDeCajaMayor });
        })));
        res.json(gastosConInfo);
    }
    catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).json({ error: 'Error al obtener los gastos' });
    }
});
exports.getGastos = getGastos;
// Obtener un gasto por su ID
const getGastoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const gasto = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) },
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        res.json(gasto);
    }
    catch (error) {
        console.error('Error al obtener gasto:', error);
        res.status(500).json({ error: 'Error al obtener el gasto' });
    }
});
exports.getGastoById = getGastoById;
// Crear un nuevo gasto
const createGasto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fecha, descripcion, monto, moneda, categoriaId, subcategoriaId, sucursalId, observaciones, saleDeCajaMayor } = req.body;
        // Verificar que el usuario es válido
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Convertir saleDeCajaMayor a boolean
        const saleDeCajaMayorBool = saleDeCajaMayor === 'true' || saleDeCajaMayor === true;
        console.log('Creando gasto:', { descripcion, monto, moneda, saleDeCajaMayor: saleDeCajaMayorBool });
        // Si sale de caja mayor, usar transacción atómica
        if (saleDeCajaMayorBool) {
            const resultado = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                // 1. Crear el gasto
                const gasto = yield tx.gasto.create({
                    data: {
                        fecha: fecha ? new Date(fecha) : new Date(),
                        descripcion,
                        monto: parseFloat(monto),
                        moneda: moneda || 'GS',
                        categoriaId: parseInt(categoriaId),
                        subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
                        sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
                        comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : null,
                        observaciones,
                        usuarioId: userId
                    },
                    include: {
                        categoria: true,
                        subcategoria: true,
                        sucursal: true,
                        usuario: {
                            select: {
                                id: true,
                                username: true,
                                nombre: true
                            }
                        }
                    }
                });
                // 2. Crear movimiento en caja mayor (egreso)
                const monedaCajaMayor = mapearMonedaCajaMayor(moneda || 'GS');
                // Buscar el último movimiento de caja mayor para obtener el saldo anterior
                const ultimoMovimiento = yield tx.cajaMayorMovimiento.findFirst({
                    where: { moneda: monedaCajaMayor },
                    orderBy: { id: 'desc' }
                });
                const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual.toString()) : 0;
                const montoGasto = parseFloat(monto);
                const saldoActual = saldoAnterior - montoGasto; // Egreso de caja
                // Crear concepto descriptivo incluyendo categoría, subcategoría y sucursal
                const conceptoCajaMayor = `Gasto: ${descripcion} - ${gasto.categoria.nombre}${gasto.subcategoria ? ` / ${gasto.subcategoria.nombre}` : ''} - ${((_a = gasto.sucursal) === null || _a === void 0 ? void 0 : _a.nombre) || 'General/Adm'}`;
                yield tx.cajaMayorMovimiento.create({
                    data: {
                        fechaHora: new Date(),
                        tipo: 'Gasto',
                        operacionId: gasto.id.toString(),
                        moneda: monedaCajaMayor,
                        monto: montoGasto,
                        esIngreso: false, // Un gasto es un egreso
                        saldoAnterior,
                        saldoActual,
                        concepto: conceptoCajaMayor,
                        usuarioId: userId
                    }
                });
                // 3. Crear movimiento en balance farmacia (egreso)
                const monedaFarmacia = mapearMonedaFarmacia(moneda || 'GS');
                const montoNegativo = -montoGasto; // Negativo para representar egreso
                // Usar el mismo concepto detallado que en caja mayor
                const conceptoFarmacia = conceptoCajaMayor; // Mismo concepto que caja mayor
                yield tx.movimientoFarmacia.create({
                    data: {
                        fechaHora: new Date(),
                        tipoMovimiento: 'EGRESO',
                        concepto: conceptoFarmacia,
                        movimientoOrigenId: gasto.id,
                        movimientoOrigenTipo: 'GASTO',
                        monto: montoNegativo,
                        monedaCodigo: monedaFarmacia,
                        estado: 'CONFIRMADO',
                        usuarioId: userId
                    }
                });
                console.log(`✅ Gasto creado con movimientos en caja mayor y farmacia - ID: ${gasto.id}`);
                return gasto;
            }));
            res.status(201).json(resultado);
        }
        else {
            // Crear gasto sin movimientos de caja mayor
            const gasto = yield prisma.gasto.create({
                data: {
                    fecha: fecha ? new Date(fecha) : new Date(),
                    descripcion,
                    monto: parseFloat(monto),
                    moneda: moneda || 'GS',
                    categoriaId: parseInt(categoriaId),
                    subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
                    sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
                    comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : null,
                    observaciones,
                    usuarioId: userId
                },
                include: {
                    categoria: true,
                    subcategoria: true,
                    sucursal: true,
                    usuario: {
                        select: {
                            id: true,
                            username: true,
                            nombre: true
                        }
                    }
                }
            });
            res.status(201).json(gasto);
        }
    }
    catch (error) {
        console.error('Error al crear gasto:', error);
        // Si hay un archivo que se guardó y ocurrió un error en la transacción, eliminarlo
        if (req.file) {
            try {
                const filePath = path_1.default.join(__dirname, '../../uploads/comprobantes', req.file.filename);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    console.log('Archivo eliminado debido al error en la transacción');
                }
            }
            catch (fileError) {
                console.error('Error al eliminar archivo tras fallo en transacción:', fileError);
            }
        }
        res.status(500).json({ error: 'Error al crear el gasto' });
    }
});
exports.createGasto = createGasto;
// Actualizar un gasto existente
const updateGasto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { fecha, descripcion, monto, moneda, categoriaId, subcategoriaId, sucursalId, observaciones } = req.body;
        // Verificar que el gasto existe
        const gastoExistente = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) }
        });
        if (!gastoExistente) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        // Actualizar el gasto
        const gasto = yield prisma.gasto.update({
            where: { id: parseInt(id) },
            data: {
                fecha: fecha ? new Date(fecha) : undefined,
                descripcion,
                monto: monto ? parseFloat(monto) : undefined,
                moneda,
                categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
                subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
                sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
                comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : undefined,
                observaciones
            },
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true
                    }
                }
            }
        });
        res.json(gasto);
    }
    catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).json({ error: 'Error al actualizar el gasto' });
    }
});
exports.updateGasto = updateGasto;
// Eliminar un gasto
const deleteGasto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar que el gasto existe
        const gasto = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) }
        });
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        // Verificar si el gasto sale de caja mayor
        const saleDeCajaMayor = yield verificarGastoSaleDeCajaMayor(parseInt(id));
        if (saleDeCajaMayor) {
            return res.status(400).json({
                error: 'Este gasto debe eliminarse desde el Balance de Caja Mayor',
                code: 'DEBE_ELIMINAR_DESDE_BALANCE'
            });
        }
        // Eliminar archivo de comprobante si existe
        if (gasto.comprobante) {
            const comprobanteePath = path_1.default.join(__dirname, '../../uploads/comprobantes', gasto.comprobante);
            if (fs_1.default.existsSync(comprobanteePath)) {
                fs_1.default.unlinkSync(comprobanteePath);
            }
        }
        // Eliminar el gasto (solo si no sale de caja mayor)
        yield prisma.gasto.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            message: 'Gasto eliminado exitosamente',
            gastoEliminado: gasto
        });
    }
    catch (error) {
        console.error('Error al eliminar gasto:', error);
        res.status(500).json({ error: 'Error al eliminar el gasto' });
    }
});
exports.deleteGasto = deleteGasto;
// Obtener todas las sucursales
const getSucursales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sucursales = yield prisma.sucursal.findMany({
            orderBy: { nombre: 'asc' }
        });
        res.json(sucursales);
    }
    catch (error) {
        console.error('Error al obtener sucursales:', error);
        res.status(500).json({ error: 'Error al obtener las sucursales' });
    }
});
exports.getSucursales = getSucursales;
// Eliminar un gasto desde caja mayor 
const deleteGastoCajaMayor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    try {
        // Verificar que el gasto existe
        const gasto = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) },
            include: {
                categoria: true,
                subcategoria: true,
                sucursal: true
            }
        });
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        // Verificar si el gasto sale de caja mayor
        const saleDeCajaMayor = yield verificarGastoSaleDeCajaMayor(parseInt(id));
        if (!saleDeCajaMayor) {
            return res.status(400).json({
                error: 'Este gasto no sale de caja mayor',
                code: 'NO_ES_GASTO_CAJA_MAYOR'
            });
        }
        // Obtener el usuario del token
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 1;
        // Construir concepto detallado para el movimiento contrario
        let concepto = `Anulación Gasto: ${gasto.descripcion} - ${gasto.categoria.nombre}`;
        if (gasto.subcategoria) {
            concepto += ` / ${gasto.subcategoria.nombre}`;
        }
        if (gasto.sucursal) {
            concepto += ` - ${gasto.sucursal.nombre}`;
        }
        else {
            concepto += ` - General/Adm`;
        }
        // Usar transacción atómica para eliminar registros y crear movimiento contrario
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Eliminar movimientos de farmacia relacionados al gasto
            yield tx.movimientoFarmacia.deleteMany({
                where: {
                    movimientoOrigenId: gasto.id,
                    movimientoOrigenTipo: 'GASTO'
                }
            });
            // 2. Crear movimiento contrario huérfano en caja mayor (para mantener trazabilidad)
            const monedaCajaMayor = mapearMonedaCajaMayor(gasto.moneda);
            // Buscar el último movimiento de caja mayor para obtener el saldo anterior
            const ultimoMovimiento = yield tx.cajaMayorMovimiento.findFirst({
                where: { moneda: monedaCajaMayor },
                orderBy: { id: 'desc' }
            });
            const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual.toString()) : 0;
            const montoGasto = parseFloat(gasto.monto.toString());
            const saldoActual = saldoAnterior + montoGasto; // Ingreso (sumamos porque estamos devolviendo el dinero)
            yield tx.cajaMayorMovimiento.create({
                data: {
                    tipo: 'ANULACION_GASTO',
                    monto: montoGasto,
                    moneda: monedaCajaMayor,
                    concepto: concepto,
                    fechaHora: new Date(),
                    operacionId: `ANULADO_${gasto.id}`, // Cambiar ID para que sea huérfano
                    esIngreso: true,
                    saldoAnterior: saldoAnterior,
                    saldoActual: saldoActual,
                    usuarioId: userId
                }
            });
            // 3. Eliminar el gasto de la tabla
            yield tx.gasto.delete({
                where: { id: parseInt(id) }
            });
        }));
        console.log(`✅ Gasto eliminado con movimiento contrario de respaldo - ID: ${id}`);
        res.json({
            message: 'Gasto eliminado correctamente',
            gastoId: parseInt(id)
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar gasto desde caja mayor:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar el gasto',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.deleteGastoCajaMayor = deleteGastoCajaMayor;
// Actualizar un gasto desde caja mayor (actualiza también movimientos relacionados)
const updateGastoCajaMayor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { fecha, descripcion, monto, moneda, categoriaId, subcategoriaId, sucursalId, observaciones } = req.body;
        // Verificar que el gasto existe
        const gastoExistente = yield prisma.gasto.findUnique({
            where: { id: parseInt(id) }
        });
        if (!gastoExistente) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        // Verificar si el gasto sale de caja mayor
        const saleDeCajaMayor = yield verificarGastoSaleDeCajaMayor(parseInt(id));
        if (!saleDeCajaMayor) {
            return res.status(400).json({
                error: 'Este gasto no sale de caja mayor',
                code: 'NO_ES_GASTO_CAJA_MAYOR'
            });
        }
        // Usar transacción atómica para actualizar todo relacionado
        const resultado = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // 1. Actualizar el gasto
            const gastoActualizado = yield tx.gasto.update({
                where: { id: parseInt(id) },
                data: {
                    fecha: fecha ? new Date(fecha) : undefined,
                    descripcion,
                    monto: monto ? parseFloat(monto) : undefined,
                    moneda,
                    categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
                    subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
                    sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
                    comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : undefined,
                    observaciones
                },
                include: {
                    categoria: true,
                    subcategoria: true,
                    sucursal: true,
                    usuario: {
                        select: {
                            id: true,
                            username: true,
                            nombre: true
                        }
                    }
                }
            });
            // 2. Actualizar movimientos de caja mayor si cambiaron datos relevantes
            if (descripcion || monto || moneda || categoriaId || subcategoriaId || sucursalId) {
                // Buscar el movimiento de caja mayor
                const movimientoCajaMayor = yield tx.cajaMayorMovimiento.findFirst({
                    where: {
                        operacionId: id,
                        tipo: 'Gasto'
                    }
                });
                if (movimientoCajaMayor) {
                    const monedaCajaMayor = mapearMonedaCajaMayor(moneda || gastoExistente.moneda);
                    const montoNuevo = monto ? parseFloat(monto) : gastoExistente.monto;
                    // Crear concepto actualizado
                    const conceptoActualizado = `Gasto: ${descripcion || gastoExistente.descripcion} - ${gastoActualizado.categoria.nombre}${gastoActualizado.subcategoria ? ` / ${gastoActualizado.subcategoria.nombre}` : ''} - ${((_a = gastoActualizado.sucursal) === null || _a === void 0 ? void 0 : _a.nombre) || 'General/Adm'}`;
                    // Actualizar movimiento de caja mayor
                    yield tx.cajaMayorMovimiento.update({
                        where: { id: movimientoCajaMayor.id },
                        data: {
                            monto: montoNuevo,
                            moneda: monedaCajaMayor,
                            concepto: conceptoActualizado
                        }
                    });
                    // 3. Actualizar movimiento de farmacia
                    const monedaFarmacia = mapearMonedaFarmacia(moneda || gastoExistente.moneda);
                    const montoNegativo = -montoNuevo;
                    yield tx.movimientoFarmacia.updateMany({
                        where: {
                            movimientoOrigenId: parseInt(id),
                            movimientoOrigenTipo: 'GASTO'
                        },
                        data: {
                            monto: montoNegativo,
                            monedaCodigo: monedaFarmacia,
                            concepto: conceptoActualizado
                        }
                    });
                    console.log(`✅ Gasto de caja mayor actualizado con movimientos - ID: ${id}`);
                }
            }
            return gastoActualizado;
        }));
        res.json(resultado);
    }
    catch (error) {
        console.error('Error al actualizar gasto de caja mayor:', error);
        res.status(500).json({ error: 'Error al actualizar el gasto de caja mayor' });
    }
});
exports.updateGastoCajaMayor = updateGastoCajaMayor;
//# sourceMappingURL=gastos.controller.js.map
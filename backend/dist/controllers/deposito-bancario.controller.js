"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getDepositoBancarioPorMovimiento = exports.cancelarDepositoBancario = exports.deleteDepositoBancario = exports.updateDepositoBancario = exports.createDepositoBancario = exports.getDepositoBancarioById = exports.getAllDepositosBancarios = void 0;
const db_1 = require("../config/db");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const UPLOADS_DIR = path.join(__dirname, '../../uploads/comprobantes');
// Crear directorio de uploads si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
/**
 * Obtener todos los depósitos bancarios
 */
const getAllDepositosBancarios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { desde, hasta, bancoId, cuentaId } = req.query;
        // Construir consulta SQL con filtros
        let whereClause = '';
        const params = [];
        if (desde && hasta) {
            const fechaDesde = new Date(desde);
            const fechaHasta = new Date(hasta);
            fechaHasta.setHours(23, 59, 59, 999);
            whereClause += ' AND db.fecha BETWEEN $1 AND $2';
            params.push(fechaDesde, fechaHasta);
        }
        if (bancoId) {
            whereClause += ` AND db."bancoId" = $${params.length + 1}`;
            params.push(parseInt(bancoId, 10));
        }
        if (cuentaId) {
            whereClause += ` AND db."cuentaBancariaId" = $${params.length + 1}`;
            params.push(parseInt(cuentaId, 10));
        }
        // Consulta SQL para obtener depósitos con sus relaciones
        const query = `
      SELECT 
        db.*, 
        b.nombre as "bancoNombre",
        cb.moneda as "cuentaMoneda",
        cb.numeroCuenta as "numeroCuenta",
        u.nombre as "usuarioNombre",
        u.username as "usuarioUsername"
      FROM "DepositoBancario" db
      LEFT JOIN "Banco" b ON db."bancoId" = b.id
      LEFT JOIN "CuentaBancaria" cb ON db."cuentaBancariaId" = cb.id
      LEFT JOIN "Usuario" u ON db."usuarioId" = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY db.fecha DESC
    `;
        const depositos = yield db_1.prisma.$queryRawUnsafe(query, ...params);
        return res.status(200).json(depositos);
    }
    catch (error) {
        console.error('Error al obtener depósitos bancarios:', error);
        return res.status(500).json({ error: 'Error al obtener depósitos bancarios' });
    }
});
exports.getAllDepositosBancarios = getAllDepositosBancarios;
/**
 * Obtener un depósito bancario por ID
 */
const getDepositoBancarioById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const query = `
      SELECT 
        db.*, 
        b.nombre as "bancoNombre",
        cb.moneda as "cuentaMoneda",
        cb.numeroCuenta as "numeroCuenta",
        u.nombre as "usuarioNombre",
        u.username as "usuarioUsername"
      FROM "DepositoBancario" db
      LEFT JOIN "Banco" b ON db."bancoId" = b.id
      LEFT JOIN "CuentaBancaria" cb ON db."cuentaBancariaId" = cb.id
      LEFT JOIN "Usuario" u ON db."usuarioId" = u.id
      WHERE db.id = $1
    `;
        const deposito = yield db_1.prisma.$queryRaw `${query} ${id}`;
        if (!deposito || (Array.isArray(deposito) && deposito.length === 0)) {
            return res.status(404).json({ error: 'Depósito bancario no encontrado' });
        }
        return res.status(200).json(Array.isArray(deposito) ? deposito[0] : deposito);
    }
    catch (error) {
        console.error('Error al obtener depósito bancario:', error);
        return res.status(500).json({ error: 'Error al obtener depósito bancario' });
    }
});
exports.getDepositoBancarioById = getDepositoBancarioById;
/**
 * Crear un nuevo depósito bancario
 */
const createDepositoBancario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Extraer datos del cuerpo de la solicitud
        const { numeroBoleta, monto, bancoId, cuentaBancariaId, observacion } = req.body;
        console.log('Datos recibidos:', req.body);
        console.log('Archivo recibido:', req.file);
        console.log('bancoId recibido:', bancoId, 'tipo:', typeof bancoId);
        console.log('cuentaBancariaId recibido:', cuentaBancariaId, 'tipo:', typeof cuentaBancariaId);
        // Verificar datos obligatorios
        if (!numeroBoleta || !monto || !bancoId || !cuentaBancariaId) {
            return res.status(400).json({
                error: 'Faltan datos requeridos',
                details: 'El número de boleta, monto, banco y cuenta son obligatorios'
            });
        }
        // Asegurarse de que bancoId sea un número
        let bancoIdNumber;
        try {
            bancoIdNumber = parseInt(bancoId, 10);
            if (isNaN(bancoIdNumber)) {
                return res.status(400).json({
                    error: 'ID de banco inválido',
                    details: `El ID del banco debe ser un número. Valor recibido: ${bancoId}`
                });
            }
        }
        catch (error) {
            console.error('Error al convertir bancoId a número:', error);
            return res.status(400).json({
                error: 'ID de banco inválido',
                details: `Error al procesar el ID del banco: ${bancoId}`
            });
        }
        /* Comentamos la validación del banco ya que no tenemos esos datos
        // Verificar si el banco existe
        const banco = await prisma.$queryRaw`SELECT * FROM "Banco" WHERE id = ${bancoIdNumber}`;
        console.log('Resultado de búsqueda de banco:', banco);
    
        if (!banco || (Array.isArray(banco) && banco.length === 0)) {
          return res.status(404).json({ error: 'Banco no encontrado' });
        }
        */
        // Asegurarse de que cuentaBancariaId sea un número
        let cuentaIdNumber;
        try {
            cuentaIdNumber = parseInt(cuentaBancariaId, 10);
            if (isNaN(cuentaIdNumber)) {
                return res.status(400).json({
                    error: 'ID de cuenta bancaria inválido',
                    details: `El ID de la cuenta bancaria debe ser un número. Valor recibido: ${cuentaBancariaId}`
                });
            }
        }
        catch (error) {
            console.error('Error al convertir cuentaBancariaId a número:', error);
            return res.status(400).json({
                error: 'ID de cuenta bancaria inválido',
                details: `Error al procesar el ID de la cuenta bancaria: ${cuentaBancariaId}`
            });
        }
        // Verificar si la cuenta bancaria existe
        const cuenta = yield db_1.prisma.$queryRaw `SELECT * FROM "CuentaBancaria" WHERE id = ${cuentaIdNumber}`;
        console.log('Resultado de búsqueda de cuenta bancaria:', cuenta);
        if (!cuenta || (Array.isArray(cuenta) && cuenta.length === 0)) {
            return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
        }
        // Verificar si ya existe un depósito con ese número de boleta
        const depositoExistente = yield db_1.prisma.$queryRaw `SELECT * FROM "DepositoBancario" WHERE "numeroBoleta" = ${numeroBoleta}`;
        if (depositoExistente && Array.isArray(depositoExistente) && depositoExistente.length > 0) {
            return res.status(400).json({
                error: 'Número de boleta duplicado',
                details: 'Ya existe un depósito con ese número de boleta'
            });
        }
        // Procesar el archivo si existe
        let rutaComprobante = null;
        if (req.file) {
            const extension = path.extname(req.file.originalname).toLowerCase();
            const nombreArchivo = `deposito_${Date.now()}${extension}`;
            rutaComprobante = path.join('comprobantes', nombreArchivo);
            // Crear directorio si no existe
            if (!fs.existsSync(UPLOADS_DIR)) {
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            }
            // Guardar el archivo
            fs.writeFileSync(path.join(UPLOADS_DIR, nombreArchivo), req.file.buffer);
        }
        // Obtener el ID del usuario desde el token (asumiendo que está en req.user)
        let usuarioId = req.usuarioId || ((_a = req.usuario) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || null;
        // SOLUCIÓN TEMPORAL: Si no hay usuario autenticado, usar el ID 1 (administrador)
        // Esta es una solución provisional mientras se resuelve el problema de autenticación
        if (!usuarioId) {
            console.warn('⚠️ ADVERTENCIA: Usuario no autenticado. Usando ID de usuario predeterminado (1) para pruebas.');
            usuarioId = 1;
        }
        /* Comentamos esta validación temporalmente
        // Verificar que usuarioId no sea null
        if (!usuarioId) {
          console.error('Error: No se pudo obtener el ID del usuario autenticado');
          return res.status(400).json({
            error: 'Usuario no autenticado',
            details: 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.'
          });
        }
        */
        // Insertar el depósito bancario usando la sintaxis correcta de plantilla etiquetada
        const nuevoDeposito = yield db_1.prisma.$queryRaw `
      INSERT INTO "DepositoBancario" (
        id, 
        "numeroBoleta", 
        monto, 
        fecha, 
        observacion, 
        "rutaComprobante", 
        "cuentaBancariaId", 
        "usuarioId", 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(), 
        ${numeroBoleta}, 
        ${parseFloat(monto)}, 
        NOW(), 
        ${observacion || null}, 
        ${rutaComprobante}, 
        ${cuentaIdNumber},
        ${usuarioId}, 
        NOW(), 
        NOW()
      )
      RETURNING *
    `;
        const depositoObj = Array.isArray(nuevoDeposito) ? nuevoDeposito[0] : nuevoDeposito;
        // Registrar el movimiento en la tabla caja_mayor_movimientos
        try {
            // Mapear moneda según el formato esperado por la tabla caja_mayor_movimientos
            const monedaMovimiento = cuenta[0].moneda === 'PYG' ? 'guaranies'
                : cuenta[0].moneda === 'USD' ? 'dolares'
                    : 'reales';
            // Buscar el último movimiento para obtener el saldo anterior
            const ultimoMovimiento = yield db_1.prisma.$queryRaw `
        SELECT * FROM "caja_mayor_movimientos"
        WHERE moneda = ${monedaMovimiento}
        ORDER BY id DESC
        LIMIT 1
      `;
            const saldoAnterior = ultimoMovimiento && Array.isArray(ultimoMovimiento) && ultimoMovimiento.length > 0
                ? parseFloat(ultimoMovimiento[0].saldoActual.toString())
                : 0;
            const montoDeposito = parseFloat(monto);
            const saldoActual = saldoAnterior - montoDeposito; // Un depósito bancario es un egreso de caja
            // Concepto del movimiento
            const numeroCuenta = cuenta[0].numeroCuenta || '';
            const conceptoMovimiento = `Depósito bancario - ${numeroBoleta} - ${numeroCuenta}`;
            const depositoId = depositoObj.id;
            // Registrar el movimiento de caja usando una consulta SQL nativa pero con valores seguros
            console.log('Valores para inserción en caja_mayor_movimientos:', {
                depositoId,
                monedaMovimiento,
                montoDeposito,
                saldoAnterior,
                saldoActual,
                conceptoMovimiento,
                usuarioId
            });
            yield db_1.prisma.$executeRaw `
        INSERT INTO "caja_mayor_movimientos" (
          "fechaHora",
          tipo,
          "operacionId",
          moneda,
          monto,
          "esIngreso",
          "saldoAnterior",
          "saldoActual",
          concepto,
          "usuarioId",
          "depositoId",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          NOW(),
          'Depósito Bancario',
          ${depositoId},
          ${monedaMovimiento},
          ${montoDeposito},
          false,
          ${saldoAnterior},
          ${saldoActual},
          ${conceptoMovimiento},
          ${usuarioId},
          ${depositoId},
          NOW(),
          NOW()
        )
      `;
            console.log('✅ Movimiento de caja registrado correctamente para el depósito bancario');
        }
        catch (errorMovimiento) {
            console.error('❌ Error al registrar movimiento en caja_mayor_movimientos:', errorMovimiento);
            // No revertimos la creación del depósito, solo registramos el error
        }
        return res.status(201).json(depositoObj);
    }
    catch (error) {
        console.error('Error al crear depósito bancario:', error);
        return res.status(500).json({ error: 'Error al crear depósito bancario' });
    }
});
exports.createDepositoBancario = createDepositoBancario;
/**
 * Actualizar un depósito bancario existente (Número de Boleta y/o Comprobante)
 */
const updateDepositoBancario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { numeroBoleta, movimientoId } = req.body;
    const file = req.file;
    console.log(`Actualizando depósito ID: ${id}`);
    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', file ? file.originalname : 'Ninguno');
    if (!numeroBoleta || numeroBoleta.trim() === '') {
        return res.status(400).json({ error: 'El número de boleta es requerido' });
    }
    try {
        // Usar transacción para asegurar consistencia entre tablas
        const depositoActualizado = yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const depositoActual = yield tx.depositoBancario.findUnique({
                where: { id },
                include: { cuentaBancaria: true }
            });
            if (!depositoActual) {
                throw new Error('Depósito bancario no encontrado');
            }
            if ((_a = depositoActual.observacion) === null || _a === void 0 ? void 0 : _a.includes('CANCELADO')) {
                throw new Error('No se puede editar un depósito cancelado.');
            }
            if (numeroBoleta.trim() !== depositoActual.numeroBoleta) {
                const depositoExistente = yield tx.depositoBancario.findFirst({
                    where: {
                        numeroBoleta: numeroBoleta.trim(),
                        id: { not: id }
                    }
                });
                if (depositoExistente) {
                    throw new Error('Ya existe otro depósito con ese número de boleta');
                }
            }
            let rutaComprobante = depositoActual.rutaComprobante;
            if (file) {
                if (rutaComprobante) {
                    const rutaAnteriorAbsoluta = path.join(UPLOADS_DIR, path.basename(rutaComprobante));
                    if (fs.existsSync(rutaAnteriorAbsoluta)) {
                        try {
                            fs.unlinkSync(rutaAnteriorAbsoluta);
                            console.log(`Archivo anterior eliminado: ${rutaAnteriorAbsoluta}`);
                        }
                        catch (unlinkError) {
                            console.error('Error al eliminar archivo anterior:', unlinkError);
                        }
                    }
                }
                const extension = path.extname(file.originalname).toLowerCase();
                const nombreArchivo = `deposito_${id}_${Date.now()}${extension}`;
                const nuevaRutaAbsoluta = path.join(UPLOADS_DIR, nombreArchivo);
                rutaComprobante = path.join('comprobantes', nombreArchivo);
                if (!fs.existsSync(UPLOADS_DIR)) {
                    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
                }
                fs.writeFileSync(nuevaRutaAbsoluta, file.buffer);
                console.log(`Nuevo comprobante guardado: ${nuevaRutaAbsoluta}`);
                console.log(`Ruta guardada en DB: ${rutaComprobante}`);
            }
            const updateData = {
                numeroBoleta: numeroBoleta.trim(),
                rutaComprobante: rutaComprobante,
                updatedAt: new Date()
            };
            const updatedDeposito = yield tx.depositoBancario.update({
                where: { id },
                data: updateData
            });
            if (movimientoId) {
                const movId = parseInt(movimientoId, 10);
                if (!isNaN(movId)) {
                    try {
                        const movimientoOriginal = yield tx.cajaMayorMovimiento.findFirst({
                            where: {
                                id: movId,
                                depositoId: id
                            }
                        });
                        if (movimientoOriginal) {
                            const numeroCuenta = ((_b = depositoActual.cuentaBancaria) === null || _b === void 0 ? void 0 : _b.numeroCuenta) || '';
                            const nuevoConcepto = `Depósito bancario - ${numeroBoleta.trim()} - ${numeroCuenta}`;
                            yield tx.cajaMayorMovimiento.update({
                                where: { id: movimientoOriginal.id },
                                data: {
                                    concepto: nuevoConcepto,
                                    updatedAt: new Date()
                                }
                            });
                            console.log(`Movimiento de caja ${movimientoOriginal.id} actualizado con nuevo concepto.`);
                        }
                        else {
                            console.warn(`No se encontró movimiento de caja original con ID ${movId} y depositoId ${id} para actualizar.`);
                        }
                    }
                    catch (errorMovimiento) {
                        console.error('Error al actualizar caja_mayor_movimientos:', errorMovimiento);
                        throw new Error('Error al actualizar el movimiento de caja asociado.');
                    }
                }
                else {
                    console.warn(`ID de movimiento (${movimientoId}) inválido, no se actualizará caja_mayor_movimientos.`);
                }
            }
            return updatedDeposito;
        }));
        return res.status(200).json(depositoActualizado);
    }
    catch (error) {
        console.error('Error al actualizar depósito bancario:', error);
        if (file && error.message !== 'Depósito bancario no encontrado' && error.message !== 'No se puede editar un depósito cancelado.' && error.message !== 'Ya existe otro depósito con ese número de boleta') {
            const extension = path.extname(file.originalname).toLowerCase();
            const nombreArchivo = `deposito_${id}_${Date.now()}${extension}`;
            const rutaArchivoFallido = path.join(UPLOADS_DIR, path.basename(path.join('comprobantes', nombreArchivo)));
            if (fs.existsSync(rutaArchivoFallido)) {
                try {
                    fs.unlinkSync(rutaArchivoFallido);
                    console.log(`Archivo subido ${nombreArchivo} eliminado debido a error en transacción.`);
                }
                catch (unlinkErr) {
                    console.error(`Error al intentar eliminar archivo ${nombreArchivo} tras error:`, unlinkErr);
                }
            }
        }
        if (error.message === 'Depósito bancario no encontrado' || error.message === 'No se puede editar un depósito cancelado.') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Ya existe otro depósito con ese número de boleta') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Error interno al actualizar el depósito bancario', detalles: error.message });
    }
});
exports.updateDepositoBancario = updateDepositoBancario;
/**
 * Eliminar un depósito bancario
 */
const deleteDepositoBancario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Verificar si el depósito existe
        const deposito = yield db_1.prisma.$queryRaw `SELECT * FROM "DepositoBancario" WHERE id = ${id}`;
        if (!deposito || (Array.isArray(deposito) && deposito.length === 0)) {
            return res.status(404).json({ error: 'Depósito bancario no encontrado' });
        }
        const depositoActual = Array.isArray(deposito) ? deposito[0] : deposito;
        // Si hay un comprobante, eliminar el archivo
        if (depositoActual.rutaComprobante) {
            const rutaArchivo = path.join(UPLOADS_DIR, path.basename(depositoActual.rutaComprobante));
            if (fs.existsSync(rutaArchivo)) {
                fs.unlinkSync(rutaArchivo);
            }
        }
        // Eliminar el depósito
        yield db_1.prisma.$queryRaw `DELETE FROM "DepositoBancario" WHERE id = ${id}`;
        return res.status(200).json({ message: 'Depósito bancario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar depósito bancario:', error);
        return res.status(500).json({ error: 'Error al eliminar depósito bancario' });
    }
});
exports.deleteDepositoBancario = deleteDepositoBancario;
/**
 * Cancelar un depósito bancario (marcar como cancelado en la observación)
 */
const cancelarDepositoBancario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { movimientoId, razon } = req.body;
        // Verificar si el depósito existe
        const deposito = yield db_1.prisma.$queryRaw `SELECT * FROM "DepositoBancario" WHERE id = ${id}`;
        if (!deposito || (Array.isArray(deposito) && deposito.length === 0)) {
            return res.status(404).json({ error: 'Depósito bancario no encontrado' });
        }
        const depositoActual = Array.isArray(deposito) ? deposito[0] : deposito;
        // Verificar si ya está cancelado comprobando si la observación contiene "CANCELADO"
        const observacionActual = depositoActual.observacion || '';
        if (observacionActual.includes('CANCELADO')) {
            return res.status(400).json({ error: 'Este depósito ya ha sido cancelado previamente' });
        }
        // Actualizar la observación para marcar como cancelado
        const nuevaObservacion = `${observacionActual}${observacionActual ? ' | ' : ''}CANCELADO: ${razon}`;
        // Obtener el ID del usuario desde el token
        let usuarioId = req.usuarioId || ((_a = req.usuario) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || 1;
        // Transacción para cancelar el depósito y crear el movimiento inverso
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Actualizar la observación del depósito para marcarlo como cancelado
            yield tx.$executeRaw `
        UPDATE "DepositoBancario" 
        SET 
          observacion = ${nuevaObservacion},
          "updatedAt" = NOW()
        WHERE id = ${id}
      `;
            // 2. Si existe el ID de movimiento, crear un movimiento inverso en caja_mayor_movimientos
            if (movimientoId) {
                // Obtener el movimiento original
                const movimientoOriginal = yield tx.$queryRaw `
          SELECT * FROM "caja_mayor_movimientos" WHERE id = ${movimientoId}
        `;
                if (movimientoOriginal && Array.isArray(movimientoOriginal) && movimientoOriginal.length > 0) {
                    const mov = movimientoOriginal[0];
                    // Crear movimiento inverso (con monto negativo)
                    yield tx.$executeRaw `
            INSERT INTO "caja_mayor_movimientos" (
              "fechaHora",
              "tipo",
              "monto",
              "moneda",
              "concepto",
              "operacionId",
              "esIngreso",
              "saldoAnterior",
              "saldoActual",
              "usuarioId",
              "depositoId",
              "createdAt",
              "updatedAt"
            ) VALUES (
              NOW(),
              'Cancelación depósito',
              ${-Math.abs(parseFloat(mov.monto))},
              ${mov.moneda || 'guaranies'},
              ${`Cancelación del depósito ID: ${id}. Motivo: ${razon}`},
              ${mov.id},
              false,
              ${parseFloat(mov.saldoActual) || 0},
              ${(parseFloat(mov.saldoActual) || 0) - Math.abs(parseFloat(mov.monto))},
              ${usuarioId},
              ${id},
              NOW(),
              NOW()
            )
          `;
                }
            }
        }));
        return res.status(200).json({
            mensaje: 'Depósito bancario cancelado correctamente',
            depositoId: id
        });
    }
    catch (error) {
        console.error('Error al cancelar depósito bancario:', error);
        return res.status(500).json({
            error: 'Error al cancelar depósito bancario',
            detalles: error.message
        });
    }
});
exports.cancelarDepositoBancario = cancelarDepositoBancario;
/**
 * Obtener un depósito bancario por ID de movimiento
 */
const getDepositoBancarioPorMovimiento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { movimientoId } = req.params;
        if (!movimientoId || isNaN(parseInt(movimientoId))) {
            return res.status(400).json({ error: 'ID de movimiento no válido' });
        }
        // Primero obtenemos el depositoId desde caja_mayor_movimientos
        const movimiento = yield db_1.prisma.cajaMayorMovimiento.findUnique({
            where: {
                id: parseInt(movimientoId)
            },
            select: {
                depositoId: true,
                tipo: true
            }
        });
        // Verificar si el movimiento existe
        if (!movimiento) {
            return res.status(404).json({ error: 'No se encontró el movimiento especificado' });
        }
        // Verificar si es un movimiento de tipo depósito
        if (!movimiento.depositoId) {
            // Si el tipo contiene "depósito" pero no tiene depositoId
            if (movimiento.tipo && movimiento.tipo.toLowerCase().includes('depósito')) {
                return res.status(404).json({
                    error: 'Este movimiento corresponde a un depósito, pero no tiene enlace con la tabla de depósitos'
                });
            }
            // Si es otro tipo de movimiento
            return res.status(404).json({
                error: 'Este movimiento no está asociado a un depósito bancario'
            });
        }
        // Ahora consultamos el depósito con el id obtenido
        const deposito = yield db_1.prisma.depositoBancario.findUnique({
            where: {
                id: movimiento.depositoId
            },
            include: {
                banco: {
                    select: {
                        id: true,
                        nombre: true
                    }
                },
                cuentaBancaria: {
                    select: {
                        id: true,
                        moneda: true,
                        numeroCuenta: true,
                        tipo: true,
                        banco: true
                    }
                },
                usuario: {
                    select: {
                        nombre: true,
                        username: true
                    }
                }
            }
        });
        if (!deposito) {
            return res.status(404).json({ error: 'Depósito bancario no encontrado para este movimiento' });
        }
        // Formatear la respuesta
        const depositoFormateado = Object.assign(Object.assign({}, deposito), { bancoNombre: ((_a = deposito.cuentaBancaria) === null || _a === void 0 ? void 0 : _a.banco) || ((_b = deposito.banco) === null || _b === void 0 ? void 0 : _b.nombre), cuentaMoneda: (_c = deposito.cuentaBancaria) === null || _c === void 0 ? void 0 : _c.moneda, numeroCuenta: (_d = deposito.cuentaBancaria) === null || _d === void 0 ? void 0 : _d.numeroCuenta, tipoCuenta: (_e = deposito.cuentaBancaria) === null || _e === void 0 ? void 0 : _e.tipo, usuarioNombre: (_f = deposito.usuario) === null || _f === void 0 ? void 0 : _f.nombre, usuarioUsername: (_g = deposito.usuario) === null || _g === void 0 ? void 0 : _g.username });
        return res.status(200).json(depositoFormateado);
    }
    catch (error) {
        console.error('Error al obtener depósito bancario por movimiento:', error);
        return res.status(500).json({ error: 'Error al obtener depósito bancario por movimiento' });
    }
});
exports.getDepositoBancarioPorMovimiento = getDepositoBancarioPorMovimiento;
//# sourceMappingURL=deposito-bancario.controller.js.map
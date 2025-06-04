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
exports.deleteOperacionBancaria = exports.updateOperacionBancaria = exports.createOperacionBancaria = exports.getOperacionBancariaById = exports.getOperacionesBancariasByCajaId = exports.getAllOperacionesBancarias = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
// Directorio para guardar comprobantes
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads/comprobantes');
// Asegurar que el directorio existe
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Esquema para validar la creación de una operación bancaria
const OperacionBancariaCreateSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['pos', 'transferencia'], {
        errorMap: () => ({ message: 'El tipo debe ser pos o transferencia' })
    }),
    monto: zod_1.z.number({
        required_error: 'El monto es requerido',
        invalid_type_error: 'El monto debe ser un número'
    }).positive('El monto debe ser mayor a cero'),
    montoACobrar: zod_1.z.number().positive('El monto a cobrar debe ser mayor a cero').optional(),
    tipoServicio: zod_1.z.string().min(1, 'El tipo de servicio es requerido'),
    codigoBarrasPos: zod_1.z.string().optional(),
    posDescripcion: zod_1.z.string().optional(),
    numeroComprobante: zod_1.z.string().optional(),
    cuentaBancariaId: zod_1.z.number().optional(),
    cajaId: zod_1.z.string({
        required_error: 'El ID de la caja es requerido'
    }),
    crearMovimientoFarmacia: zod_1.z.boolean().optional(),
    // Nuevos campos para manejo de monedas
    posMoneda: zod_1.z.enum(['PYG', 'USD', 'BRL']).optional(),
    montoOriginalEnMonedaPOS: zod_1.z.number().optional()
});
// Esquema para validar la actualización de una operación bancaria
const OperacionBancariaUpdateSchema = OperacionBancariaCreateSchema.partial();
// Extender el OperacionBancariaUpdateSchema para incluir crearMovimientoFarmacia
const OperacionBancariaUpdateWithFarmaciaSchema = OperacionBancariaUpdateSchema.extend({
    crearMovimientoFarmacia: zod_1.z.boolean().optional()
});
/**
 * Obtener todas las operaciones bancarias
 */
const getAllOperacionesBancarias = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const operaciones = yield prisma.operacionBancaria.findMany({
            include: {
                cuentaBancaria: true,
                caja: {
                    select: {
                        id: true,
                        estado: true,
                        fechaApertura: true,
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                username: true
                            }
                        },
                        sucursal: {
                            select: {
                                id: true,
                                nombre: true,
                                codigo: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        return res.status(200).json(operaciones);
    }
    catch (error) {
        console.error('Error al obtener operaciones bancarias:', error);
        return res.status(500).json({ error: 'Error al obtener operaciones bancarias' });
    }
});
exports.getAllOperacionesBancarias = getAllOperacionesBancarias;
/**
 * Obtener operaciones bancarias por ID de caja
 */
const getOperacionesBancariasByCajaId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cajaId } = req.params;
        if (!cajaId) {
            return res.status(400).json({ error: 'ID de caja requerido' });
        }
        const operaciones = yield prisma.operacionBancaria.findMany({
            where: {
                cajaId
            },
            include: {
                cuentaBancaria: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        return res.status(200).json(operaciones);
    }
    catch (error) {
        console.error(`Error al obtener operaciones bancarias para caja ${req.params.cajaId}:`, error);
        return res.status(500).json({ error: 'Error al obtener operaciones bancarias' });
    }
});
exports.getOperacionesBancariasByCajaId = getOperacionesBancariasByCajaId;
/**
 * Obtener una operación bancaria por ID
 */
const getOperacionBancariaById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID requerido' });
        }
        const operacion = yield prisma.operacionBancaria.findUnique({
            where: {
                id
            },
            include: {
                cuentaBancaria: true,
                caja: {
                    select: {
                        id: true,
                        estado: true,
                        fechaApertura: true,
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                username: true
                            }
                        },
                        sucursal: {
                            select: {
                                id: true,
                                nombre: true,
                                codigo: true
                            }
                        }
                    }
                }
            }
        });
        if (!operacion) {
            return res.status(404).json({ error: 'Operación bancaria no encontrada' });
        }
        return res.status(200).json(operacion);
    }
    catch (error) {
        console.error(`Error al obtener operación bancaria ${req.params.id}:`, error);
        return res.status(500).json({ error: 'Error al obtener operación bancaria' });
    }
});
exports.getOperacionBancariaById = getOperacionBancariaById;
/**
 * Crear una nueva operación bancaria
 */
const createOperacionBancaria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Creando operación bancaria...');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    let rutaComprobante = null; // Declarar al inicio para estar disponible en catch
    try {
        // Extraer datos según cómo se envían (FormData o JSON)
        let operacionData;
        // Comprobar si los datos vienen en el campo 'data' (FormData)
        if (req.body.data) {
            console.log('Procesando datos del campo data en FormData');
            try {
                operacionData = JSON.parse(req.body.data);
                console.log('Datos parseados del FormData:', operacionData);
            }
            catch (e) {
                console.error('Error al parsear JSON del campo data:', e);
                return res.status(400).json({ error: 'Datos JSON inválidos en el campo data' });
            }
        }
        else {
            // Si no viene con un campo data, los datos están directamente en req.body
            console.log('Procesando datos JSON directamente del body');
            operacionData = req.body;
        }
        // Convertir strings numéricos a números para la validación
        if (typeof operacionData.monto === 'string') {
            operacionData.monto = parseFloat(operacionData.monto);
        }
        if (typeof operacionData.montoACobrar === 'string') {
            operacionData.montoACobrar = parseFloat(operacionData.montoACobrar);
        }
        if (typeof operacionData.cuentaBancariaId === 'string') {
            operacionData.cuentaBancariaId = parseInt(operacionData.cuentaBancariaId);
        }
        // Validar datos
        console.log('Validando datos...');
        const validationResult = OperacionBancariaCreateSchema.safeParse(operacionData);
        if (!validationResult.success) {
            console.error('Error de validación:', validationResult.error.errors);
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        console.log('Datos validados:', data);
        // Verificar que la caja existe
        console.log(`Verificando caja con ID ${data.cajaId}...`);
        const caja = yield prisma.caja.findUnique({
            where: { id: data.cajaId },
            select: { id: true, estado: true }
        });
        if (!caja) {
            console.error(`Caja con ID ${data.cajaId} no encontrada`);
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        console.log('Caja encontrada:', caja);
        // Si es una transferencia, verificar que la cuenta bancaria existe
        if (data.tipo === 'transferencia' && data.cuentaBancariaId) {
            console.log(`Verificando cuenta bancaria con ID ${data.cuentaBancariaId}...`);
            const cuentaBancaria = yield prisma.cuentaBancaria.findUnique({
                where: { id: data.cuentaBancariaId }
            });
            if (!cuentaBancaria) {
                console.error(`Cuenta bancaria con ID ${data.cuentaBancariaId} no encontrada`);
                return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
            }
            console.log('Cuenta bancaria encontrada:', cuentaBancaria);
        }
        // Procesar archivo si existe
        if (req.file) {
            try {
                console.log('Procesando archivo adjunto...');
                // Generar nombre único para el archivo
                const extension = req.file.originalname.split('.').pop();
                const nombreArchivo = `${(0, uuid_1.v4)()}.${extension}`;
                const rutaCompleta = path_1.default.join(UPLOADS_DIR, nombreArchivo);
                console.log(`Guardando archivo en ${rutaCompleta}...`);
                // Guardar archivo
                fs_1.default.writeFileSync(rutaCompleta, req.file.buffer);
                // Guardar ruta relativa para acceso desde API
                rutaComprobante = `/uploads/comprobantes/${nombreArchivo}`;
                console.log(`Archivo guardado con éxito. Ruta relativa: ${rutaComprobante}`);
            }
            catch (error) {
                console.error('Error al procesar archivo:', error);
                return res.status(500).json({ error: 'Error al procesar el archivo adjunto' });
            }
        }
        // Usar transacción para garantizar consistencia entre operación bancaria y movimiento de farmacia
        const resultado = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // Paso 1: Crear la operación bancaria
            console.log('Creando operación bancaria en la base de datos...');
            const nuevaOperacion = yield tx.operacionBancaria.create({
                data: {
                    tipo: data.tipo,
                    monto: data.monto,
                    montoACobrar: data.montoACobrar,
                    tipoServicio: data.tipoServicio,
                    codigoBarrasPos: data.codigoBarrasPos,
                    posDescripcion: data.posDescripcion,
                    numeroComprobante: data.numeroComprobante,
                    cuentaBancariaId: data.cuentaBancariaId,
                    cajaId: data.cajaId,
                    rutaComprobante
                },
                include: {
                    cuentaBancaria: true
                }
            });
            // Paso 2: Crear movimiento de farmacia si se requiere
            if (data.crearMovimientoFarmacia === true) {
                console.log('Creando movimiento de farmacia correspondiente...');
                // Determinar la moneda y el monto según el tipo de operación
                let monedaMovimiento = 'PYG';
                let montoMovimiento = data.montoACobrar || data.monto || 0;
                let conceptoMovimiento = '';
                if (data.tipo === 'pos' && data.posMoneda && data.montoOriginalEnMonedaPOS) {
                    // Para operaciones POS con moneda diferente a PYG, usar la moneda del POS
                    monedaMovimiento = data.posMoneda;
                    // Calcular el monto con comisión en la moneda original del POS
                    montoMovimiento = data.montoOriginalEnMonedaPOS * 1.06;
                    console.log(`POS en moneda ${monedaMovimiento}: monto original ${data.montoOriginalEnMonedaPOS}, con comisión: ${montoMovimiento}`);
                }
                else {
                    // Para transferencias o POS en guaraníes, usar guaraníes
                    monedaMovimiento = 'PYG';
                    montoMovimiento = data.montoACobrar || data.monto || 0;
                    console.log(`Operación en guaraníes: monto ${montoMovimiento}`);
                }
                // Construir concepto descriptivo según el tipo de operación
                if (data.tipo === 'pos') {
                    // Para POS: buscar el nombre del dispositivo por código de barras
                    let nombrePOS = 'POS Desconocido';
                    if (data.codigoBarrasPos) {
                        try {
                            const dispositivoPOS = yield tx.dispositivoPos.findUnique({
                                where: { codigoBarras: data.codigoBarrasPos },
                                select: { nombre: true }
                            });
                            if (dispositivoPOS) {
                                nombrePOS = dispositivoPOS.nombre;
                            }
                        }
                        catch (error) {
                            console.error('Error al buscar nombre del POS:', error);
                        }
                    }
                    conceptoMovimiento = `POS ${nombrePOS} - ${data.tipoServicio}`;
                }
                else if (data.tipo === 'transferencia') {
                    // Para transferencias: usar información de la cuenta bancaria
                    let infoCuentaBancaria = 'Cuenta Desconocida';
                    if (data.cuentaBancariaId) {
                        try {
                            const cuentaBancaria = yield tx.cuentaBancaria.findUnique({
                                where: { id: data.cuentaBancariaId },
                                select: { banco: true, numeroCuenta: true }
                            });
                            if (cuentaBancaria) {
                                infoCuentaBancaria = `${cuentaBancaria.banco} ${cuentaBancaria.numeroCuenta}`;
                            }
                        }
                        catch (error) {
                            console.error('Error al buscar información de cuenta bancaria:', error);
                        }
                    }
                    conceptoMovimiento = `Transferencia ${infoCuentaBancaria} - ${data.tipoServicio}`;
                }
                else {
                    // Fallback para otros tipos
                    conceptoMovimiento = `Operación Bancaria: ${data.tipo} - ${data.tipoServicio}`;
                }
                // El monto se almacena como negativo para representar un EGRESO
                const montoNegativo = new library_1.Decimal(montoMovimiento).negated();
                // Crear el movimiento de farmacia dentro de la transacción
                yield tx.movimientoFarmacia.create({
                    data: Object.assign({ fechaHora: new Date(), tipoMovimiento: 'EGRESO', concepto: conceptoMovimiento, movimientoOrigenId: parseInt(nuevaOperacion.id), movimientoOrigenTipo: 'OPERACION_BANCARIA', monto: montoNegativo, monedaCodigo: monedaMovimiento, estado: `OPERACION_BANCARIA:${nuevaOperacion.id}` }, (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) ? { usuarioId: req.user.id } : {}))
                });
                console.log(`Movimiento de farmacia creado con éxito - Concepto: "${conceptoMovimiento}", Moneda: ${monedaMovimiento}, Monto: ${montoNegativo}`);
            }
            return nuevaOperacion;
        }));
        console.log('Operación bancaria creada con éxito:', resultado);
        return res.status(201).json(resultado);
    }
    catch (error) {
        console.error('Error al crear operación bancaria:', error);
        // Si hay un archivo que se guardó y ocurrió un error en la transacción, eliminarlo
        if (rutaComprobante) {
            try {
                const rutaCompleta = path_1.default.join(UPLOADS_DIR, path_1.default.basename(rutaComprobante));
                if (fs_1.default.existsSync(rutaCompleta)) {
                    fs_1.default.unlinkSync(rutaCompleta);
                    console.log('Archivo eliminado debido al error en la transacción');
                }
            }
            catch (fileError) {
                console.error('Error al eliminar archivo tras fallo en transacción:', fileError);
            }
        }
        return res.status(500).json({ error: 'Error al crear operación bancaria' });
    }
});
exports.createOperacionBancaria = createOperacionBancaria;
/**
 * Actualizar una operación bancaria existente
 */
const updateOperacionBancaria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Actualizando operación bancaria...');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Params:', req.params);
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID requerido' });
        }
        // Verificar si la operación existe
        const operacionExistente = yield prisma.operacionBancaria.findUnique({
            where: { id },
            select: { id: true, rutaComprobante: true }
        });
        if (!operacionExistente) {
            return res.status(404).json({ error: 'Operación bancaria no encontrada' });
        }
        // Extraer datos según cómo se envían (FormData o JSON)
        let operacionData;
        // Comprobar si los datos vienen en el campo 'data' (FormData)
        if (req.body.data) {
            console.log('Procesando datos del campo data en FormData');
            try {
                operacionData = JSON.parse(req.body.data);
                console.log('Datos parseados del FormData:', operacionData);
            }
            catch (e) {
                console.error('Error al parsear JSON del campo data:', e);
                return res.status(400).json({ error: 'Datos JSON inválidos en el campo data' });
            }
        }
        else {
            // Si no viene con un campo data, los datos están directamente en req.body
            console.log('Procesando datos JSON directamente del body');
            operacionData = req.body;
        }
        // Convertir strings numéricos a números para la validación
        if (typeof operacionData.monto === 'string') {
            operacionData.monto = parseFloat(operacionData.monto);
        }
        if (typeof operacionData.montoACobrar === 'string') {
            operacionData.montoACobrar = parseFloat(operacionData.montoACobrar);
        }
        if (typeof operacionData.cuentaBancariaId === 'string') {
            operacionData.cuentaBancariaId = parseInt(operacionData.cuentaBancariaId);
        }
        // Validar datos
        console.log('Validando datos...');
        const validationResult = OperacionBancariaUpdateSchema.safeParse(operacionData);
        if (!validationResult.success) {
            console.error('Error de validación:', validationResult.error.errors);
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        console.log('Datos validados:', data);
        // Si hay cajaId, verificar que la caja existe
        if (data.cajaId) {
            console.log(`Verificando caja con ID ${data.cajaId}...`);
            const caja = yield prisma.caja.findUnique({
                where: { id: data.cajaId },
                select: { id: true }
            });
            if (!caja) {
                console.error(`Caja con ID ${data.cajaId} no encontrada`);
                return res.status(404).json({ error: 'Caja no encontrada' });
            }
            console.log('Caja encontrada:', caja);
        }
        // Si es una transferencia y hay cuentaBancariaId, verificar que la cuenta bancaria existe
        if (data.tipo === 'transferencia' && data.cuentaBancariaId) {
            console.log(`Verificando cuenta bancaria con ID ${data.cuentaBancariaId}...`);
            const cuentaBancaria = yield prisma.cuentaBancaria.findUnique({
                where: { id: data.cuentaBancariaId }
            });
            if (!cuentaBancaria) {
                console.error(`Cuenta bancaria con ID ${data.cuentaBancariaId} no encontrada`);
                return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
            }
            console.log('Cuenta bancaria encontrada:', cuentaBancaria);
        }
        // Procesar archivo si existe
        let rutaComprobante = operacionExistente.rutaComprobante;
        if (req.file) {
            try {
                console.log('Procesando nuevo archivo adjunto...');
                // Si ya existía un archivo anterior, eliminarlo
                if (operacionExistente.rutaComprobante) {
                    const rutaAnterior = path_1.default.join(__dirname, '../../', operacionExistente.rutaComprobante.replace('/', ''));
                    console.log(`Intentando eliminar archivo anterior en ${rutaAnterior}...`);
                    if (fs_1.default.existsSync(rutaAnterior)) {
                        fs_1.default.unlinkSync(rutaAnterior);
                        console.log('Archivo anterior eliminado con éxito');
                    }
                    else {
                        console.log('Archivo anterior no encontrado, continuando...');
                    }
                }
                // Generar nombre único para el archivo
                const extension = req.file.originalname.split('.').pop();
                const nombreArchivo = `${(0, uuid_1.v4)()}.${extension}`;
                const rutaCompleta = path_1.default.join(UPLOADS_DIR, nombreArchivo);
                console.log(`Guardando nuevo archivo en ${rutaCompleta}...`);
                // Guardar archivo
                fs_1.default.writeFileSync(rutaCompleta, req.file.buffer);
                // Guardar ruta relativa para acceso desde API
                rutaComprobante = `/uploads/comprobantes/${nombreArchivo}`;
                console.log(`Nuevo archivo guardado con éxito. Ruta relativa: ${rutaComprobante}`);
            }
            catch (error) {
                console.error('Error al procesar archivo:', error);
                return res.status(500).json({ error: 'Error al procesar el archivo adjunto' });
            }
        }
        // Actualizar la operación bancaria en la base de datos
        console.log('Actualizando operación bancaria en la base de datos...');
        // Usar transacción para garantizar consistencia entre operación bancaria y movimiento de farmacia
        const operacionActualizada = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // Paso 1: Actualizar la operación bancaria
            const operacionUpdated = yield tx.operacionBancaria.update({
                where: { id },
                data: {
                    tipo: data.tipo,
                    monto: data.monto,
                    montoACobrar: data.montoACobrar,
                    tipoServicio: data.tipoServicio,
                    codigoBarrasPos: data.codigoBarrasPos,
                    posDescripcion: data.posDescripcion,
                    numeroComprobante: data.numeroComprobante,
                    cuentaBancariaId: data.cuentaBancariaId,
                    cajaId: data.cajaId,
                    rutaComprobante
                },
                include: {
                    cuentaBancaria: true
                }
            });
            // Paso 2: Crear o actualizar movimiento de farmacia si se requiere
            if (data.crearMovimientoFarmacia === true) {
                console.log('Verificando si existe un movimiento de farmacia para esta operación...');
                // Buscar si ya existe un movimiento para esta operación
                const movimientoExistente = yield tx.movimientoFarmacia.findFirst({
                    where: {
                        OR: [
                            // Nuevo formato: buscar por estado
                            { estado: `OPERACION_BANCARIA:${id}` },
                            // Formato anterior: buscar por movimientoOrigenId (compatibilidad)
                            {
                                movimientoOrigenId: parseInt(id),
                                movimientoOrigenTipo: 'OPERACION_BANCARIA'
                            }
                        ]
                    }
                });
                // Determinar la moneda y el monto según el tipo de operación
                let monedaMovimiento = 'PYG';
                let montoMovimiento = data.montoACobrar || data.monto || 0;
                let conceptoMovimiento = '';
                if (data.tipo === 'pos' && data.posMoneda && data.montoOriginalEnMonedaPOS) {
                    // Para operaciones POS con moneda diferente a PYG, usar la moneda del POS
                    monedaMovimiento = data.posMoneda;
                    // Calcular el monto con comisión en la moneda original del POS
                    montoMovimiento = data.montoOriginalEnMonedaPOS * 1.06;
                    console.log(`POS en moneda ${monedaMovimiento}: monto original ${data.montoOriginalEnMonedaPOS}, con comisión: ${montoMovimiento}`);
                }
                else {
                    // Para transferencias o POS en guaraníes, usar guaraníes
                    monedaMovimiento = 'PYG';
                    montoMovimiento = data.montoACobrar || data.monto || 0;
                    console.log(`Operación en guaraníes: monto ${montoMovimiento}`);
                }
                // Construir concepto descriptivo según el tipo de operación
                if (data.tipo === 'pos') {
                    // Para POS: buscar el nombre del dispositivo por código de barras
                    let nombrePOS = 'POS Desconocido';
                    if (data.codigoBarrasPos) {
                        try {
                            const dispositivoPOS = yield tx.dispositivoPos.findUnique({
                                where: { codigoBarras: data.codigoBarrasPos },
                                select: { nombre: true }
                            });
                            if (dispositivoPOS) {
                                nombrePOS = dispositivoPOS.nombre;
                            }
                        }
                        catch (error) {
                            console.error('Error al buscar nombre del POS:', error);
                        }
                    }
                    conceptoMovimiento = `POS ${nombrePOS} - ${data.tipoServicio}`;
                }
                else if (data.tipo === 'transferencia') {
                    // Para transferencias: usar información de la cuenta bancaria
                    let infoCuentaBancaria = 'Cuenta Desconocida';
                    if (data.cuentaBancariaId) {
                        try {
                            const cuentaBancaria = yield tx.cuentaBancaria.findUnique({
                                where: { id: data.cuentaBancariaId },
                                select: { banco: true, numeroCuenta: true }
                            });
                            if (cuentaBancaria) {
                                infoCuentaBancaria = `${cuentaBancaria.banco} ${cuentaBancaria.numeroCuenta}`;
                            }
                        }
                        catch (error) {
                            console.error('Error al buscar información de cuenta bancaria:', error);
                        }
                    }
                    conceptoMovimiento = `Transferencia ${infoCuentaBancaria} - ${data.tipoServicio}`;
                }
                else {
                    // Fallback para otros tipos
                    conceptoMovimiento = `Operación Bancaria: ${data.tipo} - ${data.tipoServicio}`;
                }
                // El monto se almacena como negativo para representar un EGRESO
                const montoNegativo = new library_1.Decimal(montoMovimiento).negated();
                if (movimientoExistente) {
                    // Actualizar movimiento existente
                    console.log('Actualizando movimiento de farmacia existente...');
                    yield tx.movimientoFarmacia.update({
                        where: { id: movimientoExistente.id },
                        data: Object.assign({ concepto: conceptoMovimiento, monto: montoNegativo, monedaCodigo: monedaMovimiento, estado: `OPERACION_BANCARIA:${id}` }, (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) ? { usuarioId: req.user.id } : {}))
                    });
                    console.log(`Movimiento de farmacia actualizado con éxito dentro de la transacción - Concepto: "${conceptoMovimiento}", Moneda: ${monedaMovimiento}, Monto: ${montoNegativo}`);
                }
                else {
                    // Crear nuevo movimiento
                    console.log('Creando nuevo movimiento de farmacia...');
                    yield tx.movimientoFarmacia.create({
                        data: Object.assign({ fechaHora: new Date(), tipoMovimiento: 'EGRESO', concepto: conceptoMovimiento, movimientoOrigenId: parseInt(id), movimientoOrigenTipo: 'OPERACION_BANCARIA', monto: montoNegativo, monedaCodigo: monedaMovimiento, estado: `OPERACION_BANCARIA:${id}` }, (((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) ? { usuarioId: req.user.id } : {}))
                    });
                    console.log(`Movimiento de farmacia creado con éxito dentro de la transacción - Concepto: "${conceptoMovimiento}", Moneda: ${monedaMovimiento}, Monto: ${montoNegativo}`);
                }
            }
            return operacionUpdated;
        }));
        console.log('Operación bancaria actualizada con éxito:', operacionActualizada);
        return res.status(200).json(operacionActualizada);
    }
    catch (error) {
        console.error(`Error al actualizar operación bancaria ${req.params.id}:`, error);
        return res.status(500).json({ error: 'Error al actualizar operación bancaria' });
    }
});
exports.updateOperacionBancaria = updateOperacionBancaria;
/**
 * Eliminar una operación bancaria
 */
const deleteOperacionBancaria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID requerido' });
        }
        // Verificar si la operación existe y obtener su ruta de comprobante
        const operacion = yield prisma.operacionBancaria.findUnique({
            where: { id },
            select: { id: true, rutaComprobante: true }
        });
        if (!operacion) {
            return res.status(404).json({ error: 'Operación bancaria no encontrada' });
        }
        // Usar una transacción para garantizar consistencia
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Paso 1: Eliminar el movimiento en movimientos_farmacia si existe
            console.log('Buscando movimiento de farmacia relacionado...');
            const movimientoFarmacia = yield tx.movimientoFarmacia.findFirst({
                where: {
                    OR: [
                        // Nuevo formato: buscar por estado
                        { estado: `OPERACION_BANCARIA:${id}` },
                        // Formato anterior: buscar por movimientoOrigenId (compatibilidad)
                        {
                            movimientoOrigenId: parseInt(id),
                            movimientoOrigenTipo: 'OPERACION_BANCARIA'
                        }
                    ]
                }
            });
            if (movimientoFarmacia) {
                console.log(`Eliminando movimiento de farmacia con ID ${movimientoFarmacia.id}...`);
                yield tx.movimientoFarmacia.delete({
                    where: { id: movimientoFarmacia.id }
                });
                console.log('Movimiento de farmacia eliminado dentro de la transacción');
            }
            else {
                console.log('No se encontró movimiento de farmacia relacionado');
            }
            // Paso 2: Eliminar la operación bancaria
            console.log('Eliminando operación bancaria...');
            yield tx.operacionBancaria.delete({
                where: { id }
            });
            console.log('Operación bancaria eliminada dentro de la transacción');
        }));
        // Solo después de que la transacción sea exitosa, eliminar el archivo de comprobante
        if (operacion.rutaComprobante) {
            try {
                const rutaArchivo = path_1.default.join(__dirname, '../../', operacion.rutaComprobante.replace('/', ''));
                if (fs_1.default.existsSync(rutaArchivo)) {
                    fs_1.default.unlinkSync(rutaArchivo);
                    console.log(`Archivo eliminado: ${rutaArchivo}`);
                }
            }
            catch (error) {
                console.error('Error al eliminar archivo de comprobante:', error);
                // No relanzamos el error aquí porque la operación principal ya fue exitosa
            }
        }
        console.log('Operación bancaria y movimiento de farmacia eliminados con éxito');
        return res.status(204).send();
    }
    catch (error) {
        console.error(`Error al eliminar operación bancaria ${req.params.id}:`, error);
        return res.status(500).json({ error: 'Error al eliminar operación bancaria' });
    }
});
exports.deleteOperacionBancaria = deleteOperacionBancaria;
//# sourceMappingURL=operacion-bancaria.controller.js.map
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
exports.AquipagoController = exports.downloadContrato = exports.getAquipagoConfigHistory = exports.getLatestAquipagoConfig = exports.createAquipagoConfig = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
console.log('[DEBUG] Cargando controlador aquipago.controller.ts...');
const prisma = new client_1.PrismaClient();
const UPLOADS_DIR = path_1.default.join(__dirname, '../../../uploads/contratos'); // Ajusta la ruta si es necesario
// Asegurarse de que el directorio de subidas exista
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    console.log(`[DEBUG] Creando directorio de uploads en: ${UPLOADS_DIR}`);
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('[DEBUG] Directorio de uploads creado con éxito.');
}
else {
    console.log(`[DEBUG] Directorio de uploads ya existe en: ${UPLOADS_DIR}`);
}
const createAquipagoConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('[DEBUG] Ejecutando createAquipagoConfig...');
    console.log('[DEBUG] Body recibido:', req.body);
    console.log('[DEBUG] Archivo recibido:', req.file ? 'Sí' : 'No');
    const { cuentaBancariaId, limiteCredito, fechaInicioVigencia, fechaFinVigencia } = req.body;
    // @ts-ignore // Asumiendo que tienes un middleware que añade el usuario al request
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const file = req.file; // Multer añade el archivo aquí
    if (!usuarioId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    if (!cuentaBancariaId || !limiteCredito || !fechaInicioVigencia || !fechaFinVigencia) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }
    try {
        const data = {
            cuentaBancaria: { connect: { id: parseInt(cuentaBancariaId) } },
            limiteCredito: new client_1.Prisma.Decimal(limiteCredito.replace(/\./g, '')), // Eliminar puntos de miles
            fechaInicioVigencia: new Date(fechaInicioVigencia),
            fechaFinVigencia: new Date(fechaFinVigencia),
            usuario: { connect: { id: usuarioId } },
            fechaCreacion: new Date(), // Aseguramos fecha de creación
        };
        if (file) {
            data.nombreArchivoContrato = file.originalname;
            data.pathArchivoContrato = file.path; // Multer (con DiskStorage) guarda la ruta completa
        }
        const nuevaConfig = yield prisma.aquipagoConfig.create({ data });
        res.status(201).json(nuevaConfig);
    }
    catch (error) {
        console.error("Error al crear configuración Aquipago:", error);
        // Limpiar archivo subido si la transacción falla
        if (file && file.path && fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Manejar errores específicos de Prisma (ej. foreign key constraint)
            if (error.code === 'P2003' || error.code === 'P2025') {
                return res.status(400).json({ message: 'Error de referencia: La cuenta bancaria o el usuario no existen.' });
            }
        }
        res.status(500).json({ message: 'Error interno del servidor al crear la configuración.' });
    }
});
exports.createAquipagoConfig = createAquipagoConfig;
const getLatestAquipagoConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[DEBUG] Ejecutando getLatestAquipagoConfig...');
    try {
        const latestConfig = yield prisma.aquipagoConfig.findFirst({
            orderBy: {
                fechaCreacion: 'desc',
            },
            include: {
                cuentaBancaria: true,
                usuario: { select: { id: true, username: true, nombre: true } } // No enviar datos sensibles
            }
        });
        if (!latestConfig) {
            return res.status(404).json({ message: 'No se encontró configuración de Aquipago.' });
        }
        res.status(200).json(latestConfig);
    }
    catch (error) {
        console.error("Error al obtener la última configuración Aquipago:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
exports.getLatestAquipagoConfig = getLatestAquipagoConfig;
const getAquipagoConfigHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[DEBUG] Ejecutando getAquipagoConfigHistory...');
    try {
        const history = yield prisma.aquipagoConfig.findMany({
            orderBy: {
                fechaCreacion: 'desc',
            },
            include: {
                cuentaBancaria: true,
                usuario: { select: { id: true, username: true, nombre: true } }
            }
        });
        res.status(200).json(history);
    }
    catch (error) {
        console.error("Error al obtener historial de Aquipago:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
exports.getAquipagoConfigHistory = getAquipagoConfigHistory;
// Opcional: Endpoint para descargar el archivo del contrato
const downloadContrato = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[DEBUG] Ejecutando downloadContrato con id:', req.params.id);
    const { id } = req.params;
    try {
        const config = yield prisma.aquipagoConfig.findUnique({
            where: { id: parseInt(id) },
        });
        if (!config || !config.pathArchivoContrato || !config.nombreArchivoContrato) {
            return res.status(404).json({ message: 'Configuración o archivo no encontrado.' });
        }
        if (!fs_1.default.existsSync(config.pathArchivoContrato)) {
            console.error(`Archivo no encontrado en el path: ${config.pathArchivoContrato}`);
            return res.status(404).json({ message: 'Archivo físico no encontrado en el servidor.' });
        }
        // Establecer cabeceras para la descarga
        res.setHeader('Content-Disposition', `attachment; filename="${config.nombreArchivoContrato}"`);
        // Podrías querer establecer Content-Type si conoces el tipo de archivo
        // res.setHeader('Content-Type', 'application/pdf'); // Ejemplo
        const fileStream = fs_1.default.createReadStream(config.pathArchivoContrato);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error("Error al descargar el contrato:", error);
        res.status(500).json({ message: 'Error interno del servidor al descargar el archivo.' });
    }
});
exports.downloadContrato = downloadContrato;
/**
 * Controlador para gestionar las operaciones relacionadas con Aqui Pago
 */
exports.AquipagoController = {
    /**
     * Obtiene los movimientos de Aqui Pago filtrados por fecha
     * Agrupa los pagos y retiros por caja
     */
    obtenerMovimientos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const { fechaInicio, fechaFin } = req.query;
            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({ error: 'Las fechas de inicio y fin son requeridas' });
            }
            // Convertir fechas de string a Date, asegurando UTC
            const [startYear, startMonth, startDay] = fechaInicio.split('-').map(Number);
            const [endYear, endMonth, endDay] = fechaFin.split('-').map(Number);
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
            // Validar que las fechas construidas sean válidas (opcional pero bueno)
            if (isNaN(fechaInicioUTC.getTime()) || isNaN(fechaFinSiguienteUTC.getTime())) {
                return res.status(400).json({ error: 'Fechas inválidas resultantes' });
            }
            // Log de depuración de fechas para Prisma (usando las nuevas fechas UTC)
            console.log(`[DEBUG] Prisma Query - Fechas UTC: gte ${fechaInicioUTC.toISOString()} , lt ${fechaFinSiguienteUTC.toISOString()}`);
            // 1. Obtener la configuración actual de Aquipago para conocer la cuenta bancaria
            const aquipagoConfig = yield prisma.aquipagoConfig.findFirst({
                orderBy: {
                    fechaCreacion: 'desc'
                }
            });
            if (!aquipagoConfig || !aquipagoConfig.cuentaBancariaId) {
                console.warn('[WARN] No hay configuración de Aquipago disponible o no tiene cuenta bancaria asignada');
            }
            else {
                // ---> [NUEVO] Log para cuenta bancaria ID usada
                console.log(`[DEBUG] Usando cuentaBancariaId: ${aquipagoConfig.cuentaBancariaId} para buscar depósitos.`);
            }
            // 2. Obtener movimientos relacionados con Aqui Pago usando los campos correctos y fechas UTC
            const movimientos = yield prisma.movimientoCaja.findMany({
                where: {
                    fecha: {
                        gte: fechaInicioUTC, // Usar fecha UTC
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
                    caja: {
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
            // ----> [INICIO] Añadir mapeo explícito para movimientos
            const movimientosFormateados = movimientos.map(mov => {
                var _a, _b, _c, _d;
                return ({
                    id: mov.id,
                    fecha: mov.fecha.toISOString(), // Enviar como ISO string
                    // Formatear info de caja según lo esperado por el frontend
                    cajaId: mov.caja ? mov.caja.id.toString() : 'N/A',
                    numeroEntero: mov.caja ? mov.caja.cajaEnteroId : undefined,
                    sucursal: ((_b = (_a = mov.caja) === null || _a === void 0 ? void 0 : _a.sucursal) === null || _b === void 0 ? void 0 : _b.nombre) || 'N/A',
                    usuario: ((_d = (_c = mov.caja) === null || _c === void 0 ? void 0 : _c.usuario) === null || _d === void 0 ? void 0 : _d.username) || 'N/A',
                    // --- Asegurar que 'servicio' se incluye --- 
                    servicio: mov.servicio,
                    // --- Asegurar que 'monto' se incluye y es número ---
                    monto: mov.monto.toNumber(), // Convertir Decimal a number
                    operadora: mov.operadora,
                    rutaComprobante: mov.rutaComprobante, // Incluir ruta
                });
            });
            // <---- [FIN] Añadir mapeo explícito para movimientos
            // 3. Obtener depósitos bancarios (usando fechas UTC y filtro OR para observacion)
            const depositos = (aquipagoConfig === null || aquipagoConfig === void 0 ? void 0 : aquipagoConfig.cuentaBancariaId) ? yield prisma.depositoBancario.findMany({
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
            // Calcular totales del RANGO DE FECHAS
            let totalPagosEnRango = 0;
            let totalRetirosEnRango = 0;
            movimientos.forEach(mov => {
                // Usamos los movimientos del rango para estos totales
                if (mov.servicio.toLowerCase() === 'pagos') {
                    totalPagosEnRango += mov.monto.toNumber();
                }
                else if (mov.servicio.toLowerCase() === 'retiros') {
                    totalRetirosEnRango += mov.monto.toNumber();
                }
            });
            const totalDepositosEnRango = depositos.reduce((sum, d) => sum + d.monto.toNumber(), 0);
            // ---> [INICIO] Calcular Balance GLOBAL (Total a Depositar Histórico)
            const sumaPagosGlobal = yield prisma.movimientoCaja.aggregate({
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
            const sumaRetirosGlobal = yield prisma.movimientoCaja.aggregate({
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
            const sumaDepositosGlobal = (aquipagoConfig === null || aquipagoConfig === void 0 ? void 0 : aquipagoConfig.cuentaBancariaId) ? yield prisma.depositoBancario.aggregate({
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
            const totalADepositarGlobal = (((_a = sumaPagosGlobal._sum.monto) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0) -
                (((_b = sumaRetirosGlobal._sum.monto) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0) -
                (((_c = sumaDepositosGlobal._sum.monto) === null || _c === void 0 ? void 0 : _c.toNumber()) || 0); // Restar depósitos globales
            // <--- [FIN] Calcular Balance GLOBAL
            // Enviar la respuesta
            res.status(200).json({
                movimientos: movimientosFormateados,
                depositos: depositosFormateados,
                // Totales del rango de fechas
                totalPagos: totalPagosEnRango,
                totalRetiros: totalRetirosEnRango,
                totalDepositos: totalDepositosEnRango,
                // Total a depositar GLOBAL (Histórico)
                totalADepositar: totalADepositarGlobal,
            });
        }
        catch (error) {
            console.error('Error al obtener movimientos de Aqui Pago:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    /**
     * Obtiene un comprobante específico de Aqui Pago
     */
    obtenerComprobante: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                path_1.default.join(process.cwd(), 'uploads', rutaArchivo),
                path_1.default.join(process.cwd(), 'uploads', 'comprobantes', rutaArchivo),
                path_1.default.join(__dirname, '../../uploads', rutaArchivo),
                path_1.default.join(__dirname, '../../uploads/comprobantes', rutaArchivo),
                path_1.default.join(process.cwd(), '..', 'uploads', rutaArchivo),
                path_1.default.join(process.cwd(), '..', 'uploads', 'comprobantes', rutaArchivo)
            ];
            console.log('[DEBUG] Posibles rutas a verificar:');
            posiblesRutas.forEach((ruta, i) => console.log(`[${i}] ${ruta}`));
            // Verificar cada ruta hasta encontrar el archivo
            let rutaEncontrada = null;
            for (const ruta of posiblesRutas) {
                if (fs_1.default.existsSync(ruta)) {
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
            const ext = path_1.default.extname(rutaEncontrada).toLowerCase();
            let contentType = 'application/octet-stream'; // Default
            if (ext === '.pdf')
                contentType = 'application/pdf';
            else if (ext === '.png')
                contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg')
                contentType = 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${path_1.default.basename(rutaEncontrada)}"`);
            return fs_1.default.createReadStream(rutaEncontrada).pipe(res);
        }
        catch (error) {
            console.error('[ERROR] Error al obtener comprobante:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }),
    /**
     * [DEBUG] Obtiene y muestra en consola los últimos movimientos de caja
     */
    debugObtenerTodosMovimientos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[DEBUG] Ejecutando debugObtenerTodosMovimientos...');
        try {
            const ultimosMovimientos = yield prisma.movimientoCaja.findMany({
                take: 20, // Traemos solo los últimos 20 para no sobrecargar
                orderBy: {
                    fecha: 'desc',
                },
                include: {
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
        }
        catch (error) {
            console.error('[DEBUG] Error al obtener todos los movimientos de caja:', error);
            return res.status(500).json({ error: 'Error interno al obtener datos para debug' });
        }
    })
};
exports.default = exports.AquipagoController;
console.log('[DEBUG] Controlador aquipago.controller.ts cargado exitosamente.');
//# sourceMappingURL=aquipago.controller.js.map
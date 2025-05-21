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
console.log('[DEBUG] *** Ejecutando index.ts ***'); // <-- Log MUY al principio
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const persona_routes_1 = __importDefault(require("./routes/persona.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const rol_routes_1 = __importDefault(require("./routes/rol.routes"));
const permiso_routes_1 = __importDefault(require("./routes/permiso.routes"));
const cotizacion_routes_1 = __importDefault(require("./routes/cotizacion.routes"));
const sucursal_routes_1 = __importDefault(require("./routes/sucursal.routes"));
const maletin_routes_1 = __importDefault(require("./routes/maletin.routes"));
const caja_routes_1 = __importDefault(require("./routes/caja.routes"));
const pos_routes_1 = __importDefault(require("./routes/pos.routes"));
const cuenta_bancaria_routes_1 = __importDefault(require("./routes/cuenta-bancaria.routes"));
const operacion_bancaria_routes_1 = __importDefault(require("./routes/operacion-bancaria.routes"));
const vale_routes_1 = __importDefault(require("./routes/vale.routes"));
const cambio_moneda_routes_1 = __importDefault(require("./routes/cambio-moneda.routes"));
const usoDevolucionRoutes_1 = __importDefault(require("./routes/usoDevolucionRoutes"));
const banco_routes_1 = __importDefault(require("./routes/banco.routes"));
const deposito_bancario_routes_1 = __importDefault(require("./routes/deposito-bancario.routes"));
const pago_servicio_routes_1 = __importDefault(require("./routes/pago-servicio.routes"));
const caja_mayor_routes_1 = __importDefault(require("./routes/caja-mayor.routes"));
const caja_mayor_movimientos_routes_1 = __importDefault(require("./routes/caja-mayor-movimientos.routes"));
const conteo_routes_1 = __importDefault(require("./routes/conteo.routes"));
const cotizacion_externa_routes_1 = __importDefault(require("./routes/cotizacion-externa.routes"));
const path_1 = __importDefault(require("path")); // Importar path
const diferencias_routes_1 = __importDefault(require("./routes/diferencias.routes"));
const movimientoFarmacia_routes_1 = __importDefault(require("./routes/movimientoFarmacia.routes"));
const configuracion_routes_1 = __importDefault(require("./routes/configuracion.routes")); // Importar rutas de configuración
const aquipago_routes_1 = __importDefault(require("./routes/aquipago.routes")); // Importar rutas de Aqui Pago
const weno_gs_routes_1 = __importDefault(require("./routes/weno-gs.routes")); // Importar rutas de Wepa Gs
const wepa_usd_routes_1 = __importDefault(require("./routes/wepa-usd.routes")); // Importar rutas de Wepa USD
const carousel_routes_1 = __importDefault(require("./routes/carousel.routes")); // Importar rutas del carrusel
const sueldo_minimo_routes_1 = __importDefault(require("./routes/sueldo-minimo.routes")); // Importar rutas del sueldo mínimo
const fs_1 = __importDefault(require("fs"));
const sueldo_routes_1 = __importDefault(require("./routes/sueldo.routes"));
const rrhhRoutes_1 = __importDefault(require("./routes/rrhhRoutes")); // Importar rutas RRHH
const ips_routes_1 = __importDefault(require("./routes/ips.routes")); // Importar rutas IPS
const categorias_gastos_routes_1 = __importDefault(require("./routes/categorias-gastos.routes")); // Importar rutas de categorías de gastos
const gastos_routes_1 = __importDefault(require("./routes/gastos.routes")); // Importar rutas para gestión de gastos
const movimientoCaja_routes_1 = __importDefault(require("./routes/movimientoCaja.routes")); // Importar rutas para movimientos de caja
const activoPasivoRoutes_1 = __importDefault(require("./routes/activoPasivoRoutes")); // Importar rutas para activo pasivo
const notificacion_routes_1 = __importDefault(require("./routes/notificacion.routes")); // Importar rutas de notificaciones
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // Para manejar formularios
// <<< Añadir Middleware para servir archivos estáticos >>>
// Servir archivos desde la carpeta 'uploads' en la ruta '/uploads'
// path.join(__dirname, '..', 'uploads') apunta a la carpeta 'uploads' en la raíz del proyecto
// ya que __dirname estará en 'dist' después de compilar, y '..' sube un nivel.
const uploadsPath = path_1.default.join(__dirname, '..', 'uploads');
app.use('/uploads', express_1.default.static(uploadsPath));
console.log(`[DEBUG] Sirviendo archivos estáticos desde: ${uploadsPath}`);
// Ruta adicional para servir comprobantes directamente
app.get('/comprobante/:nombreArchivo', (req, res) => {
    const { nombreArchivo } = req.params;
    const filePath = path_1.default.join(uploadsPath, nombreArchivo);
    console.log(`[DEBUG] Intentando servir comprobante: ${filePath}`);
    if (fs_1.default.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    else {
        console.log(`[DEBUG] Archivo no encontrado: ${filePath}`);
        return res.status(404).json({ error: 'Comprobante no encontrado' });
    }
});
// Ruta de salud para monitorear el estado del servidor
app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});
// Rutas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/personas', persona_routes_1.default);
app.use('/api/usuarios', usuario_routes_1.default);
app.use('/api/roles', rol_routes_1.default);
app.use('/api/permisos', permiso_routes_1.default);
app.use('/api/cotizaciones', cotizacion_routes_1.default);
app.use('/api/sucursales', sucursal_routes_1.default);
app.use('/api/maletines', maletin_routes_1.default);
app.use('/api/cajas', caja_routes_1.default);
app.use('/api/pos', pos_routes_1.default);
app.use('/api/cuentas-bancarias', cuenta_bancaria_routes_1.default);
app.use('/api/operaciones-bancarias', operacion_bancaria_routes_1.default);
app.use('/api/vales', vale_routes_1.default);
app.use('/api/cambios-moneda', cambio_moneda_routes_1.default);
app.use('/api/uso-devolucion', usoDevolucionRoutes_1.default);
app.use('/api/bancos', banco_routes_1.default);
app.use('/api/depositos-bancarios', deposito_bancario_routes_1.default);
app.use('/api', pago_servicio_routes_1.default);
app.use('/api/cajas-mayor', caja_mayor_routes_1.default);
app.use('/api/conteos', conteo_routes_1.default);
app.use('/api/caja_mayor_movimientos', caja_mayor_movimientos_routes_1.default);
app.use('/api/cotizaciones-externas', cotizacion_externa_routes_1.default);
app.use('/api/diferencias', diferencias_routes_1.default);
// Registrar rutas de notificaciones
console.log('[DEBUG] Intentando registrar /api/notificaciones...');
app.use('/api/notificaciones', notificacion_routes_1.default);
console.log('[DEBUG] Ruta /api/notificaciones registrada en index.ts');
console.log('[DEBUG] Intentando registrar /api/movimientos-farmacia...');
app.use('/api/movimientos-farmacia', movimientoFarmacia_routes_1.default);
console.log('[DEBUG] Ruta /api/movimientos-farmacia registrada en index.ts');
// Registrar rutas de configuración
console.log('[DEBUG] Intentando registrar /api/configuracion...');
app.use('/api/configuracion', configuracion_routes_1.default);
console.log('[DEBUG] Ruta /api/configuracion registrada en index.ts');
// Registrar rutas de Aqui Pago
console.log('[DEBUG] Intentando registrar /api/aquipago...');
app.use('/api/aquipago', aquipago_routes_1.default);
console.log('[DEBUG] Ruta /api/aquipago registrada en index.ts');
// Registrar rutas de Wepa Gs
console.log('[DEBUG] Intentando registrar /api/weno-gs...');
app.use('/api/weno-gs', weno_gs_routes_1.default);
console.log('[DEBUG] Ruta /api/weno-gs registrada en index.ts');
// Registrar rutas de Wepa USD
console.log('[DEBUG] Intentando registrar /api/wepa-usd...');
app.use('/api/wepa-usd', wepa_usd_routes_1.default);
console.log('[DEBUG] Ruta /api/wepa-usd registrada en index.ts');
// Registrar rutas del carrusel
console.log('[DEBUG] Intentando registrar /api/carousel...');
app.use('/api/carousel', carousel_routes_1.default);
console.log('[DEBUG] Ruta /api/carousel registrada en index.ts');
// Registrar rutas del sueldo mínimo
console.log('[DEBUG] Intentando registrar /api/sueldos-minimos...');
app.use('/api/sueldos-minimos', sueldo_minimo_routes_1.default);
console.log('[DEBUG] Ruta /api/sueldos-minimos registrada en index.ts');
// Registrar nuevas rutas
app.use('/api/sueldos', sueldo_routes_1.default);
console.log('Ruta /api/sueldos registrada en index.ts');
// Registrar rutas RRHH
console.log('[DEBUG] Intentando registrar /api/rrhh...');
app.use('/api/rrhh', rrhhRoutes_1.default);
console.log('[DEBUG] Ruta /api/rrhh registrada en index.ts');
// Registrar rutas IPS
console.log('[DEBUG] Intentando registrar /api/ips...');
app.use('/api/ips', ips_routes_1.default);
console.log('[DEBUG] Ruta /api/ips registrada en index.ts');
// Registrar rutas de categorías y subcategorías de gastos
console.log('[DEBUG] Intentando registrar /api/categorias-gastos...');
app.use('/api', categorias_gastos_routes_1.default);
console.log('[DEBUG] Ruta /api/categorias-gastos registrada en index.ts');
// Registrar rutas para gestión de gastos
console.log('[DEBUG] Intentando registrar /api/gastos...');
app.use('/api', gastos_routes_1.default);
console.log('[DEBUG] Ruta /api/gastos registrada en index.ts');
// Registrar nueva ruta para movimientos de caja
console.log('[DEBUG] Intentando registrar /api/movimientos-caja...');
app.use('/api/movimientos-caja', movimientoCaja_routes_1.default);
console.log('[DEBUG] Ruta /api/movimientos-caja registrada en index.ts');
// Registrar rutas para activo pasivo
console.log('[DEBUG] Intentando registrar /api/activo-pasivo...');
app.use('/api/activo-pasivo', activoPasivoRoutes_1.default);
console.log('[DEBUG] Ruta /api/activo-pasivo registrada en index.ts');
// Lista de nombres de rutas para debugging
console.log('Rutas disponibles:');
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        // Rutas directas
        console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    }
    else if (middleware.name === 'router') {
        // Rutas de router
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                const method = Object.keys(handler.route.methods).join(', ').toUpperCase();
                const routerPath = middleware.regexp.toString()
                    .replace(/^\/\^\\\//, '') // Eliminar el inicio /^\/
                    .replace(/\\\/\?\(\?=\\\/\|\$\)\/i$/, ''); // Eliminar el final \/\?\(\?=\\\/\|\$\)\/i
                // Reemplazar las barras invertidas
                const cleanPath = routerPath.replace(/\\\//g, '/');
                console.log(`${method} /${cleanPath}${handler.route.path}`);
            }
        });
    }
});
// Ruta básica
app.get('/', (_req, res) => {
    res.send('API Sistema de Servicios');
});
// Ruta de prueba
app.get('/test', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'El servidor está funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});
// Iniciar el servidor
const PORT = process.env.PORT || 3000;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Iniciar el servidor primero
            const server = app.listen(PORT, () => {
                console.log(`Servidor corriendo en http://localhost:${PORT}`);
                // Listar las rutas registradas
                console.log('Rutas registradas:');
                app._router.stack.forEach((middleware) => {
                    if (middleware.route) {
                        // Rutas directas
                        console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
                    }
                    else if (middleware.name === 'router') {
                        // Rutas de router
                        middleware.handle.stack.forEach((handler) => {
                            if (handler.route) {
                                const method = Object.keys(handler.route.methods).join(', ').toUpperCase();
                                const routerPath = middleware.regexp.toString()
                                    .replace(/^\/\^\\\//, '') // Eliminar el inicio /^\/
                                    .replace(/\\\/\?\(\?=\\\/\|\$\)\/i$/, ''); // Eliminar el final \/\?\(\?=\\\/\|\$\)\/i
                                // Reemplazar las barras invertidas
                                const cleanPath = routerPath.replace(/\\\//g, '/');
                                console.log(`${method} /${cleanPath}${handler.route.path}`);
                            }
                        });
                    }
                });
            });
            // Luego intentar conectar a la base de datos
            yield prisma.$connect();
            console.log('Base de datos conectada');
            // Manejar el cierre gracioso del servidor
            process.on('SIGTERM', () => __awaiter(this, void 0, void 0, function* () {
                yield prisma.$disconnect();
                server.close(() => {
                    console.log('Servidor cerrado');
                    process.exit(0);
                });
            }));
        }
        catch (error) {
            console.error('Error al iniciar el servidor:', error);
            yield prisma.$disconnect();
            process.exit(1);
        }
    });
}
startServer().catch(console.error);
//# sourceMappingURL=index.js.map
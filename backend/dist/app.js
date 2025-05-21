"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const persona_routes_1 = __importDefault(require("./routes/persona.routes"));
const rol_routes_1 = __importDefault(require("./routes/rol.routes"));
const permiso_routes_1 = __importDefault(require("./routes/permiso.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const cotizacion_routes_1 = __importDefault(require("./routes/cotizacion.routes"));
const sucursal_routes_1 = __importDefault(require("./routes/sucursal.routes"));
const maletin_routes_1 = __importDefault(require("./routes/maletin.routes"));
const caja_routes_1 = __importDefault(require("./routes/caja.routes"));
const cuenta_bancaria_routes_1 = __importDefault(require("./routes/cuenta-bancaria.routes"));
const pos_routes_1 = __importDefault(require("./routes/pos.routes"));
const operacion_bancaria_routes_1 = __importDefault(require("./routes/operacion-bancaria.routes"));
const vale_routes_1 = __importDefault(require("./routes/vale.routes"));
const usoDevolucionRoutes_1 = __importDefault(require("./routes/usoDevolucionRoutes"));
const banco_routes_1 = __importDefault(require("./routes/banco.routes"));
const deposito_bancario_routes_1 = __importDefault(require("./routes/deposito-bancario.routes"));
const pago_servicio_routes_1 = __importDefault(require("./routes/pago-servicio.routes"));
const conteo_routes_1 = __importDefault(require("./routes/conteo.routes"));
const caja_mayor_movimientos_routes_1 = __importDefault(require("./routes/caja-mayor-movimientos.routes"));
const movimientoFarmacia_routes_1 = __importDefault(require("./routes/movimientoFarmacia.routes"));
const configuracion_routes_1 = __importDefault(require("./routes/configuracion.routes"));
const carousel_routes_1 = __importDefault(require("./routes/carousel.routes"));
const rrhhRoutes_1 = __importDefault(require("./routes/rrhhRoutes"));
const ips_routes_1 = __importDefault(require("./routes/ips.routes"));
const notificacion_routes_1 = __importDefault(require("./routes/notificacion.routes"));
const app = (0, express_1.default)();
// Configuración de CORS para permitir peticiones desde cualquier origen durante desarrollo
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Configuración para manejar JSON y formularios
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Configuración para servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Rutas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/personas', persona_routes_1.default);
app.use('/api/roles', rol_routes_1.default);
app.use('/api/permisos', permiso_routes_1.default);
app.use('/api/usuarios', usuario_routes_1.default);
app.use('/api/cotizaciones', cotizacion_routes_1.default);
app.use('/api/sucursales', sucursal_routes_1.default);
app.use('/api/maletines', maletin_routes_1.default);
app.use('/api/cajas', caja_routes_1.default);
app.use('/api/cuentas-bancarias', cuenta_bancaria_routes_1.default);
app.use('/api/pos', pos_routes_1.default);
app.use('/api/operaciones-bancarias', operacion_bancaria_routes_1.default);
app.use('/api/vales', vale_routes_1.default);
app.use('/api/uso-devolucion', usoDevolucionRoutes_1.default);
app.use('/api/bancos', banco_routes_1.default);
app.use('/api/depositos-bancarios', deposito_bancario_routes_1.default);
app.use('/api', pago_servicio_routes_1.default);
app.use('/api/conteos', conteo_routes_1.default);
app.use('/api/caja', caja_mayor_movimientos_routes_1.default);
console.log('[DEBUG] Intentando registrar /api/movimientos-farmacia...');
app.use('/api/movimientos-farmacia', movimientoFarmacia_routes_1.default);
console.log('[DEBUG] Ruta /api/movimientos-farmacia registrada en app.');
// Registrar las rutas de configuración
app.use('/api/configuracion', configuracion_routes_1.default);
// Registrar las rutas del carrusel y panel informativo
app.use('/api/carousel', carousel_routes_1.default);
// Registrar las rutas RRHH
app.use('/api/rrhh', rrhhRoutes_1.default);
// Registrar las rutas IPS
app.use('/api/ips', ips_routes_1.default);
// Registrar las rutas de notificaciones
app.use('/api/notificaciones', notificacion_routes_1.default);
// Middleware para imprimir cada solicitud que llega
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
exports.default = app;
//# sourceMappingURL=app.js.map
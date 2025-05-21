import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import personaRoutes from './routes/persona.routes';
import rolRoutes from './routes/rol.routes';
import permisoRoutes from './routes/permiso.routes';
import usuarioRoutes from './routes/usuario.routes';
import cotizacionRoutes from './routes/cotizacion.routes';
import sucursalRoutes from './routes/sucursal.routes';
import maletinRoutes from './routes/maletin.routes';
import cajaRoutes from './routes/caja.routes';
import cuentaBancariaRoutes from './routes/cuenta-bancaria.routes';
import posRoutes from './routes/pos.routes';
import operacionBancariaRoutes from './routes/operacion-bancaria.routes';
import valeRoutes from './routes/vale.routes';
import usoDevolucionRoutes from './routes/usoDevolucionRoutes';
import bancoRoutes from './routes/banco.routes';
import depositoBancarioRoutes from './routes/deposito-bancario.routes';
import pagoServicioRoutes from './routes/pago-servicio.routes';
import conteoRoutes from './routes/conteo.routes';
import cajaMayorMovimientosRoutes from './routes/caja-mayor-movimientos.routes';
import movimientoFarmaciaRoutes from './routes/movimientoFarmacia.routes';
import categoriasGastosRoutes from './routes/categoriasGastosRoutes';

const app = express();

// Configuración de CORS para permitir peticiones desde cualquier origen durante desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración para manejar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración para servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/maletines', maletinRoutes);
app.use('/api/cajas', cajaRoutes);
app.use('/api/cuentas-bancarias', cuentaBancariaRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/operaciones-bancarias', operacionBancariaRoutes);
app.use('/api/vales', valeRoutes);
app.use('/api/uso-devolucion', usoDevolucionRoutes);
app.use('/api/bancos', bancoRoutes);
app.use('/api/depositos-bancarios', depositoBancarioRoutes);
app.use('/api', pagoServicioRoutes);
app.use('/api/conteos', conteoRoutes);
app.use('/api/caja', cajaMayorMovimientosRoutes);

console.log('[DEBUG] Intentando registrar /api/movimientos-farmacia...');
app.use('/api/movimientos-farmacia', movimientoFarmaciaRoutes);
console.log('[DEBUG] Ruta /api/movimientos-farmacia registrada en app.');

// Registrar rutas para categorías y subcategorías de gastos
app.use('/api', categoriasGastosRoutes);

// Middleware para imprimir cada solicitud que llega
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

export default app;
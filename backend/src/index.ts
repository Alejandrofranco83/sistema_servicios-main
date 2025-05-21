console.log('[DEBUG] *** Ejecutando index.ts ***'); // <-- Log MUY al principio
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import personaRoutes from './routes/persona.routes';
import usuarioRoutes from './routes/usuario.routes';
import rolRoutes from './routes/rol.routes';
import permisoRoutes from './routes/permiso.routes';
import cotizacionRoutes from './routes/cotizacion.routes';
import sucursalRoutes from './routes/sucursal.routes';
import maletinRoutes from './routes/maletin.routes';
import cajaRoutes from './routes/caja.routes';
import posRoutes from './routes/pos.routes';
import cuentaBancariaRoutes from './routes/cuenta-bancaria.routes';
import operacionBancariaRoutes from './routes/operacion-bancaria.routes';
import valeRoutes from './routes/vale.routes';
import cambioMonedaRoutes from './routes/cambio-moneda.routes';
import usoDevolucionRoutes from './routes/usoDevolucionRoutes';
import bancoRoutes from './routes/banco.routes';
import depositoBancarioRoutes from './routes/deposito-bancario.routes';
import pagoServicioRoutes from './routes/pago-servicio.routes';
import cajaMayorRoutes from './routes/caja-mayor.routes';
import cajaMayorMovimientosRouter from './routes/caja-mayor-movimientos.routes';
import conteoRoutes from './routes/conteo.routes';
import cotizacionExternaRoutes from './routes/cotizacion-externa.routes';
import path from 'path'; // Importar path
import diferenciasRoutes from './routes/diferencias.routes';
import movimientoFarmaciaRoutes from './routes/movimientoFarmacia.routes';
import configuracionRoutes from './routes/configuracion.routes'; // Importar rutas de configuración
import aquipagoRoutes from './routes/aquipago.routes'; // Importar rutas de Aqui Pago
import wenoGsRoutes from './routes/weno-gs.routes'; // Importar rutas de Wepa Gs
import wepaUsdRoutes from './routes/wepa-usd.routes'; // Importar rutas de Wepa USD
import carouselRoutes from './routes/carousel.routes'; // Importar rutas del carrusel
import sueldoMinimoRoutes from './routes/sueldo-minimo.routes'; // Importar rutas del sueldo mínimo
import fs from 'fs';
import sueldoRoutes from './routes/sueldo.routes';
import rrhhRoutes from './routes/rrhhRoutes'; // Importar rutas RRHH
import ipsRoutes from './routes/ips.routes'; // Importar rutas IPS
import categoriasGastosRoutes from './routes/categorias-gastos.routes'; // Importar rutas de categorías de gastos
import gastosRoutes from './routes/gastos.routes'; // Importar rutas para gestión de gastos
import movimientoCajaRoutes from './routes/movimientoCaja.routes'; // Importar rutas para movimientos de caja
import activoPasivoRoutes from './routes/activoPasivoRoutes'; // Importar rutas para activo pasivo
import notificacionRoutes from './routes/notificacion.routes'; // Importar rutas de notificaciones

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para manejar formularios

// <<< Añadir Middleware para servir archivos estáticos >>>
// Servir archivos desde la carpeta 'uploads' en la ruta '/uploads'
// path.join(__dirname, '..', 'uploads') apunta a la carpeta 'uploads' en la raíz del proyecto
// ya que __dirname estará en 'dist' después de compilar, y '..' sube un nivel.
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`[DEBUG] Sirviendo archivos estáticos desde: ${uploadsPath}`);

// Ruta adicional para servir comprobantes directamente
app.get('/comprobante/:nombreArchivo', (req, res) => {
  const { nombreArchivo } = req.params;
  const filePath = path.join(uploadsPath, nombreArchivo);
  
  console.log(`[DEBUG] Intentando servir comprobante: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    console.log(`[DEBUG] Archivo no encontrado: ${filePath}`);
    return res.status(404).json({ error: 'Comprobante no encontrado' });
  }
});

// Ruta de salud para monitorear el estado del servidor
app.get('/api/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/maletines', maletinRoutes);
app.use('/api/cajas', cajaRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/cuentas-bancarias', cuentaBancariaRoutes);
app.use('/api/operaciones-bancarias', operacionBancariaRoutes);
app.use('/api/vales', valeRoutes);
app.use('/api/cambios-moneda', cambioMonedaRoutes);
app.use('/api/uso-devolucion', usoDevolucionRoutes);
app.use('/api/bancos', bancoRoutes);
app.use('/api/depositos-bancarios', depositoBancarioRoutes);
app.use('/api', pagoServicioRoutes);
app.use('/api/cajas-mayor', cajaMayorRoutes);
app.use('/api/conteos', conteoRoutes);
app.use('/api/caja_mayor_movimientos', cajaMayorMovimientosRouter);
app.use('/api/cotizaciones-externas', cotizacionExternaRoutes);
app.use('/api/diferencias', diferenciasRoutes);
// Registrar rutas de notificaciones
console.log('[DEBUG] Intentando registrar /api/notificaciones...');
app.use('/api/notificaciones', notificacionRoutes);
console.log('[DEBUG] Ruta /api/notificaciones registrada en index.ts');

console.log('[DEBUG] Intentando registrar /api/movimientos-farmacia...');
app.use('/api/movimientos-farmacia', movimientoFarmaciaRoutes);
console.log('[DEBUG] Ruta /api/movimientos-farmacia registrada en index.ts');

// Registrar rutas de configuración
console.log('[DEBUG] Intentando registrar /api/configuracion...');
app.use('/api/configuracion', configuracionRoutes);
console.log('[DEBUG] Ruta /api/configuracion registrada en index.ts');

// Registrar rutas de Aqui Pago
console.log('[DEBUG] Intentando registrar /api/aquipago...');
app.use('/api/aquipago', aquipagoRoutes);
console.log('[DEBUG] Ruta /api/aquipago registrada en index.ts');

// Registrar rutas de Wepa Gs
console.log('[DEBUG] Intentando registrar /api/weno-gs...');
app.use('/api/weno-gs', wenoGsRoutes);
console.log('[DEBUG] Ruta /api/weno-gs registrada en index.ts');

// Registrar rutas de Wepa USD
console.log('[DEBUG] Intentando registrar /api/wepa-usd...');
app.use('/api/wepa-usd', wepaUsdRoutes);
console.log('[DEBUG] Ruta /api/wepa-usd registrada en index.ts');

// Registrar rutas del carrusel
console.log('[DEBUG] Intentando registrar /api/carousel...');
app.use('/api/carousel', carouselRoutes);
console.log('[DEBUG] Ruta /api/carousel registrada en index.ts');

// Registrar rutas del sueldo mínimo
console.log('[DEBUG] Intentando registrar /api/sueldos-minimos...');
app.use('/api/sueldos-minimos', sueldoMinimoRoutes);
console.log('[DEBUG] Ruta /api/sueldos-minimos registrada en index.ts');

// Registrar nuevas rutas
app.use('/api/sueldos', sueldoRoutes);
console.log('Ruta /api/sueldos registrada en index.ts');

// Registrar rutas RRHH
console.log('[DEBUG] Intentando registrar /api/rrhh...');
app.use('/api/rrhh', rrhhRoutes);
console.log('[DEBUG] Ruta /api/rrhh registrada en index.ts');

// Registrar rutas IPS
console.log('[DEBUG] Intentando registrar /api/ips...');
app.use('/api/ips', ipsRoutes);
console.log('[DEBUG] Ruta /api/ips registrada en index.ts');

// Registrar rutas de categorías y subcategorías de gastos
console.log('[DEBUG] Intentando registrar /api/categorias-gastos...');
app.use('/api', categoriasGastosRoutes);
console.log('[DEBUG] Ruta /api/categorias-gastos registrada en index.ts');

// Registrar rutas para gestión de gastos
console.log('[DEBUG] Intentando registrar /api/gastos...');
app.use('/api', gastosRoutes);
console.log('[DEBUG] Ruta /api/gastos registrada en index.ts');

// Registrar nueva ruta para movimientos de caja
console.log('[DEBUG] Intentando registrar /api/movimientos-caja...');
app.use('/api/movimientos-caja', movimientoCajaRoutes);
console.log('[DEBUG] Ruta /api/movimientos-caja registrada en index.ts');

// Registrar rutas para activo pasivo
console.log('[DEBUG] Intentando registrar /api/activo-pasivo...');
app.use('/api/activo-pasivo', activoPasivoRoutes);
console.log('[DEBUG] Ruta /api/activo-pasivo registrada en index.ts');

// Lista de nombres de rutas para debugging
console.log('Rutas disponibles:');
app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
        // Rutas directas
        console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
        // Rutas de router
        middleware.handle.stack.forEach((handler: any) => {
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

async function startServer() {
    try {
        // Iniciar el servidor primero
        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            
            // Listar las rutas registradas
            console.log('Rutas registradas:');
            app._router.stack.forEach((middleware: any) => {
                if (middleware.route) {
                    // Rutas directas
                    console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
                } else if (middleware.name === 'router') {
                    // Rutas de router
                    middleware.handle.stack.forEach((handler: any) => {
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
        await prisma.$connect();
        console.log('Base de datos conectada');

        // Manejar el cierre gracioso del servidor
        process.on('SIGTERM', async () => {
            await prisma.$disconnect();
            server.close(() => {
                console.log('Servidor cerrado');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer().catch(console.error); 
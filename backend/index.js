import configuracionRoutes from './routes/configuracion.routes'; // Importar rutas de configuración
import aquipagoRoutes from './routes/aquipago.routes'; // Importar rutas de Aqui Pago
import wepaGsRoutes from './routes/wepa-gs.routes'; // Importar rutas de Wepa GS
import categoriasGastosRoutes from './routes/categoriasGastosRoutes'; // Importar rutas de categorías de gastos

// Registrar rutas
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/configuracion/aquipago', aquipagoRoutes);
app.use('/api/configuracion/wepa-gs', wepaGsRoutes);
app.use('/api', categoriasGastosRoutes); // Registrar rutas para categorías de gastos 
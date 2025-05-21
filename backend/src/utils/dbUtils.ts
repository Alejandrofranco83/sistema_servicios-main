import { Pool } from 'pg';

// Configurar la conexión a la base de datos desde las variables de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Utilidades para operaciones directas en la base de datos
 */
export const dbUtils = {
  /**
   * Registra un movimiento directamente en la tabla caja_mayor_movimientos usando SQL nativo
   */
  async registrarMovimientoCajaMayor(
    operacionId: number,
    moneda: 'guaranies' | 'dolares' | 'reales',
    monto: number,
    esIngreso: boolean,
    concepto: string,
    usuarioId: number,
    usoDevolucionId: number
  ) {
    console.log('⚠️ INICIO: Registrando movimiento en caja_mayor_movimientos con SQL');
    console.log(`Parámetros: operacionId=${operacionId}, moneda=${moneda}, monto=${monto}, esIngreso=${esIngreso}`);
    
    try {
      // 1. Buscar el último movimiento para esta moneda
      console.log(`Buscando último movimiento para moneda: ${moneda}`);
      const ultimoMovimientoQuery = await pool.query(`
        SELECT id, "saldoActual" 
        FROM caja_mayor_movimientos 
        WHERE moneda = $1 
        ORDER BY id DESC 
        LIMIT 1
      `, [moneda]);
      
      // 2. Calcular saldos
      const ultimoMovimiento = ultimoMovimientoQuery.rows[0];
      console.log(`Último movimiento encontrado: ${ultimoMovimiento ? 'Sí' : 'No'}`);
      
      const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual) : 0;
      const saldoActual = esIngreso ? saldoAnterior + monto : saldoAnterior - monto;
      
      console.log(`Saldo anterior: ${saldoAnterior}, Nuevo saldo: ${saldoActual}`);
      
      // 3. Insertar el nuevo movimiento
      const fechaActual = new Date();
      const query = `
        INSERT INTO caja_mayor_movimientos (
          "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
          "saldoAnterior", "saldoActual", concepto, "usuarioId", 
          "usoDevolucionId", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `;
      
      const values = [
        fechaActual,              // fechaHora
        'Uso y devolución',       // tipo
        operacionId.toString(),   // operacionId
        moneda,                   // moneda
        monto,                    // monto
        esIngreso,                // esIngreso
        saldoAnterior,            // saldoAnterior
        saldoActual,              // saldoActual
        concepto,                 // concepto
        usuarioId,                // usuarioId
        usoDevolucionId,          // usoDevolucionId
        fechaActual,              // createdAt
        fechaActual               // updatedAt
      ];
      
      console.log('Ejecutando INSERT en la tabla caja_mayor_movimientos...');
      const result = await pool.query(query, values);
      
      if (result.rows && result.rows.length > 0) {
        console.log(`✅ Movimiento registrado correctamente. ID: ${result.rows[0].id}`);
        return true;
      } else {
        console.error('⚠️ La inserción no retornó un ID');
        return false;
      }
    } catch (error) {
      console.error('❌ ERROR al registrar movimiento con SQL:', error);
      
      // Mostrar detalles del error para mejor diagnóstico
      if (error instanceof Error) {
        console.error('Nombre del error:', error.name);
        console.error('Mensaje del error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      
      throw error;
    }
  }
};

export default dbUtils; 
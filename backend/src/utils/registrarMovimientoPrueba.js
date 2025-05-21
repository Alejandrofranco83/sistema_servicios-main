/**
 * Script para insertar un registro de prueba en caja_mayor_movimientos
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertarMovimientoPrueba() {
  const client = await pool.connect();
  try {
    console.log('Iniciando inserción de movimiento de prueba...');
    
    // Obtener el último movimiento para calcular el saldo
    const ultimoMovimiento = await client.query(`
      SELECT * FROM caja_mayor_movimientos 
      WHERE moneda = 'guaranies' 
      ORDER BY "fechaHora" DESC 
      LIMIT 1
    `);
    
    // Determinar el saldo anterior
    let saldoAnterior = 0;
    if (ultimoMovimiento.rows.length > 0) {
      saldoAnterior = parseFloat(ultimoMovimiento.rows[0].saldoActual);
      console.log(`Saldo anterior encontrado: ${saldoAnterior}`);
    } else {
      console.log('No se encontraron movimientos previos, saldo anterior: 0');
    }
    
    // Monto de prueba
    const monto = 100;
    const esIngreso = true;
    
    // Calcular el saldo actual
    const saldoActual = esIngreso 
      ? saldoAnterior + monto 
      : saldoAnterior - monto;
    
    console.log(`Calculando nuevo saldo: ${saldoAnterior} ${esIngreso ? '+' : '-'} ${monto} = ${saldoActual}`);
    
    // Insertar el movimiento
    const ahora = new Date();
    const resultado = await client.query(`
      INSERT INTO caja_mayor_movimientos (
        "fechaHora", "tipo", "operacionId", "moneda", "monto", "esIngreso",
        "saldoAnterior", "saldoActual", "concepto", "usuarioId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `, [
      ahora,                   // fechaHora
      'PRUEBA',                // tipo
      '999',                   // operacionId
      'guaranies',             // moneda
      monto,                   // monto
      esIngreso,               // esIngreso
      saldoAnterior,           // saldoAnterior
      saldoActual,             // saldoActual
      'Movimiento de prueba',  // concepto
      1,                       // usuarioId
      ahora,                   // createdAt
      ahora                    // updatedAt
    ]);
    
    console.log('✅ Movimiento insertado correctamente:');
    console.log(JSON.stringify(resultado.rows[0], null, 2));
    
    // Eliminar el movimiento de prueba
    await client.query(`
      DELETE FROM caja_mayor_movimientos 
      WHERE id = $1
    `, [resultado.rows[0].id]);
    
    console.log(`✅ Movimiento de prueba con ID ${resultado.rows[0].id} eliminado correctamente`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción del movimiento de prueba:', error);
  } finally {
    client.release();
    console.log('\nProceso completado');
  }
}

// Ejecutar la función principal
insertarMovimientoPrueba()
  .then(() => {
    console.log('🚀 Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 
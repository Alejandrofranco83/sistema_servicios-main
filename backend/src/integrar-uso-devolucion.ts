import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Leer el script SQL desde el archivo
const sqlScript = fs.readFileSync(path.join(__dirname, '../sql/migrations/create_uso_devolucion_tables.sql'), 'utf8');

// Configuración de la conexión a la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistema_servicios',
  password: 'postgres',
  port: 5432
});

/**
 * Ejecuta el script SQL para crear las tablas y funciones necesarias
 */
async function ejecutarMigracion() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración para Uso y Devolución de Efectivo...');
    
    // Iniciar una transacción
    await client.query('BEGIN');
    
    // Ejecutar el script SQL
    await client.query(sqlScript);
    
    // Confirmar la transacción
    await client.query('COMMIT');
    
    console.log('✅ Migración completada con éxito.');
    console.log('✅ Se han creado las siguientes tablas:');
    console.log('   - uso_devolucion');
    console.log('   - saldo_persona');
    console.log('✅ Se han creado las siguientes funciones:');
    console.log('   - actualizar_saldo_persona()');
    console.log('   - anular_uso_devolucion()');
    
  } catch (error) {
    // Revertir la transacción en caso de error
    await client.query('ROLLBACK');
    console.error('❌ Error al ejecutar la migración:', error);
    
  } finally {
    // Liberar el cliente
    client.release();
    // Cerrar la conexión a la base de datos
    pool.end();
  }
}

// Ejecutar la migración
ejecutarMigracion(); 
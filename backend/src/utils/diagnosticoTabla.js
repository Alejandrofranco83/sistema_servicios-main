/**
 * Script para diagnosticar la estructura de la tabla caja_mayor_movimientos
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function diagnosticarTabla() {
  const client = await pool.connect();
  try {
    console.log('Iniciando diagnóstico de la tabla caja_mayor_movimientos...');
    
    // Verificar si la tabla existe
    const tablaExiste = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'caja_mayor_movimientos'
      );
    `);
    
    if (!tablaExiste.rows[0].exists) {
      console.log('❌ La tabla caja_mayor_movimientos no existe en la base de datos');
      return;
    }
    
    console.log('✅ La tabla caja_mayor_movimientos existe');
    
    // Obtener la estructura de la tabla
    const columnas = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'caja_mayor_movimientos' 
      ORDER BY 
        ordinal_position;
    `);
    
    console.log('\nEstructura de la tabla:');
    console.log('------------------------');
    
    columnas.rows.forEach(col => {
      console.log(`${col.column_name} - ${col.data_type} - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Obtener información sobre claves primarias
    const primaryKey = await client.query(`
      SELECT 
        kcu.column_name
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_catalog = kcu.constraint_catalog
          AND tc.constraint_schema = kcu.constraint_schema
          AND tc.constraint_name = kcu.constraint_name
      WHERE 
        tc.table_name = 'caja_mayor_movimientos'
        AND tc.constraint_type = 'PRIMARY KEY';
    `);
    
    console.log('\nClave primaria:');
    console.log('---------------');
    if (primaryKey.rows.length > 0) {
      primaryKey.rows.forEach(row => {
        console.log(row.column_name);
      });
    } else {
      console.log('No se encontró una clave primaria');
    }
    
    // Contar registros
    const conteo = await client.query(`
      SELECT COUNT(*) FROM caja_mayor_movimientos;
    `);
    
    console.log(`\nNúmero total de registros: ${conteo.rows[0].count}`);
    
    // Mostrar algunos registros si existen
    if (parseInt(conteo.rows[0].count) > 0) {
      const registros = await client.query(`
        SELECT * FROM caja_mayor_movimientos 
        ORDER BY id DESC 
        LIMIT 3;
      `);
      
      console.log('\nÚltimos 3 registros:');
      console.log('------------------');
      registros.rows.forEach(registro => {
        console.log(JSON.stringify(registro, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    client.release();
    console.log('\nDiagnóstico completado');
  }
}

// Ejecutar la función principal
diagnosticarTabla()
  .then(() => {
    console.log('🚀 Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 
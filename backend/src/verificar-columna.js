require('dotenv').config();
const { Pool } = require('pg');

// Configurar la conexión a la base de datos 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verificarColumna() {
  const client = await pool.connect();
  try {
    console.log('Verificando columna estado en pagos_servicios...');
    
    // Consulta para obtener información de la columna
    const query = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pagos_servicios' AND column_name = 'estado';
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length > 0) {
      console.log('¡La columna estado existe!');
      console.log('Detalles de la columna:', result.rows[0]);
    } else {
      console.log('La columna estado NO existe en la tabla pagos_servicios.');
    }
  } catch (error) {
    console.error('Error al verificar la columna:', error);
  } finally {
    client.release();
    pool.end();
  }
}

verificarColumna(); 
/**
 * Script para crear las tablas necesarias para el módulo de uso/devolución
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function crearTablas() {
  const client = await pool.connect();
  try {
    console.log('Iniciando creación de tablas...');
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    // Crear tabla uso_devolucion si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS uso_devolucion (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('USO', 'DEVOLUCION')),
        persona_id INTEGER NOT NULL,
        persona_nombre VARCHAR(255) NOT NULL,
        guaranies BIGINT DEFAULT 0,
        dolares DECIMAL(12, 2) DEFAULT 0,
        reales DECIMAL(12, 2) DEFAULT 0,
        motivo TEXT NOT NULL,
        usuario_id INTEGER NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        anulado BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_persona FOREIGN KEY (persona_id) REFERENCES persona(id),
        CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
      )
    `);
    console.log('✅ Tabla uso_devolucion creada o ya existe');
    
    // Crear tabla saldo_persona si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS saldo_persona (
        id SERIAL PRIMARY KEY,
        persona_id INTEGER UNIQUE NOT NULL,
        guaranies DOUBLE PRECISION DEFAULT 0,
        dolares DOUBLE PRECISION DEFAULT 0,
        reales DOUBLE PRECISION DEFAULT 0,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
      )
    `);
    console.log('✅ Tabla saldo_persona creada o ya existe');
    
    // Commit de la transacción
    await client.query('COMMIT');
    console.log('✅ Todas las tablas fueron creadas correctamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al crear las tablas:', error);
    throw error;
  } finally {
    client.release();
    console.log('Cliente liberado');
  }
}

// Ejecutar la función principal
crearTablas()
  .then(() => {
    console.log('🚀 Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 
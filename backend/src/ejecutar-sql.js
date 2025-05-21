require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, '../sql/add_estado_to_pagos_servicios.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Configurar la conexión a la base de datos usando la URL de conexión de .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ejecutarSQL() {
  const client = await pool.connect();
  try {
    console.log('Ejecutando SQL para añadir columna estado...');
    await client.query(sql);
    console.log('¡SQL ejecutado con éxito! Columna estado añadida a pagos_servicios.');
  } catch (error) {
    console.error('Error al ejecutar SQL:', error);
  } finally {
    client.release();
    pool.end();
  }
}

ejecutarSQL(); 
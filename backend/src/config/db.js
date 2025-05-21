const { Pool } = require('pg');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sistema_servicios',
});

// Funciones para ejecutar consultas SQL
module.exports = {
  /**
   * Ejecuta una consulta SQL parametrizada
   * @param {string} text - Consulta SQL
   * @param {Array} params - Parámetros para la consulta
   * @returns {Promise<Object>} - Resultado de la consulta
   */
  query: (text, params) => pool.query(text, params),
  
  /**
   * Obtiene un cliente del pool para transacciones
   * @returns {Promise<Object>} - Cliente de la base de datos
   */
  getClient: async () => {
    const client = await pool.connect();
    return client;
  },
  
  /**
   * Finaliza la conexión al pool cuando se cierra la aplicación
   */
  end: () => pool.end()
}; 
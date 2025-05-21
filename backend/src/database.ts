import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'servicios',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Clase para manejar transacciones y consultas
class Database {
  private connection: mysql.PoolConnection | null = null;
  private inTransaction = false;

  // Método para ejecutar consultas
  async query(sql: string, params?: any[]): Promise<any> {
    if (this.inTransaction && this.connection) {
      const [rows] = await this.connection.query(sql, params);
      return rows;
    } else {
      const [rows] = await pool.query(sql, params);
      return rows;
    }
  }

  // Iniciar transacción
  async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Ya existe una transacción en curso');
    }
    this.connection = await pool.getConnection();
    await this.connection.beginTransaction();
    this.inTransaction = true;
  }

  // Confirmar transacción
  async commit(): Promise<void> {
    if (!this.inTransaction || !this.connection) {
      throw new Error('No hay transacción activa para confirmar');
    }
    await this.connection.commit();
    this.connection.release();
    this.connection = null;
    this.inTransaction = false;
  }

  // Revertir transacción
  async rollback(): Promise<void> {
    if (!this.inTransaction || !this.connection) {
      throw new Error('No hay transacción activa para revertir');
    }
    await this.connection.rollback();
    this.connection.release();
    this.connection = null;
    this.inTransaction = false;
  }
}

export const db = new Database(); 
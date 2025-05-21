import { Pool } from 'pg';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Cargar variables de entorno
dotenv.config();

// Crear una instancia del cliente Prisma
export const prisma = new PrismaClient();
export type { PrismaClient as Prisma } from '@prisma/client';

// Configurar la conexión a la base de datos desde las variables de entorno
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
}

// Función para cerrar la conexión cuando la aplicación se apague
export async function closeConnection() {
  try {
    await pool.end();
    await prisma.$disconnect();
    console.log('Conexión a la base de datos cerrada correctamente');
  } catch (error) {
    console.error('Error al cerrar la conexión con la base de datos:', error);
  }
} 
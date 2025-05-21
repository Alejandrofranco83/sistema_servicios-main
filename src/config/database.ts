import { ConnectionOptions } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sistema_servicios',
  synchronize: true,
  logging: true,
  entities: ['src/models/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  cli: {
    entitiesDir: 'src/models',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers',
  }
}; 
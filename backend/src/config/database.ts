import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { CashRegister } from '../models/CashRegister';
import { Transaction } from '../models/Transaction';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'sistema_servicios',
    synchronize: process.env.DB_SYNCHRONIZE === 'true', // Solo para desarrollo
    logging: true,
    entities: [User, CashRegister, Transaction],
    subscribers: [],
    migrations: [],
    migrationsTableName: 'migrations',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
});

/* // Comentado para evitar error TS2353
cli: {
  entitiesDir: 'src/entity',
  migrationsDir: 'src/migration',
  subscribersDir: 'src/subscriber'
}
*/ 
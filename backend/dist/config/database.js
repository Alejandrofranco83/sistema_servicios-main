"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const CashRegister_1 = require("../models/CashRegister");
const Transaction_1 = require("../models/Transaction");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'sistema_servicios',
    synchronize: process.env.DB_SYNCHRONIZE === 'true', // Solo para desarrollo
    logging: true,
    entities: [User_1.User, CashRegister_1.CashRegister, Transaction_1.Transaction],
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
//# sourceMappingURL=database.js.map
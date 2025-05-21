"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const pool = promise_1.default.createPool(dbConfig);
// Clase para manejar transacciones y consultas
class Database {
    constructor() {
        this.connection = null;
        this.inTransaction = false;
    }
    // Método para ejecutar consultas
    query(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.inTransaction && this.connection) {
                const [rows] = yield this.connection.query(sql, params);
                return rows;
            }
            else {
                const [rows] = yield pool.query(sql, params);
                return rows;
            }
        });
    }
    // Iniciar transacción
    beginTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.inTransaction) {
                throw new Error('Ya existe una transacción en curso');
            }
            this.connection = yield pool.getConnection();
            yield this.connection.beginTransaction();
            this.inTransaction = true;
        });
    }
    // Confirmar transacción
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.inTransaction || !this.connection) {
                throw new Error('No hay transacción activa para confirmar');
            }
            yield this.connection.commit();
            this.connection.release();
            this.connection = null;
            this.inTransaction = false;
        });
    }
    // Revertir transacción
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.inTransaction || !this.connection) {
                throw new Error('No hay transacción activa para revertir');
            }
            yield this.connection.rollback();
            this.connection.release();
            this.connection = null;
            this.inTransaction = false;
        });
    }
}
exports.db = new Database();
//# sourceMappingURL=database.js.map
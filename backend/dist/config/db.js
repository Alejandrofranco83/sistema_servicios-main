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
exports.pool = exports.prisma = void 0;
exports.testConnection = testConnection;
exports.closeConnection = closeConnection;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Cargar variables de entorno
dotenv_1.default.config();
// Crear una instancia del cliente Prisma
exports.prisma = new client_1.PrismaClient();
// Configurar la conexión a la base de datos desde las variables de entorno
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = yield exports.pool.connect();
            console.log('✅ Conexión a la base de datos establecida correctamente');
            client.release();
            return true;
        }
        catch (error) {
            console.error('❌ Error al conectar con la base de datos:', error);
            return false;
        }
    });
}
// Función para cerrar la conexión cuando la aplicación se apague
function closeConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exports.pool.end();
            yield exports.prisma.$disconnect();
            console.log('Conexión a la base de datos cerrada correctamente');
        }
        catch (error) {
            console.error('Error al cerrar la conexión con la base de datos:', error);
        }
    });
}
//# sourceMappingURL=db.js.map
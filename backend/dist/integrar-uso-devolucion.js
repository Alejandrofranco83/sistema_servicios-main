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
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Leer el script SQL desde el archivo
const sqlScript = fs_1.default.readFileSync(path_1.default.join(__dirname, '../sql/migrations/create_uso_devolucion_tables.sql'), 'utf8');
// Configuración de la conexión a la base de datos
const pool = new pg_1.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sistema_servicios',
    password: 'postgres',
    port: 5432
});
/**
 * Ejecuta el script SQL para crear las tablas y funciones necesarias
 */
function ejecutarMigracion() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            console.log('🔄 Iniciando migración para Uso y Devolución de Efectivo...');
            // Iniciar una transacción
            yield client.query('BEGIN');
            // Ejecutar el script SQL
            yield client.query(sqlScript);
            // Confirmar la transacción
            yield client.query('COMMIT');
            console.log('✅ Migración completada con éxito.');
            console.log('✅ Se han creado las siguientes tablas:');
            console.log('   - uso_devolucion');
            console.log('   - saldo_persona');
            console.log('✅ Se han creado las siguientes funciones:');
            console.log('   - actualizar_saldo_persona()');
            console.log('   - anular_uso_devolucion()');
        }
        catch (error) {
            // Revertir la transacción en caso de error
            yield client.query('ROLLBACK');
            console.error('❌ Error al ejecutar la migración:', error);
        }
        finally {
            // Liberar el cliente
            client.release();
            // Cerrar la conexión a la base de datos
            pool.end();
        }
    });
}
// Ejecutar la migración
ejecutarMigracion();
//# sourceMappingURL=integrar-uso-devolucion.js.map
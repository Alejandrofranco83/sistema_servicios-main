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
require('dotenv').config();
const { Pool } = require('pg');
// Configurar la conexión a la base de datos 
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
function verificarColumna() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            console.log('Verificando columna estado en pagos_servicios...');
            // Consulta para obtener información de la columna
            const query = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pagos_servicios' AND column_name = 'estado';
    `;
            const result = yield client.query(query);
            if (result.rows.length > 0) {
                console.log('¡La columna estado existe!');
                console.log('Detalles de la columna:', result.rows[0]);
            }
            else {
                console.log('La columna estado NO existe en la tabla pagos_servicios.');
            }
        }
        catch (error) {
            console.error('Error al verificar la columna:', error);
        }
        finally {
            client.release();
            pool.end();
        }
    });
}
verificarColumna();
//# sourceMappingURL=verificar-columna.js.map
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
const fs = require('fs');
const path = require('path');
// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, '../sql/add_estado_to_pagos_servicios.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');
// Configurar la conexión a la base de datos usando la URL de conexión de .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
function ejecutarSQL() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            console.log('Ejecutando SQL para añadir columna estado...');
            yield client.query(sql);
            console.log('¡SQL ejecutado con éxito! Columna estado añadida a pagos_servicios.');
        }
        catch (error) {
            console.error('Error al ejecutar SQL:', error);
        }
        finally {
            client.release();
            pool.end();
        }
    });
}
ejecutarSQL();
//# sourceMappingURL=ejecutar-sql.js.map
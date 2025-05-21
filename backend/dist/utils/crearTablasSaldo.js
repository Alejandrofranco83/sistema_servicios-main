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
/**
 * Script para crear las tablas necesarias para el módulo de uso/devolución
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
function crearTablas() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            console.log('Iniciando creación de tablas...');
            // Iniciar transacción
            yield client.query('BEGIN');
            // Crear tabla uso_devolucion si no existe
            yield client.query(`
      CREATE TABLE IF NOT EXISTS uso_devolucion (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('USO', 'DEVOLUCION')),
        persona_id INTEGER NOT NULL,
        persona_nombre VARCHAR(255) NOT NULL,
        guaranies BIGINT DEFAULT 0,
        dolares DECIMAL(12, 2) DEFAULT 0,
        reales DECIMAL(12, 2) DEFAULT 0,
        motivo TEXT NOT NULL,
        usuario_id INTEGER NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        anulado BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_persona FOREIGN KEY (persona_id) REFERENCES persona(id),
        CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
      )
    `);
            console.log('✅ Tabla uso_devolucion creada o ya existe');
            // Crear tabla saldo_persona si no existe
            yield client.query(`
      CREATE TABLE IF NOT EXISTS saldo_persona (
        id SERIAL PRIMARY KEY,
        persona_id INTEGER UNIQUE NOT NULL,
        guaranies DOUBLE PRECISION DEFAULT 0,
        dolares DOUBLE PRECISION DEFAULT 0,
        reales DOUBLE PRECISION DEFAULT 0,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
      )
    `);
            console.log('✅ Tabla saldo_persona creada o ya existe');
            // Commit de la transacción
            yield client.query('COMMIT');
            console.log('✅ Todas las tablas fueron creadas correctamente');
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('❌ Error al crear las tablas:', error);
            throw error;
        }
        finally {
            client.release();
            console.log('Cliente liberado');
        }
    });
}
// Ejecutar la función principal
crearTablas()
    .then(() => {
    console.log('🚀 Script finalizado correctamente');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
});
//# sourceMappingURL=crearTablasSaldo.js.map
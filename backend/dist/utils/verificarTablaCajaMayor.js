"use strict";
/**
 * Script para verificar y crear la tabla caja_mayor_movimientos si no existe
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
function verificarYCrearTabla() {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            client = yield pool.connect();
            console.log('Conexión establecida. Verificando tabla caja_mayor_movimientos...');
            // Verificar si la tabla existe
            const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'caja_mayor_movimientos'
      );
    `;
            const tableExists = yield client.query(checkTableQuery);
            if (!tableExists.rows[0].exists) {
                console.log('La tabla caja_mayor_movimientos no existe. Creándola...');
                // Crear la tabla con la estructura adecuada
                const createTableQuery = `
        CREATE TABLE caja_mayor_movimientos (
          id SERIAL PRIMARY KEY,
          "fechaHora" TIMESTAMP NOT NULL DEFAULT NOW(),
          tipo VARCHAR(50) NOT NULL,
          "operacionId" VARCHAR(50),
          moneda VARCHAR(50) NOT NULL,
          monto DECIMAL(15, 2) NOT NULL,
          "esIngreso" BOOLEAN NOT NULL,
          "saldoAnterior" DECIMAL(15, 2) NOT NULL,
          "saldoActual" DECIMAL(15, 2) NOT NULL,
          concepto TEXT,
          "usuarioId" INTEGER NOT NULL,
          "referenciaEntidad" VARCHAR(50),
          "observaciones" TEXT,
          "valeId" VARCHAR(50),
          "cambioMonedaId" VARCHAR(50),
          "usoDevolucionId" INTEGER,
          "depositoId" VARCHAR(50),
          "pagoServicioId" INTEGER,
          "movimientoId" VARCHAR(50),
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX caja_mayor_tipo_idx ON caja_mayor_movimientos(tipo);
        CREATE INDEX caja_mayor_fechahora_idx ON caja_mayor_movimientos("fechaHora");
        CREATE INDEX caja_mayor_moneda_idx ON caja_mayor_movimientos(moneda);
        CREATE INDEX caja_mayor_usuario_idx ON caja_mayor_movimientos("usuarioId");
      `;
                yield client.query(createTableQuery);
                console.log('✅ Tabla caja_mayor_movimientos creada exitosamente.');
                // Crear registros iniciales para cada moneda con saldo 0
                const monedas = ['guaranies', 'dolares', 'reales'];
                for (const moneda of monedas) {
                    console.log(`Creando registro inicial para ${moneda}...`);
                    const insertInitialRecord = `
          INSERT INTO caja_mayor_movimientos (
            tipo, "operacionId", moneda, monto, "esIngreso", 
            "saldoAnterior", "saldoActual", concepto, "usuarioId"
          ) VALUES (
            'Inicial', '0', $1, 0, true, 0, 0, 'Saldo inicial', 1
          );
        `;
                    yield client.query(insertInitialRecord, [moneda]);
                }
                console.log('✅ Registros iniciales creados exitosamente.');
            }
            else {
                console.log('✅ La tabla caja_mayor_movimientos ya existe.');
                // Verificar si hay registros
                const checkRecordsQuery = `SELECT COUNT(*) FROM caja_mayor_movimientos;`;
                const recordCount = yield client.query(checkRecordsQuery);
                console.log(`Número de registros en la tabla: ${recordCount.rows[0].count}`);
            }
            console.log('Proceso completado correctamente.');
        }
        catch (error) {
            console.error('❌ Error:', error);
        }
        finally {
            if (client) {
                client.release();
            }
            yield pool.end();
        }
    });
}
// Ejecutar la función principal
verificarYCrearTabla();
//# sourceMappingURL=verificarTablaCajaMayor.js.map
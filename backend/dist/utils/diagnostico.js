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
// Utilidad para diagnosticar problemas con la tabla caja_mayor_movimientos
require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');
console.log('Variables de entorno cargadas. DATABASE_URL existe:', !!process.env.DATABASE_URL);
// Configurar la conexión a la base de datos desde las variables de entorno
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
function diagnosticar() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('==== DIAGNÓSTICO DE TABLA caja_mayor_movimientos ====');
        try {
            // 1. Verificar si la tabla existe
            const tablaExiste = yield pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'caja_mayor_movimientos'
      );
    `);
            console.log(`¿Existe la tabla? ${tablaExiste.rows[0].exists ? 'SÍ' : 'NO'}`);
            if (!tablaExiste.rows[0].exists) {
                console.log('La tabla no existe, no se puede continuar el diagnóstico.');
                return;
            }
            // 2. Mostrar la estructura de la tabla
            console.log('\n- ESTRUCTURA DE COLUMNAS:');
            const columnas = yield pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'caja_mayor_movimientos' 
      ORDER BY ordinal_position
    `);
            columnas.rows.forEach(col => {
                console.log(`${col.column_name} - ${col.data_type} - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
            // 3. Contar registros
            const conteo = yield pool.query('SELECT COUNT(*) FROM caja_mayor_movimientos');
            console.log(`\nNúmero total de registros: ${conteo.rows[0].count}`);
            // 4. Mostrar algunos registros
            if (parseInt(conteo.rows[0].count) > 0) {
                console.log('\n- ÚLTIMOS 5 REGISTROS:');
                const registros = yield pool.query(`
        SELECT id, "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso" 
        FROM caja_mayor_movimientos 
        ORDER BY id DESC 
        LIMIT 5
      `);
                registros.rows.forEach(reg => {
                    console.log(`ID: ${reg.id}, Fecha: ${reg.fechaHora}, Tipo: ${reg.tipo}, OperaciónID: ${reg.operacionId}, Moneda: ${reg.moneda}, Monto: ${reg.monto}, EsIngreso: ${reg.esIngreso}`);
                });
            }
            // 5. Intentar insertar un registro de prueba
            console.log('\n- INTENTANDO INSERTAR UN REGISTRO DE PRUEBA:');
            // Primero buscar el último movimiento para calcular saldos
            const ultimoMovimientoQuery = yield pool.query(`
      SELECT id, "saldoActual" 
      FROM caja_mayor_movimientos 
      WHERE moneda = 'guaranies'
      ORDER BY id DESC 
      LIMIT 1
    `);
            const saldoAnterior = ultimoMovimientoQuery.rows.length > 0
                ? parseFloat(ultimoMovimientoQuery.rows[0].saldoActual)
                : 0;
            const montoTest = 100;
            const saldoActualTest = saldoAnterior + montoTest;
            // Ahora intentar insertar
            try {
                const fechaActual = new Date();
                const insertResult = yield pool.query(`
        INSERT INTO caja_mayor_movimientos (
          "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
          "saldoAnterior", "saldoActual", concepto, "usuarioId", 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
                    fechaActual, // fechaHora
                    'Diagnóstico', // tipo
                    '999', // operacionId
                    'guaranies', // moneda
                    montoTest, // monto
                    true, // esIngreso
                    saldoAnterior, // saldoAnterior
                    saldoActualTest, // saldoActual
                    'Prueba de diagnóstico', // concepto
                    1, // usuarioId (usuario 1 por defecto)
                    fechaActual, // createdAt
                    fechaActual // updatedAt
                ]);
                console.log(`✅ Registro de prueba insertado exitosamente con ID: ${insertResult.rows[0].id}`);
                // Eliminar el registro de prueba para no dejar datos falsos
                yield pool.query(`DELETE FROM caja_mayor_movimientos WHERE id = $1`, [insertResult.rows[0].id]);
                console.log(`✅ Registro de prueba eliminado exitosamente`);
            }
            catch (error) {
                console.error('❌ Error al insertar registro de prueba:', error.message);
                // Analizar el error con más detalle
                console.log('\n- ANÁLISIS DEL ERROR:');
                if (error.code === '42P01') {
                    console.log('Error: La tabla no existe (aunque el chequeo inicial dijo que sí)');
                }
                else if (error.code === '42703') {
                    console.log('Error: Columna desconocida');
                    console.log(`Detalles: ${error.message}`);
                }
                else if (error.code === '23502') {
                    console.log('Error: Restricción NOT NULL violada');
                    console.log(`Detalles: ${error.message}`);
                }
                else if (error.code === '23505') {
                    console.log('Error: Restricción UNIQUE violada');
                    console.log(`Detalles: ${error.message}`);
                }
                else {
                    console.log(`Código de error: ${error.code}`);
                    console.log(`Detalles: ${error.message}`);
                }
            }
        }
        catch (error) {
            console.error('❌ Error durante el diagnóstico:', error);
        }
        finally {
            yield pool.end();
            console.log('\n==== FIN DEL DIAGNÓSTICO ====');
        }
    });
}
// Ejecutar el diagnóstico
diagnosticar().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=diagnostico.js.map
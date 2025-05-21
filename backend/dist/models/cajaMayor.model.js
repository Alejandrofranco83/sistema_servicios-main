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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CajaMayorModel = void 0;
const pg_1 = require("pg");
const dbUtils_1 = require("../utils/dbUtils");
// Crear un pool de conexiones
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
exports.CajaMayorModel = {
    // Obtener todos los movimientos o los últimos N
    findAll: (limit) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let query = `
        SELECT * FROM caja_mayor_movimientos 
        ORDER BY "fechaHora" DESC
      `;
            const values = [];
            if (limit && limit > 0) {
                query += ` LIMIT $1`;
                values.push(limit);
            }
            const result = yield pool.query(query, values);
            return result.rows;
        }
        catch (error) {
            console.error('Error al obtener movimientos de caja mayor:', error);
            throw error;
        }
    }),
    // Obtener movimientos de una moneda específica
    findByMoneda: (moneda, limit) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let query = `
        SELECT * FROM caja_mayor_movimientos 
        WHERE moneda = $1 
        ORDER BY "fechaHora" DESC
      `;
            const values = [moneda];
            if (limit && limit > 0) {
                query += ` LIMIT $2`;
                values.push(limit);
            }
            const result = yield pool.query(query, values);
            return result.rows;
        }
        catch (error) {
            console.error(`Error al obtener movimientos de moneda ${moneda}:`, error);
            throw error;
        }
    }),
    // Crear un nuevo movimiento
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Creando nuevo movimiento en caja mayor:', data);
        try {
            // 1. Buscar el último movimiento para esta moneda para obtener el saldo actual
            const ultimoMovimientoQuery = yield pool.query(`
        SELECT id, "saldoActual" 
        FROM caja_mayor_movimientos 
        WHERE moneda = $1 
        ORDER BY id DESC 
        LIMIT 1
      `, [data.moneda]);
            // 2. Calcular saldos
            const ultimoMovimiento = ultimoMovimientoQuery.rows[0];
            const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual) : 0;
            const esIngreso = data.operacion === 'ingreso';
            const saldoActual = esIngreso ? saldoAnterior + data.monto : saldoAnterior - data.monto;
            console.log(`Saldo anterior: ${saldoAnterior}, Nuevo saldo: ${saldoActual}`);
            // 3. Insertar el nuevo movimiento
            const fechaActual = new Date();
            const query = `
        INSERT INTO caja_mayor_movimientos (
          "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
          "saldoAnterior", "saldoActual", concepto, "usuarioId", 
          "referenciaEntidad", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
            const values = [
                fechaActual, // fechaHora
                data.tipo, // tipo
                data.referencia_id ? data.referencia_id.toString() : null, // operacionId
                data.moneda, // moneda
                data.monto, // monto
                esIngreso, // esIngreso
                saldoAnterior, // saldoAnterior
                saldoActual, // saldoActual
                data.concepto, // concepto
                data.usuario_id, // usuarioId
                data.referencia_tipo || null, // referenciaEntidad
                fechaActual, // createdAt
                fechaActual // updatedAt
            ];
            const result = yield pool.query(query, values);
            if (result.rows && result.rows.length > 0) {
                console.log('Movimiento creado exitosamente:', result.rows[0]);
                return result.rows[0];
            }
            else {
                throw new Error('La inserción no retornó un ID');
            }
        }
        catch (error) {
            console.error('Error al crear movimiento en caja mayor:', error);
            // Intenta usar el método de utilidad si está disponible y dbUtils tiene el método
            if (dbUtils_1.dbUtils && typeof dbUtils_1.dbUtils.registrarMovimientoCajaMayor === 'function') {
                try {
                    console.log('Intentando crear movimiento con método alternativo...');
                    yield dbUtils_1.dbUtils.registrarMovimientoCajaMayor(data.referencia_id || 0, data.moneda, data.monto, data.operacion === 'ingreso', data.concepto, data.usuario_id, 0 // usoDevolucionId
                    );
                    return { success: true, message: 'Movimiento registrado con método alternativo' };
                }
                catch (utilError) {
                    console.error('Error al crear movimiento con método alternativo:', utilError);
                }
            }
            throw error; // Lanzar el error original
        }
    }),
    // Obtener saldos actuales
    getSaldos: () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Consultar el último movimiento para cada moneda usando SQL directo
            const monedas = ['guaranies', 'dolares', 'reales'];
            const saldos = {
                guaranies: 0,
                dolares: 0,
                reales: 0
            };
            for (const moneda of monedas) {
                const result = yield pool.query(`
          SELECT "saldoActual" 
          FROM caja_mayor_movimientos 
          WHERE moneda = $1 
          ORDER BY id DESC 
          LIMIT 1
        `, [moneda]);
                if (result.rows && result.rows.length > 0) {
                    saldos[moneda] = parseFloat(result.rows[0].saldoActual);
                }
            }
            return saldos;
        }
        catch (error) {
            console.error('Error al obtener saldos de caja mayor:', error);
            throw error;
        }
    }),
    // Obtener totales de ingresos y egresos del mes actual
    getResumenMes: () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Obtener el primer y último día del mes actual
            const now = new Date();
            const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
            const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            // Consultar los totales de ingresos agrupados por moneda usando SQL directo
            const ingresosResult = yield pool.query(`
        SELECT 
          moneda, 
          SUM(CAST(monto AS DECIMAL(20, 2))) as total
        FROM 
          caja_mayor_movimientos
        WHERE 
          "fechaHora" BETWEEN $1 AND $2
          AND "esIngreso" = true
        GROUP BY 
          moneda
      `, [primerDiaMes, ultimoDiaMes]);
            // Consultar los totales de egresos agrupados por moneda
            const egresosResult = yield pool.query(`
        SELECT 
          moneda, 
          SUM(CAST(monto AS DECIMAL(20, 2))) as total
        FROM 
          caja_mayor_movimientos
        WHERE 
          "fechaHora" BETWEEN $1 AND $2
          AND "esIngreso" = false
        GROUP BY 
          moneda
      `, [primerDiaMes, ultimoDiaMes]);
            // Formatear los resultados
            const ingresosMes = {
                guaranies: 0,
                dolares: 0,
                reales: 0
            };
            const egresosMes = {
                guaranies: 0,
                dolares: 0,
                reales: 0
            };
            // Procesar ingresos
            if (ingresosResult.rows) {
                ingresosResult.rows.forEach((ingreso) => {
                    ingresosMes[ingreso.moneda] = parseFloat(ingreso.total);
                });
            }
            // Procesar egresos
            if (egresosResult.rows) {
                egresosResult.rows.forEach((egreso) => {
                    egresosMes[egreso.moneda] = parseFloat(egreso.total);
                });
            }
            return {
                ingresosMes,
                egresosMes
            };
        }
        catch (error) {
            console.error('Error al obtener resumen de mes para caja mayor:', error);
            throw error;
        }
    }),
    // Buscar un movimiento por su ID
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const query = `
        SELECT * FROM caja_mayor_movimientos 
        WHERE id = $1
      `;
            const result = yield pool.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        }
        catch (error) {
            console.error(`Error al obtener movimiento con ID ${id}:`, error);
            throw error;
        }
    })
};
//# sourceMappingURL=cajaMayor.model.js.map
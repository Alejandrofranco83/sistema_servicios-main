import { Pool } from 'pg';
import { dbUtils } from '../utils/dbUtils';

// Crear un pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export interface MovimientoCajaInput {
  tipo: string;
  concepto: string;
  moneda: 'guaranies' | 'dolares' | 'reales';
  monto: number;
  operacion: 'egreso' | 'ingreso';
  referencia_id?: number;
  referencia_tipo?: string;
  usuario_id: number;
}

// Interfaz para resultados SQL
interface IngresoEgreso {
  moneda: string;
  total: string;
}

export const CajaMayorModel = {
  // Obtener todos los movimientos o los últimos N
  findAll: async (limit?: number) => {
    try {
      let query = `
        SELECT * FROM caja_mayor_movimientos 
        ORDER BY "fechaHora" DESC
      `;
      const values: any[] = [];

      if (limit && limit > 0) {
        query += ` LIMIT $1`;
        values.push(limit);
      }

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener movimientos de caja mayor:', error);
      throw error;
    }
  },

  // Obtener movimientos de una moneda específica
  findByMoneda: async (moneda: string, limit?: number) => {
    try {
      let query = `
        SELECT * FROM caja_mayor_movimientos 
        WHERE moneda = $1 
        ORDER BY "fechaHora" DESC
      `;
      const values: any[] = [moneda];

      if (limit && limit > 0) {
        query += ` LIMIT $2`;
        values.push(limit);
      }

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener movimientos de moneda ${moneda}:`, error);
      throw error;
    }
  },

  // Crear un nuevo movimiento
  create: async (data: MovimientoCajaInput) => {
    console.log('Creando nuevo movimiento en caja mayor:', data);
    
    try {
      // 1. Buscar el último movimiento para esta moneda para obtener el saldo actual
      const ultimoMovimientoQuery = await pool.query(`
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
        fechaActual,                                // fechaHora
        data.tipo,                                  // tipo
        data.referencia_id ? data.referencia_id.toString() : null, // operacionId
        data.moneda,                                // moneda
        data.monto,                                 // monto
        esIngreso,                                  // esIngreso
        saldoAnterior,                              // saldoAnterior
        saldoActual,                                // saldoActual
        data.concepto,                              // concepto
        data.usuario_id,                            // usuarioId
        data.referencia_tipo || null,               // referenciaEntidad
        fechaActual,                                // createdAt
        fechaActual                                 // updatedAt
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows && result.rows.length > 0) {
        console.log('Movimiento creado exitosamente:', result.rows[0]);
        return result.rows[0];
      } else {
        throw new Error('La inserción no retornó un ID');
      }
    } catch (error) {
      console.error('Error al crear movimiento en caja mayor:', error);
      
      // Intenta usar el método de utilidad si está disponible y dbUtils tiene el método
      if (dbUtils && typeof dbUtils.registrarMovimientoCajaMayor === 'function') {
        try {
          console.log('Intentando crear movimiento con método alternativo...');
          await dbUtils.registrarMovimientoCajaMayor(
            data.referencia_id || 0,
            data.moneda,
            data.monto,
            data.operacion === 'ingreso',
            data.concepto,
            data.usuario_id,
            0 // usoDevolucionId
          );
          return { success: true, message: 'Movimiento registrado con método alternativo' };
        } catch (utilError) {
          console.error('Error al crear movimiento con método alternativo:', utilError);
        }
      }
      
      throw error; // Lanzar el error original
    }
  },

  // Obtener saldos actuales
  getSaldos: async () => {
    try {
      // Consultar el último movimiento para cada moneda usando SQL directo
      const monedas = ['guaranies', 'dolares', 'reales'];
      const saldos: { [key: string]: number } = {
        guaranies: 0,
        dolares: 0,
        reales: 0
      };

      for (const moneda of monedas) {
        const result = await pool.query(`
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
    } catch (error) {
      console.error('Error al obtener saldos de caja mayor:', error);
      throw error;
    }
  },

  // Obtener totales de ingresos y egresos del mes actual
  getResumenMes: async () => {
    try {
      // Obtener el primer y último día del mes actual
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Consultar los totales de ingresos agrupados por moneda usando SQL directo
      const ingresosResult = await pool.query(`
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
      const egresosResult = await pool.query(`
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
      const ingresosMes: { [key: string]: number } = {
        guaranies: 0,
        dolares: 0,
        reales: 0
      };
      
      const egresosMes: { [key: string]: number } = {
        guaranies: 0,
        dolares: 0,
        reales: 0
      };
      
      // Procesar ingresos
      if (ingresosResult.rows) {
        ingresosResult.rows.forEach((ingreso: IngresoEgreso) => {
          ingresosMes[ingreso.moneda] = parseFloat(ingreso.total);
        });
      }
      
      // Procesar egresos
      if (egresosResult.rows) {
        egresosResult.rows.forEach((egreso: IngresoEgreso) => {
          egresosMes[egreso.moneda] = parseFloat(egreso.total);
        });
      }
      
      return {
        ingresosMes,
        egresosMes
      };
    } catch (error) {
      console.error('Error al obtener resumen de mes para caja mayor:', error);
      throw error;
    }
  },

  // Buscar un movimiento por su ID
  findById: async (id: number) => {
    try {
      const query = `
        SELECT * FROM caja_mayor_movimientos 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener movimiento con ID ${id}:`, error);
      throw error;
    }
  }
}; 
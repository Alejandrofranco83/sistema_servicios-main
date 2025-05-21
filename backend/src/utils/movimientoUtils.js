/**
 * Utilidades para el manejo de movimientos en la caja mayor
 */
const { PrismaClient } = require('@prisma/client');
const db = require('../config/db');

const prisma = new PrismaClient();

/**
 * Mapea el nombre de la moneda al formato esperado en la base de datos
 * @param {string} moneda - Nombre de la moneda
 * @returns {string} - Moneda normalizada
 */
function mapearMoneda(moneda) {
  // Verificar si es null o undefined
  if (!moneda) return 'guaranies';
  
  // Si ya viene en el formato esperado por el frontend, no modificarlo
  if (moneda === 'guaranies' || moneda === 'dolares' || moneda === 'reales') {
    return moneda;
  }
  
  // Normalizar el nombre de la moneda para uniformidad
  moneda = moneda.toUpperCase();
  
  // Mapear a los nombres esperados por el frontend
  if (moneda === 'GUARANIES' || moneda === 'GS' || moneda === 'PYG') return 'guaranies';
  if (moneda === 'DOLARES' || moneda === 'USD') return 'dolares'; 
  if (moneda === 'REALES' || moneda === 'BRL') return 'reales';
  
  // Valor por defecto
  return moneda;
}

/**
 * Registra un movimiento en la tabla caja_mayor_movimientos
 * @param {Object} datos - Datos del movimiento
 * @returns {Promise<Object>} - Movimiento registrado
 */
async function registrarMovimiento({
  operacionId,
  moneda,
  monto,
  esIngreso,
  concepto,
  usuarioId,
  usoDevolucionId
}) {
  // Normalizar la moneda
  moneda = mapearMoneda(moneda);
  console.log(`📊 Registrando movimiento de caja mayor: ${moneda} ${monto} (${esIngreso ? 'Ingreso' : 'Egreso'})`);
  
  try {
    // Obtener el último movimiento para esta moneda
    console.log(`Buscando último movimiento para moneda: ${moneda}`);
    const ultimoMovimiento = await db.query(
      `SELECT * FROM caja_mayor_movimientos 
       WHERE moneda = $1 
       ORDER BY "fechaHora" DESC 
       LIMIT 1`,
      [moneda]
    );
    
    let saldoAnterior = 0;
    if (ultimoMovimiento.rows.length > 0) {
      saldoAnterior = parseFloat(ultimoMovimiento.rows[0].saldoActual);
      console.log(`Último movimiento encontrado, saldo anterior: ${saldoAnterior}`);
    } else {
      console.log('No se encontraron movimientos previos, saldo anterior: 0');
    }
    
    // Calcular el saldo actual
    const saldoActual = esIngreso 
      ? saldoAnterior + parseFloat(monto) 
      : saldoAnterior - parseFloat(monto);
    
    console.log(`Calculando nuevo saldo: ${saldoAnterior} ${esIngreso ? '+' : '-'} ${monto} = ${saldoActual}`);
    
    // Insertar el nuevo movimiento
    console.log('Insertando nuevo movimiento en la base de datos...');
    const result = await db.query(
      `INSERT INTO caja_mayor_movimientos (
        "tipo", "operacionId", "moneda", "monto", "esIngreso", 
        "saldoAnterior", "saldoActual", "concepto", "usuarioId", "usoDevolucionId", 
        "fechaHora", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW()
      ) RETURNING *`,
      [
        'USO_DEVOLUCION', // tipo
        operacionId, // operacionId
        moneda, // moneda
        monto, // monto
        esIngreso, // esIngreso
        saldoAnterior, // saldoAnterior
        saldoActual, // saldoActual
        concepto, // concepto
        usuarioId, // usuarioId
        usoDevolucionId // usoDevolucionId
      ]
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Movimiento registrado correctamente con ID: ${result.rows[0].id}`);
      return result.rows[0];
    } else {
      throw new Error('No se pudo registrar el movimiento');
    }
  } catch (error) {
    console.error('❌ Error al registrar movimiento en caja_mayor_movimientos:', error);
    throw error;
  }
}

/**
 * Registra los movimientos en caja mayor para un uso o devolución
 * @param {Object} datos - Datos de la operación
 * @returns {Promise<Object[]>} - Movimientos registrados
 */
async function registrarMovimientoUsoDevolucion({
  id,
  tipo,
  guaranies,
  dolares,
  reales,
  persona_nombre,
  usuario_id
}) {
  console.log(`🔄 Registrando movimientos para ${tipo} de ${persona_nombre}`);
  const resultados = [];
  
  try {
    // Determinar si es ingreso o egreso según el tipo de operación
    const esIngresoGuaranies = tipo === 'USO';
    const esIngresoDolares = tipo === 'USO';
    const esIngresoReales = tipo === 'USO';
    
    // Registrar movimiento para guaraníes si hay monto
    if (guaranies && guaranies > 0) {
      console.log(`Procesando guaraníes: ${guaranies}`);
      const movimientoGuaranies = await registrarMovimiento({
        operacionId: id,
        moneda: 'guaranies',
        monto: guaranies,
        esIngreso: esIngresoGuaranies,  // USO = true, DEVOLUCION = false
        concepto: `${tipo === 'USO' ? 'Uso' : 'Devolución'} de efectivo - ${persona_nombre}`,
        usuarioId: usuario_id,
        usoDevolucionId: id
      });
      resultados.push(movimientoGuaranies);
    }
    
    // Registrar movimiento para dólares si hay monto
    if (dolares && dolares > 0) {
      console.log(`Procesando dólares: ${dolares}`);
      const movimientoDolares = await registrarMovimiento({
        operacionId: id,
        moneda: 'dolares',
        monto: dolares,
        esIngreso: esIngresoDolares,  // USO = true, DEVOLUCION = false
        concepto: `${tipo === 'USO' ? 'Uso' : 'Devolución'} de efectivo - ${persona_nombre}`,
        usuarioId: usuario_id,
        usoDevolucionId: id
      });
      resultados.push(movimientoDolares);
    }
    
    // Registrar movimiento para reales si hay monto
    if (reales && reales > 0) {
      console.log(`Procesando reales: ${reales}`);
      const movimientoReales = await registrarMovimiento({
        operacionId: id,
        moneda: 'reales',
        monto: reales,
        esIngreso: esIngresoReales,  // USO = true, DEVOLUCION = false
        concepto: `${tipo === 'USO' ? 'Uso' : 'Devolución'} de efectivo - ${persona_nombre}`,
        usuarioId: usuario_id,
        usoDevolucionId: id
      });
      resultados.push(movimientoReales);
    }
    
    console.log(`✅ Se registraron ${resultados.length} movimientos correctamente`);
    return resultados;
  } catch (error) {
    console.error('❌ Error al registrar movimientos para uso/devolución:', error);
    throw error;
  }
}

module.exports = {
  registrarMovimiento,
  registrarMovimientoUsoDevolucion
}; 
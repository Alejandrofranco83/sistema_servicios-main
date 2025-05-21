/**
 * Modelo para manejar las operaciones de uso y devolución de efectivo
 */
const { PrismaClient } = require('@prisma/client');
const { registrarMovimientoUsoDevolucion } = require('../utils/movimientoUtils');
const db = require('../config/db');

const prisma = new PrismaClient();

class UsoDevolucionModel {
  /**
   * Crea un nuevo registro de uso o devolución de efectivo
   * @param {Object} data - Datos de la operación
   * @returns {Promise<Object>} - El registro creado junto con su saldo
   */
  async create(data) {
    try {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        console.log('Iniciando transacción para crear registro de uso/devolución');

        // Insertar en la tabla uso_devolucion
        const query = `
          INSERT INTO uso_devolucion (
            tipo, guaranies, dolares, reales, persona_id, persona_nombre, 
            motivo, usuario_id, anulado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        const values = [
          data.tipo,
          data.guaranies || 0,
          data.dolares || 0,
          data.reales || 0,
          data.persona_id,
          data.persona_nombre,
          data.motivo,
          data.usuario_id,
          false // No anulado por defecto
        ];

        console.log('Ejecutando consulta para insertar registro de uso/devolución');
        const result = await client.query(query, values);
        const nuevoRegistro = result.rows[0];
        console.log(`Registro creado con ID: ${nuevoRegistro.id}`);

        // Actualizar saldo de la persona
        console.log(`Actualizando saldo para persona_id: ${data.persona_id}`);
        const saldoActual = await this.getSaldoPersona(data.persona_id);
        console.log(`Saldo actual de la persona: ${JSON.stringify(saldoActual)}`);

        // Preparar los valores para la actualización de saldo
        const updateValues = [];
        const updateSets = [];

        if (data.guaranies && data.guaranies > 0) {
          const nuevoSaldoGs = data.tipo === 'USO' 
            ? (saldoActual.guaranies || 0) - data.guaranies 
            : (saldoActual.guaranies || 0) + data.guaranies;
          updateSets.push(`guaranies = $${updateValues.length + 1}`);
          updateValues.push(nuevoSaldoGs);
        }

        if (data.dolares && data.dolares > 0) {
          const nuevoSaldoUsd = data.tipo === 'USO' 
            ? (saldoActual.dolares || 0) - data.dolares 
            : (saldoActual.dolares || 0) + data.dolares;
          updateSets.push(`dolares = $${updateValues.length + 1}`);
          updateValues.push(nuevoSaldoUsd);
        }

        if (data.reales && data.reales > 0) {
          const nuevoSaldoBrl = data.tipo === 'USO' 
            ? (saldoActual.reales || 0) - data.reales 
            : (saldoActual.reales || 0) + data.reales;
          updateSets.push(`reales = $${updateValues.length + 1}`);
          updateValues.push(nuevoSaldoBrl);
        }

        // Solo actualizar si hay campos para actualizar
        if (updateSets.length > 0) {
          const updateQuery = `
            UPDATE saldo_persona 
            SET ${updateSets.join(', ')}, fecha_actualizacion = NOW()
            WHERE persona_id = $${updateValues.length + 1}
          `;
          updateValues.push(data.persona_id);

          console.log('Ejecutando actualización de saldo de persona');
          await client.query(updateQuery, updateValues);
        }

        // Registrar movimientos en la caja mayor
        console.log('Registrando movimientos en caja mayor');
        await registrarMovimientoUsoDevolucion({
          id: nuevoRegistro.id,
          tipo: data.tipo,
          guaranies: data.guaranies || 0,
          dolares: data.dolares || 0,
          reales: data.reales || 0,
          persona_nombre: data.persona_nombre,
          usuario_id: data.usuario_id
        });

        // Obtener el saldo actualizado
        const saldoActualizado = await this.getSaldoPersona(data.persona_id);

        await client.query('COMMIT');
        console.log('Transacción completada exitosamente');
        
        return {
          operacion: nuevoRegistro,
          saldo: saldoActualizado
        };
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción, se ha revertido:', error);
        throw error;
      } finally {
        client.release();
        console.log('Cliente de base de datos liberado');
      }
    } catch (error) {
      console.error('Error al crear uso/devolución:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las operaciones de uso y devolución
   * @param {Object} filters - Filtros para la consulta
   * @returns {Promise<Array>} - Lista de operaciones
   */
  async getAll(filters = {}) {
    try {
      // Construir el objeto de filtros para Prisma
      const where = { anulado: false };

      if (filters.persona_id) {
        where.persona_id = filters.persona_id;
      }

      if (filters.tipo) {
        where.tipo = filters.tipo;
      }

      if (filters.fecha_inicio && filters.fecha_fin) {
        where.fecha_creacion = {
          gte: new Date(filters.fecha_inicio),
          lte: new Date(filters.fecha_fin)
        };
      }

      const operaciones = await prisma.usoDevolucion.findMany({
        where,
        include: {
          persona: true,
          usuario: true
        },
        orderBy: {
          fecha_creacion: 'desc'
        },
        take: filters.limit,
        skip: filters.offset
      });

      // Convertir BigInt a número para la respuesta
      return operaciones.map((op) => ({
        ...op,
        guaranies: Number(op.guaranies)
      }));
    } catch (error) {
      console.error('Error al obtener registros de uso/devolución:', error);
      throw error;
    }
  }

  /**
   * Obtiene un registro de uso/devolución por su ID
   * @param {number} id - ID del registro
   * @returns {Promise<Object|null>} - Registro encontrado o null
   */
  async getById(id) {
    try {
      const operacion = await prisma.usoDevolucion.findUnique({
        where: { id },
        include: {
          persona: true,
          usuario: true
        }
      });

      if (!operacion) return null;

      // Convertir BigInt a número para la respuesta
      return {
        ...operacion,
        guaranies: Number(operacion.guaranies)
      };
    } catch (error) {
      console.error(`Error al obtener registro de uso/devolución ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el saldo actual de una persona
   * @param {number} personaId - ID de la persona
   * @returns {Promise<Object>} - Saldo de la persona
   */
  async getSaldoPersona(personaId) {
    try {
      console.log(`Consultando saldo para persona_id: ${personaId}`);
      const query = `
        SELECT * FROM saldo_persona 
        WHERE persona_id = $1
      `;
      const result = await db.query(query, [personaId]);
      return result.rows[0] || { 
        persona_id: personaId, 
        guaranies: 0, 
        dolares: 0, 
        reales: 0 
      };
    } catch (error) {
      console.error('Error al obtener saldo de persona:', error);
      throw error;
    }
  }

  /**
   * Anula un registro de uso o devolución
   * @param {number} id - ID del registro a anular
   * @param {number} usuario_id - ID del usuario que realiza la anulación
   * @returns {Promise<boolean>} - Resultado de la operación
   */
  async anular(id, usuario_id) {
    try {
      const operacion = await prisma.usoDevolucion.findUnique({
        where: { id }
      });

      if (!operacion || operacion.anulado) {
        return false;
      }

      // Comenzar una transacción
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Marcar la operación como anulada
        await tx.usoDevolucion.update({
          where: { id },
          data: { anulado: true }
        });

        // 2. Revertir el efecto en el saldo según el tipo de operación
        if (operacion.tipo === 'USO') {
          // Restar lo que habíamos sumado
          await tx.saldoPersona.update({
            where: { persona_id: operacion.persona_id },
            data: {
              guaranies: { decrement: operacion.guaranies },
              dolares: { decrement: operacion.dolares },
              reales: { decrement: operacion.reales },
              fecha_actualizacion: new Date()
            }
          });
        } else if (operacion.tipo === 'DEVOLUCION') {
          // Sumar lo que habíamos restado
          await tx.saldoPersona.update({
            where: { persona_id: operacion.persona_id },
            data: {
              guaranies: { increment: operacion.guaranies },
              dolares: { increment: operacion.dolares },
              reales: { increment: operacion.reales },
              fecha_actualizacion: new Date()
            }
          });
        }

        // 3. Registrar movimientos de anulación
        try {
          await registrarMovimientoUsoDevolucion({
            id,
            tipo: operacion.tipo === 'USO' ? 'DEVOLUCION' : 'USO', // Invertimos el tipo
            guaranies: Number(operacion.guaranies),
            dolares: Number(operacion.dolares),
            reales: Number(operacion.reales),
            persona_nombre: `Anulación - ${operacion.persona_nombre}`,
            usuario_id
          });
        } catch (error) {
          console.error('Error al registrar movimientos de anulación:', error);
          // Continuamos con la transacción aunque falle el registro de movimientos
        }
        
        return true;
      });

      return resultado;
    } catch (error) {
      console.error(`Error al anular registro de uso/devolución ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de operaciones de una persona
   * @param {number} persona_id - ID de la persona
   * @returns {Promise<Array>} - Historial de operaciones
   */
  async getHistorialPersona(persona_id) {
    try {
      const historial = await prisma.usoDevolucion.findMany({
        where: {
          persona_id,
          anulado: false
        },
        include: {
          usuario: true
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      // Convertir BigInt a número para la respuesta
      return historial.map((op) => ({
        ...op,
        guaranies: Number(op.guaranies)
      }));
    } catch (error) {
      console.error(`Error al obtener historial de persona ID ${persona_id}:`, error);
      throw error;
    }
  }
}

module.exports = new UsoDevolucionModel(); 
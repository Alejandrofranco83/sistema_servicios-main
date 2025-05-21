const usoDevolucionModel = require('../models/usoDevolucionModel');
const { validationResult } = require('express-validator');

/**
 * Controlador para operaciones de uso y devolución de efectivo
 */
class UsoDevolucionController {
  /**
   * Crea un nuevo registro de uso o devolución
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        tipo,
        persona_id,
        persona_nombre,
        guaranies,
        dolares,
        reales,
        motivo
      } = req.body;

      // Verificar que haya al menos un monto
      if ((guaranies || 0) <= 0 && (dolares || 0) <= 0 && (reales || 0) <= 0) {
        return res.status(400).json({
          message: 'Debe ingresar al menos un monto mayor a cero'
        });
      }

      // Crear el registro
      const resultado = await usoDevolucionModel.create({
        tipo,
        persona_id,
        persona_nombre,
        guaranies: guaranies || 0,
        dolares: dolares || 0,
        reales: reales || 0,
        motivo,
        usuario_id: req.user.id // Usuario autenticado
      });

      res.status(201).json({
        message: `${tipo === 'USO' ? 'Uso' : 'Devolución'} registrado con éxito`,
        data: resultado.operacion,
        saldo: resultado.saldo
      });
    } catch (error) {
      console.error('Error al crear uso/devolución:', error);
      res.status(500).json({
        message: 'Error al procesar la solicitud',
        error: error.message
      });
    }
  }

  /**
   * Obtiene todas las operaciones de uso y devolución
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getAll(req, res) {
    try {
      const { 
        persona_id, 
        tipo, 
        fecha_inicio, 
        fecha_fin,
        limit,
        offset
      } = req.query;

      const filters = {
        persona_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      };

      const operaciones = await usoDevolucionModel.getAll(filters);
      
      res.json(operaciones);
    } catch (error) {
      console.error('Error al obtener operaciones:', error);
      res.status(500).json({
        message: 'Error al obtener las operaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtiene una operación específica
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const operacion = await usoDevolucionModel.getById(id);
      
      if (!operacion) {
        return res.status(404).json({
          message: 'Operación no encontrada'
        });
      }

      res.json(operacion);
    } catch (error) {
      console.error(`Error al obtener operación ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al obtener la operación',
        error: error.message
      });
    }
  }

  /**
   * Anula una operación
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async anular(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id; // Usuario autenticado

      const resultado = await usoDevolucionModel.anular(id, usuario_id);
      
      if (!resultado) {
        return res.status(404).json({
          message: 'Operación no encontrada o ya anulada'
        });
      }

      res.json({
        message: 'Operación anulada con éxito'
      });
    } catch (error) {
      console.error(`Error al anular operación ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al anular la operación',
        error: error.message
      });
    }
  }

  /**
   * Obtiene el saldo de una persona
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getSaldoPersona(req, res) {
    try {
      const { id } = req.params;
      const saldo = await usoDevolucionModel.getSaldoPersona(id);
      
      res.json(saldo);
    } catch (error) {
      console.error(`Error al obtener saldo de persona ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al obtener el saldo',
        error: error.message
      });
    }
  }

  /**
   * Obtiene el historial de operaciones de una persona
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getHistorialPersona(req, res) {
    try {
      const { id } = req.params;
      const historial = await usoDevolucionModel.getHistorialPersona(id);
      
      res.json(historial);
    } catch (error) {
      console.error(`Error al obtener historial de persona ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al obtener el historial',
        error: error.message
      });
    }
  }
}

module.exports = new UsoDevolucionController(); 
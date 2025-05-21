import { Request, Response } from 'express';
import usoDevolucionModel from '../models/usoDevolucionModel';
import { validationResult } from 'express-validator';

// console.log('[DEBUG] *** Módulo usoDevolucionController.ts cargado ***');

// Definir una interfaz que extienda la Request de Express para incluir la propiedad user
// Asegúrate que la estructura coincida con lo que tu middleware añade.
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    // otros campos del payload si existen...
  };
}

/**
 * Controlador para operaciones de uso y devolución de efectivo
 */
class UsoDevolucionController {
  /**
   * Crea un nuevo registro de uso o devolución
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async create(req: AuthenticatedRequest, res: Response) {
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

      // Obtener usuario_id de forma segura
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        console.error('Error: No se pudo obtener el ID del usuario autenticado.');
        return res.status(401).json({ message: 'Usuario no autenticado correctamente.' });
      }

      // Crear el registro (pasando el usuario_id validado)
      const resultado = await usoDevolucionModel.create({
        tipo,
        persona_id,
        persona_nombre,
        guaranies: guaranies || 0,
        dolares: dolares || 0,
        reales: reales || 0,
        motivo,
        usuario_id
      });

      // Obtener el saldo actualizado
      const saldoActualizado = await usoDevolucionModel.getSaldoPersona(persona_id);

      res.status(201).json({
        message: `${tipo === 'USO' ? 'Uso' : 'Devolución'} registrado con éxito`,
        data: resultado,
        saldo: saldoActualizado
      });
    } catch (error: any) {
      console.error('Error al crear uso/devolución:', error);
      res.status(500).json({
        message: 'Error al procesar la solicitud',
        error: error.message || 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene todas las operaciones de uso y devolución
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async getAll(req: Request, res: Response) {
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
        persona_id: persona_id ? parseInt(persona_id as string) : undefined,
        tipo: tipo as ('USO' | 'DEVOLUCION' | undefined),
        fecha_inicio: fecha_inicio as string | undefined,
        fecha_fin: fecha_fin as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const operaciones = await usoDevolucionModel.getAll(filters);
      
      res.json(operaciones);
    } catch (error: any) {
      console.error('Error al obtener operaciones:', error);
      res.status(500).json({
        message: 'Error al obtener las operaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtiene una operación específica
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const operacion = await usoDevolucionModel.getById(parseInt(id));
      
      if (!operacion) {
        return res.status(404).json({
          message: 'Operación no encontrada'
        });
      }

      res.json(operacion);
    } catch (error: any) {
      console.error(`Error al obtener operación ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al obtener la operación',
        error: error.message
      });
    }
  }

  /**
   * Anula una operación
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async anular(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // @ts-ignore - Se asume que req.user existe por el middleware de autenticación
      const usuario_id = req.user.id;

      const resultado = await usoDevolucionModel.anular(parseInt(id), usuario_id);
      
      if (!resultado) {
        return res.status(404).json({
          message: 'Operación no encontrada o ya anulada'
        });
      }

      res.json({
        message: 'Operación anulada con éxito'
      });
    } catch (error: any) {
      console.error(`Error al anular operación ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al anular la operación',
        error: error.message
      });
    }
  }

  /**
   * Obtiene el saldo de una persona
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async getSaldoPersona(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const saldo = await usoDevolucionModel.getSaldoPersona(parseInt(id));
      
      res.json(saldo);
    } catch (error: any) {
      console.error(`Error al obtener saldo de persona ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al obtener el saldo',
        error: error.message
      });
    }
  }

  /**
   * Obtiene el historial de operaciones de una persona
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async getHistorialPersona(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const historial = await usoDevolucionModel.getHistorialPersona(parseInt(id));
      
      res.json(historial);
    } catch (error: any) {
      console.error(`Error al obtener historial de persona ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al obtener el historial',
        error: error.message
      });
    }
  }

  /**
   * Obtiene una operación por su ID de movimiento asociado
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async getPorMovimiento(req: Request, res: Response) {
    try {
      const { movimientoId } = req.params;
      
      if (!movimientoId) {
        return res.status(400).json({
          message: 'ID de movimiento no proporcionado'
        });
      }

      // Buscar la operación usando el ID del movimiento
      const operacion = await usoDevolucionModel.getByMovimientoId(parseInt(movimientoId));
      
      if (!operacion) {
        return res.status(404).json({
          message: 'No se encontró operación asociada a este movimiento'
        });
      }

      res.json(operacion);
    } catch (error: any) {
      console.error(`Error al obtener operación por movimiento ID ${req.params.movimientoId}:`, error);
      res.status(500).json({
        message: 'Error al obtener la operación por ID de movimiento',
        error: error.message
      });
    }
  }

  /**
   * Cancela una operación de uso/devolución
   * @param req - Objeto de solicitud
   * @param res - Objeto de respuesta
   */
  async cancelar(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { movimientoId, razon } = req.body;
      
      console.log(`CANCELACIÓN INICIADA: Operación ID: ${id}, Razón: ${razon}`);
      
      // Validar que existan los datos necesarios
      if (!id) {
        return res.status(400).json({
          message: 'ID de operación no proporcionado'
        });
      }

      // Obtener el ID del usuario que realiza la cancelación
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ 
          message: 'Usuario no autenticado correctamente' 
        });
      }

      // Realizar la cancelación
      const resultado = await usoDevolucionModel.cancelar(parseInt(id), usuario_id, razon);
      
      if (!resultado.success) {
        // Usamos el status del resultado si existe, o 400 por defecto
        const statusCode = 'status' in resultado ? resultado.status : 400;
        return res.status(statusCode).json({
          message: resultado.message || 'Error al cancelar la operación'
        });
      }

      // Si la operación fue exitosa
      return res.json({
        message: 'Operación cancelada correctamente',
        data: 'data' in resultado ? resultado.data : undefined
      });
    } catch (error: any) {
      console.error(`Error al cancelar operación ID ${req.params.id}:`, error);
      res.status(500).json({
        message: 'Error al cancelar la operación',
        error: error.message
      });
    }
  }

  /**
   * Obtiene todas las personas con saldo pendiente (no cero)
   * @param _req - Objeto de solicitud (no usado)
   * @param res - Objeto de respuesta
   */
  async getPersonasConSaldo(_req: Request, res: Response) {
    try {
      const personasConSaldo = await usoDevolucionModel.getPersonasConSaldo();
      res.json(personasConSaldo);
    } catch (error: any) {
      console.error('Error al obtener personas con saldo:', error);
      res.status(500).json({
        message: 'Error al obtener las personas con saldo pendiente',
        error: error.message
      });
    }
  }
}

export default new UsoDevolucionController(); 
import { Request, Response } from 'express';
import { ValeModel, ValeInput } from '../models/vale.model';
import { Prisma } from '@prisma/client';

export const ValeController = {
  getAllVales: async (_req: Request, res: Response) => {
    try {
      const vales = await ValeModel.findAll();
      return res.json(vales);
    } catch (error) {
      console.error('Error al obtener vales:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getValeById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const vale = await ValeModel.findById(id);
      
      if (!vale) {
        return res.status(404).json({ error: 'Vale no encontrado' });
      }
      
      return res.json(vale);
    } catch (error) {
      console.error('Error al obtener vale:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getValesByPersona: async (req: Request, res: Response) => {
    try {
      const personaId = parseInt(req.params.personaId);
      const vales = await ValeModel.findByPersona(personaId);
      
      return res.json(vales);
    } catch (error) {
      console.error('Error al obtener vales por persona:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getValesPendientes: async (_req: Request, res: Response) => {
    try {
      const vales = await ValeModel.findPendientes();
      return res.json(vales);
    } catch (error) {
      console.error('Error al obtener vales pendientes:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getEstadisticasVales: async (_req: Request, res: Response) => {
    try {
      const estadisticas = await ValeModel.getEstadisticas();
      return res.json(estadisticas);
    } catch (error) {
      console.error('Error al obtener estadísticas de vales:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createVale: async (req: Request, res: Response) => {
    try {
      const valeData: ValeInput = req.body;
      
      // Validar campos requeridos
      if (!valeData.moneda || !valeData.monto || !valeData.fecha_vencimiento || 
          !valeData.motivo || !valeData.persona_id || !valeData.persona_nombre ||
          !valeData.usuario_creador_id) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos para crear el vale' 
        });
      }

      // Parsear la fecha de vencimiento si viene como string
      if (typeof valeData.fecha_vencimiento === 'string') {
        valeData.fecha_vencimiento = new Date(valeData.fecha_vencimiento);
      }
      
      // Intentar crear el vale
      const nuevoVale = await ValeModel.create(valeData);
      return res.status(201).json(nuevoVale);
    } catch (error) {
      console.error('Error al crear vale:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(400).json({ 
            error: 'Ya existe un vale con ese número' 
          });
        }
      }
      
      return res.status(500).json({ 
        error: 'Error al crear el vale. Por favor, intente nuevamente.' 
      });
    }
  },

  updateVale: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const valeData: Partial<ValeInput> = req.body;
      
      // Parsear la fecha de vencimiento si viene como string
      if (typeof valeData.fecha_vencimiento === 'string') {
        valeData.fecha_vencimiento = new Date(valeData.fecha_vencimiento);
      }
      
      const valeActualizado = await ValeModel.update(id, valeData);
      return res.json(valeActualizado);
    } catch (error) {
      console.error('Error al actualizar vale:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  marcarValeCobrado: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const vale = await ValeModel.marcarCobrado(id);
      return res.json(vale);
    } catch (error) {
      console.error('Error al marcar vale como cobrado:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  marcarValeAnulado: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const vale = await ValeModel.marcarAnulado(id);
      return res.json(vale);
    } catch (error) {
      console.error('Error al marcar vale como anulado:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  marcarValeImpreso: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const vale = await ValeModel.marcarImpreso(id);
      return res.json(vale);
    } catch (error) {
      console.error('Error al marcar vale como impreso:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  deleteVale: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      await ValeModel.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar vale:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getValeByMovimientoId: async (req: Request, res: Response) => {
    try {
      const movimientoId = parseInt(req.params.movimientoId);
      
      if (isNaN(movimientoId)) {
        return res.status(400).json({ error: 'ID de movimiento inválido' });
      }
      
      const vale = await ValeModel.findByMovimientoId(movimientoId);
      
      if (!vale) {
        return res.status(404).json({ error: 'No se encontró vale asociado a este movimiento' });
      }
      
      return res.json(vale);
    } catch (error) {
      console.error('Error al obtener vale por ID de movimiento:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  cancelarVale: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { movimientoId, razon } = req.body;
      const usuarioId = req.body.usuarioId || 1; // Si no hay usuario, usar uno por defecto
      
      if (!movimientoId) {
        return res.status(400).json({ error: 'ID de movimiento es requerido' });
      }
      
      const resultado = await ValeModel.cancelarVale(
        id, 
        razon || 'Vale cancelado', 
        parseInt(movimientoId), 
        usuarioId
      );
      
      return res.json({
        mensaje: 'Vale cancelado exitosamente',
        ...resultado
      });
    } catch (error: any) {
      console.error('Error al cancelar vale:', error);
      return res.status(500).json({ 
        error: error.message || 'Error al cancelar el vale. Por favor, intente nuevamente.' 
      });
    }
  }
}; 
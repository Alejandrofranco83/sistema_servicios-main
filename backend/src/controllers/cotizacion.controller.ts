import { Request, Response } from 'express';
import { CotizacionModel, CotizacionInput } from '../models/cotizacion.model';

export class CotizacionController {
  // Obtener todas las cotizaciones
  static getCotizaciones = async (_req: Request, res: Response) => {
    try {
      const cotizaciones = await CotizacionModel.findAll();
      return res.json(cotizaciones);
    } catch (error) {
      console.error('Error al obtener cotizaciones:', error);
      return res.status(500).json({ error: 'Error al obtener cotizaciones' });
    }
  }

  // Obtener cotización vigente
  static getCotizacionVigente = async (_req: Request, res: Response) => {
    try {
      const cotizacion = await CotizacionModel.findVigente();
      
      if (!cotizacion) {
        return res.status(404).json({ error: 'No hay cotización vigente' });
      }
      
      return res.json(cotizacion);
    } catch (error) {
      console.error('Error al obtener cotización vigente:', error);
      return res.status(500).json({ error: 'Error al obtener cotización vigente' });
    }
  }

  // Obtener una cotización por ID
  static getCotizacionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cotizacion = await CotizacionModel.findById(Number(id));
      
      if (!cotizacion) {
        return res.status(404).json({ error: 'Cotización no encontrada' });
      }
      
      return res.json(cotizacion);
    } catch (error) {
      console.error('Error al obtener cotización:', error);
      return res.status(500).json({ error: 'Error al obtener cotización' });
    }
  }

  // Crear una nueva cotización
  static createCotizacion = async (req: Request, res: Response) => {
    try {
      const { valorDolar, valorReal } = req.body;
      
      // Validaciones básicas
      if (!valorDolar || !valorReal || valorDolar <= 0 || valorReal <= 0) {
        return res.status(400).json({ 
          error: 'Los valores de cotización deben ser números positivos' 
        });
      }
      
      // Obtener el ID del usuario autenticado desde el middleware de autenticación
      const usuarioId = req.usuarioId;
      
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const cotizacionData: CotizacionInput = {
        valorDolar,
        valorReal,
        usuarioId
      };
      
      const nuevaCotizacion = await CotizacionModel.create(cotizacionData);
      return res.status(201).json(nuevaCotizacion);
    } catch (error) {
      console.error('Error al crear cotización:', error);
      return res.status(500).json({ error: 'Error al crear cotización' });
    }
  }

  // Actualizar una cotización existente
  static updateCotizacion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { valorDolar, valorReal } = req.body;
      
      // Validaciones básicas
      if ((!valorDolar && !valorReal) || 
          (valorDolar && valorDolar <= 0) || 
          (valorReal && valorReal <= 0)) {
        return res.status(400).json({ 
          error: 'Los valores de cotización deben ser números positivos' 
        });
      }
      
      // Verificar que la cotización existe
      const cotizacionExistente = await CotizacionModel.findById(Number(id));
      
      if (!cotizacionExistente) {
        return res.status(404).json({ error: 'Cotización no encontrada' });
      }
      
      // Datos a actualizar
      const cotizacionData: Partial<CotizacionInput> = {};
      
      if (valorDolar) cotizacionData.valorDolar = valorDolar;
      if (valorReal) cotizacionData.valorReal = valorReal;
      
      const cotizacionActualizada = await CotizacionModel.update(Number(id), cotizacionData);
      return res.json(cotizacionActualizada);
    } catch (error) {
      console.error('Error al actualizar cotización:', error);
      return res.status(500).json({ error: 'Error al actualizar cotización' });
    }
  }

  // Eliminar una cotización
  static deleteCotizacion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      try {
        await CotizacionModel.delete(Number(id));
        return res.json({ message: 'Cotización eliminada correctamente' });
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      return res.status(500).json({ error: 'Error al eliminar cotización' });
    }
  }
} 
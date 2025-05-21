import { Request, Response } from 'express';
import { SueldoMinimoModel, SueldoMinimoInput } from '../models/sueldo-minimo.model';

export class SueldoMinimoController {
  // Obtener todos los sueldos mínimos
  static getSueldosMinimos = async (_req: Request, res: Response) => {
    try {
      const sueldosMinimos = await SueldoMinimoModel.findAll();
      return res.json(sueldosMinimos);
    } catch (error) {
      console.error('Error al obtener sueldos mínimos:', error);
      return res.status(500).json({ error: 'Error al obtener sueldos mínimos' });
    }
  }

  // Obtener sueldo mínimo vigente
  static getSueldoMinimoVigente = async (_req: Request, res: Response) => {
    try {
      const sueldoMinimo = await SueldoMinimoModel.findVigente();
      
      if (!sueldoMinimo) {
        return res.status(404).json({ error: 'No hay sueldo mínimo vigente' });
      }
      
      return res.json(sueldoMinimo);
    } catch (error) {
      console.error('Error al obtener sueldo mínimo vigente:', error);
      return res.status(500).json({ error: 'Error al obtener sueldo mínimo vigente' });
    }
  }

  // Obtener un sueldo mínimo por ID
  static getSueldoMinimoById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sueldoMinimo = await SueldoMinimoModel.findById(Number(id));
      
      if (!sueldoMinimo) {
        return res.status(404).json({ error: 'Sueldo mínimo no encontrado' });
      }
      
      return res.json(sueldoMinimo);
    } catch (error) {
      console.error('Error al obtener sueldo mínimo:', error);
      return res.status(500).json({ error: 'Error al obtener sueldo mínimo' });
    }
  }

  // Crear un nuevo sueldo mínimo
  static createSueldoMinimo = async (req: Request, res: Response) => {
    try {
      const { valor } = req.body;
      
      // Validaciones básicas
      if (!valor || valor <= 0) {
        return res.status(400).json({ 
          error: 'El valor del sueldo mínimo debe ser un número positivo' 
        });
      }
      
      // Obtener el ID del usuario autenticado desde el middleware de autenticación
      const usuarioId = req.usuarioId;
      
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const sueldoMinimoData: SueldoMinimoInput = {
        valor,
        usuarioId
      };
      
      const nuevoSueldoMinimo = await SueldoMinimoModel.create(sueldoMinimoData);
      return res.status(201).json(nuevoSueldoMinimo);
    } catch (error) {
      console.error('Error al crear sueldo mínimo:', error);
      return res.status(500).json({ error: 'Error al crear sueldo mínimo' });
    }
  }

  // Actualizar un sueldo mínimo existente
  static updateSueldoMinimo = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { valor } = req.body;
      
      // Validaciones básicas
      if (!valor || valor <= 0) {
        return res.status(400).json({ 
          error: 'El valor del sueldo mínimo debe ser un número positivo' 
        });
      }
      
      // Verificar que el sueldo mínimo existe
      const sueldoMinimoExistente = await SueldoMinimoModel.findById(Number(id));
      
      if (!sueldoMinimoExistente) {
        return res.status(404).json({ error: 'Sueldo mínimo no encontrado' });
      }
      
      // Datos a actualizar
      const sueldoMinimoData: Partial<SueldoMinimoInput> = { valor };
      
      const sueldoMinimoActualizado = await SueldoMinimoModel.update(Number(id), sueldoMinimoData);
      return res.json(sueldoMinimoActualizado);
    } catch (error) {
      console.error('Error al actualizar sueldo mínimo:', error);
      return res.status(500).json({ error: 'Error al actualizar sueldo mínimo' });
    }
  }

  // Eliminar un sueldo mínimo
  static deleteSueldoMinimo = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      try {
        await SueldoMinimoModel.delete(Number(id));
        return res.json({ message: 'Sueldo mínimo eliminado correctamente' });
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Error al eliminar sueldo mínimo:', error);
      return res.status(500).json({ error: 'Error al eliminar sueldo mínimo' });
    }
  }
} 
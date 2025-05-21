import { Request, Response } from 'express';
import { SueldoModel, SueldoInput } from '../models/sueldo.model';
import { PersonaModel } from '../models/persona.model';

export const SueldoController = {
  // Obtener todos los sueldos
  getAllSueldos: async (req: Request, res: Response) => {
    try {
      const sueldos = await SueldoModel.findAll();
      res.status(200).json(sueldos);
    } catch (error) {
      console.error('Error al obtener todos los sueldos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener sueldo por ID
  getSueldoById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sueldo = await SueldoModel.findById(parseInt(id));
      
      if (!sueldo) {
        return res.status(404).json({ error: 'Sueldo no encontrado' });
      }
      
      res.status(200).json(sueldo);
    } catch (error) {
      console.error('Error al obtener sueldo por ID:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener sueldos por persona
  getSueldosByPersona: async (req: Request, res: Response) => {
    try {
      const { personaId } = req.params;
      const sueldos = await SueldoModel.findByPersona(parseInt(personaId));
      res.status(200).json(sueldos);
    } catch (error) {
      console.error('Error al obtener sueldos por persona:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener sueldos por mes y año
  getSueldosByMesAnio: async (req: Request, res: Response) => {
    try {
      const { anio, mes } = req.params;
      const sueldos = await SueldoModel.findByMesAnio(
        parseInt(mes),
        parseInt(anio)
      );
      res.status(200).json(sueldos);
    } catch (error) {
      console.error('Error al obtener sueldos por mes y año:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear un nuevo sueldo
  createSueldo: async (req: Request, res: Response) => {
    try {
      const { personaId, mes, anio, monto } = req.body;
      
      // Validar que la persona exista
      const persona = await PersonaModel.findById(personaId);
      if (!persona) {
        return res.status(404).json({ error: 'Persona no encontrada' });
      }

      // Validar los datos
      if (!personaId || !mes || !anio || !monto) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      // Convertir valores a números
      const sueldoData: SueldoInput = {
        personaId: parseInt(personaId),
        mes: parseInt(mes),
        anio: parseInt(anio),
        monto: parseFloat(monto)
      };

      const sueldo = await SueldoModel.create(sueldoData);
      res.status(201).json(sueldo);
    } catch (error) {
      console.error('Error al crear sueldo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Guardar múltiples sueldos
  guardarSueldos: async (req: Request, res: Response) => {
    try {
      const sueldosData = req.body;
      
      if (!Array.isArray(sueldosData) || sueldosData.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar un array de sueldos' });
      }
      
      // Validar cada uno de los datos
      for (const sueldo of sueldosData) {
        if (!sueldo.personaId || !sueldo.mes || !sueldo.anio || !sueldo.monto) {
          return res.status(400).json({ error: 'Todos los campos son requeridos para cada sueldo' });
        }
      }
      
      // Convertir los valores a números
      const sueldosFormateados: SueldoInput[] = sueldosData.map(sueldo => ({
        personaId: parseInt(sueldo.personaId),
        mes: parseInt(sueldo.mes),
        anio: parseInt(sueldo.anio),
        monto: parseFloat(sueldo.monto)
      }));
      
      await SueldoModel.guardarMultiples(sueldosFormateados);
      res.status(201).json({ message: 'Sueldos guardados correctamente' });
    } catch (error) {
      console.error('Error al guardar múltiples sueldos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar un sueldo
  updateSueldo: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { personaId, mes, anio, monto } = req.body;
      
      // Validar que el sueldo exista
      const existingSueldo = await SueldoModel.findById(parseInt(id));
      if (!existingSueldo) {
        return res.status(404).json({ error: 'Sueldo no encontrado' });
      }
      
      // Validar que la persona exista si se está actualizando personaId
      if (personaId) {
        const persona = await PersonaModel.findById(parseInt(personaId));
        if (!persona) {
          return res.status(404).json({ error: 'Persona no encontrada' });
        }
      }
      
      const sueldoData: Partial<SueldoInput> = {};
      
      if (personaId) sueldoData.personaId = parseInt(personaId);
      if (mes) sueldoData.mes = parseInt(mes);
      if (anio) sueldoData.anio = parseInt(anio);
      if (monto) sueldoData.monto = parseFloat(monto);
      
      const sueldo = await SueldoModel.update(parseInt(id), sueldoData);
      res.status(200).json(sueldo);
    } catch (error) {
      console.error('Error al actualizar sueldo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar un sueldo
  deleteSueldo: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validar que el sueldo exista
      const existingSueldo = await SueldoModel.findById(parseInt(id));
      if (!existingSueldo) {
        return res.status(404).json({ error: 'Sueldo no encontrado' });
      }
      
      await SueldoModel.delete(parseInt(id));
      res.status(200).json({ message: 'Sueldo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar sueldo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}; 
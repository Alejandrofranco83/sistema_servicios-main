import { Request, Response } from 'express';
import { PersonaModel, PersonaInput } from '../models/persona.model';
import { Prisma } from '@prisma/client';

export const PersonaController = {
  getAllPersonas: async (_req: Request, res: Response) => {
    try {
      const personas = await PersonaModel.findAll();
      return res.json(personas);
    } catch (error) {
      console.error('Error al obtener personas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getPersonaById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const persona = await PersonaModel.findById(id);
      
      if (!persona) {
        return res.status(404).json({ error: 'Persona no encontrada' });
      }
      
      return res.json(persona);
    } catch (error) {
      console.error('Error al obtener persona:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createPersona: async (req: Request, res: Response) => {
    try {
      const personaData: PersonaInput = req.body;
      
      // Validar campos requeridos
      if (!personaData.nombreCompleto || !personaData.documento) {
        return res.status(400).json({ 
          error: 'Los campos nombreCompleto y documento son requeridos' 
        });
      }

      // Intentar crear la persona
      const nuevaPersona = await PersonaModel.create(personaData);
      return res.status(201).json(nuevaPersona);
    } catch (error) {
      console.error('Error al crear persona:', error);
      
      // Manejar error de documento duplicado
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(400).json({ 
            error: 'Ya existe una persona con ese número de documento' 
          });
        }
      }
      
      return res.status(500).json({ 
        error: 'Error al crear la persona. Por favor, intente nuevamente.' 
      });
    }
  },

  updatePersona: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const personaData: Partial<PersonaInput> = req.body;
      
      const personaActualizada = await PersonaModel.update(id, personaData);
      return res.json(personaActualizada);
    } catch (error) {
      console.error('Error al actualizar persona:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  deletePersona: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await PersonaModel.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  
  searchPersonas: async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string || '';
      
      if (!query || query.trim() === '') {
        return res.json([]);
      }
      
      const personas = await PersonaModel.search(query);
      return res.json(personas);
    } catch (error) {
      console.error('Error al buscar personas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  
  // Obtener solo las personas que son funcionarios
  getFuncionarios: async (_req: Request, res: Response) => {
    try {
      // Utilizamos PrismaClient directamente para esta consulta específica
      const funcionarios = await PersonaModel.findByTipo('Funcionario');
      return res.json(funcionarios);
    } catch (error) {
      console.error('Error al obtener funcionarios:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}; 
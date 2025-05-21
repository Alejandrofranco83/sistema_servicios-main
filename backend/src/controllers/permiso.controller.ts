import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PermisoController {
  // Obtener todos los permisos
  getPermisos = async (_req: Request, res: Response) => {
    try {
      const permisos = await prisma.permiso.findMany();
      res.json(permisos);
      return;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      res.status(500).json({ error: 'Error al obtener permisos' });
      return;
    }
  }

  // Crear un nuevo permiso
  createPermiso = async (req: Request, res: Response) => {
    try {
      const { modulo, pantalla, descripcion } = req.body;

      if (!modulo || !pantalla) {
        return res.status(400).json({ error: 'Módulo y pantalla son requeridos' });
      }

      // Verificar si ya existe un permiso similar
      const permisoExistente = await prisma.permiso.findFirst({
        where: {
          modulo,
          pantalla
        }
      });

      if (permisoExistente) {
        return res.status(400).json({ error: 'Ya existe un permiso para este módulo y pantalla' });
      }

      // Crear el permiso
      const permiso = await prisma.permiso.create({
        data: {
          modulo,
          pantalla,
          descripcion
        }
      });

      res.status(201).json(permiso);
      return;
    } catch (error) {
      console.error('Error al crear permiso:', error);
      res.status(500).json({ error: 'Error al crear permiso' });
      return;
    }
  }

  // Actualizar un permiso existente
  updatePermiso = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { modulo, pantalla, descripcion } = req.body;

      // Verificar si existe el permiso
      const permisoExistente = await prisma.permiso.findUnique({
        where: { id: Number(id) }
      });

      if (!permisoExistente) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }

      // Verificar si ya existe otro permiso con la misma combinación de módulo y pantalla
      if (modulo && pantalla) {
        const duplicado = await prisma.permiso.findFirst({
          where: {
            modulo,
            pantalla,
            NOT: {
              id: Number(id)
            }
          }
        });

        if (duplicado) {
          return res.status(400).json({ error: 'Ya existe un permiso para este módulo y pantalla' });
        }
      }

      // Actualizar el permiso
      const permisoActualizado = await prisma.permiso.update({
        where: { id: Number(id) },
        data: {
          modulo: modulo || undefined,
          pantalla: pantalla || undefined,
          descripcion: descripcion || undefined
        }
      });

      res.json(permisoActualizado);
      return;
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      res.status(500).json({ error: 'Error al actualizar permiso' });
      return;
    }
  }

  // Eliminar un permiso
  deletePermiso = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar si el permiso está asignado a algún rol
      const rolesConPermiso = await prisma.rol.findMany({
        where: {
          permisos: {
            some: {
              id: Number(id)
            }
          }
        }
      });

      if (rolesConPermiso.length > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar este permiso porque está asignado a roles' 
        });
      }

      // Eliminar el permiso
      await prisma.permiso.delete({
        where: { id: Number(id) }
      });

      res.json({ message: 'Permiso eliminado correctamente' });
      return;
    } catch (error) {
      console.error('Error al eliminar permiso:', error);
      res.status(500).json({ error: 'Error al eliminar permiso' });
      return;
    }
  }
} 
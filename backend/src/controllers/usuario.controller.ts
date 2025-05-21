import { Request, Response } from 'express';
import { UsuarioModel, UsuarioInput } from '../models/usuario.model';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UsuarioController {
  // Obtener todos los usuarios
  static getUsuarios = async (_req: Request, res: Response) => {
    try {
      const usuarios = await prisma.usuario.findMany({
        include: {
          persona: true,
          rol: {
            include: {
              permisos: true
            }
          }
        }
      });
      
      res.json(usuarios);
      return;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }
  }

  // Obtener un usuario por ID
  static getUsuarioById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        include: {
          persona: true,
          rol: {
            include: {
              permisos: true
            }
          }
        }
      });
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(usuario);
      return;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
      return;
    }
  }

  static getAllUsuarios = async (_req: Request, res: Response) => {
    try {
      const usuarios = await UsuarioModel.findAll();
      return res.json(usuarios);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static createUsuario = async (req: Request, res: Response) => {
    try {
      const { username, personaId, nombre, rolId } = req.body;

      // Validar datos
      if (!username || !personaId || !nombre) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      // Verificar si ya existe un usuario con el mismo username
      const existingUser = await prisma.usuario.findUnique({
        where: {
          username
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: "Ya existe un usuario con ese nombre de usuario" });
      }

      // Crear usuario
      const usuario = await prisma.usuario.create({
        data: {
          username,
          nombre,
          password: 'TEMP_PASSWORD', // Contraseña temporal que debe ser cambiada
          persona: {
            connect: {
              id: personaId
            }
          },
          rol: {
            connect: {
              id: rolId || 1 // Si no hay rolId, conectar al rol ID 1 por defecto
            }
          }
        }
      });

      return res.status(201).json(usuario);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return res.status(500).json({ error: "Error al crear usuario" });
    }
  }

  static updateUsuario = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const usuarioData: Partial<UsuarioInput> = req.body;
      
      const usuarioActualizado = await UsuarioModel.update(id, usuarioData);
      return res.json(usuarioActualizado);
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);

      // Manejar errores de validación personalizados
      if (error.message) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static deleteUsuario = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await UsuarioModel.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static resetPassword = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await UsuarioModel.resetPassword(id);
      return res.status(200).json({ message: 'Contraseña reseteada exitosamente' });
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
} 
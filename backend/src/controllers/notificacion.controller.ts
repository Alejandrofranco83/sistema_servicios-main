import { Request, Response } from 'express';
import { NotificacionModel, NotificacionInput } from '../models/notificacion.model';

// Tipos válidos de notificaciones
const TIPOS_VALIDOS = ['info', 'warning', 'error', 'success'];

// Interfaz para los resultados de las consultas
interface NotificacionBase {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fechaCreacion: Date;
  url?: string | null;
  modulo?: string | null;
  esGlobal: boolean;
  entidadTipo?: string | null;
  entidadId?: string | null;
  accion?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Función auxiliar para validar y normalizar el tipo de notificación
const normalizarTipoNotificacion = (tipo: any): 'info' | 'warning' | 'error' | 'success' => {
  // Si no es string o no es un valor válido, usar 'info' como valor predeterminado
  if (typeof tipo !== 'string' || !TIPOS_VALIDOS.includes(tipo)) {
    return 'info';
  }
  return tipo as 'info' | 'warning' | 'error' | 'success';
};

export class NotificacionController {
  // Obtener todas las notificaciones
  static getNotificaciones = async (_req: Request, res: Response) => {
    try {
      const notificaciones = await NotificacionModel.findAll() as NotificacionBase[];
      
      // Normalizar los tipos de notificaciones
      const notificacionesNormalizadas = notificaciones.map(notif => ({
        ...notif,
        tipo: normalizarTipoNotificacion(notif.tipo)
      }));
      
      return res.json(notificacionesNormalizadas);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
  }

  // Obtener una notificación por ID
  static getNotificacionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notificacion = await NotificacionModel.findById(Number(id));
      
      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }
      
      // Normalizar el tipo de notificación
      const notificacionNormalizada = {
        ...notificacion,
        tipo: normalizarTipoNotificacion(notificacion.tipo)
      };
      
      return res.json(notificacionNormalizada);
    } catch (error) {
      console.error(`Error al obtener notificación ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Error al obtener notificación' });
    }
  }

  // Obtener todas las notificaciones del usuario autenticado
  static getMisNotificaciones = async (req: Request, res: Response) => {
    try {
      const userId = req.usuario?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      // Consultar notificaciones del usuario
      console.log('Consultando notificaciones para usuario:', userId);
      const notificaciones = await NotificacionModel.findByUsuario(userId);
      console.log(`Encontradas ${notificaciones.length} notificaciones para el usuario ${userId}`);
      
      // Transformar los datos para asegurarnos que los campos obligatorios estén presentes
      const notificacionesFormateadas = notificaciones.map(notif => {
        // Crear un objeto con las propiedades normalizadas
        return {
          id: notif.id,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          tipo: normalizarTipoNotificacion(notif.tipo),
          fechaCreacion: notif.fechaCreacion || new Date(),
          url: notif.url,
          modulo: notif.modulo,
          esGlobal: Boolean(notif.esGlobal),
          entidadTipo: notif.entidadTipo || null,
          entidadId: notif.entidadId || null,
          accion: notif.accion,
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
          leida: Boolean(notif.leida),
          fechaLectura: notif.fechaLectura || null
        };
      });
      
      // Revisar si tenemos datos correctos después de la transformación
      if (notificacionesFormateadas.length > 0) {
        console.log('Primera notificación después de formateo:', {
          id: notificacionesFormateadas[0].id,
          tipo: notificacionesFormateadas[0].tipo,
          tipoValue: typeof notificacionesFormateadas[0].tipo
        });
      }
      
      return res.json(notificacionesFormateadas);
    } catch (error) {
      console.error('Error al obtener notificaciones del usuario:', error);
      return res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
  }

  // Obtener notificaciones no leídas del usuario autenticado
  static getMisNotificacionesNoLeidas = async (req: Request, res: Response) => {
    try {
      const userId = req.usuario?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const notificaciones = await NotificacionModel.findNoLeidasByUsuario(userId);
      
      // Debug log para verificar notificaciones recuperadas
      console.log(`[API] Notificaciones no leídas recuperadas para usuario ${userId}: ${notificaciones.length}`);
      if (notificaciones.length > 0) {
        console.log(`[API] Primera notificación no leída: id=${notificaciones[0].id}, leida=${notificaciones[0].leida}`);
      }
      
      // Transformar los datos para asegurarnos que los campos obligatorios estén presentes
      const notificacionesFormateadas = notificaciones.map(notif => {
        return {
          id: notif.id,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          tipo: normalizarTipoNotificacion(notif.tipo),
          fechaCreacion: notif.fechaCreacion || new Date(),
          url: notif.url,
          modulo: notif.modulo,
          esGlobal: Boolean(notif.esGlobal),
          entidadTipo: notif.entidadTipo || null,
          entidadId: notif.entidadId || null,
          accion: notif.accion,
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
          // Forzar a falso - estas son notificaciones no leídas
          leida: false,
          fechaLectura: null
        };
      });
      
      console.log(`[API] Total notificaciones no leídas enviadas: ${notificacionesFormateadas.length}`);
      
      return res.json(notificacionesFormateadas);
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      return res.status(500).json({ error: 'Error al obtener notificaciones no leídas' });
    }
  }

  // Contar notificaciones no leídas del usuario autenticado
  static contarMisNotificacionesNoLeidas = async (req: Request, res: Response) => {
    try {
      const userId = req.usuario?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const cantidad = await NotificacionModel.countNoLeidasByUsuario(userId);
      console.log(`[API] Contador de notificaciones no leídas para usuario ${userId}: ${cantidad}`);
      return res.json({ cantidad });
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      return res.status(500).json({ error: 'Error al contar notificaciones no leídas' });
    }
  }

  // Crear una nueva notificación
  static createNotificacion = async (req: Request, res: Response) => {
    try {
      const notificacionData = req.body;
      
      // Validar datos mínimos
      if (!notificacionData.titulo || !notificacionData.mensaje) {
        return res.status(400).json({ error: 'Se requieren título y mensaje' });
      }
      
      // Normalizar tipo
      const notificacion: NotificacionInput = {
        ...notificacionData,
        tipo: normalizarTipoNotificacion(notificacionData.tipo)
      };
      
      const nuevaNotificacion = await NotificacionModel.create(notificacion);
      return res.status(201).json(nuevaNotificacion);
    } catch (error) {
      console.error('Error al crear notificación:', error);
      return res.status(500).json({ error: 'Error al crear notificación' });
    }
  }

  // Crear notificación para un usuario específico
  static createNotificacionForUsuario = async (req: Request, res: Response) => {
    try {
      const { notificacion: notificacionData, usuarioId } = req.body;
      
      // Validar datos mínimos
      if (!notificacionData.titulo || !notificacionData.mensaje || !usuarioId) {
        return res.status(400).json({ error: 'Se requieren título, mensaje y usuarioId' });
      }
      
      // Normalizar tipo
      const notificacion: NotificacionInput = {
        ...notificacionData,
        tipo: normalizarTipoNotificacion(notificacionData.tipo)
      };
      
      const nuevaNotificacion = await NotificacionModel.createForUsuario(notificacion, usuarioId);
      return res.status(201).json(nuevaNotificacion);
    } catch (error) {
      console.error('Error al crear notificación para usuario:', error);
      return res.status(500).json({ error: 'Error al crear notificación para usuario' });
    }
  }

  // Crear notificación para un rol específico
  static createNotificacionForRol = async (req: Request, res: Response) => {
    try {
      const { notificacion: notificacionData, rolId } = req.body;
      
      // Validar datos mínimos
      if (!notificacionData.titulo || !notificacionData.mensaje || !rolId) {
        return res.status(400).json({ error: 'Se requieren título, mensaje y rolId' });
      }
      
      // Normalizar tipo
      const notificacion: NotificacionInput = {
        ...notificacionData,
        tipo: normalizarTipoNotificacion(notificacionData.tipo)
      };
      
      const nuevaNotificacion = await NotificacionModel.createForRol(notificacion, rolId);
      return res.status(201).json(nuevaNotificacion);
    } catch (error) {
      console.error('Error al crear notificación para rol:', error);
      return res.status(500).json({ error: 'Error al crear notificación para rol' });
    }
  }

  // Marcar una notificación como leída
  static marcarComoLeida = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.usuario?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      await NotificacionModel.marcarComoLeida(Number(id), userId);
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error al marcar notificación ${req.params.id} como leída:`, error);
      return res.status(500).json({ error: 'Error al marcar notificación como leída' });
    }
  }

  // Marcar todas las notificaciones como leídas
  static marcarTodasComoLeidas = async (req: Request, res: Response) => {
    try {
      const userId = req.usuario?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      await NotificacionModel.marcarTodasComoLeidas(userId);
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return res.status(500).json({ error: 'Error al marcar notificaciones como leídas' });
    }
  }

  // Eliminar una notificación
  static deleteNotificacion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verificar si la notificación existe
      const notificacion = await NotificacionModel.findById(Number(id));
      
      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }
      
      await NotificacionModel.delete(Number(id));
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error al eliminar notificación ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Error al eliminar notificación' });
    }
  }

  // Actualizar una notificación
  static updateNotificacion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notificacionData = req.body;
      
      console.log(`Actualizando notificación ${id} con datos:`, notificacionData);
      
      // Verificar si la notificación existe
      const notificacionExistente = await NotificacionModel.findById(Number(id));
      if (!notificacionExistente) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }
      
      // Validar campos mínimos
      if (!notificacionData.titulo || !notificacionData.mensaje) {
        return res.status(400).json({ error: 'Se requieren título y mensaje' });
      }
      
      // Asegurarnos de no alterar campos sensibles como fechaCreacion si no es necesario
      if (notificacionData.fechaCreacion && notificacionExistente.fechaCreacion) {
        console.log('Preservando fechaCreacion original');
        notificacionData.fechaCreacion = notificacionExistente.fechaCreacion;
      }
      
      // Normalizar el tipo de notificación
      if (notificacionData.tipo) {
        notificacionData.tipo = normalizarTipoNotificacion(notificacionData.tipo);
      }
      
      // Realizar la actualización - convertir a Partial<NotificacionInput> solo los campos permitidos
      const dataParaActualizar: Partial<NotificacionInput> = {
        titulo: notificacionData.titulo,
        mensaje: notificacionData.mensaje,
        tipo: notificacionData.tipo,
        url: notificacionData.url,
        modulo: notificacionData.modulo,
        esGlobal: notificacionData.esGlobal,
        entidadTipo: notificacionData.entidadTipo,
        entidadId: notificacionData.entidadId,
        accion: notificacionData.accion
      };
      
      const notificacion = await NotificacionModel.update(Number(id), dataParaActualizar);
      console.log('Notificación actualizada exitosamente');
      
      return res.json(notificacion);
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      return res.status(500).json({ error: 'Error al actualizar notificación' });
    }
  }
} 
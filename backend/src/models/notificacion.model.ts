import { PrismaClient } from '@prisma/client';

// Crear un prisma client estándar
const prisma = new PrismaClient();

// Interfaz para la creación de notificaciones
export interface NotificacionInput {
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  url?: string;
  modulo?: string;
  esGlobal?: boolean;
  entidadTipo?: string;
  entidadId?: string;
  accion?: string;
}

// Interfaz para asociar notificaciones a usuarios
export interface NotificacionUsuarioInput {
  notificacionId: number;
  usuarioId: number;
}

// Interfaz para asociar notificaciones a roles
export interface NotificacionRolInput {
  notificacionId: number;
  rolId: number;
}

// Interfaz para los resultados de las consultas
export interface NotificacionResult {
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
  leida?: boolean;
  fechaLectura?: Date | null;
}

// Interfaz para usuarios
interface Usuario {
  id: number;
  username?: string;
  rolId?: number;
}

export const NotificacionModel = {
  // Obtener todas las notificaciones
  findAll: async () => {
    return prisma.notificacion.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      }
    });
  },

  // Obtener una notificación por ID
  findById: async (id: number) => {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id }
    });

    if (!notificacion) return null;

    // Obtener usuarios asociados
    const notificacionUsuarios = await prisma.notificacionUsuario.findMany({
      where: { notificacionId: id },
      include: { usuario: true }
    });

    // Obtener roles asociados
    const notificacionRoles = await prisma.notificacionRol.findMany({
      where: { notificacionId: id },
      include: { rol: true }
    });

    return {
      ...notificacion,
      usuarios: notificacionUsuarios,
      roles: notificacionRoles
    };
  },

  // Obtener notificaciones para un usuario específico
  findByUsuario: async (usuarioId: number) => {
    try {
      // Verificar si el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { rol: true }
      });

      if (!usuario) return [];
      
      console.log(`Consultando notificaciones para usuario: ${usuarioId}`);

      // Para obtener notificaciones de usuario, de su rol y globales, 
      // necesitamos hacer consultas separadas y combinarlas
      
      // 1. Notificaciones directas para el usuario
      const notificacionesUsuario = await prisma.notificacionUsuario.findMany({
        where: { usuarioId },
        include: { 
          notificacion: true 
        }
      });
      
      // 2. Notificaciones para el rol del usuario
      const notificacionesRol = await prisma.notificacionRol.findMany({
        where: { rolId: usuario.rolId },
        include: { 
          notificacion: true 
        }
      });
      
      // 3. Notificaciones globales
      const notificacionesGlobales = await prisma.notificacion.findMany({
        where: { esGlobal: true }
      });
      
      // Combinar todos los resultados evitando duplicados
      const idSet = new Set();
      const notificacionesCombinadas = [];
      
      // Procesar notificaciones de usuario
      for (const nu of notificacionesUsuario) {
        if (!idSet.has(nu.notificacionId)) {
          idSet.add(nu.notificacionId);
          notificacionesCombinadas.push({
            ...nu.notificacion,
            leida: nu.leida || false,
            fechaLectura: nu.fechaLectura
          });
        }
      }
      
      // Procesar notificaciones de rol
      for (const nr of notificacionesRol) {
        if (!idSet.has(nr.notificacionId)) {
          idSet.add(nr.notificacionId);
          
          // Verificar si el usuario ha leído esta notificación
          const lecturaRegistro = await prisma.notificacionUsuario.findUnique({
            where: {
              notificacionId_usuarioId: {
                notificacionId: nr.notificacionId,
                usuarioId
              }
            }
          });
          
          notificacionesCombinadas.push({
            ...nr.notificacion,
            leida: lecturaRegistro?.leida || false,
            fechaLectura: lecturaRegistro?.fechaLectura
          });
        }
      }
      
      // Procesar notificaciones globales
      for (const ng of notificacionesGlobales) {
        if (!idSet.has(ng.id)) {
          idSet.add(ng.id);
          
          // Verificar si el usuario ha leído esta notificación global
          const lecturaRegistro = await prisma.notificacionUsuario.findUnique({
            where: {
              notificacionId_usuarioId: {
                notificacionId: ng.id,
                usuarioId
              }
            }
          });
          
          notificacionesCombinadas.push({
            ...ng,
            leida: lecturaRegistro?.leida || false,
            fechaLectura: lecturaRegistro?.fechaLectura
          });
        }
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      const notificacionesOrdenadas = notificacionesCombinadas.sort(
        (a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime()
      );
      
      console.log(`Encontradas ${notificacionesOrdenadas.length} notificaciones para el usuario ${usuarioId}`);
      
      if (notificacionesOrdenadas.length > 0) {
        console.log('Primera notificación después de formateo:', { 
          id: notificacionesOrdenadas[0].id, 
          tipo: notificacionesOrdenadas[0].tipo,
          tipoValue: typeof notificacionesOrdenadas[0].tipo
        });
      }
      
      return notificacionesOrdenadas;
    } catch (error) {
      console.error('Error al obtener notificaciones por usuario:', error);
      return [];
    }
  },

  // Obtener notificaciones no leídas para un usuario
  findNoLeidasByUsuario: async (usuarioId: number) => {
    try {
      const todasLasNotificaciones = await NotificacionModel.findByUsuario(usuarioId);
      
      // Depuración para verificar
      console.log(`Total notificaciones para usuario ${usuarioId} antes de filtrar: ${todasLasNotificaciones.length}`);
      
      // Filtrar solo las no leídas de manera más estricta
      const noLeidas = todasLasNotificaciones.filter(n => n.leida === false);
      
      // Más logs para depuración
      console.log(`Notificaciones no leídas encontradas para usuario ${usuarioId}: ${noLeidas.length}`);
      
      if (noLeidas.length > 0) {
        console.log('Primera notificación no leída de la consulta:', {
          id: noLeidas[0].id,
          fechaCreacion: noLeidas[0].fechaCreacion,
          tipo: noLeidas[0].tipo,
          tipoDeValor: typeof noLeidas[0].tipo,
          leida: noLeidas[0].leida
        });
      } else {
        console.log('No se encontraron notificaciones no leídas para el usuario', usuarioId);
      }
      
      return noLeidas;
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas por usuario:', error);
      return [];
    }
  },

  // Contar notificaciones no leídas para un usuario
  countNoLeidasByUsuario: async (usuarioId: number) => {
    try {
      const notificaciones = await NotificacionModel.findNoLeidasByUsuario(usuarioId);
      const count = notificaciones.length;
      console.log(`Contador para usuario ${usuarioId}: ${count} notificaciones no leídas`);
      return count;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      return 0;
    }
  },

  // Crear una nueva notificación global
  create: async (data: NotificacionInput) => {
    // Validar el tipo de notificación antes de almacenarla
    const tipoValido = ['info', 'warning', 'error', 'success'].includes(data.tipo) 
      ? data.tipo 
      : 'info';
      
    try {
      // 1. Crear la notificación
      const notificacion = await prisma.notificacion.create({
        data: {
          titulo: data.titulo,
          mensaje: data.mensaje,
          tipo: tipoValido,
          url: data.url,
          modulo: data.modulo,
          esGlobal: data.esGlobal || false,
          entidadTipo: data.entidadTipo,
          entidadId: data.entidadId,
          accion: data.accion
        }
      });
      
      // 2. Si es global, crear registros para todos los usuarios activos
      if (data.esGlobal) {
        const usuariosActivos = await prisma.usuario.findMany({
          where: { activo: true },
          select: { id: true }
        });
        
        // Crear registros en notificaciones_usuarios para cada usuario activo
        const createPromises = usuariosActivos.map(usuario => 
          prisma.notificacionUsuario.create({
            data: {
              notificacionId: notificacion.id,
              usuarioId: usuario.id,
              leida: false
            }
          })
        );
        
        await Promise.all(createPromises);
        
        console.log(`Creados registros para notificación global ${notificacion.id} para ${usuariosActivos.length} usuarios activos`);
      }
      
      return notificacion;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  },

  // Crear registros en la tabla notificaciones_usuarios para todos los usuarios
  crearRegistrosParaTodosLosUsuarios: async (notificacionId: number) => {
    try {
      // Obtener todos los usuarios activos
      const usuariosActivos = await prisma.usuario.findMany({
        where: { activo: true },
        select: { id: true }
      });
      
      // Crear registros no leídos para cada usuario
      const createPromises = usuariosActivos.map(usuario => 
        prisma.notificacionUsuario.upsert({
          where: {
            notificacionId_usuarioId: {
              notificacionId,
              usuarioId: usuario.id
            }
          },
          update: {}, // No actualizamos nada si ya existe
          create: {
            notificacionId,
            usuarioId: usuario.id,
            leida: false
          }
        })
      );
      
      await Promise.all(createPromises);
      
      console.log(`Creados registros para notificación ${notificacionId} para ${usuariosActivos.length} usuarios`);
    } catch (error) {
      console.error('Error al crear registros para todos los usuarios:', error);
    }
  },

  // Crear una notificación y asignarla a un usuario específico
  createForUsuario: async (data: NotificacionInput, usuarioId: number) => {
    // Validar el tipo de notificación
    const tipoValido = ['info', 'warning', 'error', 'success'].includes(data.tipo) 
      ? data.tipo 
      : 'info';
    
    try {
      // 1. Crear la notificación
      const notificacion = await prisma.notificacion.create({
        data: {
          titulo: data.titulo,
          mensaje: data.mensaje,
          tipo: tipoValido,
          url: data.url,
          modulo: data.modulo,
          esGlobal: false,
          entidadTipo: data.entidadTipo,
          entidadId: data.entidadId,
          accion: data.accion
        }
      });

      // 2. Asignarla al usuario destinatario (como no leída)
      await prisma.notificacionUsuario.create({
        data: {
          notificacionId: notificacion.id,
          usuarioId: usuarioId,
          leida: false
        }
      });

      // 3. También hacerla visible para el usuario actual (emisor) pero como leída
      // Obtener el ID del usuario actual (asumimos que es admin para simplificar)
      const usuarioAdmin = await prisma.usuario.findFirst({
        where: { username: 'admin' }
      });
      
      if (usuarioAdmin && usuarioAdmin.id !== usuarioId) {
        await prisma.notificacionUsuario.create({
          data: {
            notificacionId: notificacion.id,
            usuarioId: usuarioAdmin.id,
            leida: true,
            fechaLectura: new Date()
          }
        });
      }

      return notificacion;
    } catch (error) {
      console.error('Error al crear notificación para usuario:', error);
      throw error;
    }
  },

  // Crear una notificación y asignarla a un rol específico
  createForRol: async (data: NotificacionInput, rolId: number) => {
    // Validar el tipo de notificación
    const tipoValido = ['info', 'warning', 'error', 'success'].includes(data.tipo) 
      ? data.tipo 
      : 'info';
    
    try {
      // 1. Crear la notificación
      const notificacion = await prisma.notificacion.create({
        data: {
          titulo: data.titulo,
          mensaje: data.mensaje,
          tipo: tipoValido,
          url: data.url,
          modulo: data.modulo,
          esGlobal: false,
          entidadTipo: data.entidadTipo,
          entidadId: data.entidadId,
          accion: data.accion
        }
      });

      // 2. Asignarla al rol
      await prisma.notificacionRol.create({
        data: {
          notificacionId: notificacion.id,
          rolId: rolId
        }
      });
      
      // 3. Crear registros para todos los usuarios con ese rol
      const usuariosDelRol = await prisma.usuario.findMany({
        where: { 
          rolId: rolId,
          activo: true
        },
        select: { id: true }
      });
      
      // Crear registros en notificaciones_usuarios para cada usuario del rol
      for (const usuario of usuariosDelRol) {
        await prisma.notificacionUsuario.create({
          data: {
            notificacionId: notificacion.id,
            usuarioId: usuario.id,
            leida: false
          }
        });
      }
      
      console.log(`Creados registros para notificación ${notificacion.id} para ${usuariosDelRol.length} usuarios del rol ${rolId}`);
      
      // 4. También hacerla visible para el usuario que la crea (admin)
      const usuarioAdmin = await prisma.usuario.findFirst({
        where: { username: 'admin' }
      });
      
      // Solo si el admin no está ya incluido entre los usuarios del rol
      if (usuarioAdmin && !usuariosDelRol.some(u => u.id === usuarioAdmin.id)) {
        await prisma.notificacionUsuario.create({
          data: {
            notificacionId: notificacion.id,
            usuarioId: usuarioAdmin.id,
            leida: true,
            fechaLectura: new Date()
          }
        });
      }

      return notificacion;
    } catch (error) {
      console.error('Error al crear notificación para rol:', error);
      throw error;
    }
  },

  // Marcar una notificación como leída para un usuario
  marcarComoLeida: async (notificacionId: number, usuarioId: number) => {
    try {
      // Usar upsert para crear o actualizar el registro
      await prisma.notificacionUsuario.upsert({
        where: {
          notificacionId_usuarioId: {
            notificacionId,
            usuarioId
          }
        },
        update: {
          leida: true,
          fechaLectura: new Date()
        },
        create: {
          notificacionId,
          usuarioId,
          leida: true,
          fechaLectura: new Date()
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas para un usuario
  marcarTodasComoLeidas: async (usuarioId: number) => {
    try {
      // Obtener todas las notificaciones del usuario (directas, por rol o globales)
      const notificaciones = await NotificacionModel.findByUsuario(usuarioId);
      
      // Para cada notificación, crear o actualizar un registro en notificaciones_usuarios
      for (const notif of notificaciones) {
        await NotificacionModel.marcarComoLeida(notif.id, usuarioId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  },

  // Eliminar una notificación
  delete: async (id: number) => {
    try {
      // Eliminar la notificación (Prisma se encargará de eliminar las relaciones por el onDelete: Cascade)
      await prisma.notificacion.delete({
        where: { id }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  },

  // Actualizar una notificación
  update: async (id: number, data: Partial<NotificacionInput>) => {
    try {
      // Validar el tipo si se está actualizando
      let tipoValidado = data.tipo;
      if (data.tipo && !['info', 'warning', 'error', 'success'].includes(data.tipo)) {
        tipoValidado = 'info';
      }
      
      // Actualizar la notificación
      const notificacionActualizada = await prisma.notificacion.update({
        where: { id },
        data: {
          titulo: data.titulo,
          mensaje: data.mensaje,
          tipo: tipoValidado,
          url: data.url,
          modulo: data.modulo,
          esGlobal: data.esGlobal,
          entidadTipo: data.entidadTipo,
          entidadId: data.entidadId,
          accion: data.accion
        }
      });
      
      // Si es global y se cambió a true, crear registros para todos los usuarios
      if (data.esGlobal === true) {
        await NotificacionModel.crearRegistrosParaTodosLosUsuarios(id);
      }
      
      return notificacionActualizada;
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      throw error;
    }
  }
}; 
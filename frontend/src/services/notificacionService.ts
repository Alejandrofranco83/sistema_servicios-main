import axios from 'axios';

// Interfaz para las notificaciones
export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fechaCreacion: string;
  leida?: boolean;
  fechaLectura?: string;
  url?: string;
  modulo?: string;
  esGlobal?: boolean;
  entidadTipo?: string;
  entidadId?: string;
  accion?: string;
}

const API_URL = '/api/notificaciones';

export const notificacionService = {
  // Verificar si la API está disponible
  verificarApi: async (): Promise<boolean> => {
    try {
      // Intenta obtener un contador de notificaciones como prueba simple
      const response = await axios.get(`${API_URL}/mis-notificaciones/contador`);
      return response.status === 200;
    } catch (error: any) {
      console.error('Error al verificar API de notificaciones:', error?.message || 'Error desconocido');
      return false;
    }
  },

  // Obtener todas las notificaciones del usuario
  obtenerMisNotificaciones: async (): Promise<Notificacion[]> => {
    try {
      const response = await axios.get(`${API_URL}/mis-notificaciones`);
      
      // Verificar que la respuesta sea un array
      if (!Array.isArray(response.data)) {
        console.error('La respuesta no es un array:', response.data);
        return [];
      }
      
      // Procesar los datos para mapear campos snake_case a camelCase
      return procesarNotificaciones(response.data);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  },

  // Obtener notificaciones no leídas del usuario
  obtenerMisNotificacionesNoLeidas: async (): Promise<Notificacion[]> => {
    try {
      console.log('[SERVICE] Solicitando notificaciones no leídas al servidor');
      const response = await axios.get(`${API_URL}/mis-notificaciones/no-leidas`);
      
      if (!Array.isArray(response.data)) {
        console.warn('[SERVICE] La respuesta de no leídas no es un array:', response.data);
        return [];
      }
      
      console.log('[SERVICE] Respuesta del backend (no leídas):', JSON.stringify(response.data));
      
      // Pasar directamente los datos del backend a procesar
      // El backend ya debería devolverlas con leida=false
      const procesadas = procesarNotificaciones(response.data);
      console.log('[SERVICE] Notificaciones no leídas después de procesar:', procesadas);
      return procesadas;
    } catch (error: any) {
      console.error('[SERVICE] Error al obtener notificaciones no leídas:', error?.message || 'Error desconocido');
      return [];
    }
  },

  // Contar notificaciones no leídas del usuario
  contarMisNotificacionesNoLeidas: async (): Promise<number> => {
    try {
      console.log('Solicitando contador de notificaciones no leídas');
      const response = await axios.get(`${API_URL}/mis-notificaciones/contador`);
      
      // Extraer directamente el número del contador para evitar problemas de tipo
      let contador = 0;
      
      // Validar que la respuesta tenga la propiedad cantidad
      if (response.data && typeof response.data.cantidad === 'number') {
        contador = response.data.cantidad;
        console.log('Contador recibido:', contador);
      } else {
        console.warn('La respuesta no contiene una cantidad válida:', response.data);
        
        // Intentar extraer el número directamente si es posible
        if (response.data && !isNaN(Number(response.data))) {
          contador = Number(response.data);
          console.log('Contador extraído directamente:', contador);
        }
      }
      
      return contador;
    } catch (error: any) {
      console.error('Error al contar notificaciones no leídas:', error);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.status, error.response.data);
      }
      return 0;
    }
  },

  // Marcar una notificación como leída
  marcarComoLeida: async (id: number): Promise<void> => {
    try {
      await axios.put(`${API_URL}/${id}/leer`);
    } catch (error) {
      console.error(`Error al marcar notificación ${id} como leída:`, error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas
  marcarTodasComoLeidas: async (): Promise<void> => {
    try {
      await axios.put(`${API_URL}/leer-todas`);
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  },

  // Crear una nueva notificación (para usuarios con permisos)
  crearNotificacion: async (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>): Promise<Notificacion> => {
    try {
      console.log('Enviando notificación:', notificacion);
      const response = await axios.post(API_URL, notificacion);
      console.log('Respuesta de creación de notificación:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear notificación:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },

  // Eliminar una notificación (para usuarios con permisos)
  eliminarNotificacion: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error(`Error al eliminar notificación ${id}:`, error);
      throw error;
    }
  },

  // Crear notificación para un usuario específico
  crearNotificacionParaUsuario: async (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>, usuarioId: number): Promise<Notificacion> => {
    try {
      const response = await axios.post(`${API_URL}/para-usuario`, {
        notificacion,
        usuarioId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al crear notificación para usuario:', error);
      throw error;
    }
  },

  // Crear notificación para un rol específico
  crearNotificacionParaRol: async (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>, rolId: number): Promise<Notificacion> => {
    try {
      const response = await axios.post(`${API_URL}/para-rol`, {
        notificacion,
        rolId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al crear notificación para rol:', error);
      throw error;
    }
  },

  // Actualizar una notificación existente
  actualizarNotificacion: async (notificacion: Notificacion): Promise<Notificacion> => {
    try {
      const response = await axios.put(`${API_URL}/${notificacion.id}`, notificacion, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar notificación:', error);
      throw error;
    }
  },
};

// Función auxiliar para procesar notificaciones
const procesarNotificaciones = (datos: any[]): Notificacion[] => {
  console.log('[SERVICE] Iniciando procesarNotificaciones con datos:', datos);
  return datos.map((notif: any) => {
    // Imprimir detalles específicos para debugging
    console.log(`[SERVICE] Procesando notif ID ${notif.id}: leida=${notif.leida}, tipo=${notif.tipo}, titulo=${notif.titulo}`);
    
    // Determinar el estado 'leida' de forma más directa
    // El backend envía 'false' para las no leídas en la ruta específica
    // Para la ruta general, envía el estado real.
    const estaLeida = notif.leida === true; 
    
    console.log(`[SERVICE] Notif ID ${notif.id} - ¿Está leída?: ${estaLeida}`);

    return {
      id: notif.id,
      titulo: notif.titulo || '',
      mensaje: notif.mensaje || '',
      tipo: notif.tipo || 'info',
      fechaCreacion: notif.fechaCreacion || notif.fecha_creacion || new Date().toISOString(),
      url: notif.url || null,
      modulo: notif.modulo || null,
      esGlobal: Boolean(notif.esGlobal || notif.es_global || false),
      entidadTipo: notif.entidadTipo || notif.entidad_tipo || null,
      entidadId: notif.entidadId || notif.entidad_id || null,
      accion: notif.accion || null,
      // Usar el valor calculado directamente
      leida: estaLeida, 
      fechaLectura: notif.fechaLectura || notif.fecha_lectura || null
    };
  });
};

export default notificacionService; 
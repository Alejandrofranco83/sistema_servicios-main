import api from './api'; // Importar la instancia global

// const API_BASE_URL = 'http://localhost:3000/api'; // ELIMINAR ESTA LÍNEA

// Configuración global de axios
// axios.defaults.timeout = 10000; // Esto ya debería estar en la instancia 'api'
// axios.defaults.headers.common['Content-Type'] = 'application/json'; // Esto ya debería estar en la instancia 'api'

export interface ValeInput {
  moneda: 'PYG' | 'USD' | 'BRL';
  monto: number;
  fecha_vencimiento: string | Date;
  motivo: string;
  persona_id: number;
  persona_nombre: string;
  usuario_creador_id: number;
  observaciones_internas?: string;
}

export interface Vale {
  id: string;
  numero: string;
  moneda: 'PYG' | 'USD' | 'BRL';
  monto: number;
  monto_texto?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_cobro?: string;
  estado: 'pendiente' | 'cobrado' | 'anulado' | 'vencido';
  motivo: string;
  impreso: boolean;
  observaciones_internas?: string;
  persona_id: number;
  persona_nombre: string;
  usuario_creador_id: number;
  createdAt: string;
  updatedAt: string;
}

export const valeService = {
  // Obtener todos los vales
  getVales: async (): Promise<Vale[]> => {
    try {
      const response = await api.get('/api/vales');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener vales:', error.message);
      throw error;
    }
  },

  // Obtener un vale por ID
  getValeById: async (id: string): Promise<Vale> => {
    try {
      const response = await api.get(`/api/vales/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener vale ${id}:`, error.message);
      throw error;
    }
  },

  // Obtener vales por persona
  getValesByPersona: async (personaId: number): Promise<Vale[]> => {
    try {
      const response = await api.get(`/api/vales/persona/${personaId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener vales para la persona ${personaId}:`, error.message);
      throw error;
    }
  },

  // Obtener vales pendientes
  getValesPendientes: async (): Promise<Vale[]> => {
    try {
      const response = await api.get('/api/vales/pendientes');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener vales pendientes:', error.message);
      throw error;
    }
  },

  // Crear un nuevo vale
  createVale: async (vale: ValeInput): Promise<Vale> => {
    try {
      const response = await api.post('/api/vales', vale);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear vale:', error.message);
      throw error;
    }
  },

  // Actualizar un vale existente
  updateVale: async (id: string, vale: Partial<ValeInput>): Promise<Vale> => {
    try {
      const response = await api.put(`/api/vales/${id}`, vale);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar vale ${id}:`, error.message);
      throw error;
    }
  },

  // Marcar un vale como cobrado
  marcarValeCobrado: async (id: string): Promise<Vale> => {
    try {
      const response = await api.patch(`/api/vales/${id}/cobrar`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al marcar vale ${id} como cobrado:`, error.message);
      throw error;
    }
  },

  // Marcar un vale como anulado
  marcarValeAnulado: async (id: string): Promise<Vale> => {
    try {
      const response = await api.patch(`/api/vales/${id}/anular`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al marcar vale ${id} como anulado:`, error.message);
      throw error;
    }
  },

  // Marcar un vale como impreso
  marcarValeImpreso: async (id: string): Promise<Vale> => {
    try {
      const response = await api.patch(`/api/vales/${id}/imprimir`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al marcar vale ${id} como impreso:`, error.message);
      throw error;
    }
  },

  // Eliminar un vale
  deleteVale: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/vales/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar vale ${id}:`, error.message);
      throw error;
    }
  },

  // Obtener estadísticas de vales
  getEstadisticasVales: async () => {
    try {
      const response = await api.get('/api/vales/estadisticas');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas de vales:', error.message);
      throw error;
    }
  }
}; 
import axios from 'axios';

// Base URL desde variables de entorno o configuración
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Configuración base para axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo global de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aquí podemos manejar errores globales como 401, 403, etc.
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Redirigir a login o mostrar mensaje
        console.error('No autorizado. Debe iniciar sesión nuevamente.');
      }
      
      if (status === 403) {
        console.error('No tiene permisos para realizar esta acción.');
      }
    }
    
    return Promise.reject(error);
  }
);

// Interceptor para añadir el token de autenticación a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interfaz para los detalles del conteo por denominación
export interface DetalleDenominacion {
  denominacion: number;
  cantidad: number;
  subtotal: number;
}

// Interfaz para el conteo
export interface ConteoData {
  moneda: string;
  total: number;
  saldo_sistema: number;
  observaciones?: string;
  usuario_id: number;
  detalles: DetalleDenominacion[];
  // Campos adicionales para generar movimientos
  generarMovimiento?: boolean;
  concepto?: string;
}

// Interfaz para conteo con ID
export interface Conteo extends ConteoData {
  id: number;
  fecha_hora: string;
  diferencia: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

// Servicio de conteos
export const conteoService = {
  // Obtener todos los conteos
  getConteos: async () => {
    try {
      const response = await api.get('/conteos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener conteos:', error);
      throw error;
    }
  },

  // Obtener un conteo por ID
  getConteoById: async (id: number) => {
    try {
      const response = await api.get(`/conteos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener conteo con ID ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo conteo
  createConteo: async (conteoData: ConteoData) => {
    try {
      const response = await api.post('/conteos', conteoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear conteo:', error);
      throw error;
    }
  },

  // Actualizar un conteo existente
  updateConteo: async (id: number, data: Partial<ConteoData>) => {
    try {
      const response = await api.put(`/conteos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar conteo con ID ${id}:`, error);
      throw error;
    }
  },

  // Anular un conteo
  anularConteo: async (id: number) => {
    try {
      const response = await api.patch(`/conteos/${id}/anular`);
      return response.data;
    } catch (error) {
      console.error(`Error al anular conteo con ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un conteo
  deleteConteo: async (id: number) => {
    try {
      const response = await api.delete(`/conteos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar conteo con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicio para Caja Mayor
export const cajaMayorService = {
  // Obtener los saldos actuales de todas las monedas
  getSaldosActuales: async () => {
    try {
      const response = await api.get('/caja_mayor_movimientos/saldos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener saldos actuales de caja mayor:', error);
      throw error;
    }
  },
  
  // Obtener movimientos paginados con filtros y orden
  getMovimientosPaginados: async (params: {
    moneda?: 'guaranies' | 'dolares' | 'reales' | string;
    page?: number;
    pageSize?: number;
    sortOrder?: 'asc' | 'desc';
    fechaDesde?: string;
    fechaHasta?: string;
    tipo?: string;
    concepto?: string;
  }) => {
    try {
      const { moneda } = params;
      
      const endpoint = moneda 
        ? `/caja_mayor_movimientos/movimientos/${moneda}` 
        : '/caja_mayor_movimientos/movimientos';
        
      console.log('[cajaMayorService] Llamando a:', endpoint, 'con params:', params);
      const response = await api.get(endpoint, {
        params: params
      });
      
      return response.data; 
      
    } catch (error) {
      console.error(`Error al obtener movimientos paginados:`, params, error);
      throw error;
    }
  },

  // Obtener detalles de un movimiento específico
  getMovimientoDetalle: async (movimientoId: number) => {
    try {
      const response = await api.get(`/caja_mayor_movimientos/detalle/${movimientoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener detalles del movimiento ${movimientoId}:`, error);
      throw error;
    }
  },

  // Mantener getUltimosMovimientos por si se usa en otro lado, 
  // pero internamente llama a la nueva función
  getUltimosMovimientos: async (limit: number = 10) => {
    console.warn('[DEPRECATED] getUltimosMovimientos ahora usa getMovimientosPaginados');
    return cajaMayorService.getMovimientosPaginados({ pageSize: limit });
  },

  // <<< Nueva función para obtener tipos únicos >>>
  getTiposUnicos: async (): Promise<string[]> => {
    try {
      const response = await api.get('/caja_mayor_movimientos/tipos');
      return response.data || []; // Devolver array vacío si no hay datos
    } catch (error) {
      console.error('Error al obtener tipos únicos de movimiento:', error);
      throw error; // O devolver [] para que no rompa el componente
    }
  },
};

export default api; 
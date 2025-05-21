import api from './api';

/**
 * Interfaz para la respuesta del saldo de persona
 */
export interface SaldoPersona {
  persona_id: number;
  id?: number;
  nombre_completo?: string;
  persona_nombre?: string;
  documento?: string;
  guaranies: number;
  dolares: number;
  reales: number;
  fecha_actualizacion?: string;
}

/**
 * Interfaz para la respuesta de una operación de uso/devolución
 */
export interface UsoDevolucion {
  id: number;
  tipo: 'USO' | 'DEVOLUCION';
  persona_id: number;
  persona_nombre: string;
  guaranies: number;
  dolares: number;
  reales: number;
  motivo: string;
  usuario_id: number;
  fecha_creacion: string;
  anulado: boolean;
}

/**
 * Interfaz para los datos de creación de una operación
 */
export interface UsoDevolucionInput {
  tipo: 'USO' | 'DEVOLUCION';
  persona_id: number;
  persona_nombre: string;
  guaranies?: number;
  dolares?: number;
  reales?: number;
  motivo: string;
}

/**
 * Interfaz para la respuesta completa de crear una operación
 */
export interface UsoDevolucionResponse {
  message: string;
  data: UsoDevolucion;
  saldo: SaldoPersona;
}

/**
 * Servicio para manejar operaciones de uso y devolución de efectivo
 */
export const usoDevolucionService = {
  /**
   * Crea un nuevo registro de uso o devolución
   * @param data - Datos de la operación
   * @returns - La respuesta de la API
   */
  async create(data: UsoDevolucionInput): Promise<UsoDevolucionResponse> {
    try {
      const response = await api.post('/uso-devolucion', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear registro de uso/devolución:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las operaciones de uso y devolución con filtros opcionales
   * @param filters - Filtros para la consulta
   * @returns - Lista de operaciones
   */
  async getAll(filters = {}): Promise<UsoDevolucion[]> {
    try {
      const response = await api.get('/uso-devolucion', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener registros de uso/devolución:', error);
      throw error;
    }
  },

  /**
   * Obtiene un registro específico de uso o devolución
   * @param id - ID del registro
   * @returns - El registro encontrado
   */
  async getById(id: number): Promise<UsoDevolucion> {
    try {
      const response = await api.get(`/uso-devolucion/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener registro de uso/devolución ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Anula un registro de uso o devolución
   * @param id - ID del registro a anular
   * @returns - La respuesta de la API
   */
  async anular(id: number): Promise<{ message: string }> {
    try {
      const response = await api.put(`/uso-devolucion/${id}/anular`);
      return response.data;
    } catch (error) {
      console.error(`Error al anular registro de uso/devolución ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el saldo actual de una persona
   * @param personaId - ID de la persona
   * @returns - Saldo de la persona
   */
  async getSaldoPersona(personaId: number): Promise<SaldoPersona> {
    try {
      const response = await api.get(`/uso-devolucion/saldo/persona/${personaId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener saldo de persona ID ${personaId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de operaciones de una persona
   * @param personaId - ID de la persona
   * @returns - Historial de operaciones
   */
  async getHistorialPersona(personaId: number): Promise<UsoDevolucion[]> {
    try {
      const response = await api.get(`/uso-devolucion/historial/persona/${personaId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener historial de persona ID ${personaId}:`, error);
      throw error;
    }
  }
};

/**
 * Obtiene todas las personas con saldo
 */
export const obtenerPersonasConSaldo = async (): Promise<SaldoPersona[]> => {
  const response = await api.get('/uso-devolucion/saldos/personas');
  return response.data;
};

/**
 * Obtiene el saldo de una persona específica
 * @param personaId - ID de la persona
 */
export const obtenerSaldoPersona = async (personaId: number): Promise<SaldoPersona> => {
  const response = await api.get(`/saldos/personas/${personaId}`);
  return response.data;
};

/**
 * Obtiene los movimientos de una persona específica
 * @param personaId - ID de la persona
 */
export const obtenerMovimientosPersona = async (personaId: number): Promise<UsoDevolucion[]> => {
  const response = await api.get(`/uso-devolucion/historial/persona/${personaId}`);
  return response.data;
}; 
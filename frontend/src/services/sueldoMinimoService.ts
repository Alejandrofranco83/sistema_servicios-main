import api from './api'; // Usar instancia global configurada
// ELIMINAMOS: import { API_BASE_URL } from '../config';

// Tipos para el sueldo mínimo
export interface SueldoMinimo {
  id: number;
  valor: number;
  fecha: string;
  vigente: boolean;
  usuario: {
    id: number;
    nombre: string;
  } | null;
}

export interface SueldoMinimoInput {
  valor: number;
}

// Servicio para gestionar el sueldo mínimo
const sueldoMinimoService = {
  // Obtener todos los registros de sueldo mínimo
  getSueldosMinimos: async (): Promise<SueldoMinimo[]> => {
    const response = await api.get('/api/sueldos-minimos');
    return response.data;
  },

  // Obtener el sueldo mínimo vigente
  getSueldoMinimoVigente: async (): Promise<SueldoMinimo> => {
    const response = await api.get('/api/sueldos-minimos/vigente');
    return response.data;
  },

  // Crear un nuevo registro de sueldo mínimo
  createSueldoMinimo: async (data: SueldoMinimoInput): Promise<SueldoMinimo> => {
    const response = await api.post('/api/sueldos-minimos', data);
    return response.data;
  }
};

export default sueldoMinimoService;
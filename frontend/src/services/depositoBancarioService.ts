import axios from 'axios';
import api from './api';

const API_BASE_URL = 'http://localhost:3000/api';

// Interfaz para los datos de movimiento de caja
export interface MovimientoCajaInput {
  tipo: string;
  concepto: string;
  moneda: string;
  monto: number;
  operacion: 'egreso' | 'ingreso';
  referencia_id?: number;
  referencia_tipo?: string;
  usuario_id: number;
}

export const depositoBancarioService = {
  // Crear un nuevo depósito bancario
  createDeposito: async (formData: FormData): Promise<any> => {
    try {
      const response = await api.post('/depositos-bancarios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al crear depósito bancario:', error.message);
      throw error;
    }
  },

  // Se elimina esta función ya que la lógica de registro en caja mayor
  // se debe manejar en el backend al crear el depósito.
  /*
  registrarMovimientoCaja: async (movimiento: MovimientoCajaInput): Promise<any> => {
    // ... cuerpo de la función eliminado ...
    }
  */
}; 
import axios from 'axios';

// URL base de la API
const API_URL = 'http://localhost:3000/api';

export interface OperacionBancaria {
  id?: string;
  tipo: 'pos' | 'transferencia';
  monto: number;
  montoACobrar?: number;
  tipoServicio: string;
  codigoBarrasPos?: string;
  posDescripcion?: string;
  numeroComprobante?: string;
  cuentaBancariaId?: number;
  cuentaBancaria?: {
    id: number;
    banco: string;
    numeroCuenta: string;
    moneda: string;
  };
  cajaId: string;
  rutaComprobante?: string;
  fecha?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperacionBancariaInput {
  tipo: 'pos' | 'transferencia';
  monto: number;
  montoACobrar?: number;
  tipoServicio: string;
  codigoBarrasPos?: string;
  posDescripcion?: string;
  numeroComprobante?: string;
  cuentaBancariaId?: number;
  cajaId: string;
}

const operacionBancariaService = {
  // Obtener todas las operaciones bancarias
  getAllOperacionesBancarias: async (): Promise<OperacionBancaria[]> => {
    try {
      const response = await axios.get(`${API_URL}/operaciones-bancarias`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener operaciones bancarias:', error.message);
      throw error;
    }
  },

  // Obtener operaciones bancarias por ID de caja
  getOperacionesBancariasByCajaId: async (cajaId: string): Promise<OperacionBancaria[]> => {
    try {
      const response = await axios.get(`${API_URL}/operaciones-bancarias/caja/${cajaId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener operaciones bancarias para caja ${cajaId}:`, error.message);
      throw error;
    }
  },

  // Obtener una operación bancaria por ID
  getOperacionBancariaById: async (id: string): Promise<OperacionBancaria> => {
    try {
      const response = await axios.get(`${API_URL}/operaciones-bancarias/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener operación bancaria ${id}:`, error.message);
      throw error;
    }
  },

  // Crear una nueva operación bancaria
  createOperacionBancaria: async (
    data: OperacionBancariaInput, 
    comprobante?: File
  ): Promise<OperacionBancaria> => {
    try {
      // Si hay un archivo adjunto, usar FormData
      if (comprobante) {
        const formData = new FormData();
        
        // Añadir los datos como JSON para que el backend pueda procesarlos correctamente
        formData.append('data', JSON.stringify(data));
        formData.append('comprobante', comprobante);
        
        const response = await axios.post(`${API_URL}/operaciones-bancarias`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Si no hay archivo, enviar JSON directamente
        const response = await axios.post(`${API_URL}/operaciones-bancarias`, data);
        return response.data;
      }
    } catch (error: any) {
      console.error('Error al crear operación bancaria:', error.message);
      throw error;
    }
  },

  // Actualizar una operación bancaria existente
  updateOperacionBancaria: async (
    id: string, 
    data: Partial<OperacionBancariaInput>, 
    comprobante?: File
  ): Promise<OperacionBancaria> => {
    try {
      // Si hay un archivo adjunto, usar FormData
      if (comprobante) {
        const formData = new FormData();
        
        // Añadir los datos como JSON
        formData.append('data', JSON.stringify(data));
        formData.append('comprobante', comprobante);
        
        const response = await axios.put(`${API_URL}/operaciones-bancarias/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Si no hay archivo, enviar JSON directamente
        const response = await axios.put(`${API_URL}/operaciones-bancarias/${id}`, data);
        return response.data;
      }
    } catch (error: any) {
      console.error(`Error al actualizar operación bancaria ${id}:`, error.message);
      throw error;
    }
  },

  // Eliminar una operación bancaria
  deleteOperacionBancaria: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/operaciones-bancarias/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar operación bancaria ${id}:`, error.message);
      throw error;
    }
  }
};

export default operacionBancariaService; 
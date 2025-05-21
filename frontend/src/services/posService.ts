import axios from 'axios';

// Ya no definimos API_URL aquí,
// se asume que axios está configurado globalmente en App.tsx.

export interface Pos {
  id: number;
  nombre: string;
  codigoBarras: string; // Debe ser único si se usa para búsqueda
  cuentaBancariaId: number;
  cuentaBancaria?: { // Opcional, dependiendo si el backend siempre lo incluye
    id: number;
    banco: string;
    numeroCuenta: string;
    moneda: string; // 'PYG' | 'BRL' | 'USD'
  };
  createdAt?: string; // Usualmente string en formato ISO si viene del backend
  updatedAt?: string; // Usualmente string en formato ISO si viene del backend
}

// Para creación, usualmente no se envía id, createdAt, updatedAt
export type PosInput = Omit<Pos, 'id' | 'createdAt' | 'updatedAt' | 'cuentaBancaria'>;


const posService = {
  // Obtener todos los POS
  getAllPos: async (): Promise<Pos[]> => {
    try {
      console.log('Obteniendo todos los dispositivos POS desde: /api/pos');
      const response = await axios.get('/api/pos'); // Ruta relativa
      console.log('Respuesta del servidor (getAllPos):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener dispositivos POS:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (getAllPos error):', error.response.data);
      }
      throw error;
    }
  },

  // Obtener un POS por ID
  getPosById: async (id: number): Promise<Pos> => {
    try {
      // Asumiendo que la ruta correcta en el backend es /api/pos/:id
      // Si es /api/pos/id/:id como antes, ajústalo. Prefiere /api/pos/:id por consistencia.
      console.log(`Obteniendo POS por ID desde: /api/pos/${id}`);
      const response = await axios.get(`/api/pos/${id}`); // Ruta relativa
      console.log(`Respuesta del servidor (getPosById ${id}):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener dispositivo POS ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (getPosById ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Obtener un POS por código de barras
  getPosByCodigoBarras: async (codigo: string): Promise<Pos | null> => {
    try {
      console.log(`Buscando POS con código de barras ${codigo}`);
      console.log(`URL para buscar POS por código: /api/pos/codigo/${codigo}`);
      
      const response = await axios.get(`/api/pos/codigo/${codigo}`); // Ruta relativa
      console.log('Respuesta del servidor (buscar POS por código):', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al buscar POS con código ${codigo}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (buscar POS por código ${codigo} error):`, error.response.data);
        // Si el error es 404, devolver null en lugar de lanzar error
        if (error.response.status === 404) {
          console.log(`POS con código ${codigo} no encontrado (404), devolviendo null.`);
          return null;
        }
      }
      throw error;
    }
  },

  // Crear un nuevo POS
  createPos: async (data: PosInput): Promise<Pos> => {
    try {
      console.log('Creando POS con datos:', data);
      console.log('URL para crear POS: /api/pos');
      const response = await axios.post('/api/pos', data); // Ruta relativa
      console.log('Respuesta del servidor (createPos):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear dispositivo POS:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (createPos error):', error.response.data);
      }
      throw error;
    }
  },

  // Actualizar un POS existente
  updatePos: async (id: number, data: Partial<PosInput>): Promise<Pos> => {
    try {
      console.log(`Actualizando POS ${id} con datos:`, data);
      console.log(`URL para actualizar POS: /api/pos/${id}`);
      const response = await axios.put(`/api/pos/${id}`, data); // Ruta relativa
      console.log(`Respuesta del servidor (updatePos ${id}):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar dispositivo POS ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (updatePos ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Eliminar un POS
  deletePos: async (id: number): Promise<void> => {
    try {
      console.log(`Eliminando POS con ID: ${id}`);
      console.log(`URL para eliminar POS: /api/pos/${id}`);
      await axios.delete(`/api/pos/${id}`); // Ruta relativa
      console.log(`POS ${id} eliminado exitosamente.`);
    } catch (error: any) {
      console.error(`Error al eliminar dispositivo POS ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (deletePos ${id} error):`, error.response.data);
      }
      throw error;
    }
  }
};

export default posService;
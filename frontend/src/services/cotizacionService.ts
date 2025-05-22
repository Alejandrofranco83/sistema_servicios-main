import api from './api'; // Importar instancia global de Axios
// import axios from 'axios'; // Eliminar axios directo

export interface Cotizacion {
  id: number;
  fecha: string;
  valorDolar: number;
  valorReal: number;
  vigente: boolean;
  usuarioId: number;
  usuario?: {
    id: number;
    username: string;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CotizacionInput {
  valorDolar: number;
  valorReal: number;
}

const cotizacionService = {
  // Obtener todas las cotizaciones
  getCotizaciones: async (): Promise<Cotizacion[]> => {
    // const response = await axios.get('/api/cotizaciones'); // Antigua
    const response = await api.get('/api/cotizaciones'); // Corregida
    return response.data;
  },

  // Obtener la cotización vigente
  getCotizacionVigente: async (): Promise<Cotizacion> => {
    // const response = await axios.get('/api/cotizaciones/vigente'); // Antigua
    const response = await api.get('/api/cotizaciones/vigente'); // Corregida
    return response.data;
  },

  // Obtener una cotización por su ID
  getCotizacionById: async (id: number): Promise<Cotizacion> => {
    // const response = await axios.get(`/api/cotizaciones/\${id}`); // Antigua
    const response = await api.get(`/api/cotizaciones/${id}`); // Corregida
    return response.data;
  },

  // Obtener la cotización vigente para una fecha específica
  getCotizacionByFecha: async (fecha: string): Promise<Cotizacion> => {
    try {
      // const response = await axios.get(`/api/cotizaciones/fecha/\${fecha}`); // Antigua
      const response = await api.get(`/api/cotizaciones/fecha/${fecha}`); // Corregida
      return response.data;
    } catch (error) {
      console.error('Error al obtener cotización por fecha:', error);
      // Si no se encuentra una cotización para la fecha específica, intentar obtener la más cercana
      const cotizaciones = await cotizacionService.getCotizaciones();
      if (cotizaciones.length === 0) {
        throw new Error('No hay cotizaciones disponibles');
      }
      
      // Obtener la cotización más cercana a la fecha solicitada
      const fechaObjetivo = new Date(fecha);
      
      // Ordenar por proximidad a la fecha objetivo
      cotizaciones.sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return Math.abs(fechaA.getTime() - fechaObjetivo.getTime()) - 
               Math.abs(fechaB.getTime() - fechaObjetivo.getTime());
      });
      
      // Retornar la cotización más cercana
      return cotizaciones[0];
    }
  },

  // Crear una nueva cotización
  createCotizacion: async (data: CotizacionInput): Promise<Cotizacion> => {
    // const response = await axios.post('/api/cotizaciones', data); // Antigua
    const response = await api.post('/api/cotizaciones', data); // Corregida
    return response.data;
  },

  // Actualizar una cotización existente
  updateCotizacion: async (id: number, data: Partial<CotizacionInput>): Promise<Cotizacion> => {
    // const response = await axios.put(`/api/cotizaciones/\${id}`, data); // Antigua
    const response = await api.put(`/api/cotizaciones/${id}`, data); // Corregida
    return response.data;
  },

  // Eliminar una cotización
  deleteCotizacion: async (id: number): Promise<void> => {
    // await axios.delete(`/api/cotizaciones/\${id}`); // Antigua
    await api.delete(`/api/cotizaciones/${id}`); // Corregida
  }
};

export default cotizacionService; 
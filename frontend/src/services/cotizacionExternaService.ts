import axios from 'axios';

// Interface para la respuesta del servidor
interface CambiosAlberdiResponse {
  success: boolean;
  cotizaciones: {
    dolar: {
      compra: number;
      venta: number;
    };
    real: {
      compra: number;
      venta: number;
    };
    lastUpdate: string;
  };
  source: string;
}

// Servicio para cotizaciones externas
const cotizacionExternaService = {
  // Obtener cotizaciones de Cambios Alberdi
  getCambiosAlberdi: async (): Promise<CambiosAlberdiResponse> => {
    try {
      const response = await axios.get('/api/cotizaciones-externas/cambios-alberdi');
      return response.data;
    } catch (error) {
      console.error('Error al obtener cotizaciones de Cambios Alberdi:', error);
      throw error;
    }
  }
};

export default cotizacionExternaService; 
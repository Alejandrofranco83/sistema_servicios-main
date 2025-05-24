import axios from 'axios';
import debugService from '../services/debugService';
import api from '../services/api'; // Importar la instancia api global

// Configuración base para Axios - usar variable de entorno
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://192.168.100.31:3001/api';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Interceptor para debugging
axios.interceptors.request.use(
  (config) => {
    debugService.apiRequest(config.method || 'unknown', config.url || '', config.data);
    return config;
  },
  (error) => {
    debugService.apiRequestError(error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    debugService.apiResponse(response.status, response.config.url || '', response.data);
    return response;
  },
  (error) => {
    debugService.apiResponseError(error);
    return Promise.reject(error);
  }
);

// Exportar servicios específicos usando la instancia api global
export const apiService = {
  // Maletines
  maletines: {
    getAll: () => api.get('/api/maletines'),
    getById: (id: string) => api.get(`/api/maletines/${id}`),
    create: (data: any) => api.post('/api/maletines', data),
    update: (id: string, data: any) => api.put(`/api/maletines/${id}`, data),
    delete: (id: string) => api.delete(`/api/maletines/${id}`)
  },
  // Sucursales
  sucursales: {
    getAll: () => api.get('/api/sucursales'),
    getById: (id: string) => api.get(`/api/sucursales/${id}`),
    create: (data: any) => api.post('/api/sucursales', data),
    update: (id: string, data: any) => api.put(`/api/sucursales/${id}`, data),
    delete: (id: string) => api.delete(`/api/sucursales/${id}`)
  }
};

export default axios; 
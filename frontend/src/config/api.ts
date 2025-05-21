import axios from 'axios';
import debugService from '../services/debugService';

// Configuración base para Axios
axios.defaults.baseURL = 'http://localhost:3000';
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

// Exportar servicios específicos
export const apiService = {
  // Maletines
  maletines: {
    getAll: () => axios.get('/api/maletines'),
    getById: (id: string) => axios.get(`/api/maletines/${id}`),
    create: (data: any) => axios.post('/api/maletines', data),
    update: (id: string, data: any) => axios.put(`/api/maletines/${id}`, data),
    delete: (id: string) => axios.delete(`/api/maletines/${id}`)
  },
  // Sucursales
  sucursales: {
    getAll: () => axios.get('/api/sucursales'),
    getById: (id: string) => axios.get(`/api/sucursales/${id}`),
    create: (data: any) => axios.post('/api/sucursales', data),
    update: (id: string, data: any) => axios.put(`/api/sucursales/${id}`, data),
    delete: (id: string) => axios.delete(`/api/sucursales/${id}`)
  }
};

export default axios; 
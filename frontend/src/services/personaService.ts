import axios from 'axios';

// Ya no definimos API_BASE_URL ni axios.defaults aquí,
// se asume que axios está configurado globalmente en App.tsx
// y que su baseURL apunta a http://<tu_servidor_ip_o_dominio>:<puerto>
// y las llamadas usarán rutas relativas como '/api/personas'.

export interface Persona {
  id: number;
  nombreCompleto: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  tipo: 'Cliente' | 'Funcionario' | 'Conveniado' | 'Vip';
  fechaNacimiento: string | null; // Mantener como string si el backend espera ISO string
}

export const personaService = {
  // Obtener todas las personas
  getPersonas: async (): Promise<Persona[]> => {
    try {
      console.log('Obteniendo personas desde: /api/personas');
      const response = await axios.get('/api/personas'); // Ruta relativa
      console.log('Respuesta del servidor (getPersonas):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener personas:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (getPersonas error):', error.response.data);
      }
      throw error;
    }
  },

  // Obtener una persona por ID
  getPersonaById: async (id: number): Promise<Persona> => {
    try {
      console.log(`Obteniendo persona por ID desde: /api/personas/${id}`);
      const response = await axios.get(`/api/personas/${id}`); // Ruta relativa
      console.log(`Respuesta del servidor (getPersonaById ${id}):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener persona ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (getPersonaById ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Crear una nueva persona
  createPersona: async (persona: Omit<Persona, 'id'>): Promise<Persona> => {
    try {
      console.log('Creando persona con datos:', persona);
      console.log('URL para crear persona: /api/personas');
      
      const personaData = {
        ...persona,
        // Asegúrate que el backend maneje bien el formato de fechaNacimiento
        // Si esperas un ISO string, y fechaNacimiento ya lo es o es null, no necesitas new Date().toISOString()
        // Si fechaNacimiento es un objeto Date o una string que necesita conversión:
        fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString() : null
      };
      
      const response = await axios.post('/api/personas', personaData); // Ruta relativa
      console.log('Respuesta del servidor (createPersona):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear persona:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (createPersona error):', error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor (createPersona)');
      }
      throw error;
    }
  },

  // Actualizar una persona existente
  updatePersona: async (id: number, persona: Partial<Persona>): Promise<Persona> => {
    try {
      console.log(`Actualizando persona ${id} con datos:`, persona);
      console.log(`URL para actualizar persona: /api/personas/${id}`);

      const personaData = {
        ...persona,
        fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString() : null
      };
      
      const response = await axios.put(`/api/personas/${id}`, personaData); // Ruta relativa
      console.log(`Respuesta del servidor (updatePersona ${id}):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar persona ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (updatePersona ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Eliminar una persona
  deletePersona: async (id: number): Promise<void> => {
    try {
      console.log(`Eliminando persona con ID: ${id}`);
      console.log(`URL para eliminar persona: /api/personas/${id}`);
      await axios.delete(`/api/personas/${id}`); // Ruta relativa
      console.log(`Persona ${id} eliminada exitosamente.`);
    } catch (error: any) {
      console.error(`Error al eliminar persona ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (deletePersona ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Buscar personas por texto
  searchPersonas: async (query: string): Promise<Persona[]> => {
    try {
      console.log(`Buscando personas con query: "${query}"`);
      console.log(`URL para buscar personas: /api/personas/search?query=${encodeURIComponent(query)}`);
      const response = await axios.get(`/api/personas/search?query=${encodeURIComponent(query)}`); // Ruta relativa
      console.log(`Respuesta del servidor (searchPersonas "${query}"):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al buscar personas con query "${query}":`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (searchPersonas "${query}" error):`, error.response.data);
      }
      throw error;
    }
  }
};
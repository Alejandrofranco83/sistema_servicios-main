import axios from 'axios';
import { Persona } from './personaService'; // Se mantiene esta importación

// SE ELIMINA LA CONSTANTE API_BASE_URL de aquí

export interface Usuario {
  id: number;
  username: string;
  personaId: number;
  nombre: string;
  tipo: string;
  persona: Persona; // Dejamos 'persona' como estaba en tu original (obligatoria)
                  // Si el error TS18048 vuelve a aparecer, sabremos que es porque
                  // el backend no siempre la envía, y entonces la haremos opcional (persona?: Persona)
                  // y aplicaremos 'safeguards' (?. ) en el componente Usuarios.tsx.
  rol?: {
    id: number;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioInput {
  username: string;
  personaId: number;
  nombre: string;
  tipo: string;
  rolId?: number;
  password?: string; // Añadido por si se necesita para crear usuarios con contraseña
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export const usuarioService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log('Service - Intentando login con:', {
        username: credentials.username.toUpperCase(),
        // No loguear la contraseña en producción
      });
      
      // Ruta relativa, usa la baseURL global de App.tsx
      const response = await axios.post('/api/auth/login', { 
        username: credentials.username.toUpperCase(),
        password: credentials.password,
      });
      
      console.log('Service - Respuesta del servidor (login):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Service - Error al iniciar sesión:', error.message);
      if (error.response) {
        console.error('Service - Respuesta del servidor (login error):', error.response.data);
      }
      throw error;
    }
  },

  // Obtener todos los usuarios
  getUsuarios: async (): Promise<Usuario[]> => {
    try {
      console.log('Obteniendo todos los usuarios desde: /api/usuarios');
      // Ruta relativa
      const response = await axios.get('/api/usuarios'); 
      console.log('Respuesta del servidor (getUsuarios):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (getUsuarios error):', error.response.data);
      }
      throw error;
    }
  },

  // Obtener un usuario por ID
  getUsuarioById: async (id: number): Promise<Usuario> => {
    try {
      console.log(`Obteniendo usuario por ID desde: /api/usuarios/${id}`);
      // Ruta relativa
      const response = await axios.get(`/api/usuarios/${id}`); 
      console.log(`Respuesta del servidor (getUsuarioById ${id}):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener usuario ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (getUsuarioById ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Crear un nuevo usuario
  createUsuario: async (usuario: UsuarioInput): Promise<Usuario> => {
    try {
      console.log('Creando usuario con datos:', usuario);
      console.log('URL para crear usuario: /api/usuarios');
      // Ruta relativa
      const response = await axios.post('/api/usuarios', usuario); 
      console.log('Respuesta del servidor (createUsuario):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear usuario:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (createUsuario error):', error.response.data);
      }
      throw error;
    }
  },

  // Actualizar un usuario existente
  updateUsuario: async (id: number, usuario: Partial<UsuarioInput>): Promise<Usuario> => {
    try {
      console.log(`Actualizando usuario ${id} con datos:`, usuario);
      console.log(`URL para actualizar usuario: /api/usuarios/${id}`);
      // Ruta relativa
      const response = await axios.put(`/api/usuarios/${id}`, usuario); 
      console.log(`Respuesta del servidor (updateUsuario ${id}):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar usuario ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (updateUsuario ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Eliminar un usuario
  deleteUsuario: async (id: number): Promise<void> => {
    try {
      console.log(`Eliminando usuario con ID: ${id}`);
      console.log(`URL para eliminar usuario: /api/usuarios/${id}`);
      // Ruta relativa
      await axios.delete(`/api/usuarios/${id}`); 
      console.log(`Usuario ${id} eliminado exitosamente.`);
    } catch (error: any) {
      console.error(`Error al eliminar usuario ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (deleteUsuario ${id} error):`, error.response.data);
      }
      throw error;
    }
  },

  // Resetear contraseña de usuario
  resetPassword: async (id: number): Promise<void> => {
    try {
      console.log(`Reseteando contraseña para usuario ID: ${id}`);
      console.log(`URL para resetear contraseña: /api/usuarios/${id}/reset-password`);
      // Ruta relativa
      await axios.post(`/api/usuarios/${id}/reset-password`); 
      console.log(`Contraseña reseteada para usuario ${id}.`);
    } catch (error: any) {
      console.error(`Error al resetear contraseña del usuario ${id}:`, error.message);
      if (error.response) {
        console.error(`Respuesta del servidor (resetPassword ${id} error):`, error.response.data);
      }
      throw error;
    }
  }
};
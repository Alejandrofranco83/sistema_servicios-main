import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Permiso {
  id: number;
  modulo: string;
  pantalla: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
  createdAt: string;
  updatedAt: string;
}

export interface RolInput {
  nombre: string;
  descripcion?: string;
  permisos: (Permiso | number)[];
}

export const rolService = {
  // Obtener todos los roles
  getRoles: async (): Promise<Rol[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener roles:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Obtener un rol por ID
  getRol: async (id: number): Promise<Rol> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener rol ${id}:`, error.message);
      throw error;
    }
  },

  // Crear un nuevo rol
  createRol: async (rolData: RolInput): Promise<Rol> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/roles`, rolData);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear rol:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Actualizar un rol existente
  updateRol: async (id: number, rolData: Partial<RolInput>): Promise<Rol> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/roles/${id}`, rolData);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar rol ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Eliminar un rol
  deleteRol: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/roles/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar rol ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Obtener todos los permisos disponibles
  getPermisos: async (): Promise<Permiso[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/permisos`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener permisos:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Crear un nuevo permiso (para administradores)
  createPermiso: async (permisoData: Omit<Permiso, 'id' | 'createdAt' | 'updatedAt'>): Promise<Permiso> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/permisos`, permisoData);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear permiso:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Eliminar un permiso (para administradores)
  deletePermiso: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/permisos/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar permiso ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  }
};

// Función para verificar y crear el permiso OPERACIONES/CAJAS si no existe
export const verificarYCrearPermisosOperaciones = async () => {
  try {
    const permisosCajas = await rolService.getPermisos();
    const permisoOperacionesCajas = permisosCajas.find(p => 
      p.modulo === 'OPERACIONES' && p.pantalla === 'CAJAS'
    );

    if (!permisoOperacionesCajas) {
      try {
        await rolService.createPermiso({
          modulo: 'OPERACIONES',
          pantalla: 'CAJAS',
          descripcion: 'Permiso para acceder a las operaciones de cajas'
        });
        console.log('Permiso OPERACIONES/CAJAS creado exitosamente');
      } catch (err) {
        console.error('Error al crear permiso OPERACIONES/CAJAS:', err);
      }
    }
  } catch (err) {
    console.error('Error al verificar permisos OPERACIONES:', err);
  }
}; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  rolId: number;
  branchId: string;
  rol?: {
    id: number;
    nombre: string;
    permisos: Permission[];
  };
}

interface Permission {
  id: number;
  modulo: string;
  pantalla: string;
  descripcion?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (modulo: string, pantalla?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cargar el usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      // Configurar el token para todas las solicitudes
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      
      // Intentar establecer el usuario desde el almacenamiento
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Cargar el rol y permisos del usuario si no están cargados
        if (!parsedUser.rol) {
          loadUserPermissions(parsedUser.id);
        }
      } catch (error) {
        console.error('Error al parsear el usuario almacenado:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    
    setLoading(false);
  }, []);

  // Cargar permisos del usuario
  const loadUserPermissions = async (userId: number) => {
    try {
      console.log(`Cargando permisos para el usuario ID: ${userId}`);
      
      // Obtener el usuario con sus permisos
      const response = await axios.get(`/api/usuarios/${userId}`);
      const userData = response.data;
      
      console.log('Datos del usuario obtenidos:', userData);
      
      if (userData.rol && userData.rol.permisos) {
        console.log('Rol del usuario:', userData.rol.nombre);
        console.log('Permisos cargados:', userData.rol.permisos.map((p: Permission) => `${p.modulo}/${p.pantalla}`));
      } else {
        console.warn('El usuario no tiene rol o permisos asociados');
      }
      
      // Actualizar el estado y localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error al cargar permisos del usuario:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', { username, password });
      const { token: responseToken, user } = response.data;
      
      // Registrar en la consola para depuración
      console.log('%c === Usuario autenticado ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;');
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      
      if (user.rol) {
        console.log('%c === Rol del usuario ===', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 2px;');
        console.log('ID del rol:', user.rolId);
        console.log('Nombre del rol:', user.rol.nombre);
        
        if (user.rol.permisos && user.rol.permisos.length > 0) {
          console.log('%c === Permisos asignados ===', 'background: #FF9800; color: white; padding: 2px 5px; border-radius: 2px;');
          console.table(user.rol.permisos.map((p: Permission) => ({ 
            id: p.id, 
            modulo: p.modulo, 
            pantalla: p.pantalla, 
            descripcion: p.descripcion || '-' 
          })));
        } else {
          console.warn('%c === Sin permisos asignados ===', 'background: #F44336; color: white; padding: 2px 5px; border-radius: 2px;');
          console.log('El rol no tiene permisos asignados.');
        }
      } else {
        console.warn('%c === Sin rol asignado ===', 'background: #F44336; color: white; padding: 2px 5px; border-radius: 2px;');
        console.log('El usuario no tiene un rol asignado.');
      }
      
      // Guardar el token y el usuario
      localStorage.setItem('token', responseToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Establecer el token y el usuario en el estado
      setToken(responseToken);
      
      // Configurar el token para todas las solicitudes
      axios.defaults.headers.common['Authorization'] = `Bearer ${responseToken}`;
      
      // Establecer el usuario en el estado
      setUser(user);
      
      // Cargar permisos si es necesario
      if (!user.rol) {
        await loadUserPermissions(user.id);
      }
      
      // Redireccionar al dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Limpiar el estado de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar los headers de axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Resetear el estado
    setUser(null);
    setToken(null);
    
    // Redireccionar al login
    navigate('/login');
  };

  // Función para eliminar acentos y diacríticos de un string
  const normalize = (str: string): string => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (modulo: string, pantalla?: string) => {
    console.log(`%c[PERMISOS] Verificando: Módulo="${modulo}", Pantalla="${pantalla || 'N/A'}"`, 'color: blue; font-weight: bold;');

    // Si no hay usuario autenticado, no tiene permiso
    if (!user || !user.rol) {
      console.log('%c[PERMISOS] Resultado: NO (Sin usuario o sin rol)', 'color: red;');
      return false;
    }
    
    console.log(`%c[PERMISOS] Usuario: ${user.username}, Rol: ${user.rol.nombre}`, 'color: gray;');

    // Si es administrador, tiene todos los permisos
    if (user.rol.nombre === 'ADMINISTRADOR') {
      console.log('%c[PERMISOS] Resultado: SÍ (Usuario es ADMINISTRADOR)', 'color: green;');
      return true;
    }
    
    // Verificar permisos específicos
    if (!user.rol.permisos || user.rol.permisos.length === 0) {
      console.log(`%c[PERMISOS] Resultado: NO (Rol ${user.rol.nombre} no tiene permisos definidos o está vacío)`, 'color: red;');
      console.log('[PERMISOS] Permisos actuales:', user.rol.permisos);
      return false;
    }

    // console.log('=== DATOS COMPLETOS DE PERMISOS ===');
    // console.log('Usuario:', user.username);
    // console.log('Rol:', user.rol.nombre);
    // console.log('Permisos disponibles:', user.rol.permisos);
    // console.log('Permisos disponibles (detalle):');
    // user.rol.permisos.forEach((p, index) => {
    //   console.log(`#${index+1} - ID: ${p.id}, Módulo: "${p.modulo}", Pantalla: "${p.pantalla}"`);
    // });
    // console.log('Buscando permiso - Módulo:', modulo, 'Pantalla:', pantalla || 'cualquiera');
    
    // Normalizar módulo para la comparación (convertir espacios a guiones bajos, quitar acentos y a mayúsculas)
    const moduloNormalizado = normalize(modulo).replace(/\\s+/g, '_');
    
    // Si solo se especifica el módulo, verificar que tenga acceso al módulo
    if (!pantalla) {
      const permisosDelModulo = user.rol.permisos.filter(
        (p) => normalize(p.modulo) === moduloNormalizado
      );
      // console.log(`Permisos encontrados para el módulo ${moduloNormalizado}:`, permisosDelModulo);
      
      const tienePermiso = permisosDelModulo.length > 0;
      console.log(`%c[PERMISOS] Resultado (solo módulo ${moduloNormalizado}): ${tienePermiso ? 'SÍ' : 'NO'}`, tienePermiso ? 'color: green;' : 'color: red;');
      return tienePermiso;
    }
    
    // Normalizar pantalla para la comparación (a mayúsculas y sin acentos)
    const pantallaNormalizada = normalize(pantalla);
    
    // Verificar permiso específico (módulo y pantalla)
    const permisosEspecificos = user.rol.permisos.filter(
      (p) => normalize(p.modulo) === moduloNormalizado && 
             normalize(p.pantalla) === pantallaNormalizada
    );
    // console.log(`Permisos específicos encontrados para ${moduloNormalizado}/${pantallaNormalizada}:`, permisosEspecificos);
    
    const tienePermiso = permisosEspecificos.length > 0;
    console.log(`%c[PERMISOS] Resultado (${moduloNormalizado}/${pantallaNormalizada}): ${tienePermiso ? 'SÍ' : 'NO'}`, tienePermiso ? 'color: green;' : 'color: red;');
    return tienePermiso;
  };

  const value = {
    user,
    loading,
    error,
    token,
    login,
    logout,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
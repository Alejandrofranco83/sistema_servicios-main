import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Definir interface para sucursal
export interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono: string;
  email?: string;
}

// Clave para localStorage
const SUCURSAL_STORAGE_KEY = 'sucursal_seleccionada';

// Definir interfaces para el contexto
interface SucursalContextType {
  sucursalActual: Sucursal | null;
  loading: boolean;
  error: string | null;
  setSucursal: (sucursal: Sucursal | null) => void;
}

// Crear el contexto
const SucursalContext = createContext<SucursalContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useSucursal = () => {
  const context = useContext(SucursalContext);
  if (context === undefined) {
    throw new Error('useSucursal debe ser usado dentro de un SucursalProvider');
  }
  return context;
};

// Datos de ejemplo para sucursales
const sucursalesEjemplo: Sucursal[] = [
  {
    id: 'SUC001',
    nombre: 'Central',
    codigo: 'CEN',
    direccion: 'Av. Eusebio Ayala 1234, Asunción',
    telefono: '021-123-4567',
    email: 'central@farmaciafranco.com'
  },
  {
    id: 'SUC002',
    nombre: 'Itaipu',
    codigo: 'ITA',
    direccion: 'Ruta Internacional, Ciudad del Este',
    telefono: '061-589-6785',
    email: 'itaipu@farmaciafranco.com'
  },
  {
    id: 'SUC003',
    nombre: 'Calle 10',
    codigo: 'C10',
    direccion: 'Calle 10, Ciudad del Este',
    telefono: '061-512-3489',
    email: 'calle10@farmaciafranco.com'
  }
];

// Función para obtener sucursal del localStorage
const getSucursalFromStorage = (): Sucursal | null => {
  try {
    const storedSucursal = localStorage.getItem(SUCURSAL_STORAGE_KEY);
    if (storedSucursal) {
      return JSON.parse(storedSucursal);
    }
    return null;
  } catch (err) {
    console.error('Error al leer sucursal del almacenamiento local:', err);
    return null;
  }
};

// Proveedor del contexto
export const SucursalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(getSucursalFromStorage());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al iniciar o cambiar el usuario, cargar la sucursal correspondiente
  useEffect(() => {
    const cargarSucursal = async () => {
      setLoading(true);
      setError(null);

      try {
        // Primero intentamos cargar desde localStorage
        const sucursalGuardada = getSucursalFromStorage();
        
        if (sucursalGuardada) {
          console.log(`Sucursal cargada desde almacenamiento local: ${sucursalGuardada.nombre}`);
          setSucursalActual(sucursalGuardada);
          setLoading(false);
          return;
        }
        
        // Si no hay sucursal guardada localmente, seguimos con la lógica existente
        // En producción, esto debería venir de una llamada a la API
        // basado en el branchId del usuario actual
        
        if (user?.branchId) {
          // Por ahora simulamos la carga con los datos de ejemplo
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Buscar la sucursal por el branchId del usuario
          // Comparamos con el ID o código de la sucursal
          const sucursalEncontrada = sucursalesEjemplo.find(
            s => s.id === user.branchId || s.codigo === user.branchId
          );
          
          if (sucursalEncontrada) {
            setSucursalActual(sucursalEncontrada);
            console.log(`Sucursal encontrada: ${sucursalEncontrada.nombre}`);
          } else {
            // Si no encuentra, establecer la primera (Central) como default
            setSucursalActual(sucursalesEjemplo[0]);
            console.warn(`No se encontró una sucursal para el branchId: ${user.branchId}. Se asigna sucursal Central por defecto.`);
          }
        } else {
          // Si el usuario no tiene branchId, establecer Central como default
          setSucursalActual(sucursalesEjemplo[0]);
          console.warn("Usuario sin sucursal asignada. Se asigna sucursal Central por defecto.");
        }
      } catch (err) {
        console.error('Error al cargar la sucursal:', err);
        setError('No se pudo cargar la información de la sucursal');
      } finally {
        setLoading(false);
      }
    };

    if (user && !sucursalActual) {
      cargarSucursal();
    } else if (!user) {
      setSucursalActual(null);
      setLoading(false);
    }
  }, [user, sucursalActual]);

  // Función para cambiar la sucursal manualmente (solo para admin)
  const setSucursal = (sucursal: Sucursal | null) => {
    setSucursalActual(sucursal);
    
    // Guardar en localStorage
    if (sucursal) {
      try {
        localStorage.setItem(SUCURSAL_STORAGE_KEY, JSON.stringify(sucursal));
        console.log(`Sucursal guardada en almacenamiento local: ${sucursal.nombre}`);
      } catch (err) {
        console.error('Error al guardar sucursal en almacenamiento local:', err);
      }
    } else {
      // Si es null, eliminar del localStorage
      localStorage.removeItem(SUCURSAL_STORAGE_KEY);
    }
  };

  const value = {
    sucursalActual,
    loading,
    error,
    setSucursal
  };

  return <SucursalContext.Provider value={value}>{children}</SucursalContext.Provider>;
}; 
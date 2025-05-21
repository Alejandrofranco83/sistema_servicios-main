import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Definir la interfaz para el contexto
interface ServerStatusContextType {
  isOnline: boolean;
  lastChecked: Date | null;
  checkServerStatus: () => Promise<void>;
}

// Crear el contexto con un valor predeterminado
const ServerStatusContext = createContext<ServerStatusContextType>({
  isOnline: false,
  lastChecked: null,
  checkServerStatus: async () => {},
});

// Hook personalizado para utilizar el contexto
export const useServerStatus = () => useContext(ServerStatusContext);

interface ServerStatusProviderProps {
  children: ReactNode;
  checkInterval?: number; // Intervalo en ms para verificar el estado del servidor
}

export const ServerStatusProvider: React.FC<ServerStatusProviderProps> = ({ 
  children, 
  checkInterval = 60000 // Verificar cada minuto por defecto
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Función para verificar el estado del servidor
  const checkServerStatus = async () => {
    try {
      // Intentar hacer una solicitud simple a la API
      await axios.get('/api/health', { timeout: 5000 });
      
      // Si la solicitud es exitosa, el servidor está en línea
      setIsOnline(true);
    } catch (error) {
      // Si hay un error en la solicitud, el servidor está fuera de línea
      setIsOnline(false);
    }
    
    // Actualizar la marca de tiempo de la última verificación
    setLastChecked(new Date());
  };

  // Verificar el estado del servidor al cargar el componente
  useEffect(() => {
    checkServerStatus();
    
    // Configurar verificación periódica
    const intervalId = setInterval(checkServerStatus, checkInterval);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [checkInterval]);

  return (
    <ServerStatusContext.Provider value={{ isOnline, lastChecked, checkServerStatus }}>
      {children}
    </ServerStatusContext.Provider>
  );
};

export default ServerStatusContext; 
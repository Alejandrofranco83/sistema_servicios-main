import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sucursal } from '../../contexts/SucursalContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface QRData {
  sucursalId: string;
  sucursalNombre: string;
  codigo: string;
  timestamp: string;
  hash: string; // Para validación de seguridad
}

interface MobileSucursalContextType {
  sucursalMovil: Sucursal | null;
  loading: boolean;
  error: string | null;
  qrEscaneado: boolean;
  seleccionarSucursalPorQR: (qrData: string) => Promise<boolean>;
  limpiarSucursalMovil: () => void;
  validarAccesoSucursal: () => boolean;
}

const MobileSucursalContext = createContext<MobileSucursalContextType | undefined>(undefined);

export const useMobileSucursal = () => {
  const context = useContext(MobileSucursalContext);
  if (context === undefined) {
    throw new Error('useMobileSucursal debe ser usado dentro de un MobileSucursalProvider');
  }
  return context;
};

// Clave para localStorage móvil
const MOBILE_SUCURSAL_KEY = 'mobile_sucursal_seleccionada';
const QR_TIMESTAMP_KEY = 'mobile_qr_timestamp';

// Validar que el QR no sea muy antiguo (máximo 1 hora)
const QR_VALIDITY_HOURS = 1;

export const MobileSucursalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sucursalMovil, setSucursalMovil] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrEscaneado, setQrEscaneado] = useState(false);

  // Cargar sucursal móvil del localStorage al iniciar
  useEffect(() => {
    const cargarSucursalMovil = () => {
      try {
        const sucursalGuardada = localStorage.getItem(MOBILE_SUCURSAL_KEY);
        const timestampGuardado = localStorage.getItem(QR_TIMESTAMP_KEY);
        
        if (sucursalGuardada && timestampGuardado) {
          const timestamp = parseInt(timestampGuardado);
          const ahora = Date.now();
          const horasTranscurridas = (ahora - timestamp) / (1000 * 60 * 60);
          
          // Verificar si el QR sigue siendo válido
          if (horasTranscurridas <= QR_VALIDITY_HOURS) {
            const sucursal = JSON.parse(sucursalGuardada);
            setSucursalMovil(sucursal);
            setQrEscaneado(true);
            console.log(`📱 Sucursal móvil cargada: ${sucursal.nombre}`);
          } else {
            // QR expirado, limpiar
            console.log('⏰ QR expirado, limpiando sucursal móvil');
            limpiarSucursalMovil();
          }
        }
      } catch (err) {
        console.error('Error al cargar sucursal móvil:', err);
        limpiarSucursalMovil();
      } finally {
        setLoading(false);
      }
    };

    cargarSucursalMovil();
  }, []);

  // Función para seleccionar sucursal mediante QR
  const seleccionarSucursalPorQR = async (qrData: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('📱 Procesando QR:', qrData);

      // Intentar parsear el QR como JSON
      let datosQR: QRData;
      try {
        datosQR = JSON.parse(qrData);
      } catch {
        // Si no es JSON, asumir que es un código simple de sucursal
        datosQR = {
          sucursalId: qrData,
          sucursalNombre: '',
          codigo: qrData,
          timestamp: Date.now().toString(),
          hash: ''
        };
      }

      // Validar estructura del QR
      if (!datosQR.sucursalId) {
        throw new Error('QR inválido: falta ID de sucursal');
      }

      // Validar timestamp si existe
      if (datosQR.timestamp) {
        const timestampQR = parseInt(datosQR.timestamp);
        const ahora = Date.now();
        const horasTranscurridas = (ahora - timestampQR) / (1000 * 60 * 60);
        
        if (horasTranscurridas > QR_VALIDITY_HOURS) {
          throw new Error('QR expirado. Solicite un nuevo código QR.');
        }
      }

      // Consultar información completa de la sucursal al backend
      const response = await api.get(`/api/sucursales/${datosQR.sucursalId}`);
      const sucursal: Sucursal = response.data;

      // Verificar que el usuario tenga acceso a esta sucursal
      if (user?.branchId && user.branchId !== sucursal.id) {
        // Para operadores, verificar que coincida con su sucursal asignada
        if (user.rol?.nombre.toUpperCase() === 'OPERADOR') {
          throw new Error('No tienes permisos para acceder a esta sucursal');
        }
      }

      // Guardar sucursal seleccionada
      setSucursalMovil(sucursal);
      setQrEscaneado(true);
      
      // Persistir en localStorage
      localStorage.setItem(MOBILE_SUCURSAL_KEY, JSON.stringify(sucursal));
      localStorage.setItem(QR_TIMESTAMP_KEY, Date.now().toString());

      console.log(`✅ Sucursal móvil seleccionada: ${sucursal.nombre}`);
      return true;

    } catch (err: any) {
      console.error('❌ Error al procesar QR:', err);
      setError(err.message || 'Error al procesar el código QR');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar sucursal móvil
  const limpiarSucursalMovil = () => {
    setSucursalMovil(null);
    setQrEscaneado(false);
    setError(null);
    localStorage.removeItem(MOBILE_SUCURSAL_KEY);
    localStorage.removeItem(QR_TIMESTAMP_KEY);
    console.log('🧹 Sucursal móvil limpiada');
  };

  // Función para validar si se puede acceder a las funciones
  const validarAccesoSucursal = (): boolean => {
    if (!sucursalMovil || !qrEscaneado) {
      return false;
    }

    // Verificar que el QR sigue siendo válido
    const timestamp = localStorage.getItem(QR_TIMESTAMP_KEY);
    if (timestamp) {
      const timestampNum = parseInt(timestamp);
      const ahora = Date.now();
      const horasTranscurridas = (ahora - timestampNum) / (1000 * 60 * 60);
      
      if (horasTranscurridas > QR_VALIDITY_HOURS) {
        limpiarSucursalMovil();
        return false;
      }
    }

    return true;
  };

  // Limpiar sucursal móvil cuando el usuario hace logout
  useEffect(() => {
    if (!user) {
      limpiarSucursalMovil();
    }
  }, [user]);

  const value = {
    sucursalMovil,
    loading,
    error,
    qrEscaneado,
    seleccionarSucursalPorQR,
    limpiarSucursalMovil,
    validarAccesoSucursal
  };

  return (
    <MobileSucursalContext.Provider value={value}>
      {children}
    </MobileSucursalContext.Provider>
  );
}; 
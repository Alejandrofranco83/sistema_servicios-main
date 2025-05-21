import React, { createContext, useContext, useState, useEffect } from 'react';
import cotizacionService, { Cotizacion } from '../services/cotizacionService';
import { formatCurrency } from '../utils/formatUtils';

interface CotizacionContextType {
  cotizacionVigente: Cotizacion | null;
  loading: boolean;
  error: string | null;
  formatearDolares: (valorUSD: number) => string;
  formatearReales: (valorBRL: number) => string;
  convertirDolaresAGuaranies: (valorUSD: number) => number;
  convertirRealesAGuaranies: (valorBRL: number) => number;
  refrescarCotizacion: () => Promise<void>;
}

const CotizacionContext = createContext<CotizacionContextType | undefined>(undefined);

export const useCotizacion = () => {
  const context = useContext(CotizacionContext);
  if (context === undefined) {
    throw new Error('useCotizacion debe ser usado dentro de un CotizacionProvider');
  }
  return context;
};

export const CotizacionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cotizacionVigente, setCotizacionVigente] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCotizacionVigente = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cotizacionService.getCotizacionVigente();
      setCotizacionVigente(data);
    } catch (error: any) {
      console.error('Error al cargar cotización vigente:', error);
      setError('No se pudo cargar la cotización vigente');
      // No establecemos como null la cotización vigente para mantener la última conocida
    } finally {
      setLoading(false);
    }
  };

  // Cargar la cotización al montar el componente
  useEffect(() => {
    cargarCotizacionVigente();
  }, []);

  // Función para formatear valores en dólares (para mostrar)
  const formatearDolares = (valorUSD: number): string => {
    return formatCurrency.dollars(valorUSD);
  };

  // Función para formatear valores en reales (para mostrar)
  const formatearReales = (valorBRL: number): string => {
    return formatCurrency.reals(valorBRL);
  };

  // Función para convertir dólares a guaraníes (para cálculos)
  const convertirDolaresAGuaranies = (valorUSD: number): number => {
    if (!cotizacionVigente) return 0;
    return valorUSD * cotizacionVigente.valorDolar;
  };

  // Función para convertir reales a guaraníes (para cálculos)
  const convertirRealesAGuaranies = (valorBRL: number): number => {
    if (!cotizacionVigente) return 0;
    return valorBRL * cotizacionVigente.valorReal;
  };

  // Función para refrescar la cotización
  const refrescarCotizacion = async (): Promise<void> => {
    await cargarCotizacionVigente();
  };

  const value = {
    cotizacionVigente,
    loading,
    error,
    formatearDolares,
    formatearReales,
    convertirDolaresAGuaranies,
    convertirRealesAGuaranies,
    refrescarCotizacion
  };

  return <CotizacionContext.Provider value={value}>{children}</CotizacionContext.Provider>;
}; 
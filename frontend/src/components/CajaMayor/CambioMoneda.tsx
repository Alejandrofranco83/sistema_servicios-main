import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  CompareArrows as CompareArrowsIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { formatCurrency } from '../../utils/formatUtils';
import { handleInputClick } from '../../utils/inputUtils';
import api from '../../services/api';

interface CambioMonedaProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
}

// Tipo para las monedas disponibles
type TipoMoneda = 'PYG' | 'USD' | 'BRL';

// Interfaz para la cotización personalizada
interface CotizacionPersonalizada {
  de: TipoMoneda;
  a: TipoMoneda;
  valor: number;
}

const CambioMoneda: React.FC<CambioMonedaProps> = ({ open, onClose, onGuardarExito }) => {
  const { cotizacionVigente } = useCotizacion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para la moneda origen y destino
  const [monedaOrigen, setMonedaOrigen] = useState<TipoMoneda>('BRL');
  const [monedaDestino, setMonedaDestino] = useState<TipoMoneda>('PYG');
  
  // Estado para el monto a cambiar
  const [monto, setMonto] = useState<string>('');
  
  // Estado para la cotización personalizada
  const [cotizacion, setCotizacion] = useState<string>('');
  
  // Estado para controlar si el campo de cotización está enfocado
  const [cotizacionEnfocada, setCotizacionEnfocada] = useState<boolean>(false);
  
  // Estado para el resultado del cambio
  const [resultado, setResultado] = useState<number | null>(null);
  
  // Estado para el resultado editable (valor que puede modificar el usuario)
  const [resultadoEditable, setResultadoEditable] = useState<string>('');
  
  // Estado para la observación
  const [observacion, setObservacion] = useState<string>('');
  
  // Resetear estados cuando se abre/cierra el diálogo
  useEffect(() => {
    if (!open) {
      resetearEstados();
    }
  }, [open]);
  
  // Efecto para actualizar la cotización sugerida cuando cambian las monedas
  useEffect(() => {
    if (monedaOrigen && monedaDestino) {
      const cotizacionSugerida = obtenerCotizacionSugerida(monedaOrigen, monedaDestino);
      if (cotizacionSugerida > 0) {
        setCotizacion(formatearNumero(cotizacionSugerida));
      } else {
        setCotizacion('');
      }
    }
  }, [monedaOrigen, monedaDestino, cotizacionVigente]);
  
  // Efecto para calcular el resultado cuando cambian los valores
  useEffect(() => {
    calcularResultado();
  }, [monto, cotizacion, monedaOrigen, monedaDestino]);
  
  // Efecto para actualizar el resultado editable cuando cambia el resultado calculado
  useEffect(() => {
    if (resultado !== null) {
      // Para el resultado del cambio, usar formateo directo sin lógica de centavos
      if (monedaDestino === 'PYG') {
        setResultadoEditable(formatearResultadoCambio(Math.round(resultado).toString(), monedaDestino));
      } else {
        // Para USD y BRL, formatear con decimales correctos
        const resultadoFormateado = resultado.toFixed(2);
        setResultadoEditable(formatearResultadoCambio(resultadoFormateado, monedaDestino));
      }
    } else {
      setResultadoEditable('');
    }
  }, [resultado, monedaDestino]);
  
  // Efecto para asegurar que origen y destino no tengan la misma moneda
  useEffect(() => {
    // Si monedaOrigen y monedaDestino son iguales, cambiamos monedaDestino
    if (monedaOrigen === monedaDestino) {
      // Determinar otra moneda disponible para destino
      const monedasDisponibles: TipoMoneda[] = ['PYG', 'USD', 'BRL'];
      const otraMoneda = monedasDisponibles.find(m => m !== monedaOrigen);
      if (otraMoneda) {
        setMonedaDestino(otraMoneda);
      }
    }
  }, [monedaOrigen]);
  
  // Efecto similar para cuando cambia el destino
  useEffect(() => {
    // Si monedaDestino y monedaOrigen son iguales, cambiamos monedaOrigen
    if (monedaDestino === monedaOrigen) {
      // Determinar otra moneda disponible para origen
      const monedasDisponibles: TipoMoneda[] = ['PYG', 'USD', 'BRL'];
      const otraMoneda = monedasDisponibles.find(m => m !== monedaDestino);
      if (otraMoneda) {
        setMonedaOrigen(otraMoneda);
      }
    }
  }, [monedaDestino]);
  
  // Función para resetear todos los estados
  const resetearEstados = () => {
    setMonedaOrigen('BRL');
    setMonedaDestino('PYG');
    setMonto('');
    setCotizacion('');
    setCotizacionEnfocada(false);
    setResultado(null);
    setResultadoEditable('');
    setObservacion('');
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para obtener la cotización sugerida entre dos monedas
  const obtenerCotizacionSugerida = (de: TipoMoneda, a: TipoMoneda): number => {
    if (!cotizacionVigente) return 0;
    if (de === a) return 1;

    // CASO ESPECIAL: BRL -> USD (el usuario quiere ingresar cuántos R$ son 1 US$)
    if (de === 'BRL' && a === 'USD') {
      if (cotizacionVigente.valorReal === 0) return 0; // Evitar división por cero
      // Sugerir valorDolar / valorReal (ej: 7300 PYG/USD / 1500 PYG/BRL = 4.8666 BRL/USD)
      return cotizacionVigente.valorDolar / cotizacionVigente.valorReal;
    }

    // CASO 1: Origen es PYG. El texto será "1 [Destino] = X PYG".
    // El usuario ingresa X (ej. 7300 para USD, 1500 para BRL).
    // La cotización directa de la BD (valorDolar, valorReal) representa esto.
    if (de === 'PYG') {
      if (a === 'USD') return cotizacionVigente.valorDolar;
      if (a === 'BRL') return cotizacionVigente.valorReal;
    }

    // CASO 2: Destino es PYG. El texto será "1 [Origen] = X PYG".
    // El usuario ingresa X (ej. 7300 si Origen USD, 1500 si Origen BRL).
    // La cotización directa de la BD también representa esto.
    if (a === 'PYG') {
      if (de === 'USD') return cotizacionVigente.valorDolar;
      if (de === 'BRL') return cotizacionVigente.valorReal;
    }

    // CASO 3: Conversiones cruzadas (USD <-> BRL) EXCEPTO BRL -> USD que se maneja arriba.
    // El texto siempre será "1 [Origen] = X [Destino]".
    if (de === 'USD' && a === 'BRL') { // 1 USD = X BRL
      if (cotizacionVigente.valorReal === 0) return 0;
      return cotizacionVigente.valorDolar / cotizacionVigente.valorReal; // Ej: 7300/1500 = 4.86 BRL por USD
    }
    
    console.warn(`[obtenerCotizacionSugerida] Combinación no cubierta o predeterminada: ${de} -> ${a}`);
    return 0;
  };
  
  // Función para formatear números para mostrar
  const formatearNumero = (valor: number): string => {
    // Para valores pequeños (menores a 0.1), usamos más decimales
    if (valor < 0.1) {
      return valor.toFixed(6);
    }
    // Para valores entre 0.1 y 1, usamos 4 decimales
    if (valor < 1) {
      return valor.toFixed(4);
    }
    // Para valores entre 1 y 10, usamos 2 decimales
    if (valor < 10) {
      return valor.toFixed(2);
    }
    // Para valores grandes, sin decimales
    return Math.round(valor).toString();
  };
  
  // Función para formatear valores de entrada
  const formatearValorInput = (value: string, moneda: TipoMoneda): string => {
    if (!value) return '';
    
    if (moneda === 'PYG') {
      // Guaraníes: solo números enteros con punto como separador de miles
      const numericValue = value.replace(/\D/g, '');
      if (numericValue) {
        const number = parseInt(numericValue, 10);
        return number ? new Intl.NumberFormat('es-PY').format(number) : '';
      }
      return '';
    } else if (moneda === 'USD') {
      // Dólares: formato estadounidense (coma para miles, punto para decimales)
      let input = value.replace(/[^\d.,]/g, '');
      
      // Manejar punto decimal
      if (input.includes('.')) {
        const parts = input.split('.');
        if (parts.length > 2) {
          input = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
        } else if (parts.length === 2) {
          input = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        // Quitar todas las comas de la parte entera
        const entero = parts[0].replace(/,/g, '');
        let enteroFormateado = '';
        if (entero) {
          enteroFormateado = Number(entero).toLocaleString('en-US');
        }
        
        const decimal = parts[1] ? parts[1].substring(0, 2) : '';
        input = enteroFormateado + '.' + decimal;
      } else {
        // Si no hay punto decimal, es solo parte entera
        const entero = input.replace(/,/g, '');
        if (entero) {
          input = Number(entero).toLocaleString('en-US');
        }
      }
      
      return input;
    } else if (moneda === 'BRL') {
      // Reales: formato brasileño (punto para miles, coma para decimales)
      let input = value.replace(/[^\d.,]/g, '');
      
      // Manejar coma decimal
      if (input.includes(',')) {
        const parts = input.split(',');
        if (parts.length > 2) {
          input = parts[0] + ',' + parts.slice(1).join('').substring(0, 2);
        } else if (parts.length === 2) {
          input = parts[0] + ',' + parts[1].substring(0, 2);
        }
        
        // Quitar todos los puntos de la parte entera
        const entero = parts[0].replace(/\./g, '');
        let enteroFormateado = '';
        if (entero) {
          // Usar formato brasileño y reemplazar coma por punto para separador de miles
          enteroFormateado = Number(entero).toLocaleString('pt-BR').replace(',', '.');
        }
        
        const decimal = parts[1] ? parts[1].substring(0, 2) : '';
        input = enteroFormateado + ',' + decimal;
      } else {
        // Si no hay coma decimal, es solo parte entera
        const entero = input.replace(/\./g, '');
        if (entero) {
          input = Number(entero).toLocaleString('pt-BR').replace(',', '.');
        }
      }
      
      return input;
    }
    
    return value;
  };
  
  // Función para formatear monto durante el tipeo (basada en el documento)
  const formatMontoForDisplay = (value: string, moneda: TipoMoneda): string => {
    if (!value) return '';
    
    if (moneda === 'PYG') {
      // Guaraníes: formato con punto como separador de miles
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') return '';
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else if (moneda === 'BRL') {
      // Reales: formato con punto para miles y coma para decimales
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') return '';
      
      // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
      const paddedValue = numericValue.padStart(3, '0');
      
      // Separar enteros y decimales
      const decimalPart = paddedValue.slice(-2);
      const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
      
      // Formatear la parte entera con puntos para los miles
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      
      return `${formattedInteger},${decimalPart}`;
    } else if (moneda === 'USD') {
      // Dólares: formato con coma para miles y punto para decimales
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') return '';
      
      // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
      const paddedValue = numericValue.padStart(3, '0');
      
      // Separar enteros y decimales
      const decimalPart = paddedValue.slice(-2);
      const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
      
      // Formatear la parte entera con comas para los miles (formato USA)
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      
      return `${formattedInteger}.${decimalPart}`;
    }
    
    return value;
  };

  // Función para formatear monto en cambio de moneda (SIN lógica de centavos)
  const formatMontoCambio = (value: string, moneda: TipoMoneda): string => {
    if (!value) return '';
    
    if (moneda === 'PYG') {
      // Guaraníes: formato con punto como separador de miles
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') return '';
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else if (moneda === 'USD') {
      // Dólares: formato estadounidense (coma para miles, punto para decimales)
      let input = value.replace(/[^\d.,]/g, '');
      
      if (input.includes('.')) {
        const parts = input.split('.');
        if (parts.length > 2) {
          input = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
        } else if (parts.length === 2) {
          input = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        const entero = parts[0].replace(/,/g, '');
        let enteroFormateado = '';
        if (entero) {
          enteroFormateado = Number(entero).toLocaleString('en-US');
        }
        
        input = enteroFormateado + '.' + (parts[1] || '');
      } else {
        const entero = input.replace(/,/g, '');
        if (entero) {
          input = Number(entero).toLocaleString('en-US');
        }
      }
      
      return input;
    } else if (moneda === 'BRL') {
      // Reales: formato brasileño (punto para miles, coma para decimales)
      let input = value.replace(/[^\d.,]/g, '');
      
      if (input.includes(',')) {
        const parts = input.split(',');
        if (parts.length > 2) {
          input = parts[0] + ',' + parts.slice(1).join('').substring(0, 2);
        } else if (parts.length === 2) {
          input = parts[0] + ',' + parts[1].substring(0, 2);
        }
        
        const entero = parts[0].replace(/\./g, '');
        let enteroFormateado = '';
        if (entero) {
          enteroFormateado = Number(entero).toLocaleString('pt-BR').replace(',', '.');
        }
        
        input = enteroFormateado + ',' + (parts[1] || '');
      } else {
        const entero = input.replace(/\./g, '');
        if (entero) {
          input = Number(entero).toLocaleString('pt-BR').replace(',', '.');
        }
      }
      
      return input;
    }
    
    return value;
  };

  // Manejar cambios en el monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Para cambio de moneda, usar formateo directo sin lógica de centavos
    const formattedValue = formatMontoCambio(inputValue, monedaOrigen);
    
    setMonto(formattedValue);
  };
  
  // Manejar cambios en la cotización
  const handleCotizacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    if (cotizacionEnfocada) {
      // Mientras esté enfocado, solo permitir números, una coma para decimal
      // No aplicar formateo de separadores de miles
      input = input.replace(/[^\d,]/g, '');
      
      // Permitir solo una coma
      const partes = input.split(',');
      if (partes.length > 2) {
        input = partes[0] + ',' + partes.slice(1).join('').substring(0, 2);
      } else if (partes.length === 2) {
        // Limitar decimales a 2 dígitos
        input = partes[0] + ',' + partes[1].substring(0, 2);
      }
    } else {
      // Cuando no está enfocado, aplicar el formateo completo
      // Determinar si necesitamos permitir decimales para la cotización
      // Las cotizaciones siempre pueden tener decimales independientemente de la moneda
      const permitirDecimales = true;
      
      if (permitirDecimales) {
        // Para cotizaciones, siempre permitir decimales
        // Permitir solo números, puntos y una coma
        input = input.replace(/[^\d.,]/g, '');
        
        // Manejar el caso donde el usuario ingresa una coma
        if (input.includes(',')) {
          const parts = input.split(',');
          if (parts.length > 2) {
            // Si hay más de una coma, nos quedamos con la primera
            input = parts[0] + ',' + parts.slice(1).join('');
          }
          
          // Limitar a 2 decimales
          if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
            input = parts[0] + ',' + parts[1];
          }
          
          // Quitar todos los puntos de separador de miles de la parte entera
          const entero = parts[0].replace(/\./g, '');
          
          // Formatear la parte entera con separador de miles
          let enteroFormateado = '';
          if (entero) {
            enteroFormateado = Number(entero).toLocaleString('es-PY').split(',')[0];
          }
          
          // Reconstruir con la parte decimal
          input = enteroFormateado + ',' + parts[1];
        } else {
          // Si no hay coma, es solo parte entera
          // Quitar todos los puntos y formatear
          const entero = input.replace(/\./g, '');
          if (entero) {
            input = Number(entero).toLocaleString('es-PY');
          }
        }
      } else {
        // Para cotizaciones sin decimales (caso poco común)
        // Solo aceptar números
        const value = input.replace(/[^\d]/g, '');
        // Formatear con separadores de miles
        input = value ? Number(value).toLocaleString('es-PY') : '';
      }
    }
    
    setCotizacion(input);
    
    // Realizar cálculo después de cambiar la cotización
    setTimeout(() => calcularResultado(), 0);
  };
  
  // Manejar enfoque del campo cotización
  const handleCotizacionFocus = () => {
    setCotizacionEnfocada(true);
    // Remover formateo cuando gana el foco
    const valorSinFormato = cotizacion.replace(/\./g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorSinFormato);
    if (!isNaN(valorNumerico)) {
      // Convertir de vuelta a formato simple con coma decimal
      const valorFormateado = valorNumerico.toString().replace('.', ',');
      setCotizacion(valorFormateado);
    }
  };
  
  // Manejar pérdida de enfoque del campo cotización
  const handleCotizacionBlur = () => {
    setCotizacionEnfocada(false);
    // Aplicar formateo cuando pierde el foco
    if (cotizacion) {
      // Parsear el valor actual
      const valorSinFormato = cotizacion.replace(',', '.');
      const valorNumerico = parseFloat(valorSinFormato);
      
      if (!isNaN(valorNumerico)) {
        // Aplicar formateo completo
        const valorFormateado = formatearNumero(valorNumerico);
        setCotizacion(valorFormateado);
        
        // Recalcular después del formateo
        setTimeout(() => calcularResultado(), 0);
      }
    }
  };
  
  // Manejar cambios en el resultado editable
  const handleResultadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const inputFormateado = formatearResultadoCambio(input, monedaDestino);
    setResultadoEditable(inputFormateado);
  };
  
  // Manejar cambios en el selector de moneda origen
  const handleMonedaOrigenChange = (e: SelectChangeEvent<TipoMoneda>) => {
    const nuevaMonedaOrigen = e.target.value as TipoMoneda;
    setMonedaOrigen(nuevaMonedaOrigen);
    
    // Si la nueva moneda origen es igual a la moneda destino actual
    if (nuevaMonedaOrigen === monedaDestino) {
      // Buscar una moneda diferente para el destino
      const monedasDisponibles: TipoMoneda[] = ['PYG', 'USD', 'BRL'];
      const otraMoneda = monedasDisponibles.find(m => m !== nuevaMonedaOrigen);
      if (otraMoneda) {
        setMonedaDestino(otraMoneda);
      }
    }
    
    // Resetear valores dependientes
    setMonto('');
    setResultado(null);
    setResultadoEditable('');
  };
  
  // Manejar cambios en el selector de moneda destino
  const handleMonedaDestinoChange = (e: SelectChangeEvent<TipoMoneda>) => {
    const nuevaMonedaDestino = e.target.value as TipoMoneda;
    setMonedaDestino(nuevaMonedaDestino);
    
    // Si la nueva moneda destino es igual a la moneda origen actual
    if (nuevaMonedaDestino === monedaOrigen) {
      // Buscar una moneda diferente para el origen
      const monedasDisponibles: TipoMoneda[] = ['PYG', 'USD', 'BRL'];
      const otraMoneda = monedasDisponibles.find(m => m !== nuevaMonedaDestino);
      if (otraMoneda) {
        setMonedaOrigen(otraMoneda);
      }
    }
    
    // Resetear valores dependientes
    setMonto('');
    setResultado(null);
    setResultadoEditable('');
  };
  
  // Función para intercambiar monedas
  const handleIntercambiarMonedas = () => {
    const tempMonedaOrigen = monedaOrigen;
    setMonedaOrigen(monedaDestino);
    setMonedaDestino(tempMonedaOrigen);
    setMonto('');
    setResultado(null);
    setResultadoEditable('');
  };
  
  // Calcular resultado de la conversión
  const calcularResultado = () => {
    if (!monto || !cotizacion) {
      setResultado(null);
      return;
    }
    
    try {
      let montoNumerico: number;
      let cotizacionNumerica: number;

      // Parsear monto (lógica existente, parece correcta)
      if (monedaOrigen === 'PYG') {
        montoNumerico = parseInt(monto.replace(/\./g, ''), 10);
      } else if (monedaOrigen === 'BRL') {
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      } else if (monedaOrigen === 'USD') {
        montoNumerico = parseFloat(monto.replace(/,/g, ''));
      } else {
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      }

      // Parsear cotización (lógica existente, parece correcta)
      if (cotizacionEnfocada) {
        cotizacionNumerica = parseFloat(cotizacion.replace(',', '.'));
      } else {
        if (cotizacion.includes(',') && !cotizacion.includes('.')) {
          cotizacionNumerica = parseFloat(cotizacion.replace(/\./g, '').replace(',', '.'));
        } else if (cotizacion.includes('.') && !cotizacion.includes(',')) {
          const puntos = cotizacion.split('.');
          if (puntos.length === 2 && puntos[1].length <= 2) {
            cotizacionNumerica = parseFloat(cotizacion);
          } else {
            const entero = puntos.slice(0, -1).join('');
            const decimal = puntos[puntos.length - 1];
            cotizacionNumerica = parseFloat(entero + '.' + decimal);
          }
        } else {
          cotizacionNumerica = parseFloat(cotizacion.replace(/[^\d.,]/g, ''));
        }
      }

      if (isNaN(montoNumerico) || isNaN(cotizacionNumerica)) { 
        setResultado(null);
        return;
      }
      if (cotizacionNumerica <= 0 && monedaOrigen === 'PYG') { // Solo para división si origen es PYG
        setResultado(null);
        return;
      }
      if (cotizacionNumerica < 0 && monedaOrigen !== 'PYG') { // Para multiplicación, no puede ser negativa
          setResultado(null);
          return;
      }

      let resultadoCalculado: number;

      if (monedaOrigen === 'PYG') {
        // Texto dice: "1 [Destino] = X PYG". El usuario ingresa X PYG.
        // Para obtener el monto en [Destino], dividimos: Monto en PYG / (X PYG / 1 [Destino])
        resultadoCalculado = montoNumerico / cotizacionNumerica;
      } else if (monedaOrigen === 'BRL' && monedaDestino === 'USD') {
        // Texto dice: "1 US$ = X R$". El usuario ingresa X R$.
        // Cotización es R$/US$. Para obtener US$, dividimos: Monto en R$ / (X R$/US$)
        if (cotizacionNumerica === 0) { // Evitar división por cero
            setResultado(null);
            return;
        }
        resultadoCalculado = montoNumerico / cotizacionNumerica;
      } else {
        // Texto dice: "1 [Origen] = X [Destino]". El usuario ingresa X [Destino].
        // Para obtener el monto en [Destino], multiplicamos: Monto en [Origen] * (X [Destino] / 1 [Origen])
        resultadoCalculado = montoNumerico * cotizacionNumerica;
      }
      
      setResultado(resultadoCalculado);
      
    } catch (error) {
      console.error('Error al calcular resultado:', error);
      setResultado(null);
    }
  };
  
  // Función para guardar el cambio de moneda
  const handleGuardarCambio = async () => {
    // Validaciones
    if (!monedaOrigen || !monedaDestino) {
      setError('Debe seleccionar las monedas de origen y destino');
      return;
    }
    
    if (!monto || monto.trim() === '') {
      setError('Debe ingresar un monto válido');
      return;
    }
    
    if (!cotizacion || cotizacion.trim() === '') {
      setError('Debe ingresar una cotización válida');
      return;
    }
    
    if (!resultadoEditable || resultadoEditable.trim() === '') {
      setError('El resultado del cambio no puede estar vacío');
      return;
    }
    
    // Parsear el resultado editable
    let resultadoFinal: number;
    if (monedaDestino === 'PYG') {
      resultadoFinal = parseInt(resultadoEditable.replace(/\./g, ''), 10);
    } else {
      resultadoFinal = parseFloat(resultadoEditable.replace(/\./g, '').replace(',', '.'));
    }
    
    if (isNaN(resultadoFinal) || resultadoFinal <= 0) {
      setError('El resultado del cambio no es válido');
      return;
    }
    
    if (!observacion || observacion.trim() === '') {
      setError('Debe ingresar una observación para el cambio');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Obtener usuarioId del localStorage correctamente
      // Intenta con diferentes claves donde podría estar el usuario
      let usuarioId = null;
      
      // Intento 1: verificar token decodificado para extraer ID
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Si el token es JWT, intentar extraer la info (parte central del token)
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const tokenPayload = JSON.parse(atob(tokenParts[1]));
            usuarioId = tokenPayload.id || tokenPayload.userId || tokenPayload.user_id;
          }
        } catch (e) {
          console.error('Error al decodificar token:', e);
        }
      }
      
      // Intento 2: buscar en 'usuario'
      if (!usuarioId) {
        const usuarioData = localStorage.getItem('usuario');
        if (usuarioData) {
          try {
            const usuario = JSON.parse(usuarioData);
            usuarioId = usuario.id;
          } catch (e) {
            console.error('Error al parsear datos de usuario:', e);
          }
        }
      }
      
      // Intento 3: buscar en 'user'
      if (!usuarioId) {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            usuarioId = user.id;
          } catch (e) {
            console.error('Error al parsear datos de user:', e);
          }
        }
      }
      
      // Intento 4: buscar en 'userData'
      if (!usuarioId) {
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            usuarioId = user.id;
          } catch (e) {
            console.error('Error al parsear datos de userData:', e);
          }
        }
      }
      
      // Último recurso: obtener del servidor haciendo una petición
      if (!usuarioId) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            usuarioId = userData.id;
          }
        } catch (e) {
          console.error('Error al obtener usuario del servidor:', e);
        }
      }
      
      console.log('ID de usuario identificado:', usuarioId);
      
      if (!usuarioId) {
        setError('No se pudo identificar al usuario para registrar el cambio. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      // Parsear valores numéricos usando la lógica del documento
      let montoNumerico: number;
      if (monedaOrigen === 'PYG') {
        // Para guaraníes, remover puntos separadores de miles
        const numericValue = monto.replace(/\./g, '');
        montoNumerico = parseInt(numericValue, 10);
      } else if (monedaOrigen === 'BRL') {
        // Para reales: formato brasileño (punto para miles, coma para decimales)
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      } else if (monedaOrigen === 'USD') {
        // Para dólares: formato estadounidense (coma para miles, punto para decimales)
        montoNumerico = parseFloat(monto.replace(/,/g, ''));
      } else {
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      }
      
      // Parsear la cotización según el estado de enfoque
      let cotizacionNumerica: number;
      if (cotizacionEnfocada) {
        // Cuando está enfocada, formato simple con coma decimal
        cotizacionNumerica = parseFloat(cotizacion.replace(',', '.'));
      } else {
        // Cuando no está enfocada, puede estar en formato decimal inglés (6.01) o paraguayo (6,01)
        // Necesitamos detectar el formato correcto
        if (cotizacion.includes(',') && !cotizacion.includes('.')) {
          // Formato paraguayo: solo coma decimal (ej: 6,01 o 1.234,56)
          cotizacionNumerica = parseFloat(cotizacion.replace(/\./g, '').replace(',', '.'));
        } else if (cotizacion.includes('.') && !cotizacion.includes(',')) {
          // Formato inglés: solo punto decimal (ej: 6.01 o 1,234.56)
          // Si hay más de un punto, el último es decimal, los anteriores son separadores de miles
          const puntos = cotizacion.split('.');
          if (puntos.length === 2 && puntos[1].length <= 2) {
            // Solo un punto con máximo 2 decimales: es decimal directo (ej: 6.01)
            cotizacionNumerica = parseFloat(cotizacion);
          } else {
            // Múltiples puntos: formato con separadores de miles (ej: 1.234.567.89)
            const entero = puntos.slice(0, -1).join('');
            const decimal = puntos[puntos.length - 1];
            cotizacionNumerica = parseFloat(entero + '.' + decimal);
          }
        } else {
          // Solo números enteros o formato mixto, usar parseFloat directo
          cotizacionNumerica = parseFloat(cotizacion.replace(/[^\d.,]/g, ''));
        }
      }
      
      let resultadoFinalNumerico: number;
      if (monedaDestino === 'PYG') {
        // Para guaraníes, solo parte entera
        resultadoFinalNumerico = parseInt(resultadoEditable.replace(/\./g, ''), 10);
      } else if (monedaDestino === 'USD') {
        // Para dólares: formato estadounidense (coma para miles, punto para decimales)
        resultadoFinalNumerico = parseFloat(resultadoEditable.replace(/,/g, ''));
      } else if (monedaDestino === 'BRL') {
        // Para reales: formato brasileño (punto para miles, coma para decimales)
        resultadoFinalNumerico = parseFloat(resultadoEditable.replace(/\./g, '').replace(',', '.'));
      } else {
        resultadoFinalNumerico = parseFloat(resultadoEditable.replace(/\./g, '').replace(',', '.'));
      }
      
      // Crear datos para enviar a la API
      const datosCambio = {
        monedaOrigen,
        monedaDestino,
        monto: montoNumerico,
        cotizacion: cotizacionNumerica,
        resultado: resultadoFinalNumerico,
        observacion,
        fecha: new Date().toISOString(),
        usuarioId
      };
      
      console.log('Datos del cambio a enviar con api.post:', datosCambio);
      
      // Llamar a la API para registrar el cambio usando la instancia api de Axios
      const cambioRegistradoResponse = await api.post('/api/cambios-moneda', datosCambio);
      const cambioRegistrado = cambioRegistradoResponse.data;

      console.log('Cambio registrado:', cambioRegistrado);
      
      onGuardarExito();
      
      // Formatear montos para mostrar mensaje de éxito
      let montoFormateado, resultadoFormateado;
      switch (monedaOrigen) {
        case 'PYG':
          montoFormateado = formatCurrency.guaranies(montoNumerico);
          break;
        case 'USD':
          montoFormateado = formatCurrency.dollars(montoNumerico);
          break;
        case 'BRL':
          montoFormateado = formatCurrency.reals(montoNumerico);
          break;
      }
      
      switch (monedaDestino) {
        case 'PYG':
          resultadoFormateado = formatCurrency.guaranies(resultadoFinalNumerico);
          break;
        case 'USD':
          resultadoFormateado = formatCurrency.dollars(resultadoFinalNumerico);
          break;
        case 'BRL':
          resultadoFormateado = formatCurrency.reals(resultadoFinalNumerico);
          break;
      }
      
      setSuccessMessage(`Cambio registrado: ${montoFormateado} a ${resultadoFormateado} con cotización de ${cotizacion}`);
      
      // Limpiar el formulario después de 2 segundos
      setTimeout(() => {
        resetearEstados();
        onClose();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error al procesar el cambio:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.mensaje || 
                         error.message || 
                         'Error al registrar el cambio. Intente nuevamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para navegar al siguiente campo con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>, nextId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };
  
  // Cerrar el diálogo
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };
  
  // Obtener símbolo de moneda
  const obtenerSimboloMoneda = (moneda: TipoMoneda): string => {
    switch (moneda) {
      case 'PYG':
        return 'Gs';
      case 'USD':
        return 'US$';
      case 'BRL':
        return 'R$';
      default:
        return '';
    }
  };
  
  // Formatear resultado para mostrar (sin usar directamente en la interfaz ahora)
  const formatearResultadoMostrar = (): string => {
    if (!resultado) return '0';
    
    switch (monedaDestino) {
      case 'PYG':
        return formatCurrency.guaranies(resultado);
      case 'USD':
        return formatCurrency.dollars(resultado);
      case 'BRL':
        return formatCurrency.reals(resultado);
      default:
        return resultado.toString();
    }
  };
  
  // Obtener texto explicativo para la cotización
  const obtenerTextoCotizacion = (): string => {
    // Si el origen es PYG, el formato es "1 [Moneda Destino] = X PYG"
    if (monedaOrigen === 'PYG') {
      return `Ingrese la cotización: 1 ${obtenerSimboloMoneda(monedaDestino)} = X ${obtenerSimboloMoneda(monedaOrigen)}`;
    }
    // Si es BRL -> USD, formato especial
    if (monedaOrigen === 'BRL' && monedaDestino === 'USD') {
      return `Ingrese la cotización: 1 ${obtenerSimboloMoneda(monedaDestino)} (${monedaDestino}) = X ${obtenerSimboloMoneda(monedaOrigen)} (${monedaOrigen})`;
    }
    // Para todos los demás casos (incluyendo cuando el destino es PYG, o USD -> BRL):
    // El formato es "1 [Moneda Origen] = X [Moneda Destino]"
    return `Ingrese la cotización: 1 ${obtenerSimboloMoneda(monedaOrigen)} = X ${obtenerSimboloMoneda(monedaDestino)}`;
  };

  // Obtener las monedas disponibles para destino (excluyendo la seleccionada en origen)
  const getMonedasDestinoDisponibles = () => {
    return ['PYG', 'USD', 'BRL'].filter(moneda => moneda !== monedaOrigen);
  };

  // Obtener las monedas disponibles para origen (excluyendo la seleccionada en destino)
  const getMonedasOrigenDisponibles = () => {
    return ['PYG', 'USD', 'BRL'].filter(moneda => moneda !== monedaDestino);
  };

  // Función para formatear resultado del cambio (sin lógica de centavos)
  const formatearResultadoCambio = (value: string, moneda: TipoMoneda): string => {
    if (!value) return '';
    
    // Si el valor viene en formato decimal inglés (como "601.00"), convertirlo
    if (value.includes('.') && !value.includes(',') && moneda !== 'USD') {
      const partes = value.split('.');
      if (partes.length === 2 && !isNaN(parseFloat(value))) {
        const entero = parseInt(partes[0], 10);
        const decimal = partes[1];
        
        if (moneda === 'PYG') {
          // Para guaraníes, solo usar la parte entera
          return entero.toLocaleString('es-PY');
        } else if (moneda === 'BRL') {
          // Para reales: formato brasileño (punto para miles, coma para decimales)
          const enteroFormateado = entero.toLocaleString('pt-BR').replace(',', '.');
          return `${enteroFormateado},${decimal}`;
        }
      }
    }
    
    if (moneda === 'PYG') {
      // Guaraníes: formato con punto como separador de miles
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') return '';
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else if (moneda === 'USD') {
      // Dólares: formato estadounidense (coma para miles, punto para decimales)
      let input = value.replace(/[^\d.,]/g, '');
      
      if (input.includes('.')) {
        const parts = input.split('.');
        if (parts.length > 2) {
          input = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
        } else if (parts.length === 2) {
          input = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        const entero = parts[0].replace(/,/g, '');
        let enteroFormateado = '';
        if (entero) {
          enteroFormateado = Number(entero).toLocaleString('en-US');
        }
        
        input = enteroFormateado + '.' + (parts[1] || '');
      } else {
        const entero = input.replace(/,/g, '');
        if (entero) {
          input = Number(entero).toLocaleString('en-US');
        }
      }
      
      return input;
    } else if (moneda === 'BRL') {
      // Reales: formato brasileño (punto para miles, coma para decimales)
      let input = value.replace(/[^\d.,]/g, '');
      
      if (input.includes(',')) {
        const parts = input.split(',');
        if (parts.length > 2) {
          input = parts[0] + ',' + parts.slice(1).join('').substring(0, 2);
        } else if (parts.length === 2) {
          input = parts[0] + ',' + parts[1].substring(0, 2);
        }
        
        const entero = parts[0].replace(/\./g, '');
        let enteroFormateado = '';
        if (entero) {
          enteroFormateado = Number(entero).toLocaleString('pt-BR').replace(',', '.');
        }
        
        input = enteroFormateado + ',' + (parts[1] || '');
      } else {
        const entero = input.replace(/\./g, '');
        if (entero) {
          input = Number(entero).toLocaleString('pt-BR').replace(',', '.');
        }
      }
      
      return input;
    }
    
    return value;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Cambio de Moneda</Typography>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Selección de monedas y monto */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Monedas y Monto
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="moneda-origen-label">Moneda Origen</InputLabel>
                    <Select
                      labelId="moneda-origen-label"
                      id="moneda-origen"
                      value={monedaOrigen}
                      label="Moneda Origen"
                      onChange={handleMonedaOrigenChange}
                      disabled={loading}
                    >
                      {getMonedasOrigenDisponibles().map((moneda) => (
                        <MenuItem key={`origen-${moneda}`} value={moneda}>
                          {moneda === 'PYG' ? 'Guaraníes (Gs)' : moneda === 'USD' ? 'Dólares (US$)' : 'Reales (R$)'}
                        </MenuItem>
                      ))}
                      <MenuItem value={monedaDestino}>
                        {monedaDestino === 'PYG' ? 'Guaraníes (Gs)' : monedaDestino === 'USD' ? 'Dólares (US$)' : 'Reales (R$)'}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    color="primary"
                    onClick={handleIntercambiarMonedas}
                    disabled={loading}
                  >
                    <SwapHorizIcon />
                  </IconButton>
                </Grid>
                
                <Grid item xs={5}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="moneda-destino-label">Moneda Destino</InputLabel>
                    <Select
                      labelId="moneda-destino-label"
                      id="moneda-destino"
                      value={monedaDestino}
                      label="Moneda Destino"
                      onChange={handleMonedaDestinoChange}
                      disabled={loading}
                    >
                      {getMonedasDestinoDisponibles().map((moneda) => (
                        <MenuItem key={`destino-${moneda}`} value={moneda}>
                          {moneda === 'PYG' ? 'Guaraníes (Gs)' : moneda === 'USD' ? 'Dólares (US$)' : 'Reales (R$)'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                id="monto"
                label="Monto a Cambiar"
                value={monto}
                onChange={handleMontoChange}
                onClick={handleInputClick}
                onKeyDown={(e) => handleKeyDown(e, 'cotizacion')}
                disabled={loading}
                autoComplete="off"
                placeholder="0"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <Typography variant="caption">&nbsp;{obtenerSimboloMoneda(monedaOrigen)}</Typography>
                }}
              />
              
              <TextField
                fullWidth
                id="cotizacion"
                label="Cotización"
                value={cotizacion}
                onChange={handleCotizacionChange}
                onFocus={handleCotizacionFocus}
                onBlur={handleCotizacionBlur}
                onClick={handleInputClick}
                onKeyDown={(e) => handleKeyDown(e, 'observacion')}
                disabled={loading}
                autoComplete="off"
                placeholder="0"
                sx={{ mb: 1 }}
              />
              <FormHelperText sx={{ mb: 2 }}>
                {obtenerTextoCotizacion()}
              </FormHelperText>
              
              {cotizacionVigente && (
                <Box sx={{ mt: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cotización de Referencia
                  </Typography>
                  <Typography variant="body2">
                    Dólar: {formatCurrency.guaranies(cotizacionVigente.valorDolar)}
                  </Typography>
                  <Typography variant="body2">
                    Real: {formatCurrency.guaranies(cotizacionVigente.valorReal)}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Resultado y detalle */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Resultado del Cambio
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="resultado"
                  label="Valor Resultante"
                  value={resultadoEditable}
                  onChange={handleResultadoChange}
                  onClick={handleInputClick}
                  onKeyDown={(e) => handleKeyDown(e, 'observacion')}
                  disabled={loading || !resultado}
                  autoComplete="off"
                  placeholder="0"
                  InputProps={{
                    endAdornment: <Typography variant="caption">&nbsp;{obtenerSimboloMoneda(monedaDestino)}</Typography>
                  }}
                />
                <FormHelperText>
                  Puede ajustar este valor manualmente para redondear o facilitar la transacción
                </FormHelperText>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, textAlign: 'center' }}>
                {monto && cotizacion
                  ? monedaOrigen === 'PYG'
                    ? `${monto} ${obtenerSimboloMoneda(monedaOrigen)} ÷ ${cotizacion} = ${formatearResultadoMostrar()}`
                    : (monedaOrigen === 'BRL' && monedaDestino === 'USD')
                      ? `${monto} ${obtenerSimboloMoneda(monedaOrigen)} ÷ ${cotizacion} (${obtenerSimboloMoneda(monedaOrigen)}/${obtenerSimboloMoneda(monedaDestino)}) = ${formatearResultadoMostrar()}`
                      : `${monto} ${obtenerSimboloMoneda(monedaOrigen)} × ${cotizacion} = ${formatearResultadoMostrar()}`
                  : 'Complete los campos para ver el cálculo automático'}
              </Typography>
              
              <TextField
                fullWidth
                id="observacion"
                label="Observaciones"
                multiline
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                onClick={handleInputClick}
                onKeyDown={(e) => handleKeyDown(e, 'guardar-button')}
                disabled={loading}
                autoComplete="off"
                sx={{ mb: 1 }}
                placeholder="Ingrese detalles de la operación de cambio"
              />
              <FormHelperText>
                Proporcione información adicional sobre el cambio (Casa de cambio, motivo, etc.)
              </FormHelperText>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button
          id="guardar-button"
          variant="contained" 
          color="primary"
          onClick={handleGuardarCambio}
          disabled={loading || !monto || !cotizacion || !resultadoEditable || !observacion}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Procesando...' : 'Registrar Cambio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CambioMoneda; 
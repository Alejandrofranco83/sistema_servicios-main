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
      // Formatear el resultado según la moneda de destino
      if (monedaDestino === 'PYG') {
        setResultadoEditable(formatearValorInput(Math.round(resultado).toString(), false));
      } else {
        setResultadoEditable(formatearValorInput(resultado.toString(), true));
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
    setResultado(null);
    setResultadoEditable('');
    setObservacion('');
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para obtener la cotización sugerida entre dos monedas
  const obtenerCotizacionSugerida = (de: TipoMoneda, a: TipoMoneda): number => {
    if (!cotizacionVigente) return 0;
    
    // Si las monedas son iguales, la cotización es 1
    if (de === a) return 1;
    
    // Cuando PYG es moneda de origen, invertimos la cotización para mostrar "1 Moneda extranjera = X Gs"
    if (de === 'PYG') {
      if (a === 'USD') return cotizacionVigente.valorDolar;
      if (a === 'BRL') return cotizacionVigente.valorReal;
    }
    
    // Cotizaciones directas
    if (de === 'USD' && a === 'PYG') return cotizacionVigente.valorDolar;
    if (de === 'BRL' && a === 'PYG') return cotizacionVigente.valorReal;
    
    // Cotizaciones inversas (solo se aplican si PYG no es la moneda de origen)
    if (de === 'PYG' && a === 'USD') return 1 / cotizacionVigente.valorDolar;
    if (de === 'PYG' && a === 'BRL') return 1 / cotizacionVigente.valorReal;
    
    // Cotizaciones cruzadas
    if (de === 'USD' && a === 'BRL') return cotizacionVigente.valorDolar / cotizacionVigente.valorReal;
    if (de === 'BRL' && a === 'USD') return cotizacionVigente.valorReal / cotizacionVigente.valorDolar;
    
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
  const formatearValorInput = (value: string, esDecimal: boolean): string => {
    if (esDecimal) {
      // Permitir decimales para cotización y montos en USD/BRL
      
      // Si el valor está vacío, devolver vacío
      if (!value) return '';
      
      // Reemplazar coma por punto para procesamiento interno
      let valorProcesamiento = value.replace(/\./g, '').replace(',', '.');
      
      // Verificar si es un número válido
      if (!/^[0-9]*\.?[0-9]*$/.test(valorProcesamiento)) {
        // Si no es un formato numérico válido, intentar recuperar parte numérica
        valorProcesamiento = valorProcesamiento.replace(/[^0-9.]/g, '');
        
        // Si sigue sin ser válido después de la limpieza, devolver el valor anterior
        if (!/^[0-9]*\.?[0-9]*$/.test(valorProcesamiento)) {
          return value;
        }
      }
      
      // Si solo hay un punto decimal, devolver "0," como valor inicial
      if (valorProcesamiento === '.') {
        return '0,';
      }
      
      // Procesar número para formato paraguayo
      const partes = valorProcesamiento.split('.');
      
      // Obtener parte entera y parte decimal
      const parteEntera = partes[0];
      let parteDecimal = partes.length > 1 ? partes[1] : '';
      
      // Si la parte decimal tiene más de 2 dígitos, truncarla
      if (parteDecimal.length > 2) {
        parteDecimal = parteDecimal.substring(0, 2);
      }
      
      // Formatear parte entera con separadores de miles
      let resultado = '';
      if (parteEntera) {
        // Convertir a número para aplicar formato
        const entero = parseInt(parteEntera, 10);
        resultado = new Intl.NumberFormat('es-PY', {
          useGrouping: true,
          maximumFractionDigits: 0
        }).format(entero);
      } else {
        resultado = '0';
      }
      
      // Agregar parte decimal si existe
      if (parteDecimal || valorProcesamiento.includes('.')) {
        resultado += ',' + (parteDecimal.padEnd(2, '0')).substring(0, 2);
      }
      
      return resultado;
    } else {
      // Para montos en PYG, sin decimales
      // Remover caracteres no numéricos
      const numericValue = value.replace(/\D/g, '');
      
      // Formatear con separadores de miles
      if (numericValue) {
        const number = parseInt(numericValue, 10);
        return number ? new Intl.NumberFormat('es-PY').format(number) : '';
      }
      return '';
    }
  };
  
  // Manejar cambios en el monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    if (monedaOrigen !== 'PYG') {
      // Para reales y dólares, permitir decimales
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
      // Para guaraníes, solo números enteros
      // Solo aceptar números
      const value = input.replace(/[^\d]/g, '');
      // Formatear con separadores de miles
      input = value ? Number(value).toLocaleString('es-PY') : '';
    }
    
    setMonto(input);
  };
  
  // Manejar cambios en la cotización
  const handleCotizacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
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
    
    setCotizacion(input);
    
    // Realizar cálculo después de cambiar la cotización
    setTimeout(() => calcularResultado(), 0);
  };
  
  // Manejar cambios en el resultado editable
  const handleResultadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    if (monedaDestino !== 'PYG') {
      // Para reales y dólares, permitir decimales
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
      // Para guaraníes, solo números enteros
      // Solo aceptar números
      const value = input.replace(/[^\d]/g, '');
      // Formatear con separadores de miles
      input = value ? Number(value).toLocaleString('es-PY') : '';
    }
    
    setResultadoEditable(input);
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
      
      // Parsear el monto según la moneda
      if (monedaOrigen === 'PYG') {
        montoNumerico = parseFloat(monto.replace(/\./g, ''));
      } else {
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      }
      
      // Parsear la cotización
      const cotizacionNumerica = parseFloat(cotizacion.replace(/\./g, '').replace(',', '.'));
      
      if (isNaN(montoNumerico) || isNaN(cotizacionNumerica) || cotizacionNumerica <= 0) {
        setResultado(null);
        return;
      }
      
      // Calcular el resultado según el formato de cotización
      let resultadoCalculado: number;
      
      if (monedaOrigen === 'PYG') {
        // Si el origen es guaraníes: monto ÷ cotización 
        // (porque cotización está en formato "1 moneda destino = X guaraníes")
        resultadoCalculado = montoNumerico / cotizacionNumerica;
      } else if (monedaDestino === 'PYG') {
        // Si el destino es guaraníes: monto × cotización
        // (porque cotización está en formato "1 moneda origen = X guaraníes")
        resultadoCalculado = montoNumerico * cotizacionNumerica;
      } else {
        // Para otras combinaciones: monto × cotización
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
      
      // Parsear valores numéricos
      let montoNumerico: number;
      if (monedaOrigen === 'PYG') {
        montoNumerico = parseInt(monto.replace(/\./g, ''), 10);
      } else {
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      }
      
      const cotizacionNumerica = parseFloat(cotizacion.replace(/\./g, '').replace(',', '.'));
      
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
      
      // Crear datos para enviar a la API
      const datosCambio = {
        monedaOrigen,
        monedaDestino,
        monto: montoNumerico,
        cotizacion: cotizacionNumerica,
        resultado: resultadoFinal, // Usar el valor editado por el usuario
        observacion,
        fecha: new Date().toISOString(),
        usuarioId
      };
      
      console.log('Datos del cambio a enviar:', datosCambio);
      
      // Llamar a la API para registrar el cambio
      const response = await fetch('/api/cambios-moneda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datosCambio)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar el cambio');
      }
      
      const cambioRegistrado = await response.json();
      console.log('Cambio registrado:', cambioRegistrado);
      
      // Llamar a la función de refresco del componente padre
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
          resultadoFormateado = formatCurrency.guaranies(resultadoFinal);
          break;
        case 'USD':
          resultadoFormateado = formatCurrency.dollars(resultadoFinal);
          break;
        case 'BRL':
          resultadoFormateado = formatCurrency.reals(resultadoFinal);
          break;
      }
      
      setSuccessMessage(`Cambio registrado: ${montoFormateado} a ${resultadoFormateado} con cotización de ${cotizacion}`);
      
      // Limpiar el formulario después de 2 segundos
      setTimeout(() => {
        resetearEstados();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar el cambio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar el cambio. Intente nuevamente.';
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
    if (monedaOrigen === 'PYG') {
      // Si el origen es guaraníes, la cotización se expresa como:
      // "1 Moneda extranjera = X Guaraníes"
      return `Ingrese la cotización: 1 ${obtenerSimboloMoneda(monedaDestino)} = X ${obtenerSimboloMoneda(monedaOrigen)}`;
    } else if (monedaDestino === 'PYG') {
      // Si el destino es guaraníes:
      // "1 Moneda origen = X Guaraníes"
      return `Ingrese la cotización: 1 ${obtenerSimboloMoneda(monedaOrigen)} = X ${obtenerSimboloMoneda(monedaDestino)}`;
    } else {
      // Para otras combinaciones
      return `Ingrese la cotización: 1 ${obtenerSimboloMoneda(monedaOrigen)} = X ${obtenerSimboloMoneda(monedaDestino)}`;
    }
  };

  // Obtener las monedas disponibles para destino (excluyendo la seleccionada en origen)
  const getMonedasDestinoDisponibles = () => {
    return ['PYG', 'USD', 'BRL'].filter(moneda => moneda !== monedaOrigen);
  };

  // Obtener las monedas disponibles para origen (excluyendo la seleccionada en destino)
  const getMonedasOrigenDisponibles = () => {
    return ['PYG', 'USD', 'BRL'].filter(moneda => moneda !== monedaDestino);
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
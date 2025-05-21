import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  GlobalStyles
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import sueldoMinimoService from '../../services/sueldoMinimoService';

// Interfaces
interface Persona {
  id: number;
  nombreCompleto: string;
  documento?: string;
  telefono?: string;
  tipo?: string; // Añadir el tipo para poder filtrar Funcionario y Vip
  // Añadir otros campos si son devueltos por la API y necesarios
}

interface Movimiento {
  id: number | string; // Puede ser un string para vales (prefijo "vale-") o sueldos
  fecha: string;
  tipo: string; // Ya no es un enum fijo, viene de la BD
  descripcion: string;
  monto: string; // Viene como string del backend
  moneda: string; // Añadir moneda si no estaba
  // Propiedades adicionales para vales
  numeroVale?: string;
  estadoVale?: string;
  // Propiedad para movimientos convertidos
  montoConvertidoGS?: string;
}

interface ResumenMes {
  totalGS: string;
  totalUSD: string;
  totalBRL: string;
  totalFinalGS: string;
  calculo?: {
    totalGS: string;
    totalUSDconvertido: string;
    totalBRLconvertido: string;
  };
}

interface Cotizacion {
  moneda: string;
  valor: number;
}

// Añadir nueva interface para el sueldo mínimo
interface SueldoMinimoData {
  id: number;
  valor: number;
  fecha: string;
  vigente: boolean;
}

// Eliminar samplePersonas y sampleMovimientos ya que usaremos datos reales
// const samplePersonas: Persona[] = [...];
// const sampleMovimientos: { [key: number]: Movimiento[] } = { ... };

// Función para formatear número a guaraníes
const formatGuaranies = (amount: number): string => {
  // Asegurarse de que amount sea un número
  if (isNaN(amount)) {
    console.error('formatGuaranies recibió un valor NaN:', amount);
    return '0';
  }
  
  // Redondear al entero más cercano
  const roundedAmount = Math.round(amount);
  
  // Usar Intl.NumberFormat para formatear el número con separadores de miles
  return new Intl.NumberFormat('es-PY').format(roundedAmount);
};

// Función para formatear montos según la moneda
const formatMonto = (amount: number, moneda: string): string => {
  // Asegurarse de que amount sea un número
  if (isNaN(amount)) {
    console.error('formatMonto recibió un valor NaN:', amount);
    return '0';
  }
  
  // Redondear para evitar problemas de precisión
  const roundedAmount = Math.round(amount);
  
  switch (moneda) {
    case 'GS':
      return formatGuaranies(roundedAmount);
    case 'USD':
    case 'BRL':
      // Usar 2 decimales para monedas extranjeras
      return new Intl.NumberFormat('es-PY', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(roundedAmount);
    default:
      return formatGuaranies(roundedAmount);
  }
};

// Función para formatear número a letras (copiada de Vales.tsx)
function Unidades(num: number): string {
  switch (num) {
    case 1: return 'UN';
    case 2: return 'DOS';
    case 3: return 'TRES';
    case 4: return 'CUATRO';
    case 5: return 'CINCO';
    case 6: return 'SEIS';
    case 7: return 'SIETE';
    case 8: return 'OCHO';
    case 9: return 'NUEVE';
    default: return '';
  }
}

function Decenas(num: number): string {
  const decena = Math.floor(num / 10);
  const unidad = num % 10;

  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'DIEZ';
        case 1: return 'ONCE';
        case 2: return 'DOCE';
        case 3: return 'TRECE';
        case 4: return 'CATORCE';
        case 5: return 'QUINCE';
        default: return 'DIECI' + Unidades(unidad);
      }
    case 2:
      return unidad === 0 ? 'VEINTE' : 'VEINTI' + (unidad === 1 ? 'UNO' : Unidades(unidad)); 
    case 3: return DecenasY('TREINTA', unidad);
    case 4: return DecenasY('CUARENTA', unidad);
    case 5: return DecenasY('CINCUENTA', unidad);
    case 6: return DecenasY('SESENTA', unidad);
    case 7: return DecenasY('SETENTA', unidad);
    case 8: return DecenasY('OCHENTA', unidad);
    case 9: return DecenasY('NOVENTA', unidad);
    case 0:
      return Unidades(unidad);
    default: return '';
  }
}

function DecenasY(strSin: string, numUnidades: number): string {
  if (numUnidades > 0)
    return strSin + ' Y ' + (numUnidades === 1 ? 'UNO' : Unidades(numUnidades)); 
  return strSin;
}

function Centenas(num: number): string {
  const centenas = Math.floor(num / 100);
  const decenas = num % 100;

  switch (centenas) {
    case 1: 
      if (decenas > 0) return 'CIENTO ' + Decenas(decenas);
      return 'CIEN';
    case 2: return 'DOSCIENTOS ' + Decenas(decenas);
    case 3: return 'TRESCIENTOS ' + Decenas(decenas);
    case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
    case 5: return 'QUINIENTOS ' + Decenas(decenas);
    case 6: return 'SEISCIENTOS ' + Decenas(decenas);
    case 7: return 'SETECIENTOS ' + Decenas(decenas);
    case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
    case 9: return 'NOVECIENTOS ' + Decenas(decenas);
    default: return Decenas(decenas);
  }
}

function Seccion(num: number, divisor: number, strSingular: string, strPlural: string): string {
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  let letras = '';

  if (cientos > 0) {
    if (cientos === 1) {
       letras = strSingular.startsWith('UN') ? strSingular : 'UN ' + strSingular; 
    } else {
       letras = Centenas(cientos) + ' ' + strPlural;
    }
  }

  if (letras !== '' && resto > 0) {
      letras += ' ';
  } 

  return letras;
}

function Miles(num: number): string {
  const divisor = 1000;
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  const strMiles = Seccion(num, divisor, 'MIL', 'MIL'); 
  const strCentenas = Centenas(resto);

  if (strMiles === '') return strCentenas;
  return (strMiles + (strCentenas !== '' ? ' ' + strCentenas : '')).trim(); 
}

function Millones(num: number): string {
  const divisor = 1000000;
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  const strMillones = Seccion(num, divisor, 'MILLON', 'MILLONES'); 
  const strMiles = Miles(resto);

  if (strMillones === '') return strMiles;
  const conector = strMillones.endsWith('MILLONES') ? ' DE' : ''; 
  return (strMillones + conector + (strMiles !== '' ? ' ' + strMiles : '')).trim(); 
}

function numeroALetras(num: number, moneda?: string): string {
  // Asegurarse que el número sea válido
  if (num === null || num === undefined || isNaN(num)) {
    console.error("Número inválido para convertir a letras:", num);
    return ""; 
  }

  // Manejar números negativos
  const esNegativo = num < 0;
  num = Math.abs(num);

  const data = {
    numero: num,
    enteros: Math.floor(num),
    centavos: Math.round((num - Math.floor(num)) * 100),
    letrasCentavos: '',
    letrasMonedaPlural: '',
    letrasMonedaSingular: '',
    letrasMonedaCentavoPlural: '',
    letrasMonedaCentavoSingular: ''
  };
  
  // Definir nombres de monedas
  switch (moneda) {
    case 'GS':
    case 'PYG':
      data.letrasMonedaPlural = 'GUARANIES';
      data.letrasMonedaSingular = 'GUARANI';
      break;
    case 'USD':
      data.letrasMonedaPlural = 'DOLARES AMERICANOS';
      data.letrasMonedaSingular = 'DOLAR AMERICANO';
      data.letrasMonedaCentavoPlural = 'CENTAVOS';
      data.letrasMonedaCentavoSingular = 'CENTAVO';
      break;
    case 'BRL':
      data.letrasMonedaPlural = 'REALES BRASILEÑOS';
      data.letrasMonedaSingular = 'REAL BRASILEÑO';
      data.letrasMonedaCentavoPlural = 'CENTAVOS';
      data.letrasMonedaCentavoSingular = 'CENTAVO';
      break;
    default:
       data.letrasMonedaPlural = '';
       data.letrasMonedaSingular = '';
       break;
  }

  // Convertir centavos a letras (solo si no es GS/PYG)
  if (data.centavos > 0 && moneda !== 'GS' && moneda !== 'PYG') {
    const centavosEnLetras = data.centavos === 1 
                              ? Millones(data.centavos)
                              : Millones(data.centavos);
    const nombreCentavo = data.centavos === 1 
                           ? data.letrasMonedaCentavoSingular 
                           : data.letrasMonedaCentavoPlural;
    data.letrasCentavos = 'CON ' + centavosEnLetras + ' ' + nombreCentavo;
  }

  // Convertir parte entera a letras
  let letrasEnteros = '';
  if (data.enteros === 0) {
    letrasEnteros = 'CERO';
  } else {
    letrasEnteros = Millones(data.enteros);
  }

  // Construir resultado final
  let resultado = esNegativo ? 'MENOS ' : '';
  resultado += letrasEnteros;
  if (moneda) {
    const nombreMoneda = data.enteros === 1 ? data.letrasMonedaSingular : data.letrasMonedaPlural;
    resultado += ' ' + nombreMoneda;
  }
  if (data.letrasCentavos) {
    resultado += ' ' + data.letrasCentavos;
  }

  return resultado.replace(/\s+/g, ' ').trim().toUpperCase(); 
}

const ResumenMensual: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Meses son 0-indexados

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedPerson, setSelectedPerson] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState<boolean>(false);
  const [loadingMovimientos, setLoadingMovimientos] = useState<boolean>(false);
  const [savingMovimiento, setSavingMovimiento] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [fetchPersonasError, setFetchPersonasError] = useState<string | null>(null);
  const [fetchMovimientosError, setFetchMovimientosError] = useState<string | null>(null);
  const [mesEstaFinalizado, setMesEstaFinalizado] = useState<boolean>(false);
  const [resumenMes, setResumenMes] = useState<ResumenMes | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  // Nuevo estado para el sueldo mínimo
  const [sueldoMinimo, setSueldoMinimo] = useState<number>(0);
  const [loadingSueldoMinimo, setLoadingSueldoMinimo] = useState<boolean>(false);
  const [errorSueldoMinimo, setErrorSueldoMinimo] = useState<string | null>(null);

  // Estados para el nuevo formulario de carga
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');
  const [moneda, setMoneda] = useState<string>('GS'); // Default Guaraníes
  const [monto, setMonto] = useState<string>('');
  const [mostrarVales, setMostrarVales] = useState<boolean>(true); // Estado para controlar si se muestran los vales
  const [mostrarSueldos, setMostrarSueldos] = useState<boolean>(true); // Estado para controlar si se muestran los sueldos

  // Refs para manejar el foco
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);
  const tipoMovRef = useRef<HTMLDivElement>(null);
  const observacionRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const guardarBtnRef = useRef<HTMLButtonElement>(null);

  // Tipos de movimiento para el dropdown
  const tiposMovimiento = [
    'Adelanto',
    'Aguinaldo',
    'Bonificacion',
    'Compras',
    'Descuento',
    'Horas extra',
    'Jornales',
    'Multa',
    'Vacaciones'
  ];
  
  // Tipos que representan ingresos (valores positivos)
  const tiposIngreso = ['Aguinaldo', 'Bonificacion', 'Horas extra', 'Jornales', 'Sueldo', 'Vacaciones'];
  
  // Tipos que representan egresos (valores negativos)
  const tiposEgreso = ['Adelanto', 'Compras', 'Descuento', 'IPS', 'Multa', 'Vale'];

  const { user } = useAuth();

  // Estado para el diálogo de confirmación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteMovimientoId, setDeleteMovimientoId] = useState<number | string | null>(null);
  const [deleteMovimientoNombre, setDeleteMovimientoNombre] = useState<string>('');
  const [deleteMovimientoMonto, setDeleteMovimientoMonto] = useState<string>('');
  const [deleteMovimientoMoneda, setDeleteMovimientoMoneda] = useState<string>('');
  const [deletingMovimiento, setDeletingMovimiento] = useState<boolean>(false);

  // Tipos de movimiento que no pueden ser eliminados
  const tiposNoEliminables = ['Vale', 'Sueldo', 'IPS'];

  // Estados para finalización de mes
  const [mostrarDialogoCotizacion, setMostrarDialogoCotizacion] = useState<boolean>(false);
  const [mostrarDialogoConfirmacion, setMostrarDialogoConfirmacion] = useState<boolean>(false);
  const [finalizando, setFinalizando] = useState<boolean>(false);
  const [errorFinalizacion, setErrorFinalizacion] = useState<string | null>(null);

  // Estado para el texto de búsqueda de personas
  const [personaInputValue, setPersonaInputValue] = useState<string>('');

  // --- Carga de datos --- 

  // Cargar Personas (Funcionarios)
  useEffect(() => {
    const cargarPersonas = async () => {
        setLoadingPersonas(true);
        setFetchPersonasError(null);
        try {
            const token = localStorage.getItem('token');
            // Modificar para usar el mismo endpoint que en CajasContext
            const response = await axios.get<Persona[]>('/api/personas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Filtrar solo funcionarios y VIP
            const personasElegibles = response.data.filter(
              (persona) => persona.tipo === 'Funcionario' || persona.tipo === 'Vip'
            );
            
            setPersonas(personasElegibles);
        } catch (error: any) {
            console.error("Error al cargar las personas (funcionarios y VIP):", error);
            const message = error.response?.data?.message || 'No se pudo cargar la lista de personas.';
            setFetchPersonasError(message);
            setPersonas([]); // Limpiar en caso de error
        } finally {
            setLoadingPersonas(false);
        }
    };
    cargarPersonas();
    
    // Cargar el sueldo mínimo vigente
    cargarSueldoMinimo();
  }, []); // Ejecutar solo al montar

  // Nueva función para cargar el sueldo mínimo
  const cargarSueldoMinimo = async () => {
    setLoadingSueldoMinimo(true);
    setErrorSueldoMinimo(null);
    try {
      console.log('[DEBUG] Intentando obtener sueldo mínimo usando sueldoMinimoService...');
      
      // Intentar obtener el sueldo mínimo vigente directamente
      try {
        const sueldoMinimoVigente = await sueldoMinimoService.getSueldoMinimoVigente();
        console.log('[DEBUG] Sueldo mínimo vigente obtenido:', sueldoMinimoVigente);
        setSueldoMinimo(sueldoMinimoVigente.valor);
        return;
      } catch (errorVigente) {
        console.log('[DEBUG] No se pudo obtener el sueldo mínimo vigente, intentando obtener todos:', errorVigente);
      }
      
      // Si no se pudo obtener el vigente, intentar obtener todos los sueldos mínimos
      const sueldosMinimos = await sueldoMinimoService.getSueldosMinimos();
      console.log('[DEBUG] Todos los sueldos mínimos obtenidos:', sueldosMinimos);
      
      if (sueldosMinimos && sueldosMinimos.length > 0) {
        // Buscar el marcado como vigente
        const sueldoMinimoVigente = sueldosMinimos.find(sm => sm.vigente);
        
        if (sueldoMinimoVigente) {
          console.log('[DEBUG] Se encontró sueldo mínimo vigente:', sueldoMinimoVigente);
          setSueldoMinimo(sueldoMinimoVigente.valor);
        } else {
          // Si no hay ninguno marcado como vigente, tomar el más reciente
          const sueldosOrdenados = [...sueldosMinimos].sort((a, b) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          
          if (sueldosOrdenados.length > 0) {
            const sueldoReciente = sueldosOrdenados[0];
            console.log('[DEBUG] Usando sueldo mínimo más reciente:', sueldoReciente);
            setSueldoMinimo(sueldoReciente.valor);
          } else {
            console.warn('[DEBUG] No se encontraron registros de sueldo mínimo');
            setSueldoMinimo(0);
          }
        }
      } else {
        console.warn('[DEBUG] No se recibieron datos de sueldo mínimo');
        setSueldoMinimo(0);
      }
    } catch (error: any) {
      console.error("[DEBUG] Error al cargar el sueldo mínimo:", error);
      
      // Mostrar detalles del error para depuración
      if (error.response) {
        console.error("[DEBUG] Error de respuesta:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        });
      } else if (error.request) {
        console.error("[DEBUG] Error de solicitud (no se recibió respuesta):", error.request);
      } else {
        console.error("[DEBUG] Error de configuración:", error.message);
      }
      
      const message = error.response?.data?.message || error.response?.data?.error || 'No se pudo cargar el sueldo mínimo.';
      setErrorSueldoMinimo(message);
    } finally {
      setLoadingSueldoMinimo(false);
    }
  };

  // Cargar Movimientos
  const fetchMovimientos = async () => {
    if (selectedPerson && selectedYear && selectedMonth) {
        setLoadingMovimientos(true);
        setFetchMovimientosError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/rrhh/movimientos/${selectedPerson.id}`, {
                params: { mes: selectedMonth, anio: selectedYear },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Depuración para ver qué datos estamos recibiendo
            console.log('[DEBUG-FRONTEND] Respuesta completa:', response.data);
            
            // Extraer información del estado del mes
            const { movimientos: movimientosData, mesFinalizado, resumen, cotizaciones: cotizacionesData } = response.data;
            
            // Actualizar estados
            setMovimientos(movimientosData || []);
            setMesEstaFinalizado(mesFinalizado || false);
            setResumenMes(resumen || null);
            setCotizaciones(cotizacionesData || []);
            
            console.log('[DEBUG-FRONTEND] Mes finalizado:', mesFinalizado);
            console.log('[DEBUG-FRONTEND] Resumen:', resumen);
            console.log('[DEBUG-FRONTEND] Cotizaciones:', cotizacionesData);
            
        } catch (error: any) {
            console.error("Error al cargar movimientos:", error);
            const message = error.response?.data?.message || 'No se pudieron cargar los movimientos.';
            setFetchMovimientosError(message);
            setMovimientos([]); // Limpiar en caso de error
            setMesEstaFinalizado(false);
            setResumenMes(null);
            setCotizaciones([]);
        } finally {
            setLoadingMovimientos(false);
        }
    } else {
        setMovimientos([]); // Limpiar si no hay persona/mes/año
        setFetchMovimientosError(null); // Limpiar error si se deselecciona
        setMesEstaFinalizado(false);
        setResumenMes(null);
        setCotizaciones([]);
    }
  };

  // Recargar movimientos cuando cambian las dependencias
  useEffect(() => {
      fetchMovimientos();
      verificarMesFinalizado();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson, selectedYear, selectedMonth]);

  // Mostrar el valor del sueldo mínimo cuando cambia
  useEffect(() => {
    console.log('[DEBUG] El valor del sueldo mínimo ha cambiado:', sueldoMinimo);
  }, [sueldoMinimo]);

  // Verificar si el mes está finalizado
  const verificarMesFinalizado = async () => {
    if (selectedPerson && selectedYear && selectedMonth) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/rrhh/estado-mes/${selectedPerson.id}`, {
          params: { mes: selectedMonth, anio: selectedYear },
          headers: { Authorization: `Bearer ${token}` }
        });
        setMesEstaFinalizado(response.data.finalizado || false);
      } catch (error) {
        console.error("Error al verificar estado del mes:", error);
        setMesEstaFinalizado(false);
      }
    } else {
      setMesEstaFinalizado(false);
    }
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    setSelectedMonth(event.target.value as number);
  };

  const handlePersonChange = (event: React.SyntheticEvent, newValue: Persona | null) => {
    setSelectedPerson(newValue);
  };

  // --- Funciones para el nuevo formulario ---
  const handleTipoMovimientoChange = (event: SelectChangeEvent<string>) => {
    setTipoMovimiento(event.target.value as string);
  };

  const handleObservacionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Convertir a mayúsculas automáticamente
    setObservacion(event.target.value.toUpperCase());
  };

  const handleMonedaChange = (event: SelectChangeEvent<string>) => {
    setMoneda(event.target.value as string);
  };

  const handleMontoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir solo números y un punto decimal
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setMonto(value);
    }
  };

  const handleGuardarMovimiento = async () => {
    if (!selectedPerson || !tipoMovimiento || !monto || !observacion || !user) {
      alert('Por favor, complete todos los campos requeridos y asegúrese de estar autenticado.');
      return;
    }

    setSavingMovimiento(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Convertir el monto a número y aplicar signo según el tipo de movimiento
    let montoNumerico = parseFloat(monto) || 0;
    
    // Si es un tipo de egreso y el monto es positivo, convertirlo a negativo
    if (tiposEgreso.includes(tipoMovimiento) && montoNumerico > 0) {
      montoNumerico = -montoNumerico;
    }
    
    // Si es un tipo de ingreso y el monto es negativo, convertirlo a positivo
    if (tiposIngreso.includes(tipoMovimiento) && montoNumerico < 0) {
      montoNumerico = Math.abs(montoNumerico);
    }

    const movimientoData = {
      personaId: selectedPerson.id,
      mes: selectedMonth,
      anio: selectedYear,
      tipo: tipoMovimiento,
      observacion,
      moneda,
      monto: montoNumerico,
      // usuarioId ya no se envía, se toma del token en el backend
    };

    console.log('Enviando movimiento:', movimientoData);

    try {
        const token = localStorage.getItem('token');
        
        // Información de depuración
        console.log('[DEBUG] Token disponible:', token ? 'Sí' : 'No');
        console.log('[DEBUG] Usuario actual:', user);
        
        // Configuración de cabeceras con el token
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('[DEBUG] Cabeceras a enviar:', headers);
        
        // Petición con cabeceras explícitas
        const response = await axios.post('/api/rrhh/movimientos', movimientoData, { headers });

        console.log('Movimiento guardado:', response.data);
        setSaveSuccess(true);

        // Limpiar formulario
        setTipoMovimiento('');
        setObservacion('');
        setMonto('');
        // setMoneda('GS'); // Opcional: resetear moneda

        // Volver a cargar la lista de movimientos para reflejar el nuevo
        fetchMovimientos(); 

        // Enfocar el campo tipo de movimiento para la siguiente carga
        tipoMovRef.current?.focus();

        // Ocultar mensaje de éxito después de unos segundos
        setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error: any) {
        console.error("Error al guardar movimiento:", error);
        // Añadir más información de depuración para errores
        if (error.response) {
            console.error('[DEBUG] Error de respuesta:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else if (error.request) {
            console.error('[DEBUG] Error de solicitud (sin respuesta):', error.request);
        } else {
            console.error('[DEBUG] Error general:', error.message);
        }
        
        const errorMessage = error.response?.data?.message || 'Error al conectar con el servidor.';
        setSaveError(errorMessage);
         // Ocultar mensaje de error después de unos segundos
        setTimeout(() => setSaveError(null), 5000);
    } finally {
        setSavingMovimiento(false);
    }
  };

  // --- Fin Funciones nuevo formulario ---

  // Generar lista de años (ej: 5 años atrás hasta el actual)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Lista de meses
  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  const calcularSaldo = () => {
    // Asegurarse que el monto se parsea correctamente si es string
    return movimientos.reduce((acc, mov) => acc + (parseFloat(mov.monto) || 0), 0);
  };

  // Función para calcular saldos por moneda
  const calcularSaldosPorMoneda = (): { [key: string]: number } => {
    const saldos: { [key: string]: number } = {};
    
    // Agrupar los movimientos por moneda y sumar, respetando los filtros
    movimientos
      .filter(mov => (mostrarVales || mov.tipo !== 'Vale') && (mostrarSueldos || mov.tipo !== 'Sueldo'))
      .forEach(mov => {
        // Normalizar la moneda para que GS y PYG se consideren la misma
        let moneda = mov.moneda || 'GS'; // Usar GS por defecto si no hay moneda
        if (moneda === 'PYG') moneda = 'GS'; // Normalizar PYG a GS
        
        let monto = parseFloat(mov.monto) || 0;
        
        // Asegurarse de que los valores de tipo Vale sean siempre negativos (egresos)
        if (mov.tipo === 'Vale' && monto > 0) {
          monto = -monto;
        }
        
        if (!saldos[moneda]) {
          saldos[moneda] = 0;
        }
        
        saldos[moneda] += monto;
      });
    
    return saldos;
  };

  // Abrir diálogo de confirmación de eliminación
  const openDeleteDialog = (row: Movimiento) => {
    setDeleteMovimientoId(row.id);
    setDeleteMovimientoNombre(row.descripcion);
    setDeleteMovimientoMonto(row.monto);
    setDeleteMovimientoMoneda(row.moneda);
    setDeleteDialogOpen(true);
  };

  // Cerrar diálogo de confirmación
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteMovimientoId(null);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!deleteMovimientoId) return;
    
    setDeletingMovimiento(true);
    try {
      await handleEliminarMovimiento(deleteMovimientoId);
      // Mostrar mensaje de éxito
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error confirmando eliminación:", error);
    } finally {
      setDeletingMovimiento(false);
      closeDeleteDialog();
    }
  };

  const handleEliminarMovimiento = async (id: number | string) => {
    if (!selectedPerson || !user) {
      console.error("Error al eliminar movimiento: Persona o usuario no seleccionados");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Error al eliminar movimiento: Token no disponible");
        return;
      }

      const response = await axios.delete(`/api/rrhh/movimientos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Movimiento eliminado:', response.data);
      fetchMovimientos();
    } catch (error: any) {
      console.error("Error al eliminar movimiento:", error);
      const errorMessage = error.response?.data?.message || 'Error al conectar con el servidor.';
      setSaveError(errorMessage);
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  // Imprimir recibo para un movimiento específico
  const handleImprimirRecibo = (movimiento: Movimiento) => {
    // Convertir monto a letras
    const montoNumerico = parseFloat(movimiento.monto);
    const montoAbsoluto = Math.abs(montoNumerico);
    const montoEnLetras = numeroALetras(montoAbsoluto, movimiento.moneda);
    
    // Crear ventana emergente
    const windowContent = `
      <html>
        <head>
          <title>Recibo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .recibo { border: 1px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .content { font-size: 14px; line-height: 1.5; }
            .fecha { text-align: right; margin-bottom: 25px; }
            .monto { font-weight: bold; }
            .concepto { margin: 15px 0; }
            .total-box { 
              text-align: right; 
              border: 3px solid #000; 
              display: inline-block;
              padding: 5px 15px;
              float: right;
              margin-bottom: 15px;
              font-weight: bold;
              font-size: 16px;
            }
            .clearfix {
              clear: both;
            }
            .firma-container { 
              margin-top: 50px; 
              text-align: center;
            }
            .firma-line { 
              width: 200px; 
              border-top: 1px solid #000; 
              margin: 0 auto 5px auto;
            }
            .datos-personales { 
              margin-top: 40px; 
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="recibo">
            <div class="header">
              <div class="title">RECIBO</div>
            </div>
            
            <div class="total-box">
              Total: ${movimiento.moneda} ${formatMonto(montoAbsoluto, movimiento.moneda)}
            </div>
            
            <div class="clearfix"></div>
            
            <div class="fecha">
              Fecha: ${new Date(movimiento.fecha).toLocaleDateString('es-ES')}
            </div>
            
            <div class="content">
              <p>
                Recibí de <strong>FARMACIA FRANCO AREVALOS S.A.</strong>, 
                la suma de <span class="monto">${montoEnLetras}</span>
              </p>
              
              <div class="concepto">
                <strong>Concepto:</strong> ${movimiento.descripcion}
              </div>
            </div>
            
            <div class="firma-container">
              <div class="firma-line"></div>
              <div>Firma</div>
              
              <div class="datos-personales">
                <div><strong>Nombre:</strong> ${selectedPerson?.nombreCompleto || ''}</div>
                <div><strong>Nº Documento:</strong> ${selectedPerson?.documento || ''}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    // Abrir ventana e imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(windowContent);
      printWindow.document.close();
    }
  };
  
  // Imprimir resumen completo como recibo de sueldo
  const handleImprimirResumenCompleto = () => {
    if (!selectedPerson || !resumenMes) return;
    
    // Obtener detalles organizados por tipo
    const ingresosGS = movimientos.filter(m => 
      tiposIngreso.includes(m.tipo) && (m.moneda === 'GS' || m.moneda === 'PYG')
    );
    
    const egresosGS = movimientos.filter(m => 
      tiposEgreso.includes(m.tipo) && (m.moneda === 'GS' || m.moneda === 'PYG')
    );
    
    const otrasMonedas = movimientos.filter(m => 
      m.moneda !== 'GS' && m.moneda !== 'PYG'
    );
    
    // Usar el sueldo mínimo cargado de la base de datos
    const sueldoMinimoActual = sueldoMinimo;
    console.log('[DEBUG] --------- INFORMACIÓN DE DEPURACIÓN IMPRESIÓN ----------');
    console.log('[DEBUG] Valor de sueldoMinimo en el estado:', sueldoMinimo);
    console.log('[DEBUG] Valor usado para impresión:', sueldoMinimoActual);
    console.log('[DEBUG] -----------------------------------------------------');
    
    // Total de ingresos en las tablas originales
    const totalIngresos = ingresosGS.reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    // Separar ingresos por tipo para la tabla de resumen
    const otrosIngresos = ingresosGS.filter(m => m.tipo !== 'Sueldo');
    const totalOtrosIngresos = otrosIngresos.reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    // Verificar si los ingresos totales son menores que el sueldo mínimo
    const ingresosMenoresQueSueldoMinimo = totalIngresos < sueldoMinimoActual;
    
    // Determinar el monto para el primer recibo (sueldo)
    // Si ingresos < sueldo mínimo, mostrar el total de ingresos
    // Si ingresos >= sueldo mínimo, mostrar el sueldo mínimo
    const montoRecibo1 = ingresosMenoresQueSueldoMinimo ? totalIngresos : sueldoMinimoActual;
    
    // La bonificación será la diferencia si ingresos >= sueldo mínimo, o 0 si ingresos < sueldo mínimo
    const bonificacion = ingresosMenoresQueSueldoMinimo ? 0 : Math.max(0, totalIngresos - sueldoMinimoActual - totalOtrosIngresos);
    
    // Total final para mostrar
    const totalFinalIngresos = Math.round(montoRecibo1) + Math.round(totalOtrosIngresos) + Math.round(bonificacion);
    
    console.log('[DEBUG] Sueldo mínimo:', sueldoMinimoActual);
    console.log('[DEBUG] Total ingresos:', totalIngresos);
    console.log('[DEBUG] Ingresos < Sueldo Mínimo:', ingresosMenoresQueSueldoMinimo);
    console.log('[DEBUG] Monto para primer recibo:', montoRecibo1);
    console.log('[DEBUG] Total otros ingresos:', totalOtrosIngresos);
    console.log('[DEBUG] Bonificación:', bonificacion);
    console.log('[DEBUG] Total final ingresos (calculado):', totalFinalIngresos);
    
    // Calcular montos convertidos para monedas extranjeras
    const monedasConvertidas = otrasMonedas.map(moneda => {
      const monto = parseFloat(moneda.monto);
      const cotizacion = cotizaciones.find(c => c.moneda === moneda.moneda)?.valor || 0;
      const montoConvertido = monto * cotizacion;
      return {
        ...moneda,
        cotizacion,
        montoConvertidoCalculado: montoConvertido
      };
    });
    
    // Convertir montos a letras
    const recibo1EnLetras = numeroALetras(montoRecibo1, 'GS');
    const bonificacionesEnLetras = numeroALetras(bonificacion, 'GS');
    
    // Crear ventana emergente con formato simplificado
    const windowContent = `
      <html>
        <head>
          <title>Recibos de Sueldo - ${selectedPerson.nombreCompleto}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 0;
              margin: 0;
              font-size: 11px;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 5mm;
              margin: 0;
              border: 1px #D3D3D3 solid;
              background: white;
              box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            }
            .subpage {
              padding: 0.5cm;
              min-height: 257mm;
            }
            .recibos-section {
              display: flex;
              flex-direction: column;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px dashed black;
            }
            .recibo {
              width: 100%;
              border: 1px solid black;
              padding: 8px;
              margin-bottom: 10px;
            }
            .recibo-header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .fecha-monto {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .monto-box {
              border: 2px solid black;
              padding: 4px 8px;
              font-weight: bold;
              text-align: right;
            }
            .firma {
              margin-top: 20px;
              text-align: center;
            }
            .firma-linea {
              width: 70%;
              margin: 0 auto 5px auto;
              border-top: 1px solid black;
            }
            .resumen {
              border: 1px solid black;
              padding: 8px;
            }
            .resumen-header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .info-headers {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-weight: bold;
            }
            .tablas {
              display: flex;
              justify-content: space-between;
              gap: 8px;
            }
            .tabla-container {
              width: 49%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            table th, table td {
              border: 1px solid #ddd;
              padding: 3px 4px;
              vertical-align: top;
            }
            table th {
              background-color: #f2f2f2;
              text-align: left;
              font-weight: bold;
            }
            table tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .concepto {
              width: 75%;
            }
            .monto {
              text-align: right;
              width: 25%;
              white-space: nowrap;
            }
            .moneda-col {
              text-align: center;
              width: 25%;
            }
            .total {
              text-align: right;
              font-weight: bold;
              margin-top: 6px;
              background-color: #f2f2f2;
              padding: 4px;
            }
            .total-final {
              text-align: right;
              font-weight: bold;
              margin-top: 10px;
              background-color: #e8ffe8;
              padding: 5px;
              border: 2px solid #007700;
              font-size: 12px;
            }
            .moneda-extranjera {
              margin-top: 10px;
            }
            .moneda-extranjera table {
              margin-bottom: 5px;
            }
            .cotizaciones {
              font-size: 9px;
              margin-top: 3px;
              color: #555;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .page { margin: 0; border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="subpage">
              <div class="recibos-section">
                <!-- Recibo Sueldo -->
                <div class="recibo">
                  <div class="recibo-header">RECIBO DE HABERES</div>
                  <div class="fecha-monto">
                    <div>Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
                    <div class="monto-box">GS ${formatMonto(montoRecibo1, 'GS')}</div>
                  </div>
                  <div>
                    <p>Recibí de <strong>FARMACIA FRANCO AREVALOS S.A.</strong>, la suma de:</p>
                    <p><strong>${recibo1EnLetras}</strong></p>
                    <p>En concepto de pago de salario: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}</p>
                  </div>
                  <div class="firma">
                    <div class="firma-linea"></div>
                    <div>Firma</div>
                    <div style="margin-top: 15px;">
                      <p><strong>Nombre:</strong> ${selectedPerson?.nombreCompleto || ''}</p>
                      <p><strong>Nº Documento:</strong> ${selectedPerson?.documento || ''}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Recibo Bonificaciones (solo si bonificación > 0) -->
                ${bonificacion > 0 ? `
                <div class="recibo">
                  <div class="recibo-header">RECIBO DE HABERES</div>
                  <div class="fecha-monto">
                    <div>Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
                    <div class="monto-box">GS ${formatMonto(bonificacion, 'GS')}</div>
                  </div>
                  <div>
                    <p>Recibí de <strong>FARMACIA FRANCO AREVALOS S.A.</strong>, la suma de:</p>
                    <p><strong>${bonificacionesEnLetras}</strong></p>
                    <p>En concepto de pago de bonificaciones del: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}</p>
                  </div>
                  <div class="firma">
                    <div class="firma-linea"></div>
                    <div>Firma</div>
                    <div style="margin-top: 15px;">
                      <p><strong>Nombre:</strong> ${selectedPerson?.nombreCompleto || ''}</p>
                      <p><strong>Nº Documento:</strong> ${selectedPerson?.documento || ''}</p>
                    </div>
                  </div>
                </div>
                ` : ''}
              </div>
              
              <!-- Resumen -->
              <div class="resumen">
                <div class="resumen-header">RESUMEN DE LIQUIDACIÓN - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}</div>
                <div class="info-headers">
                  <div><strong>Colaborador:</strong> ${selectedPerson.nombreCompleto}</div>
                  <div><strong>Documento:</strong> ${selectedPerson.documento || 'N/A'}</div>
                </div>
                
                <div class="tablas">
                  <!-- Tabla Ingresos -->
                  <div class="tabla-container">
                    <div style="font-weight: bold; margin-bottom: 4px;">INGRESOS</div>
                    <table>
                      <thead>
                        <tr>
                          <th class="concepto">Concepto</th>
                          <th class="monto">Monto (GS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${ingresosMenoresQueSueldoMinimo ? `
                        <!-- Mostrar ingresos reales cuando son menores al sueldo mínimo -->
                        ${ingresosGS.map(m => `
                        <tr>
                          <td class="concepto">${m.tipo}: ${m.descripcion}</td>
                          <td class="monto">${formatMonto(parseFloat(m.monto), 'GS')}</td>
                        </tr>
                        `).join('')}
                        ` : `
                        <!-- Mostrar sueldo mínimo + otros cuando ingresos >= sueldo mínimo -->
                        <tr>
                          <td class="concepto">Sueldo Mínimo</td>
                          <td class="monto">${formatMonto(sueldoMinimoActual, 'GS')}</td>
                        </tr>
                        ${otrosIngresos.map(m => `
                        <tr>
                          <td class="concepto">${m.tipo}: ${m.descripcion}</td>
                          <td class="monto">${formatMonto(parseFloat(m.monto), 'GS')}</td>
                        </tr>
                        `).join('')}
                        ${bonificacion > 0 ? `
                        <tr>
                          <td class="concepto">Bonificación</td>
                          <td class="monto">${formatMonto(bonificacion, 'GS')}</td>
                        </tr>
                        ` : ''}
                        `}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td style="text-align: right; font-weight: bold;">Total Ingresos:</td>
                          <td class="monto" style="font-weight: bold;">${formatMonto(totalFinalIngresos, 'GS')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <!-- Tabla Descuentos -->
                  <div class="tabla-container">
                    <div style="font-weight: bold; margin-bottom: 4px;">DESCUENTOS</div>
                    <table>
                      <thead>
                        <tr>
                          <th class="concepto">Concepto</th>
                          <th class="monto">Monto (GS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${egresosGS.map(m => `
                        <tr>
                          <td class="concepto">${m.tipo}: ${m.descripcion}</td>
                          <td class="monto">${formatMonto(Math.abs(parseFloat(m.monto)), 'GS')}</td>
                        </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td style="text-align: right; font-weight: bold;">Total Descuentos:</td>
                          <td class="monto" style="font-weight: bold;">${formatMonto(Math.abs(egresosGS.reduce((sum, m) => sum + parseFloat(m.monto), 0)), 'GS')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                ${otrasMonedas.length > 0 ? `
                <!-- Monedas extranjeras -->
                <div class="moneda-extranjera">
                  <div style="font-weight: bold; margin-bottom: 4px;">MONEDA EXTRANJERA</div>
                  <table>
                    <thead>
                      <tr>
                        <th class="concepto">Concepto</th>
                        <th class="moneda-col">Moneda Original</th>
                        <th class="monto">Monto (GS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${monedasConvertidas.map(m => {
                        const monto = parseFloat(m.monto);
                        const montoConvertido = m.montoConvertidoCalculado || 0;
                        return `
                        <tr>
                          <td class="concepto">${m.tipo}: ${m.descripcion}</td>
                          <td class="moneda-col">${m.moneda} ${formatMonto(Math.abs(monto), m.moneda)}</td>
                          <td class="monto">${formatMonto(Math.abs(montoConvertido), 'GS')}</td>
                        </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                  <div class="cotizaciones">
                    <strong>Cotizaciones:</strong> 
                    ${cotizaciones.map(c => `${c.moneda}: GS ${formatMonto(c.valor, 'GS')}`).join(', ')}
                  </div>
                </div>
                ` : ''}
                
                <div class="total-final">
                  TOTAL A COBRAR: GS ${formatMonto(parseFloat(resumenMes.totalFinalGS), 'GS')}
                </div>
              </div>
            </div>
          </div>
          <script>
            // Asegurar que la impresión funcione
            window.onload = function() { 
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    
    // Abrir ventana e imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(windowContent);
      printWindow.document.close();
    }
  };

  // Iniciar proceso de finalización del mes
  const handleIniciarFinalizacion = () => {
    // Verificar si hay montos en otras monedas
    const monedasExtranjeras = movimientos
      .filter(mov => (mostrarVales || mov.tipo !== 'Vale') && (mostrarSueldos || mov.tipo !== 'Sueldo'))
      .map(mov => mov.moneda)
      .filter(moneda => moneda !== 'GS' && moneda !== 'PYG');
    
    // Eliminar duplicados usando un objeto (compatible con versiones anteriores de TS)
    const monedasUnicasSet: {[key: string]: boolean} = {};
    monedasExtranjeras.forEach(moneda => {
      monedasUnicasSet[moneda] = true;
    });
    const monedasUnicas = Object.keys(monedasUnicasSet);
    
    if (monedasUnicas.length > 0) {
      // Inicializar cotizaciones
      const cotizacionesIniciales = monedasUnicas.map(moneda => ({
        moneda,
        valor: 0
      }));
      setCotizaciones(cotizacionesIniciales);
      setMostrarDialogoCotizacion(true);
    } else {
      // No hay monedas extranjeras, ir directo a la confirmación
      setMostrarDialogoConfirmacion(true);
    }
  };

  // Manejar cambio en cotización
  const handleCotizacionChange = (index: number, valor: string) => {
    const nuevasCotizaciones = [...cotizaciones];
    nuevasCotizaciones[index].valor = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
    setCotizaciones(nuevasCotizaciones);
  };

  // Continuar a confirmación después de ingresar cotizaciones
  const handleContinuarACotizacion = () => {
    // Validar que todas las cotizaciones tengan valores mayores a cero
    const cotizacionesValidas = cotizaciones.every(c => c.valor > 0);
    
    if (!cotizacionesValidas) {
      alert('Todas las cotizaciones deben tener valores mayores a cero');
      return;
    }
    
    setMostrarDialogoCotizacion(false);
    setMostrarDialogoConfirmacion(true);
  };

  // Finalizar mes
  const handleFinalizarMes = async () => {
    if (!selectedPerson || !selectedYear || !selectedMonth) {
      setErrorFinalizacion('Datos incompletos para finalizar el mes');
      return;
    }

    setFinalizando(true);
    setErrorFinalizacion(null);

    try {
      const token = localStorage.getItem('token');
      
      // Calcular totales por moneda
      const saldosPorMoneda = calcularSaldosPorMoneda();
      
      // Preparar los datos para finalizar
      const datosFinalizacion = {
        personaId: selectedPerson.id,
        mes: selectedMonth,
        anio: selectedYear,
        cotizaciones: cotizaciones,
        saldos: saldosPorMoneda, // Enviamos los saldos calculados para asegurar el cálculo correcto
        // Los movimientos ya se obtienen del backend
      };

      // Llamar al endpoint para finalizar mes
      const response = await axios.post('/api/rrhh/finalizar-mes', datosFinalizacion, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Mes finalizado correctamente:', response.data);
      
      // Actualizar estado
      setMesEstaFinalizado(true);
      setMostrarDialogoConfirmacion(false);
      
      // Mostrar mensaje de éxito
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Recargar movimientos
      fetchMovimientos();
      
    } catch (error: any) {
      console.error("Error al finalizar mes:", error);
      const errorMessage = error.response?.data?.message || 'Error al conectar con el servidor.';
      setErrorFinalizacion(errorMessage);
    } finally {
      setFinalizando(false);
    }
  };

  // Reabrir mes (deshace la finalización)
  const handleReabrirMes = async () => {
    if (!selectedPerson || !selectedYear || !selectedMonth) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Llamar al endpoint para reabrir mes
      const response = await axios.post('/api/rrhh/reabrir-mes', {
        personaId: selectedPerson.id,
        mes: selectedMonth,
        anio: selectedYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Mes reabierto correctamente:', response.data);
      
      // Actualizar estado
      setMesEstaFinalizado(false);
      
      // Mostrar mensaje de éxito
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Recargar movimientos
      fetchMovimientos();
      
    } catch (error: any) {
      console.error("Error al reabrir mes:", error);
      const errorMessage = error.response?.data?.message || 'Error al conectar con el servidor.';
      setSaveError(errorMessage);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Aplicar estilos globales de scrollbar a TODA la aplicación */}
      <GlobalStyles
        styles={{
          '*::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: '#121212', // Casi negro
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#333', // Gris muy oscuro
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: '#444', // Ligeramente más claro al pasar el mouse
            },
          },
          'html': {
            scrollbarColor: '#333 #121212', // Formato: thumb track
            scrollbarWidth: 'thin',
          },
          'body': {
            scrollbarColor: '#333 #121212',
            scrollbarWidth: 'thin',
          }
        }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Resumen Mensual RRHH
        </Typography>
        {saveSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              ml: 2, 
              py: 0, 
              flexGrow: 1,
              '& .MuiAlert-message': { py: 0.5 }
            }}
          >
            Movimiento guardado correctamente.
          </Alert>
        )}
      </Box>

      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
      {fetchPersonasError && <Alert severity="error" sx={{ mb: 2 }}>{fetchPersonasError}</Alert>}
      {fetchMovimientosError && <Alert severity="error" sx={{ mb: 2 }}>{fetchMovimientosError}</Alert>}

      <Paper sx={{ p: 1.5, mb: 1.5 }}>
        <Grid container spacing={2} alignItems="flex-start">
          {/* Fila 1: Selectores de Fecha y Persona */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small" ref={yearRef}>
              <InputLabel id="year-select-label">Año</InputLabel>
              <Select
                labelId="year-select-label"
                id="year-select"
                value={selectedYear}
                label="Año"
                onChange={handleYearChange}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Selector de Mes */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small" ref={monthRef}>
              <InputLabel id="month-select-label">Mes</InputLabel>
              <Select
                labelId="month-select-label"
                id="month-select"
                value={selectedMonth}
                label="Mes"
                onChange={handleMonthChange}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Selector de Persona */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              id="persona-select"
              ref={personaRef}
              options={personas}
              getOptionLabel={(option) => option.nombreCompleto}
              value={selectedPerson}
              onChange={handlePersonChange}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingPersonas}
              loadingText="Cargando funcionarios y personas VIP..."
              noOptionsText={fetchPersonasError ? "Error al cargar" : "No hay personas disponibles"}
              size="small"
              // Controlar el valor de entrada para convertirlo a mayúsculas
              inputValue={personaInputValue}
              onInputChange={(event, newInputValue) => {
                setPersonaInputValue(newInputValue.toUpperCase());
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar Persona (Funcionario o VIP)"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loadingPersonas ? <Typography>Cargando...</Typography> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                  // Seleccionar todo el texto al hacer clic
                  onFocus={(event) => event.target.select()}
                />
              )}
            />
          </Grid>

          {/* Fila 2: Formulario de Carga de Datos (Solo si hay persona seleccionada y el mes NO está finalizado) */}
          {selectedPerson && !mesEstaFinalizado && (
            <Grid item xs={12} container spacing={1} sx={{ mt: 0.5, borderTop: '1px dashed #ccc', pt: 1 }}>
              <Grid item xs={12} sx={{ mb: -0.5 }}>
                  <Typography variant="subtitle2">Cargar Nuevo Movimiento</Typography>
              </Grid>
              {/* Tipo de Movimiento */}
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small" ref={tipoMovRef} margin="dense">
                  <InputLabel id="tipo-mov-label">Tipo Movimiento</InputLabel>
                  <Select
                    labelId="tipo-mov-label"
                    id="tipo-mov-select"
                    value={tipoMovimiento}
                    label="Tipo Movimiento"
                    onChange={handleTipoMovimientoChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') { observacionRef.current?.focus(); e.preventDefault(); } }}
                  >
                    <MenuItem value=""><em>Seleccione...</em></MenuItem>
                    {tiposMovimiento.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Observación */}
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Observación"
                  variant="outlined"
                  fullWidth
                  size="small"
                  margin="dense"
                  value={observacion}
                  onChange={handleObservacionChange}
                  inputRef={observacionRef}
                  onKeyDown={(e) => { if (e.key === 'Enter') { montoRef.current?.focus(); e.preventDefault(); } }}
                  // Seleccionar texto al hacer clic
                  onFocus={(event) => event.target.select()}
                />
              </Grid>

              {/* Moneda (Simplificado por ahora) */}
              <Grid item xs={6} sm={1}>
                 <FormControl fullWidth size="small" margin="dense">
                    <InputLabel id="moneda-label">Moneda</InputLabel>
                    <Select
                        labelId="moneda-label"
                        id="moneda-select"
                        value={moneda}
                        label="Moneda"
                        onChange={handleMonedaChange}
                     >
                        <MenuItem value="GS">GS</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="BRL">BRL</MenuItem>
                    </Select>
                 </FormControl>
              </Grid>

              {/* Monto */}
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Monto"
                  variant="outlined"
                  fullWidth
                  size="small"
                  margin="dense"
                  value={monto}
                  onChange={handleMontoChange}
                  inputRef={montoRef}
                  onKeyDown={(e) => { if (e.key === 'Enter') { guardarBtnRef.current?.focus(); e.preventDefault(); } }}
                  InputProps={{ sx: { textAlign: 'right' } }} // Alinear a la derecha para números
                   // Seleccionar texto al hacer clic
                  onFocus={(event) => event.target.select()}
                />
              </Grid>

              {/* Botón Guardar */}
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}> {/* Centrar verticalmente */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGuardarMovimiento}
                  disabled={savingMovimiento || !selectedPerson || !tipoMovimiento || !monto || !observacion}
                  ref={guardarBtnRef}
                  fullWidth
                  size="small"
                  startIcon={savingMovimiento ? <CircularProgress size={16} color="inherit" /> : null}
                   onKeyDown={(e) => { if (e.key === 'Enter') { handleGuardarMovimiento(); e.preventDefault(); } }}
                >
                  {savingMovimiento ? 'Guardando...' : 'Guardar'}
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Tabla de Movimientos */}
      {selectedPerson && (
        <Box position="relative">
          <TableContainer 
            component={Paper} 
            sx={{ 
              boxShadow: 3,
              background: 'linear-gradient(to bottom, #1e1e1e, #121212)',
              '& .MuiTableBody-root': {
                '& .MuiTableRow-root': {
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }
              },
              '& .MuiTableCell-root': {
                color: 'rgba(255, 255, 255, 0.87)'
              }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Movimientos de: {selectedPerson.nombreCompleto} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                {mesEstaFinalizado && (
                  <Typography 
                    component="span" 
                    variant="caption" 
                    sx={{ 
                      ml: 2,
                      color: 'success.main',
                      bgcolor: 'rgba(46, 139, 87, 0.2)',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5
                    }}
                  >
                    MES FINALIZADO
                  </Typography>
                )}
              </Typography>
              
              {/* Switch para mostrar/ocultar vales y sueldos */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mostrarVales}
                      onChange={(e) => setMostrarVales(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Mostrar Vales"
                  sx={{ color: 'white' }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={mostrarSueldos}
                      onChange={(e) => setMostrarSueldos(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Mostrar Sueldos"
                  sx={{ color: 'white' }}
                />
              </Box>
            </Box>
            
            <Table sx={{ minWidth: 650 }} aria-label="tabla de movimientos" size="small">
              <TableHead sx={{ backgroundColor: '#212121' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', py: 1, fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', py: 1, fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', py: 1, fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell align="right" sx={{ color: 'white', py: 1, fontWeight: 'bold' }}>Monto</TableCell>
                  {mesEstaFinalizado && (
                    <TableCell align="right" sx={{ color: 'white', py: 1, fontWeight: 'bold' }}>Monto (GS)</TableCell>
                  )}
                  <TableCell align="right" sx={{ color: 'white', py: 1, fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingMovimientos ? (
                  <TableRow>
                    <TableCell colSpan={mesEstaFinalizado ? 6 : 5} align="center"><CircularProgress size={24} /> Cargando movimientos...</TableCell>
                  </TableRow>
                ) : movimientos.length > 0 ? (
                  // Filtrar los vales si mostrarVales es false
                  movimientos
                    .filter(row => (mostrarVales || row.tipo !== 'Vale') && (mostrarSueldos || row.tipo !== 'Sueldo'))
                    .map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        '& td': { py: 0.75 }, // Reduce vertical padding
                        // Destacar visualmente los vales
                        ...(row.tipo === 'Vale' ? { 
                          backgroundColor: 'rgba(205, 140, 0, 0.15)',
                          '&:hover': { backgroundColor: 'rgba(205, 140, 0, 0.25)' }
                        } : {}),
                        // Destacar visualmente los sueldos
                        ...(row.tipo === 'Sueldo' ? { 
                          backgroundColor: 'rgba(30, 144, 255, 0.15)',
                          '&:hover': { backgroundColor: 'rgba(30, 144, 255, 0.25)' }
                        } : {}),
                        // Destacar visualmente los registros de IPS
                        ...(row.tipo === 'IPS' ? { 
                          backgroundColor: 'rgba(220, 20, 60, 0.15)',
                          '&:hover': { backgroundColor: 'rgba(220, 20, 60, 0.25)' }
                        } : {}),
                        // Destacar visualmente los ingresos
                        ...(tiposIngreso.includes(row.tipo) && row.tipo !== 'Sueldo' ? { 
                          backgroundColor: 'rgba(46, 139, 87, 0.15)',
                          '&:hover': { backgroundColor: 'rgba(46, 139, 87, 0.25)' }
                        } : {}),
                        // Destacar visualmente los egresos
                        ...(tiposEgreso.includes(row.tipo) && row.tipo !== 'Vale' && row.tipo !== 'IPS' ? { 
                          backgroundColor: 'rgba(178, 34, 34, 0.15)',
                          '&:hover': { backgroundColor: 'rgba(178, 34, 34, 0.25)' }
                        } : {})
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {new Date(row.fecha).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        {row.tipo === 'Vale' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: row.estadoVale === 'pendiente' ? 'warning.main' : 
                                       row.estadoVale === 'cobrado' ? 'success.main' : 'text.primary'
                              }}
                            >
                              {row.tipo} {row.numeroVale && `#${row.numeroVale}`}
                            </Typography>
                          </Box>
                        ) : row.tipo === 'Sueldo' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: 'primary.main'
                              }}
                            >
                              {row.tipo}
                            </Typography>
                          </Box>
                        ) : row.tipo === 'IPS' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: 'error.main'
                              }}
                            >
                              {row.tipo}
                            </Typography>
                          </Box>
                        ) : tiposIngreso.includes(row.tipo) ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: 'success.main'
                              }}
                            >
                              {row.tipo}
                            </Typography>
                          </Box>
                        ) : tiposEgreso.includes(row.tipo) ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: 'error.main'
                              }}
                            >
                              {row.tipo}
                            </Typography>
                          </Box>
                        ) : (
                          row.tipo
                        )}
                      </TableCell>
                      <TableCell>{row.descripcion}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          component="span" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: tiposEgreso.includes(row.tipo) ? '#f44336' : '#4caf50'  // Colores explícitos: rojo para egresos, verde para ingresos
                          }}
                        >
                          {row.moneda} {row.tipo === 'Vale' 
                            ? `-${formatMonto(Math.abs(parseFloat(row.monto) || 0), row.moneda)}` 
                            : formatMonto(parseFloat(row.monto) || 0, row.moneda)}
                        </Typography>
                      </TableCell>
                      {mesEstaFinalizado && (
                        <TableCell align="right">
                          {row.moneda !== 'GS' && row.moneda !== 'PYG' ? (
                            <Typography 
                              component="span" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: tiposEgreso.includes(row.tipo) ? '#f44336' : '#4caf50'
                              }}
                            >
                              GS {formatMonto(
                                row.montoConvertidoGS 
                                  ? parseFloat(row.montoConvertidoGS) 
                                  : parseFloat(row.monto) * (cotizaciones.find(c => c.moneda === row.moneda)?.valor || 0),
                                'GS'
                              )}
                            </Typography>
                          ) : null}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {/* Botón de impresión solo para movimientos manuales (no para IPS, Sueldos, etc.) */}
                          {!['IPS', 'Sueldo'].includes(row.tipo) && (
                            <Tooltip title="Imprimir recibo">
                              <IconButton
                                size="small"
                                onClick={() => handleImprimirRecibo(row)}
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  '&:hover': { 
                                    color: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                  } 
                                }}
                              >
                                <PrintIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {/* Botón de eliminación solo para tipos eliminables */}
                          {!tiposNoEliminables.includes(row.tipo) && !mesEstaFinalizado && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => openDeleteDialog(row)}
                                sx={{ 
                                  color: 'rgba(255, 100, 100, 0.8)',
                                  '&:hover': { 
                                    color: 'error.main',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                  } 
                                }}
                              >
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={mesEstaFinalizado ? 6 : 5} align="center">{fetchMovimientosError || 'No hay movimientos para el período seleccionado.'}</TableCell>
                  </TableRow>
                )}
                {/* Filas de Saldo */}
                {!loadingMovimientos && movimientos.length > 0 && (
                  <>
                    {/* Mostrar saldo por cada moneda */}
                    {Object.entries(calcularSaldosPorMoneda()).map(([moneda, saldo]) => (
                      <TableRow 
                        key={moneda} 
                        sx={{ 
                          backgroundColor: '#212121', 
                          fontWeight: 'bold',
                          '& td': { py: 1, color: 'white' },
                          '&:last-child': { borderBottom: '2px solid rgba(224, 224, 224, 1)' } 
                        }}
                      >
                        <TableCell colSpan={3} align="right">
                          <strong>Saldo del Mes ({moneda}):</strong>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            component="span" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: saldo < 0 ? '#f44336' : '#4caf50'  // Colores explícitos
                            }}
                          >
                            <strong>{formatMonto(saldo, moneda)}</strong>
                          </Typography>
                        </TableCell>
                        {/* Mostrar cotización si es una moneda extranjera y el mes está finalizado */}
                        {mesEstaFinalizado && moneda !== 'GS' && moneda !== 'PYG' && (
                          <TableCell align="left">
                            <Typography 
                              component="span" 
                              variant="caption"
                              sx={{ color: 'grey.400' }}
                            >
                              Cotización: GS {formatMonto(cotizaciones.find(c => c.moneda === moneda)?.valor || 0, 'GS')}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell colSpan={mesEstaFinalizado ? (moneda !== 'GS' && moneda !== 'PYG' ? 1 : 2) : 1}></TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Mostrar total final en guaraníes si el mes está finalizado */}
                    {mesEstaFinalizado && resumenMes && (
                      <TableRow 
                        sx={{ 
                          backgroundColor: 'rgba(46, 139, 87, 0.2)', 
                          '& td': { py: 1.5, color: 'white', fontWeight: 'bold' }
                        }}
                      >
                        <TableCell colSpan={3} align="right">
                          <Typography variant="subtitle1">TOTAL FINAL (GS):</Typography>
                          {(() => {
                            // Obtener los saldos por moneda directamente de la función que ya usamos para mostrarlos
                            const saldosPorMoneda = calcularSaldosPorMoneda();
                            
                            // Obtener saldos individuales
                            const saldoGS = saldosPorMoneda['GS'] || 0;
                            const saldoUSD = saldosPorMoneda['USD'] || 0;
                            const saldoBRL = saldosPorMoneda['BRL'] || 0;
                            
                            // Obtener las cotizaciones
                            const cotizacionUSD = cotizaciones.find(c => c.moneda === 'USD')?.valor || 0;
                            const cotizacionBRL = cotizaciones.find(c => c.moneda === 'BRL')?.valor || 0;
                            
                            // Calcular los montos convertidos
                            const usdConvertido = saldoUSD * cotizacionUSD;
                            const brlConvertido = saldoBRL * cotizacionBRL;
                            
                            // Calcular total final
                            const totalFinal = saldoGS + usdConvertido + brlConvertido;
                            
                            return (
                              <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                                Cálculo: {formatMonto(saldoGS, 'GS')} 
                                {saldoUSD !== 0 && ` + (${formatMonto(saldoUSD, 'USD')} x ${formatMonto(cotizacionUSD, 'GS')} = ${formatMonto(usdConvertido, 'GS')})`}
                                {saldoBRL !== 0 && ` + (${formatMonto(saldoBRL, 'BRL')} x ${formatMonto(cotizacionBRL, 'GS')} = ${formatMonto(brlConvertido, 'GS')})`}
                                {' = '}{formatMonto(totalFinal, 'GS')}
                              </Typography>
                            );
                          })()}
                        </TableCell>
                        <TableCell align="right" colSpan={3}>
                          <Typography 
                            variant="subtitle1"
                            sx={{ 
                              fontWeight: 'bold',
                              color: (() => {
                                // Usar los mismos valores calculados para determinar color
                                const saldosPorMoneda = calcularSaldosPorMoneda();
                                const saldoGS = saldosPorMoneda['GS'] || 0;
                                const saldoUSD = saldosPorMoneda['USD'] || 0;
                                const saldoBRL = saldosPorMoneda['BRL'] || 0;
                                
                                const cotizacionUSD = cotizaciones.find(c => c.moneda === 'USD')?.valor || 0;
                                const cotizacionBRL = cotizaciones.find(c => c.moneda === 'BRL')?.valor || 0;
                                
                                const totalFinal = saldoGS + 
                                  (saldoUSD * cotizacionUSD) + 
                                  (saldoBRL * cotizacionBRL);
                                  
                                return totalFinal < 0 ? '#f44336' : '#4caf50';
                              })()
                            }}
                          >
                            GS {(() => {
                              // Usar los mismos valores para mostrar el total
                              const saldosPorMoneda = calcularSaldosPorMoneda();
                              const saldoGS = saldosPorMoneda['GS'] || 0;
                              const saldoUSD = saldosPorMoneda['USD'] || 0;
                              const saldoBRL = saldosPorMoneda['BRL'] || 0;
                              
                              const cotizacionUSD = cotizaciones.find(c => c.moneda === 'USD')?.valor || 0;
                              const cotizacionBRL = cotizaciones.find(c => c.moneda === 'BRL')?.valor || 0;
                              
                              const totalFinal = saldoGS + 
                                (saldoUSD * cotizacionUSD) + 
                                (saldoBRL * cotizacionBRL);
                                
                              return formatMonto(totalFinal, 'GS');
                            })()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
            
            {/* Botón para imprimir resumen completo como recibo de sueldo */}
            {mesEstaFinalizado && movimientos.length > 0 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={handleImprimirResumenCompleto}
                  sx={{ mt: 2, mb: 2, mr: 7 }} /* Margen derecho para evitar superposición con el botón flotante */
                >
                  Imprimir Recibo de Sueldo
                </Button>
              </Box>
            )}

            {/* Botón Finalizar Mes */}
            {!mesEstaFinalizado ? (
              <Fab
                color="primary"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                }}
                onClick={handleIniciarFinalizacion}
                disabled={loadingMovimientos || movimientos.length === 0}
              >
                <DoneAllIcon />
              </Fab>
            ) : (
              <Tooltip title="Reabrir Mes">
                <Fab
                  color="secondary"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                  }}
                  onClick={handleReabrirMes}
                >
                  <DoneAllIcon />
                </Fab>
              </Tooltip>
            )}
          </TableContainer>
        </Box>
      )}
       {!selectedPerson && !loadingPersonas && personas.length > 0 && (
         <Typography sx={{ mt: 2, textAlign: 'center' }}>
           Por favor, seleccione una persona para ver sus movimientos.
         </Typography>
       )}
       {!loadingPersonas && personas.length === 0 && !fetchPersonasError && (
         <Typography sx={{ mt: 2, textAlign: 'center' }}>
           No se encontraron funcionarios o personas VIP para seleccionar.
         </Typography>
       )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmar Eliminación"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar el movimiento "{deleteMovimientoNombre}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button onClick={confirmDelete} autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ingresar cotizaciones */}
      <Dialog
        open={mostrarDialogoCotizacion}
        onClose={() => setMostrarDialogoCotizacion(false)}
        aria-labelledby="cotizacion-dialog-title"
      >
        <DialogTitle id="cotizacion-dialog-title">Ingresar Cotizaciones</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se encontraron montos en monedas extranjeras. Por favor, ingrese la cotización actual para cada moneda:
          </DialogContentText>
          
          {cotizaciones.map((cotizacion, index) => (
            <TextField
              key={cotizacion.moneda}
              margin="dense"
              label={`Cotización ${cotizacion.moneda} a Guaraníes`}
              fullWidth
              variant="outlined"
              value={cotizacion.valor > 0 ? cotizacion.valor.toLocaleString('es-PY') : ''}
              onChange={(e) => handleCotizacionChange(index, e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: <Typography variant="caption">Gs.</Typography>
              }}
              // Seleccionar texto al hacer clic
              onFocus={(event) => event.target.select()}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarDialogoCotizacion(false)}>Cancelar</Button>
          <Button 
            onClick={handleContinuarACotizacion}
            variant="contained"
            disabled={cotizaciones.some(c => c.valor <= 0)}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para finalizar mes */}
      <Dialog
        open={mostrarDialogoConfirmacion}
        onClose={() => setMostrarDialogoConfirmacion(false)}
        aria-labelledby="confirmacion-dialog-title"
      >
        <DialogTitle id="confirmacion-dialog-title">Confirmar Finalización de Mes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea finalizar el resumen del mes de {months.find(m => m.value === selectedMonth)?.label} {selectedYear} para {selectedPerson?.nombreCompleto}?
          </DialogContentText>
          
          <Typography variant="body2" sx={{ mt: 2, color: 'warning.main' }}>
            Esta acción guardará una copia de todos los movimientos actuales. 
            Una vez finalizado, los datos se mostrarán desde esta copia.
          </Typography>
          
          {errorFinalizacion && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorFinalizacion}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setMostrarDialogoConfirmacion(false)}
            disabled={finalizando}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalizarMes}
            variant="contained"
            color="primary"
            disabled={finalizando}
            startIcon={finalizando ? <CircularProgress size={20} /> : null}
          >
            {finalizando ? 'Procesando...' : 'Finalizar Mes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumenMensual; 
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CssBaseline,
  GlobalStyles
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  Euro as EuroIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  SwapHoriz as SwapHorizIcon,
  CompareArrows as CompareArrowsIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Fullscreen as FullscreenIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  MonetizationOn as MonetizationOnIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { formatCurrency, formatGuaranies, formatForeignCurrency } from '../../utils/formatUtils';
import { useNavigate } from 'react-router-dom';
import RecibirRetiros from './RecibirRetiros';
import PagosServicios from './PagosServicios';
import DepositoBancario from './DepositoBancario';
import UsoDevolucion from './UsoDevolucion';
import CambioMoneda from './CambioMoneda';
import Vales from './Vales';
import ConteoGuaranies from './ConteoGuaranies';
import ConteoReales from './ConteoReales';
import ConteoDolares from './ConteoDolares';
import MovimientosExpandidos from './MovimientosExpandidos';
import EditarVale from './EditarVale';
import EditarUsoDevolucion from './EditarUsoDevolucion';
import EliminarCambio from './EliminarCambio';
import ImprimirValeDialog from './ImprimirValeDialog';
import CancelarDeposito from './CancelarDeposito';
import AnularPagoServicio from './AnularPagoServicio';
import DevolverRetiro from './DevolverRetiro';
import { cajaMayorService } from '../../services/api';
import cotizacionExternaService from '../../services/cotizacionExternaService';
import api from '../../services/api';
import EditarEliminarGasto from './EditarEliminarGasto';

// Definir TipoMoneda para representar las abreviaturas estándar
type TipoMoneda = 'PYG' | 'USD' | 'BRL';

interface MontoMultimoneda {
  guaranies: number;
  dolares: number;
  reales: number;
}

interface Movimiento {
  id: number;
  fechaHora?: string; 
  fecha?: string; 
  tipo: string;
  concepto: string;
  moneda?: 'guaranies' | 'dolares' | 'reales';
  monto?: number; 
  montoPYG: number;
  esIngreso: boolean;
  saldoActual?: number;
  saldo?: number;
  operacionId?: string;
  rutaComprobante?: string;
  retiroId?: string;
  movimientoId?: string;
  // ... otros campos según tu modelo de datos
}

interface CambioAlberdiCotizacion {
  dolar: {
    compra: number;
    venta: number;
  };
  real: {
    compra: number;
    venta: number;
  };
  loading: boolean;
  error: boolean;
  lastUpdate: Date | null;
}

interface CambioDetalles {
  id: string; 
  monedaOrigen: TipoMoneda; 
  monedaDestino: TipoMoneda;
  monto: number; 
  cotizacion: number | string;
  resultado: number; 
  observacion?: string;
  fecha?: string;
}

// Componentes para símbolos de moneda personalizados
const GuaraniesIcon = () => (
  <Box component="span" sx={{ 
    fontWeight: 'bold', 
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24
  }}>
    ₲
  </Box>
);

const RealesIcon = () => (
  <Box component="span" sx={{ 
    fontWeight: 'bold', 
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24
  }}>
    R$
  </Box>
);

const DolaresIcon = () => (
  <Box component="span" sx={{ 
    fontWeight: 'bold', 
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24
  }}>
    $
  </Box>
);

// Helper fuera del componente para formatear montos con fallback
const formatOrError = (value: number | undefined | null, moneda: TipoMoneda | 'guaranies' | 'dolares' | 'reales' | undefined): string => {
    if (value === undefined || value === null) return '-';
    if (!moneda) moneda = 'guaranies'; // Valor por defecto
    
    const currencyKeyMap: Record<string, 'guaranies' | 'dollars' | 'reals'> = {
        PYG: 'guaranies',
        USD: 'dollars',
        BRL: 'reals',
        guaranies: 'guaranies',
        dolares: 'dollars',
        reales: 'reals'
    };
    const key = currencyKeyMap[moneda];
    if (!key) {
        console.error(`Clave de moneda no encontrada para: ${moneda}`);
        return value.toString();
    }
    try {
        // Asegurarse que formatCurrency[key] es una función antes de llamarla
        if (typeof formatCurrency[key] === 'function') {
            return formatCurrency[key](value);
        } else {
             console.error(`formatCurrency.${key} no es una función.`);
             return value.toString();
        }
    } catch (e) {
        console.error(`Error formateando ${key}`, value, e);
        return value.toString();
    }
}

// Definir estilos globales para scrollbar
const scrollbarStyles = {
  // Para WebKit (Chrome, Safari, Edge)
  '&::-webkit-scrollbar': {
    width: '12px',
    height: '12px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#121212', // Casi negro
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#333', // Gris muy oscuro
    borderRadius: '6px',
    '&:hover': {
      backgroundColor: '#444', // Ligeramente más claro al pasar el mouse
    },
  },
  // Para Firefox
  scrollbarColor: '#333 #121212', // Formato: thumb track
  scrollbarWidth: 'thin',
};

const Balance: React.FC = () => {
  const navigate = useNavigate();
  const [loadingSaldos, setLoadingSaldos] = useState(true);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monedaActiva, setMonedaActiva] = useState<'guaranies' | 'dolares' | 'reales'>('guaranies');
  const { cotizacionVigente, convertirDolaresAGuaranies, convertirRealesAGuaranies, refrescarCotizacion } = useCotizacion();
  const [ordenDescendente, setOrdenDescendente] = useState<boolean>(true);
  
  // Estados para los diálogos
  const [recibirRetirosOpen, setRecibirRetirosOpen] = useState(false);
  const [pagosServiciosOpen, setPagosServiciosOpen] = useState(false);
  const [depositoOpen, setDepositoOpen] = useState(false);
  const [usoDevolucionOpen, setUsoDevolucionOpen] = useState(false);
  const [cambioMonedaOpen, setCambioMonedaOpen] = useState(false);
  const [valesOpen, setValesOpen] = useState(false);
  const [conteoGuaraniesOpen, setConteoGuaraniesOpen] = useState(false);
  const [conteoRealesOpen, setConteoRealesOpen] = useState(false);
  const [conteoDolaresOpen, setConteoDolaresOpen] = useState(false);
  const [movimientosExpandidosOpen, setMovimientosExpandidosOpen] = useState(false);
  const [editarValeOpen, setEditarValeOpen] = useState(false);
  const [editarUsoDevolucionOpen, setEditarUsoDevolucionOpen] = useState(false);
  const [eliminarCambioOpen, setEliminarCambioOpen] = useState(false);
  const [anularPagoServicioOpen, setAnularPagoServicioOpen] = useState(false);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState<number | null>(null);
  const [selectedCambioId, setSelectedCambioId] = useState<string | null>(null);
  const [imprimirValeDialogOpen, setImprimirValeDialogOpen] = useState(false);
  const [valeParaImprimirId, setValeParaImprimirId] = useState<number | null>(null);
  const [verificandoEstadoVale, setVerificandoEstadoVale] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  // Estado para almacenar detalles de cambios por operacionId
  const [cambioDetails, setCambioDetails] = useState<Record<string, CambioDetalles>>({});
  // Estado para rastrear la carga de detalles de cada cambio
  const [loadingCambioDetails, setLoadingCambioDetails] = useState<Record<string, boolean>>({});
  
  // Estado para las cotizaciones de Cambio Alberdi
  const [cambioAlberdiCotizacion, setCambioAlberdiCotizacion] = useState<CambioAlberdiCotizacion>({
    dolar: {
      compra: 7900,
      venta: 8000
    },
    real: {
      compra: 1320,
      venta: 1360
    },
    loading: true,
    error: false,
    lastUpdate: null
  });
  
  // Estado para los datos de la caja mayor
  const [saldosData, setSaldosData] = useState<MontoMultimoneda>({
    guaranies: 0, dolares: 0, reales: 0
  });
  const [ingresosEgresosMes, setIngresosEgresosMes] = useState<{
    ingresos: MontoMultimoneda;
    egresos: MontoMultimoneda;
  }>({ 
    ingresos: { guaranies: 0, dolares: 0, reales: 0 }, 
    egresos: { guaranies: 0, dolares: 0, reales: 0 }
  });
  const [movimientosMonedaActiva, setMovimientosMonedaActiva] = useState<Movimiento[]>([]);

  const [cancelarDepositoOpen, setCancelarDepositoOpen] = useState(false);

  // Agregar estados para el diálogo de devolución de retiro
  const [dialogoDevolverRetiroOpen, setDialogoDevolverRetiroOpen] = useState(false);
  const [retiroIdSeleccionado, setRetiroIdSeleccionado] = useState('');

  const [loadingComprobante, setLoadingComprobante] = useState<boolean>(false);
  const [editarGastoOpen, setEditarGastoOpen] = useState(false);
  const [selectedGastoId, setSelectedGastoId] = useState<number | null>(null);

  // Cargar la preferencia de orden desde localStorage al inicio
  useEffect(() => {
    const ordenGuardado = localStorage.getItem('ordenMovimientosCaja');
    if (ordenGuardado !== null) {
      setOrdenDescendente(ordenGuardado === 'true');
    }
  }, []);
  
  // Función para cambiar el orden
  const cambiarOrden = () => {
    const nuevoOrden = !ordenDescendente;
    setOrdenDescendente(nuevoOrden);
    localStorage.setItem('ordenMovimientosCaja', nuevoOrden.toString());
  };

  // Cargar SOLO los saldos iniciales y datos del mes
  const cargarDatosIniciales = useCallback(async () => {
    setLoadingSaldos(true);
    setError(null);
    try {
      const [saldos] = await Promise.all([
        cajaMayorService.getSaldosActuales(),
        // TODO: Implementar endpoint para ingresos/egresos del mes si es necesario
        // cajaMayorService.getIngresosEgresosMes() 
      ]);
      
      console.log('Saldos actuales recibidos:', saldos);

      setSaldosData({
        guaranies: saldos.guaranies || 0,
        dolares: saldos.dolares || 0,
        reales: saldos.reales || 0,
      });
      // setIngresosEgresosMes(...); // Actualizar si se cargan

    } catch (err: any) {
      console.error('Error al cargar datos iniciales de caja mayor:', err);
      const errorMsg = err.response?.data?.error || 'No se pudieron cargar los datos de la caja mayor.';
      setError(errorMsg);
      setSaldosData({ guaranies: 0, dolares: 0, reales: 0 }); // Resetear saldos
    } finally {
      setLoadingSaldos(false);
    }
  }, []);

  // Cargar los últimos 10 movimientos de la MONEDA ACTIVA
  const cargarMovimientosMoneda = useCallback(async () => {
    if (!monedaActiva) return; // No cargar si no hay moneda seleccionada
    
    setLoadingMovimientos(true);
    setError(null); // Limpiar error específico de movimientos
    
    try {
      console.log(`[Balance] Cargando últimos 10 movimientos para: ${monedaActiva}, orden: ${ordenDescendente ? 'desc' : 'asc'}`);
      const response = await cajaMayorService.getMovimientosPaginados({
        moneda: monedaActiva,
        page: 1, 
        pageSize: 10, // Solo los últimos 10
        sortOrder: ordenDescendente ? 'desc' : 'asc'
      });
      
      console.log(`[Balance] Movimientos recibidos para ${monedaActiva}:`, response.movimientos);
      // Añadir log detallado de la respuesta API completa
      console.log(`[Balance] Respuesta API completa:`, JSON.stringify(response, null, 2));
      
      setMovimientosMonedaActiva(response.movimientos || []);
      
    } catch (err: any) {
       console.error(`Error al cargar movimientos para ${monedaActiva}:`, err);
       const errorMsg = err.response?.data?.error || `No se pudieron cargar los movimientos de ${monedaActiva}.`;
       setError(errorMsg); // Mostrar error específico de carga de movimientos
       setMovimientosMonedaActiva([]); // Limpiar movimientos en caso de error
    } finally {
      setLoadingMovimientos(false);
    }
  }, [monedaActiva, ordenDescendente]); // Dependencias: moneda y orden

  // useEffect para cargar datos iniciales (saldos)
  useEffect(() => {
    cargarDatosIniciales();
    refrescarCotizacion(); // Cargar cotización también
  }, [cargarDatosIniciales]); // Ejecutar solo una vez al montar

  // useEffect para cargar movimientos cuando cambia la moneda o el orden
  useEffect(() => {
    cargarMovimientosMoneda();
  }, [cargarMovimientosMoneda]); // Dependencia de la función useCallback

  // useEffect para refrescar la cotización al montar el componente
  useEffect(() => {
    refrescarCotizacion();
  }, []); // Se ejecuta solo al montar el componente

  // Función para formatear fecha (usando conversión local del navegador)
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return '-';
    try {
      // Parsear la fecha (viene de la BD como string o ya es Date)
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
         console.warn(`[formatDate] Fecha inválida al parsear:`, dateString);
         return 'Fecha inválida';
       }

      // Formatear a hora local del navegador
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-indexado
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0'); 
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formatted = `${day}/${month}/${year} ${hours}:${minutes}`;
      return formatted;
    } catch (e) {
      console.error("[formatDate] Error formateando fecha:", dateString, e);
      return 'Error fecha';
    }
  };

  // Calcular el saldo total en guaraníes
  const calcularSaldoTotalEnGuaranies = (): number => {
    const saldoGuaranies = saldosData.guaranies;
    const saldoDolaresEnGuaranies = convertirDolaresAGuaranies(saldosData.dolares);
    const saldoRealesEnGuaranies = convertirRealesAGuaranies(saldosData.reales);
    
    return saldoGuaranies + saldoDolaresEnGuaranies + saldoRealesEnGuaranies;
  };

  // Formatear valor según la moneda activa
  const formatearValor = (valor: number | undefined | null): string => {
    if (valor === undefined || valor === null) return '-';
    switch (monedaActiva) {
      case 'guaranies':
        return formatCurrency.guaranies(valor);
      case 'dolares':
        return formatCurrency.dollars(valor);
      case 'reales':
        return formatCurrency.reals(valor);
      default:
        return formatCurrency.guaranies(valor);
    }
  };

  // Función que retorna el ícono según la moneda
  const getMonedaIcon = (moneda: string) => {
    switch (moneda) {
      case 'guaranies':
        return <GuaraniesIcon />;
      case 'dolares':
        return <DolaresIcon />;
      case 'reales':
        return <RealesIcon />;
      default:
        return <GuaraniesIcon />;
    }
  };

  // Manejadores para los diálogos
  const handleRecibirRetiros = () => {
    setRecibirRetirosOpen(true);
  };
  
  const handleCloseRecibirRetiros = () => {
    setRecibirRetirosOpen(false);
  };
  
  const handlePagosServicios = () => {
    setPagosServiciosOpen(true);
  };
  
  const handleClosePagosServicios = () => {
    setPagosServiciosOpen(false);
  };
  
  const handleDeposito = () => {
    setDepositoOpen(true);
  };
  
  const handleCloseDeposito = () => {
    setDepositoOpen(false);
  };
  
  const handleUsoDevolucion = () => {
    setUsoDevolucionOpen(true);
  };
  
  const handleCloseUsoDevolucion = () => {
    setUsoDevolucionOpen(false);
  };
  
  const handleCambioMoneda = () => {
    setCambioMonedaOpen(true);
  };
  
  const handleCloseCambioMoneda = () => {
    setCambioMonedaOpen(false);
  };

  const handleVales = () => {
    setValesOpen(true);
  };
  
  const handleCloseVales = () => {
    setValesOpen(false);
  };

  // Funciones para guardar conteos (recargar datos)
  const handleSaveConteo = () => {
    // Cerrar todos los diálogos de conteo (si están abiertos)
    setConteoGuaraniesOpen(false);
    setConteoRealesOpen(false);
    setConteoDolaresOpen(false);
    
    // Recargar los datos después de un delay para asegurar que el guardado se complete
    setTimeout(() => {
      cargarDatosIniciales(); 
      cargarMovimientosMoneda();
    }, 1500);
  };

  // Funciones para los diálogos de conteo de monedas
  const handleConteoGuaranies = () => {
    setConteoGuaraniesOpen(true);
  };
  
  const handleCloseConteoGuaranies = () => {
    setConteoGuaraniesOpen(false);
  };
  
  const handleSaveConteoGuaranies = (total: number, observacion: string) => {
    // Actualizar el saldo de guaraníes
    const nuevoSaldo = {
      ...saldosData,
      guaranies: total
    };
    
    setSaldosData(nuevoSaldo);
    console.log(`Conteo de guaraníes guardado: ${total} Gs, Observación: ${observacion}`);
    
    // Recargar todos los datos después de un delay para asegurar que el guardado se complete
    setTimeout(() => {
      recargarTodo();
    }, 1500);
  };
  
  const handleConteoReales = () => {
    setConteoRealesOpen(true);
  };
  
  const handleCloseConteoReales = () => {
    setConteoRealesOpen(false);
  };
  
  const handleSaveConteoReales = (total: number, observacion: string) => {
    // Actualizar el saldo de reales
    const nuevoSaldo = {
      ...saldosData,
      reales: total
    };
    
    setSaldosData(nuevoSaldo);
    console.log(`Conteo de reales guardado: ${total} R$, Observación: ${observacion}`);
    
    // Recargar todos los datos después de un delay para asegurar que el guardado se complete
    setTimeout(() => {
      recargarTodo();
    }, 1500);
  };
  
  const handleConteoDolares = () => {
    setConteoDolaresOpen(true);
  };
  
  const handleCloseConteoDolares = () => {
    setConteoDolaresOpen(false);
  };
  
  const handleSaveConteoDolares = (total: number, observacion: string) => {
    // Actualizar el saldo de dólares
    const nuevoSaldo = {
      ...saldosData,
      dolares: total
    };
    
    setSaldosData(nuevoSaldo);
    console.log(`Conteo de dólares guardado: ${total} $, Observación: ${observacion}`);
    
    // Recargar todos los datos después de un delay para asegurar que el guardado se complete
    setTimeout(() => {
      recargarTodo();
    }, 1500);
  };

  // Función para obtener las cotizaciones de Cambios Alberdi
  const fetchCambioAlberdiCotizaciones = useCallback(async () => {
    try {
      setCambioAlberdiCotizacion(prev => ({ ...prev, loading: true, error: false }));
      
      // Usar el servicio para hacer la petición al backend
      const response = await cotizacionExternaService.getCambiosAlberdi();
      
      if (!response.success) {
        throw new Error('La respuesta no fue exitosa');
      }
      
      // Actualizar el estado con los datos recibidos
      setCambioAlberdiCotizacion({
        dolar: {
          compra: response.cotizaciones.dolar.compra,
          venta: response.cotizaciones.dolar.venta
        },
        real: {
          compra: response.cotizaciones.real.compra,
          venta: response.cotizaciones.real.venta
        },
        loading: false,
        error: false,
        lastUpdate: response.cotizaciones.lastUpdate ? new Date() : null
      });
      
    } catch (err) {
      console.error('Error al obtener cotizaciones de Cambios Alberdi:', err);
      setCambioAlberdiCotizacion(prev => ({
        ...prev,
        loading: false,
        error: true
      }));
      
      // No usar valores predeterminados en caso de error
    }
  }, []);
  
  // Efecto para obtener las cotizaciones al cargar el componente y cada 60 minutos
  useEffect(() => {
    fetchCambioAlberdiCotizaciones();
    
    // Configurar intervalo para actualizar cada 60 minutos (3600000 ms)
    const interval = setInterval(() => {
      fetchCambioAlberdiCotizaciones();
    }, 3600000);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, [fetchCambioAlberdiCotizaciones]);

  // Funciones para manejar el diálogo de movimientos expandidos
  const handleOpenMovimientosExpandidos = () => {
    setMovimientosExpandidosOpen(true);
  };
  
  const handleCloseMovimientosExpandidos = () => {
    setMovimientosExpandidosOpen(false);
    // Recargar datos cuando se cierra MovimientosExpandidos
    recargarTodo();
  };

  // Buscar la función que maneja la edición de movimientos
  const editarMovimiento = (movimientoId: string, tipo: string) => {
    console.log(`Editando movimiento tipo: ${tipo} con ID: ${movimientoId}`);
    
    const movimientoNumericoId = Number(movimientoId);
    setSelectedMovimientoId(movimientoNumericoId);
    
    // Si es un movimiento de tipo Recepción Retiro, usar nuestro componente de devolución
    if (tipo === 'Recepción Retiro') {
      const movimiento = movimientosMonedaActiva.find(m => m.id === movimientoNumericoId);
      const idRetiro = movimiento?.retiroId || movimiento?.movimientoId;
      
      if (movimiento && idRetiro) {
        setRetiroIdSeleccionado(idRetiro);
        setDialogoDevolverRetiroOpen(true);
      } else {
        console.error('No se puede devolver el retiro: ID del retiro no encontrado', movimientoId, movimiento);
        setError('No se puede devolver el retiro: ID del retiro no encontrado');
      }
      return;
    }
    
    const tipoNormalizado = tipo.toLowerCase();
    
    if (tipoNormalizado === 'vales') {
      setEditarValeOpen(true);
    } else if (tipoNormalizado === 'uso y devolución') {
      setEditarUsoDevolucionOpen(true);
    } else if (tipoNormalizado.includes('depósito') || tipoNormalizado.includes('deposito')) {
      setCancelarDepositoOpen(true);
    } else if (tipoNormalizado === 'pago servicio') {
      setAnularPagoServicioOpen(true);
    } else if (tipoNormalizado === 'cambio') {
      // Encontrar el operacionId del movimiento de cambio
      const movimientoCambio = movimientosMonedaActiva.find(m => m.id === movimientoNumericoId);
      if (movimientoCambio && movimientoCambio.operacionId) {
        setSelectedCambioId(movimientoCambio.operacionId); // Guardar el ID del CAMBIO (operacionId)
        setEliminarCambioOpen(true); // Abrir el diálogo para eliminar/cancelar el cambio
      } else {
        console.error('No se pudo obtener el operacionId para el movimiento de cambio:', movimientoId);
        setError('No se pudo obtener la información necesaria para anular este cambio.');
      }
    } else if (tipoNormalizado === 'gasto') {
      // Encontrar el operacionId del movimiento de gasto
      const movimientoGasto = movimientosMonedaActiva.find(m => m.id === movimientoNumericoId);
      if (movimientoGasto && movimientoGasto.operacionId) {
        setSelectedGastoId(parseInt(movimientoGasto.operacionId)); // Guardar el ID del GASTO (operacionId)
        setEditarGastoOpen(true); // Abrir el diálogo para editar/eliminar el gasto
      } else {
        console.error('No se pudo obtener el operacionId para el movimiento de gasto:', movimientoId);
        setError('No se pudo obtener la información necesaria para editar este gasto.');
      }
    } else {
      console.warn(`No hay editor definido para el tipo: ${tipo}`);
      // Opcionalmente, mostrar un mensaje al usuario si no hay acción definida
      // setErrorDialogMessage(`No hay una acción de edición definida para movimientos de tipo "${tipo}".`);
      // setErrorDialogOpen(true);
    }
  };

  // Función para abrir el diálogo de impresión de vale (modificada)
  const handleAbrirDialogoImprimirVale = async (movimientoId: number) => {
    if (verificandoEstadoVale) return; 
    
    setVerificandoEstadoVale(true);
    setError(null); // Limpiar errores generales previos
    console.log(`[Balance] Verificando estado para imprimir vale (Movimiento ID: ${movimientoId})...`);

    try {
      const movimientoResponse = await api.get(`/api/caja_mayor_movimientos/${movimientoId}`);
      const operacionId = movimientoResponse.data?.operacionId;

      if (!operacionId) {
        throw new Error('No se pudo obtener el ID de operación del vale.');
      }

      const valeResponse = await api.get(`/api/vales/${operacionId}`);
      const estadoVale = valeResponse.data?.estado;
      const motivoCancelacion = valeResponse.data?.motivo_cancelacion; 

      console.log(`[Balance] Estado del vale ${operacionId}:`, estadoVale);

      if (estadoVale && estadoVale.toLowerCase() === 'cancelado') {
          let errorMsg = 'Este vale ha sido cancelado y no se puede imprimir.';
          if (motivoCancelacion) {
              errorMsg += ` Motivo: ${motivoCancelacion}`;
          }
          setErrorDialogMessage(errorMsg);
          setErrorDialogOpen(true);
          console.warn(`[Balance] Intento de imprimir vale cancelado (Movimiento ID: ${movimientoId}, Vale ID: ${operacionId})`);
      } else {
        setValeParaImprimirId(movimientoId);
        setImprimirValeDialogOpen(true);
      }

    } catch (err: any) {
      console.error('[Balance] Error al verificar estado del vale antes de imprimir:', err);
      setError(err.response?.data?.error || err.message || 'Error al verificar el estado del vale.');
    } finally {
       setVerificandoEstadoVale(false);
    }
  };

  // Función para cerrar el diálogo de error
  const handleCloseErrorDialog = () => {
      setErrorDialogOpen(false);
      setErrorDialogMessage(null);
  };

  // useEffect para buscar detalles de cambios
  useEffect(() => {
    const fetchCambioDetailsForMovimientos = async () => {
      // Asegurarse que movimientosMonedaActiva es un array antes de filtrar
      if (!Array.isArray(movimientosMonedaActiva)) {
          console.warn('[Balance] movimientosMonedaActiva no es un array, omitiendo fetch de detalles de cambio.');
          return;
      }
          
      const cambiosMovimientos = movimientosMonedaActiva
        .filter((m: Movimiento) => m.tipo === 'Cambio' && m.operacionId); // Añadir tipo explícito a m
        
      const idsToFetch = cambiosMovimientos
          .map((m: Movimiento) => m.operacionId as string) // Añadir tipo explícito a m
          .filter((id: string) => id && !cambioDetails[id] && !loadingCambioDetails[id]);
      
      if (idsToFetch.length === 0) return;
      
      // Marcar como cargando
      setLoadingCambioDetails(prev => {
        const newState = { ...prev };
        idsToFetch.forEach(id => { newState[id] = true; });
        return newState;
      });
      
      console.log('[Balance] Fetching details for Cambios with IDs:', idsToFetch);

      const promises = idsToFetch.map(async (id) => {
        try {
          const response = await api.get<CambioDetalles>(`/api/cambios-moneda/${id}`);
          if (response.data) {
            return { id, details: response.data };
          }
          return { id, error: 'No data received' };
        } catch (err) { // No es necesario `any` aquí si no se usa explícitamente
          console.error(`[Balance] Error fetching details for cambio ${id}:`, err);
          return { id, error: 'Fetch error' };
        }
      });

      const results = await Promise.all(promises);

      // Actualizar estados
      setCambioDetails(prev => {
        const newState = { ...prev };
        results.forEach(res => {
          if (res.details) {
            newState[res.id] = res.details;
          }
        });
        return newState;
      });
      
      setLoadingCambioDetails(prev => {
        const newState = { ...prev };
        results.forEach(res => { newState[res.id] = false; }); 
        return newState;
      });
    };

    if (movimientosMonedaActiva.length > 0) {
      fetchCambioDetailsForMovimientos();
    }
  }, [movimientosMonedaActiva]); // Dependencia correcta

  // Helper para formatear Tooltip de Cambio
  const formatCambioTooltip = (operacionId: string): React.ReactNode => {
    if (loadingCambioDetails[operacionId]) {
      return "Cargando detalles...";
    }
    const details = cambioDetails[operacionId];
    if (!details) {
      if (loadingCambioDetails[operacionId] === undefined) {
          return "Obteniendo detalles..."; 
      }
      return "Error al cargar detalles";
    }
    
    const montoOrigen = details.monto;
    const montoDestino = details.resultado;
        
    const montoOrigenF = formatOrError(montoOrigen, details.monedaOrigen);
    const montoDestinoF = formatOrError(montoDestino, details.monedaDestino);
    
    let cotizacionNum: number;
    if (typeof details.cotizacion === 'string') {
        // Intenta parsear como flotante. Asume que el string guardado es un número válido.
        // La lógica de parseo compleja de formatos mixtos es más para la entrada del usuario.
        const num = parseFloat(details.cotizacion.replace(',', '.')); // Reemplaza coma por punto para JS
        cotizacionNum = isNaN(num) ? 0 : num;
    } else {
      cotizacionNum = details.cotizacion; // Ya es un número
    }
    
    if (isNaN(cotizacionNum)) {
      cotizacionNum = 0;
    }
    
    let cotizacionTexto = "";
    // El tooltip debe reflejar cómo se ingresó la cotización originalmente.
    if (details.monedaOrigen === 'PYG') {
      // Cuando el origen fue PYG, el usuario ingresó: 1 [Destino] = X PYG.
      // La cotizacionNum guardada es ese valor X en PYG.
      cotizacionTexto = `Cotización: 1 ${details.monedaDestino} = ${formatOrError(cotizacionNum, 'PYG')}`;
    } else if (details.monedaOrigen === 'BRL' && details.monedaDestino === 'USD') {
      // Para BRL -> USD, el usuario ingresó: 1 USD = X BRL.
      // La cotizacionNum guardada es ese valor X en BRL.
      const cotizacionFormateada = cotizacionNum.toFixed(4); // Mostrar con 4 decimales
      cotizacionTexto = `Cotización: 1 ${details.monedaDestino} (${details.monedaDestino}) = ${cotizacionFormateada} ${details.monedaOrigen} (${details.monedaOrigen})`;
    } else {
      // Para todos los demás casos (USD -> BRL, USD -> PYG, BRL -> PYG):
      // El usuario ingresó: 1 [Origen] = X [Destino].
      // La cotizacionNum guardada es ese valor X en la moneda de destino.
      const cotizacionFormateada = (details.monedaDestino === 'PYG') 
                                      ? formatOrError(cotizacionNum, 'PYG') 
                                      : cotizacionNum.toFixed(4); // 4 decimales para tasas cruzadas no PYG
      cotizacionTexto = `Cotización: 1 ${details.monedaOrigen} = ${cotizacionFormateada} ${details.monedaDestino}`;
    }

    return (
      <Box sx={{ textAlign: 'left', p: 0.5 }}>
        <Typography variant="caption" display="block">Origen: {montoOrigenF} {details.monedaOrigen}</Typography>
        <Typography variant="caption" display="block">Destino: {montoDestinoF} {details.monedaDestino}</Typography>
        <Typography variant="caption" display="block">{cotizacionTexto}</Typography>
      </Box>
    );
  };

  // Cerrar diálogo de editar uso y devolución
  const handleCloseEditarUsoDevolucion = () => {
    setEditarUsoDevolucionOpen(false);
    setSelectedMovimientoId(null);
  };

  // Cerrar diálogo de cancelar depósito
  const handleCloseCancelarDeposito = () => {
    setCancelarDepositoOpen(false);
    setSelectedMovimientoId(null);
  };

  // Función para recargar todo (útil después de guardar operaciones)
  const recargarTodo = () => {
      cargarDatosIniciales(); // Recargar saldos
      cargarMovimientosMoneda(); // Recargar movimientos de la moneda activa
  };

  // En la función handleEditar (alrededor de la línea 807)
  const handleEditar = (movimiento: Movimiento) => {
    // Si es un movimiento de tipo Recepción Retiro, abrir el diálogo de devolución
    if (movimiento.tipo === 'Recepción Retiro') {
      if (movimiento.retiroId) {
        setRetiroIdSeleccionado(movimiento.retiroId);
        setDialogoDevolverRetiroOpen(true);
      } else {
        console.error('No se puede devolver el retiro: retiroId no encontrado', movimiento);
        // Mostrar mensaje de error al usuario
        setError('No se puede devolver el retiro: ID del retiro no encontrado');
      }
      return;
    }
    
    // Para otros tipos de movimientos, seguir con la lógica existente
    // ... existing code ...
  };
  
  // Función para cerrar el diálogo de devolución de retiro
  const handleCerrarDialogoDevolverRetiro = () => {
    setDialogoDevolverRetiroOpen(false);
    setRetiroIdSeleccionado('');
  };

  // Función para verificar si un comprobante es válido
  const esComprobanteValido = (rutaComprobante: string | undefined): boolean => {
    // Añadir log para diagnóstico
    console.log('[Balance] Verificando comprobante:', rutaComprobante);
    
    if (!rutaComprobante) return false;
    
    const textoLimpio = rutaComprobante.trim().toLowerCase();
    
    // Si está vacío, no es válido
    if (textoLimpio === '') return false;
    
    // IMPORTANTE: Los archivos .txt indican que NO hay comprobante adjunto
    if (textoLimpio.endsWith('.txt')) {
      console.log('[Balance] Resultado: FALSE (archivo .txt indica sin comprobante)');
      return false;
    }
    
    // Detectar textos que indican que no hay comprobante
    const textosInvalidos = [
      'sin comprobante', 
      'no hay comprobante',
      'no disponible',
      'n/a',
      'ninguno',
      'no existe',
      '-'
    ];
    
    // Si contiene alguno de los textos inválidos, no es un comprobante válido
    for (const texto of textosInvalidos) {
      if (textoLimpio.includes(texto)) {
        return false;
      }
    }
    
    // Verificar si parece una ruta de archivo válida (excluyendo .txt)
    const tieneExtension = /\.(pdf|jpg|jpeg|png|gif|tiff|bmp)$/i.test(textoLimpio);
    
    // Si no tiene extensión de archivo válida, probablemente no sea un comprobante válido
    if (!tieneExtension) {
      console.log('[Balance] Comprobante sin extensión de archivo válida:', rutaComprobante);
      return false;
    }
    
    return true;
  };

  // Ver comprobante (implementación robusta)
  const verComprobante = async (nombreArchivo: string) => {
    try {
      if (!nombreArchivo || !esComprobanteValido(nombreArchivo)) {
        setError('Comprobante no disponible o inválido');
        return;
      }

      setLoadingComprobante(true);
      console.log('Ruta de comprobante original:', nombreArchivo);
      
      // Extraer el nombre del archivo sin la ruta
      const nombreArchivoSolo = nombreArchivo.split('/').pop() || nombreArchivo;
      
      // Detectar el servicio basado en el nombre del archivo
      let servicioDetectado = 'caja-mayor'; // Valor por defecto
      
      if (nombreArchivoSolo.includes('wepaUsd')) {
        servicioDetectado = 'wepa-usd';
      } else if (nombreArchivoSolo.includes('wepaGuaranies')) {
        servicioDetectado = 'wepa-guaranies';
      } else if (nombreArchivoSolo.includes('wepa')) {
        servicioDetectado = 'wepa';
      } else if (nombreArchivoSolo.includes('aquiPago')) {
        servicioDetectado = 'aquipago';
      }
      
      console.log('Servicio detectado por nombre de archivo:', servicioDetectado);
      
      // Lista de variantes a intentar, en orden de prioridad
      const intentos = [
        // 1. Intento basado en el servicio detectado
        { 
          url: `/api/${servicioDetectado}/comprobante/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: `Intentando con servicio detectado: ${servicioDetectado}`
        },
        // 2. Intento con caja-mayor (coincide con el servicio actual)
        { 
          url: `/api/caja-mayor/comprobante/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: 'Intentando con endpoint caja-mayor'
        },
        // 3. Intento específico para depositos
        { 
          url: `/api/depositos/comprobante/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: 'Intentando con endpoint depositos'
        },
        // 4. Intento para wepa-usd 
        { 
          url: `/api/wepa-usd/comprobante/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: 'Intentando con endpoint wepa-usd'
        },
        // 5. Intento para aquipago
        { 
          url: `/api/aquipago/comprobante/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: 'Intentando con endpoint aquipago'
        },
        // 6. Intento con endpoint genérico
        { 
          url: `/api/comprobantes/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: 'Intentando con endpoint genérico de comprobantes'
        },
        // 7. Intento directo con uploads (último recurso)
        {
          url: `/uploads/${encodeURIComponent(nombreArchivoSolo)}`,
          desc: 'Intentando con ruta directa en uploads'
        }
      ];
      
      // Probar cada intento secuencialmente
      for (const intento of intentos) {
        try {
          console.log(intento.desc);
          const response = await api.get(intento.url, {
            responseType: 'blob'
          });
          
          const blob = new Blob([response.data], { type: response.headers['content-type'] });
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          window.URL.revokeObjectURL(url);
          
          console.log('Éxito con:', intento.url);
          return; // Salir si tiene éxito
        } catch (error) {
          console.log(`Falló intento con: ${intento.url}`);
          // Continuar con el siguiente intento
        }
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      // Intentar un último recurso: la URL original directamente
      console.log('Intentando con URL original:', nombreArchivo);
      try {
        // Obtener la URL base configurada para la aplicación
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        
        // Construir la URL completa
        const comprobanteUrl = `${apiBaseUrl}/uploads/${nombreArchivo}`;
        
        console.log('URL final del comprobante:', comprobanteUrl);
        window.open(comprobanteUrl, '_blank');
      } catch (error) {
        console.error('Error al abrir URL original:', error);
        setError('No se pudo visualizar el comprobante solicitado');
      }
      
    } catch (err) {
      console.error('Error al ver comprobante:', err);
      setError('Error al visualizar el comprobante solicitado');
    } finally {
      setLoadingComprobante(false);
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
      
      {/* Resto del contenido con el Box que envuelve todo */}
      <Box sx={{ 
        '& .MuiTableContainer-root, & .MuiDialog-paper, & *': scrollbarStyles,
        height: '100%'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ mr: 2 }}>
            Balance de Caja Mayor
          </Typography>
            {verificandoEstadoVale && 
              <Alert severity="info" sx={{ py: 0, px: 1, mr: 2 }}>
                Verificando estado del vale...
              </Alert>
            }
          </Box>
          
          {/* Botones de acciones */}
          <ButtonGroup variant="outlined" size="small">
            <Button 
              startIcon={<ArrowDownwardIcon />}
              onClick={handleRecibirRetiros}
            >
              Recibir Retiros
            </Button>
            <Button 
              startIcon={<PaymentIcon />}
              onClick={handlePagosServicios}
            >
              Pagos de Servicios
            </Button>
            <Button 
              startIcon={<BankIcon />}
              onClick={handleDeposito}
            >
              Depósito
            </Button>
            <Button 
              startIcon={<SwapHorizIcon />}
              onClick={handleUsoDevolucion}
            >
              Uso/Devolución
            </Button>
            <Button 
              startIcon={<CompareArrowsIcon />}
              onClick={handleCambioMoneda}
            >
              Cambio
            </Button>
            <Button 
              startIcon={<ReceiptIcon />}
              onClick={handleVales}
            >
              Vales
            </Button>
          </ButtonGroup>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loadingSaldos ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 1.5, height: '100%', bgcolor: 'background.paper' }}>
                  <Box display="flex" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Cotización Vigente
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2">
                          Dólar: {cotizacionVigente ? formatCurrency.guaranies(cotizacionVigente.valorDolar) : 'No disponible'}
                        </Typography>
                        <Typography variant="body2">
                          Real: {cotizacionVigente ? formatCurrency.guaranies(cotizacionVigente.valorReal) : 'No disponible'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        Cambio Alberdi
                        {cambioAlberdiCotizacion.loading && (
                          <CircularProgress 
                            size={16} 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {cambioAlberdiCotizacion.error ? (
                          <Alert severity="error" sx={{ py: 0, fontSize: '0.75rem' }}>
                            No se pudo obtener la cotización
                          </Alert>
                        ) : (
                          <>
                            <Typography variant="body2">
                              Dólar: {formatCurrency.guaranies(cambioAlberdiCotizacion.dolar.compra)} / {formatCurrency.guaranies(cambioAlberdiCotizacion.dolar.venta)}
                            </Typography>
                            <Typography variant="body2">
                              Real: {formatCurrency.guaranies(cambioAlberdiCotizacion.real.compra)} / {formatCurrency.guaranies(cambioAlberdiCotizacion.real.venta)}
                            </Typography>
                          </>
                        )}
                      </Box>
                      {cambioAlberdiCotizacion.lastUpdate && !cambioAlberdiCotizacion.error && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem', color: 'text.secondary' }}>
                          Actualizado: {cambioAlberdiCotizacion.lastUpdate.toLocaleDateString('es-PY')} {cambioAlberdiCotizacion.lastUpdate.toLocaleTimeString('es-PY')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 1.5, height: '100%', bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' /* Align items at the start vertically */ }}>
                    {/* Saldo Total a la izquierda */}
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Saldo Total (Equivalente en Guaraníes)
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency.guaranies(calcularSaldoTotalEnGuaranies())}
                      </Typography>
                    </Box>
                    
                    {/* Ingresos y Egresos a la derecha */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 0.5 /* Ajustar padding top si es necesario */ }}>
                      {/* Ingresos */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                          <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                          <Typography variant="caption">
                            Ingresos Mes ({monedaActiva === 'guaranies' ? 'Gs' : monedaActiva === 'dolares' ? '$' : 'R$'})
                          </Typography>
                        </Box>
                        <Typography variant="body2" component="div" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                          {formatearValor(ingresosEgresosMes.ingresos[monedaActiva])}
                        </Typography>
                      </Box>
                      {/* Egresos */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                          <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                          <Typography variant="caption">
                            Egresos Mes ({monedaActiva === 'guaranies' ? 'Gs' : monedaActiva === 'dolares' ? '$' : 'R$'})
                          </Typography>
                        </Box>
                        <Typography variant="body2" component="div" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                          {formatearValor(ingresosEgresosMes.egresos[monedaActiva])}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* Saldo Guaraníes */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={monedaActiva === 'guaranies' ? 8 : 2}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    height: 140,
                    bgcolor: 'rgba(33, 150, 243, 0.12)', // Azul claro
                    color: (theme) => theme.palette.primary.main,
                    borderRadius: 2,
                    borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
                    transition: 'transform 0.2s',
                    boxShadow: (theme) => (monedaActiva === 'guaranies' ? theme.shadows[8] : theme.shadows[2]),
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: (theme) => theme.shadows[8],
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => setMonedaActiva('guaranies')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GuaraniesIcon />
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        Saldo en Guaraníes
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleConteoGuaranies(); }}
                      title="Conteo de Guaraníes"
                    >
                      <CalculateIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', width: '100%' }}>
                    {formatCurrency.guaranies(saldosData.guaranies)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Saldo Reales */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={monedaActiva === 'reales' ? 8 : 2}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    height: 140,
                    bgcolor: 'rgba(76, 175, 80, 0.12)', // Verde claro
                    color: (theme) => theme.palette.success.main,
                    borderRadius: 2,
                    borderLeft: (theme) => `4px solid ${theme.palette.success.main}`,
                    transition: 'transform 0.2s',
                    boxShadow: (theme) => (monedaActiva === 'reales' ? theme.shadows[8] : theme.shadows[2]),
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: (theme) => theme.shadows[8],
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => setMonedaActiva('reales')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <RealesIcon />
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        Saldo en Reales
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleConteoReales(); }}
                      title="Conteo de Reales"
                    >
                      <CalculateIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', width: '100%' }}>
                    {formatCurrency.reals(saldosData.reales)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Saldo Dólares */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={monedaActiva === 'dolares' ? 8 : 2}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    height: 140,
                    bgcolor: 'rgba(156, 39, 176, 0.12)', // Violeta claro
                    color: (theme) => theme.palette.secondary.main,
                    borderRadius: 2,
                    borderLeft: (theme) => `4px solid ${theme.palette.secondary.main}`,
                    transition: 'transform 0.2s',
                    boxShadow: (theme) => (monedaActiva === 'dolares' ? theme.shadows[8] : theme.shadows[2]),
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: (theme) => theme.shadows[8],
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => setMonedaActiva('dolares')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DolaresIcon />
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        Saldo en Dólares
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleConteoDolares(); }}
                      title="Conteo de Dólares"
                    >
                      <CalculateIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', width: '100%' }}>
                    {formatCurrency.dollars(saldosData.dolares)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">
                  Últimos Movimientos en {monedaActiva === 'guaranies' ? 'Guaraníes' : monedaActiva === 'dolares' ? 'Dólares' : 'Reales'}
                </Typography>
                  <Tooltip title={ordenDescendente ? "Orden actual: Más reciente primero. Clic para cambiar." : "Orden actual: Más antiguo primero. Clic para cambiar."}>
                    <IconButton 
                      size="small" 
                      onClick={cambiarOrden}
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      {ordenDescendente ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Tooltip title="Ver listado completo con filtros">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FullscreenIcon />}
                    onClick={handleOpenMovimientosExpandidos}
                  >
                    Expandir
                  </Button>
                </Tooltip>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center" width="50px">Editar</TableCell>
                      <TableCell>Concepto</TableCell>
                      <TableCell align="right">Ingreso</TableCell>
                      <TableCell align="right">Egreso</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientosMonedaActiva.length > 0 ? (
                      movimientosMonedaActiva.map((movimiento: Movimiento) => {
                        // Añadir log para diagnosticar tipos de movimiento
                        console.log(`[Balance] Tipo de movimiento: "${movimiento.tipo}", tiene comprobante: ${!!movimiento.rutaComprobante}`);
                        
                        // Añadir un log detallado para pagos de servicio
                        if (movimiento.tipo === 'Pago Servicio') {
                          console.log('[Balance] Detalles completos del Pago Servicio:', JSON.stringify(movimiento, null, 2));
                        }
                        
                        const isCambioCancelacion = movimiento.tipo === 'Cambio' && movimiento.concepto.startsWith('Cancelación de cambio');
                        const isDepositoCancelacion = movimiento.tipo === 'Cancelación depósito';
                        const isValeCancelacion = movimiento.tipo === 'Vales' && movimiento.concepto.toLowerCase().includes('cancelado');
                        const isGenericCancelacion = movimiento.concepto.toLowerCase().includes('cancelación');
                        
                        // AÑADIR: Verificar si el concepto incluye '[DEVUELTO]'
                        const isDevuelto = String(movimiento.concepto || '').includes('[DEVUELTO]');
                        
                        // MODIFICAR: Incluir isDevuelto en la condición para deshabilitar
                        const isEditDisabled = isCambioCancelacion || isDepositoCancelacion || isValeCancelacion || isGenericCancelacion || isDevuelto;
                        
                        let editTooltipText = "Editar/Anular movimiento";
                        if (isCambioCancelacion || isDepositoCancelacion || isValeCancelacion || isGenericCancelacion) {
                            editTooltipText = "Movimiento de anulación/cancelación (no editable)";
                        } else if (isDevuelto) { // AÑADIR: Tooltip específico para devueltos
                            editTooltipText = "Retiro devuelto (no editable)";
                        }
                        
                        // Determinar si es un depósito para mostrar icono de comprobante
                        const isDeposito = movimiento.tipo.toLowerCase().includes('depósito') || movimiento.tipo.toLowerCase().includes('deposito');
                        const hasComprobante = !!movimiento.rutaComprobante;

                        return (
                          <TableRow key={movimiento.id} hover>
                            <TableCell>{formatDate(movimiento.fechaHora ?? movimiento.fecha)}</TableCell>
                            <TableCell>{movimiento.tipo}</TableCell>
                            <TableCell align="center">
                              <Tooltip title={editTooltipText}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => !isEditDisabled && editarMovimiento(movimiento.id.toString(), movimiento.tipo)}
                                    disabled={isEditDisabled}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                               {/* Contenedor para concepto e iconos */}
                               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                 <span>{movimiento.concepto}</span>
                                  {
                                    movimiento.tipo === 'Vales' &&
                                    (() => {
                                      const isEsteMovimientoCancelacion = movimiento.concepto.toLowerCase().includes('cancelado');
                                      return (
                                        <Tooltip title={isEsteMovimientoCancelacion ? "Movimiento de cancelación (no se puede imprimir)" : "Imprimir Vale"}>
                                          <span style={{ marginLeft: '4px' }}>
                                            <IconButton
                                              size="small"
                                              color="info"
                                              onClick={() => !isEsteMovimientoCancelacion && handleAbrirDialogoImprimirVale(movimiento.id)}
                                              disabled={isEsteMovimientoCancelacion}
                                              sx={{ p: 0.25 }}
                                            >
                                              <PrintIcon fontSize="small" />
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                      );
                                    })()
                                  }
                                  {
                                    movimiento.tipo === 'Cambio' && movimiento.operacionId && (
                                      <Tooltip title={formatCambioTooltip(movimiento.operacionId)} placement="top" arrow>
                                        <span style={{ marginLeft: '4px' }}>
                                            <IconButton
                                              size="small"
                                              color="success"
                                              sx={{ p: 0.25 }}
                                            >
                                              <MonetizationOnIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                      </Tooltip>
                                    )
                                  }
                                  {/* Icono para ver comprobante de depósito */}
                                  {isDeposito && !isDepositoCancelacion && (
                                      <Tooltip title={esComprobanteValido(movimiento.rutaComprobante) ? "Ver Comprobante" : "Comprobante no disponible"}>
                                             <span style={{ marginLeft: '4px' }}>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                  sx={{ 
                                                    p: 0.25, 
                                                    opacity: esComprobanteValido(movimiento.rutaComprobante) ? 1 : 0.5
                                                  }}
                                                  onClick={() => esComprobanteValido(movimiento.rutaComprobante) ? verComprobante(movimiento.rutaComprobante || '') : null}
                                                  disabled={!esComprobanteValido(movimiento.rutaComprobante)}
                                                >
                                                    <DescriptionIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                  )}
                                  
                                  {/* Icono para ver comprobante de pago de servicio - Implementación final */}
                                  {movimiento.tipo.toLowerCase().includes('pago') && !isGenericCancelacion && (
                                      <Tooltip title={esComprobanteValido(movimiento.rutaComprobante) ? "Ver Comprobante del Pago" : "Comprobante no disponible"}>
                                           <span style={{ marginLeft: '4px' }}>
                                              <IconButton
                                                  size="small"
                                                  color="info"
                                                  sx={{ 
                                                    p: 0.25, 
                                                    opacity: esComprobanteValido(movimiento.rutaComprobante) ? 1 : 0.5
                                                  }}
                                                  onClick={() => esComprobanteValido(movimiento.rutaComprobante) ? verComprobante(movimiento.rutaComprobante || '') : null}
                                                  disabled={!esComprobanteValido(movimiento.rutaComprobante)}
                                              >
                                                  <DescriptionIcon fontSize="small" />
                                              </IconButton>
                                          </span>
                                      </Tooltip>
                                  )}
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ color: movimiento.esIngreso ? 'success.main' : 'inherit' }}>
                              {movimiento.esIngreso ? formatOrError(movimiento.monto, movimiento.moneda) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: !movimiento.esIngreso ? 'error.main' : 'inherit' }}>
                              {!movimiento.esIngreso ? formatOrError(movimiento.monto || 0, movimiento.moneda || 'guaranies') : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {formatOrError(movimiento.saldoActual ?? 0, movimiento.moneda || 'guaranies')}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay movimientos registrados en esta moneda
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
        
        <RecibirRetiros 
          open={recibirRetirosOpen} 
          onClose={handleCloseRecibirRetiros} 
          onGuardarExito={recargarTodo}
        />
        
        <PagosServicios 
          open={pagosServiciosOpen} 
          onClose={handleClosePagosServicios} 
          onGuardarExito={recargarTodo}
        />
        
        <DepositoBancario 
          open={depositoOpen} 
          onClose={handleCloseDeposito} 
          onGuardarExito={recargarTodo}
        />
        
        <UsoDevolucion
          open={usoDevolucionOpen}
          onClose={handleCloseUsoDevolucion}
          onGuardarExito={recargarTodo}
        />
        
        <CambioMoneda
          open={cambioMonedaOpen}
          onClose={handleCloseCambioMoneda}
          onGuardarExito={recargarTodo}
        />
        
        <Vales
          open={valesOpen}
          onClose={handleCloseVales}
          onGuardarExito={recargarTodo}
        />
        
        <ConteoGuaranies
          open={conteoGuaraniesOpen}
          onClose={handleCloseConteoGuaranies}
          onSaveTotal={handleSaveConteoGuaranies}
          saldoSistema={saldosData.guaranies}
          usuarioId={1} // Usar el ID del usuario autenticado
        />
        
        <ConteoReales
          open={conteoRealesOpen}
          onClose={handleCloseConteoReales}
          onSaveTotal={handleSaveConteoReales}
          saldoSistema={saldosData.reales}
          usuarioId={1} // Usar el ID del usuario autenticado
        />
        
        <ConteoDolares
          open={conteoDolaresOpen}
          onClose={handleCloseConteoDolares}
          onSaveTotal={handleSaveConteoDolares}
          saldoSistema={saldosData.dolares}
          usuarioId={1} // Usar el ID del usuario autenticado
        />
        
        <MovimientosExpandidos
          open={movimientosExpandidosOpen}
          onClose={handleCloseMovimientosExpandidos}
          monedaActiva={monedaActiva}
        />

        <EditarVale
          open={editarValeOpen}
          onClose={() => setEditarValeOpen(false)}
          onSuccess={() => {
            setEditarValeOpen(false);
            recargarTodo();
          }}
          movimientoId={selectedMovimientoId}
          tipoMovimiento="Vales"
        />

        <EditarUsoDevolucion
          open={editarUsoDevolucionOpen}
          onClose={handleCloseEditarUsoDevolucion}
          movimientoId={selectedMovimientoId}
          onSuccess={recargarTodo}
        />

        <EliminarCambio
          open={eliminarCambioOpen}
          onClose={() => setEliminarCambioOpen(false)}
          cambioId={selectedCambioId}
          onSuccess={recargarTodo}
        />

        <ImprimirValeDialog
          open={imprimirValeDialogOpen}
          onClose={() => setImprimirValeDialogOpen(false)}
          movimientoId={valeParaImprimirId}
        />

        <CancelarDeposito
          open={cancelarDepositoOpen}
          onClose={handleCloseCancelarDeposito}
          movimientoId={selectedMovimientoId}
          onSuccess={recargarTodo}
        />

        <AnularPagoServicio
          open={anularPagoServicioOpen}
          onClose={() => setAnularPagoServicioOpen(false)}
          movimientoId={selectedMovimientoId}
          onSuccess={recargarTodo}
        />

        <DevolverRetiro
          open={dialogoDevolverRetiroOpen}
          onClose={handleCerrarDialogoDevolverRetiro}
          onGuardarExito={recargarTodo}
          retiroId={retiroIdSeleccionado}
        />

        <EditarEliminarGasto
          open={editarGastoOpen}
          onClose={() => setEditarGastoOpen(false)}
          gastoId={selectedGastoId}
          onSuccess={recargarTodo}
        />

        <Dialog
          open={errorDialogOpen}
          onClose={handleCloseErrorDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Vale Cancelado"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" id="alert-dialog-description">
              {errorDialogMessage}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseErrorDialog} color="primary" autoFocus>
              Aceptar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Balance; 
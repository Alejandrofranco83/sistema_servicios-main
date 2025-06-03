import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  DialogActions
} from '@mui/material';
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  RefreshOutlined as RefreshIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatUtils';
import { scrollbarStyles } from '../../utils/scrollbarStyles';
import EditarVale from './EditarVale';
import EditarUsoDevolucion from './EditarUsoDevolucion';
import CancelarDeposito from './CancelarDeposito';
import AnularPagoServicio from './AnularPagoServicio';
import EliminarCambio from './EliminarCambio';
import DevolverRetiro from './DevolverRetiro';
import ImprimirValeDialog from './ImprimirValeDialog';
import { cajaMayorService } from '../../services/api';
import api from '../../services/api';

// Definir TipoMoneda para representar las abreviaturas estándar
type TipoMoneda = 'PYG' | 'USD' | 'BRL';

// Definir la interfaz para los movimientos
interface Movimiento {
  id: number;
  fechaHora?: string;
  fecha?: string;
  tipo: string;
  concepto: string;
  moneda: 'guaranies' | 'dolares' | 'reales';
  monto: number;
  esIngreso?: boolean;
  ingreso?: number;
  egreso?: number;
  saldoActual?: number;
  saldo?: number;
  operacionId?: string | null;
  rutaComprobante?: string | null;
  retiroId?: string;
  movimientoId?: string;
}

// Definir interfaz para detalles de cambio
interface CambioDetalles {
  id: string; 
  monedaOrigen: TipoMoneda; 
  monedaDestino: TipoMoneda;
  monto: number; 
  cotizacion: number;
  resultado: number; 
  observacion?: string;
  fecha?: string;
}

interface MovimientosExpandidosProps {
  open: boolean;
  onClose: () => void;
  monedaActiva: 'guaranies' | 'dolares' | 'reales';
}

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

const MovimientosExpandidos: React.FC<MovimientosExpandidosProps> = ({
  open,
  onClose,
  monedaActiva
}) => {
  // --- Estados de Paginación y Datos --- 
  const [page, setPage] = useState(0); // Índice de página basado en 0 para TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(25); // Empezar con 25 por página
  const [totalMovimientos, setTotalMovimientos] = useState(0);
  const [movimientosPaginados, setMovimientosPaginados] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordenDescendente, setOrdenDescendente] = useState(true); // Estado local para el orden
  const [loadingComprobante, setLoadingComprobante] = useState<boolean>(false);

  // --- Estados para filtros --- 
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<Date | null>(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<Date | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroConcepto, setFiltroConcepto] = useState<string>("");
  const [tiposUnicos, setTiposUnicos] = useState<string[]>([]); // Estado para tipos únicos
  const [loadingTipos, setLoadingTipos] = useState(false); // Estado de carga para tipos

  // Estados adicionales
  const [editarValeOpen, setEditarValeOpen] = useState(false);
  const [editarUsoDevolucionOpen, setEditarUsoDevolucionOpen] = useState(false);
  const [cancelarDepositoOpen, setCancelarDepositoOpen] = useState(false);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState<number | null>(null);

  // Estados para impresión de vales
  const [imprimirValeDialogOpen, setImprimirValeDialogOpen] = useState(false);
  const [valeParaImprimirId, setValeParaImprimirId] = useState<number | null>(null);
  const [verificandoEstadoVale, setVerificandoEstadoVale] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);

  // --- NUEVOS ESTADOS PARA FUNCIONALIDADES FALTANTES ---
  const [anularPagoServicioOpen, setAnularPagoServicioOpen] = useState(false);
  const [eliminarCambioOpen, setEliminarCambioOpen] = useState(false);
  const [dialogoDevolverRetiroOpen, setDialogoDevolverRetiroOpen] = useState(false);
  const [selectedCambioId, setSelectedCambioId] = useState<string | null>(null);
  const [retiroIdSeleccionado, setRetiroIdSeleccionado] = useState<string>('');

  // Estados para almacenar detalles de cambios por operacionId (tooltips informativos)
  const [cambioDetails, setCambioDetails] = useState<Record<string, CambioDetalles>>({});
  const [loadingCambioDetails, setLoadingCambioDetails] = useState<Record<string, boolean>>({});

  // --- Función para cargar movimientos paginados --- 
  const cargarMovimientos = useCallback(async () => {
    if (!open) return; // No cargar si el diálogo no está abierto
    
    setLoading(true);
    setError(null);
    
    try {
      // Clonar fechas para ajustar la hora final sin modificar el estado
      let fechaHastaAjustada = filtroFechaHasta ? new Date(filtroFechaHasta) : null;
      if (fechaHastaAjustada) {
        fechaHastaAjustada.setHours(23, 59, 59, 999); // Incluir todo el día final
      }

      const params: any = {
        moneda: monedaActiva,
        page: page + 1, // La API espera página basada en 1
        pageSize: rowsPerPage,
        sortOrder: ordenDescendente ? 'desc' : 'asc',
        // --- Añadir filtros si están definidos --- 
        fechaDesde: filtroFechaDesde ? filtroFechaDesde.toISOString() : undefined, 
        fechaHasta: fechaHastaAjustada ? fechaHastaAjustada.toISOString() : undefined,
        tipo: filtroTipo || undefined,
        concepto: filtroConcepto || undefined,
      };
      
      // Eliminar claves con valor undefined para no enviarlas
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      console.log('[MovExpandidos] Cargando movimientos con params:', params);
      const response = await cajaMayorService.getMovimientosPaginados(params);
      
      setMovimientosPaginados(response.movimientos || []);
      setTotalMovimientos(response.total || 0);
      
      // TODO: Cargar tipos únicos si es necesario (podría ser una llamada separada al backend)
      // setTiposUnicos(...) 

    } catch (err: any) {
       console.error('Error al cargar movimientos expandidos:', err);
       setError(err.response?.data?.error || 'Error al cargar movimientos');
       setMovimientosPaginados([]);
       setTotalMovimientos(0);
    } finally {
      setLoading(false);
    }
  }, [open, monedaActiva, page, rowsPerPage, ordenDescendente, filtroFechaDesde, filtroFechaHasta, filtroTipo, filtroConcepto]); // Dependencias

  // --- Función para cargar tipos únicos ---
  const cargarTiposUnicos = useCallback(async () => {
    if (!open) return; // No cargar si el diálogo no está abierto
    setLoadingTipos(true);
    try {
      const tipos = await cajaMayorService.getTiposUnicos();
      setTiposUnicos(tipos);
    } catch (err) {
      console.error('Error al cargar tipos únicos para el filtro.');
      // Opcional: mostrar un error al usuario
    } finally {
      setLoadingTipos(false);
    }
  }, [open]); // Dependencia: solo cargar cuando se abre

  // --- Efectos --- 
  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]); 

  // <<< Efecto para cargar tipos al abrir el diálogo >>>
  useEffect(() => {
    if (open) {
      cargarTiposUnicos();
    }
  }, [open, cargarTiposUnicos]); // Ejecutar cuando `open` cambia a true

  // --- useEffect para buscar detalles de cambios (tooltips informativos) ---
  useEffect(() => {
    const fetchCambioDetailsForMovimientos = async () => {
      // Asegurarse que movimientosPaginados es un array antes de filtrar
      if (!Array.isArray(movimientosPaginados)) {
          console.warn('[MovimientosExpandidos] movimientosPaginados no es un array, omitiendo fetch de detalles de cambio.');
          return;
      }
          
      const cambiosMovimientos = movimientosPaginados
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
      
      console.log('[MovimientosExpandidos] Fetching details for Cambios with IDs:', idsToFetch);

      const promises = idsToFetch.map(async (id) => {
        try {
          const response = await api.get<CambioDetalles>(`/api/cambios-moneda/${id}`);
          if (response.data) {
            return { id, details: response.data };
          }
          return { id, error: 'No data received' };
        } catch (err) { // No es necesario `any` aquí si no se usa explícitamente
          console.error(`[MovimientosExpandidos] Error fetching details for cambio ${id}:`, err);
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

    if (movimientosPaginados.length > 0) {
      fetchCambioDetailsForMovimientos();
    }
  }, [movimientosPaginados]); // Dependencia correcta

  // --- Helper para formatear Tooltip de Cambio ---
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
        
    const montoOrigenF = formatOrError(details.monto, details.monedaOrigen);
    const montoDestinoF = formatOrError(details.resultado, details.monedaDestino);
    
    // Formateo de cotización
    let cotizacionTexto = `Cotización: ${details.cotizacion.toLocaleString('es-PY')}`;
    if (details.monedaDestino === 'PYG') {
        cotizacionTexto = `Cotización: 1 ${details.monedaOrigen} = ${formatOrError(details.cotizacion, 'PYG')}`;
    } else if (details.monedaOrigen === 'PYG') {
         cotizacionTexto = `Cotización: 1 ${details.monedaDestino} = ${formatOrError(details.cotizacion, 'PYG')}`;
    } else { 
        cotizacionTexto = `Cotización: 1 ${details.monedaOrigen} = ${details.cotizacion.toFixed(4)} ${details.monedaDestino}`;
    }

    // Retornar JSX válido
    return (
      <Box sx={{ textAlign: 'left', p: 0.5 }}>
        <Typography variant="caption" display="block">Origen: {montoOrigenF} {details.monedaOrigen}</Typography>
        <Typography variant="caption" display="block">Destino: {montoDestinoF} {details.monedaDestino}</Typography>
        <Typography variant="caption" display="block">{cotizacionTexto}</Typography>
      </Box>
    );
  }; // Asegurar que la función cierra correctamente

  // Función para cambiar el orden
  const cambiarOrden = () => {
    const nuevoOrden = !ordenDescendente;
    setOrdenDescendente(nuevoOrden);
    localStorage.setItem('ordenMovimientosCaja', nuevoOrden.toString());
  };

  // Función para resetear filtros
  const resetearFiltros = () => {
    setFiltroFechaDesde(null);
    setFiltroFechaHasta(null);
    setFiltroTipo("");
    setFiltroConcepto("");
    setPage(0);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0'); 
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return 'Error fecha';
    }
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

  // Manejadores de Paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage); // Actualizar el estado de la página (basado en 0)
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Volver a la primera página al cambiar tamaño
  };

  // Manejador para editar movimiento
  const handleEditarMovimiento = (movimientoId: number, tipo: string) => {
    setSelectedMovimientoId(movimientoId);
    console.log(`Editando movimiento tipo: ${tipo} con ID: ${movimientoId}`);
    
    // --- CASO: RECEPCIÓN RETIRO -> DEVOLVER RETIRO ---
    if (tipo === 'Recepción Retiro') {
      const movimiento = movimientosPaginados.find(m => m.id === movimientoId);
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
    
    // Determinar qué dialog abrir según el tipo de movimiento
    const tipoNormalizado = tipo.toLowerCase().trim();
    
    // --- CASO: PAGO SERVICIO -> ANULAR PAGO SERVICIO ---
    if (tipoNormalizado === 'pago servicio') {
      setAnularPagoServicioOpen(true);
      return;
    }
    
    // --- CASO: CAMBIO -> ELIMINAR CAMBIO ---
    if (tipoNormalizado === 'cambio') {
      // Encontrar el operacionId del movimiento de cambio
      const movimientoCambio = movimientosPaginados.find(m => m.id === movimientoId);
      if (movimientoCambio && movimientoCambio.operacionId) {
        setSelectedCambioId(movimientoCambio.operacionId); // Guardar el ID del CAMBIO (operacionId)
        setEliminarCambioOpen(true); // Abrir el diálogo para eliminar/cancelar el cambio
      } else {
        console.error('No se pudo obtener el operacionId para el movimiento de cambio:', movimientoId);
        setError('No se pudo obtener la información necesaria para anular este cambio.');
      }
      return;
    }
    
    // --- CASOS EXISTENTES ---
    if (tipoNormalizado === 'vales' || tipoNormalizado.includes('vale')) {
      setEditarValeOpen(true);
    } else if (tipoNormalizado === 'uso y devolución' || tipoNormalizado.includes('uso') || tipoNormalizado.includes('devolucion')) {
      setEditarUsoDevolucionOpen(true);
    } else if (tipoNormalizado.includes('depósito') || tipoNormalizado.includes('deposito') || tipoNormalizado.includes('bancario')) {
      // Para depósitos bancarios utilizamos el componente independiente CancelarDeposito
      setCancelarDepositoOpen(true);
    } else {
      console.log(`No hay editor definido para el tipo: ${tipo}`);
    }
  };

  // Función para verificar si un comprobante es válido
  const esComprobanteValido = (rutaComprobante: string | null | undefined): boolean => {
    // Añadir log para diagnóstico más detallado
    console.log('[MovimientosExpandidos] Verificando comprobante:');
    console.log('  - Valor recibido:', rutaComprobante);
    console.log('  - Tipo:', typeof rutaComprobante);
    console.log('  - Es null:', rutaComprobante === null);
    console.log('  - Es undefined:', rutaComprobante === undefined);
    console.log('  - Es string vacío:', rutaComprobante === '');
    
    // Verificación inicial: debe existir y ser un string no vacío
    if (!rutaComprobante) {
      console.log('  - Resultado: FALSE (null, undefined o falsy)');
      return false;
    }
    
    // Verificar que sea string
    if (typeof rutaComprobante !== 'string') {
      console.log('  - Resultado: FALSE (no es string)');
      return false;
    }
    
    const textoLimpio = rutaComprobante.trim().toLowerCase();
    console.log('  - Texto limpio:', textoLimpio);
    
    // Si está vacío después de trim, no es válido
    if (textoLimpio === '') {
      console.log('  - Resultado: FALSE (string vacío después de trim)');
      return false;
    }
    
    // IMPORTANTE: Los archivos .txt indican que NO hay comprobante adjunto
    if (textoLimpio.endsWith('.txt')) {
      console.log('  - Resultado: FALSE (archivo .txt indica sin comprobante)');
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
      '-',
      'null',
      'undefined',
      'sin archivo',
      'no adjuntado',
      'pendiente'
    ];
    
    // Si contiene alguno de los textos inválidos, no es un comprobante válido
    for (const texto of textosInvalidos) {
      if (textoLimpio.includes(texto)) {
        console.log(`  - Resultado: FALSE (contiene texto inválido: "${texto}")`);
        return false;
      }
    }
    
    // Verificar si parece una ruta de archivo válida (excluyendo .txt)
    const tieneExtensionValida = /\.(pdf|jpg|jpeg|png|gif|tiff|bmp|doc|docx)$/i.test(textoLimpio);
    console.log('  - Tiene extensión válida (sin .txt):', tieneExtensionValida);
    
    if (!tieneExtensionValida) {
      console.log('  - Resultado: FALSE (sin extensión de archivo válida)');
      return false;
    }
    
    // Verificar que no sea solo una extensión sin nombre
    const nombreSinExtension = textoLimpio.replace(/\.(pdf|jpg|jpeg|png|gif|tiff|bmp|doc|docx)$/i, '');
    if (nombreSinExtension.length < 1) {
      console.log('  - Resultado: FALSE (solo extensión sin nombre de archivo)');
      return false;
    }
    
    console.log('  - Resultado: TRUE (comprobante válido)');
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

  // Función para abrir el diálogo de impresión de vale
  const handleAbrirDialogoImprimirVale = async (movimientoId: number) => {
    if (verificandoEstadoVale) return; 
    
    setVerificandoEstadoVale(true);
    setError(null); // Limpiar errores generales previos
    console.log(`[MovimientosExpandidos] Verificando estado para imprimir vale (Movimiento ID: ${movimientoId})...`);

    try {
      const movimientoResponse = await api.get(`/api/caja_mayor_movimientos/${movimientoId}`);
      const operacionId = movimientoResponse.data?.operacionId;

      if (!operacionId) {
        throw new Error('No se pudo obtener el ID de operación del vale.');
      }

      const valeResponse = await api.get(`/api/vales/${operacionId}`);
      const estadoVale = valeResponse.data?.estado;
      const motivoCancelacion = valeResponse.data?.motivo_cancelacion; 

      console.log(`[MovimientosExpandidos] Estado del vale ${operacionId}:`, estadoVale);

      if (estadoVale && estadoVale.toLowerCase() === 'cancelado') {
          let errorMsg = 'Este vale ha sido cancelado y no se puede imprimir.';
          if (motivoCancelacion) {
              errorMsg += ` Motivo: ${motivoCancelacion}`;
          }
          setErrorDialogMessage(errorMsg);
          setErrorDialogOpen(true);
          console.warn(`[MovimientosExpandidos] Intento de imprimir vale cancelado (Movimiento ID: ${movimientoId}, Vale ID: ${operacionId})`);
      } else {
        setValeParaImprimirId(movimientoId);
        setImprimirValeDialogOpen(true);
      }

    } catch (err: any) {
      console.error('[MovimientosExpandidos] Error al verificar estado del vale antes de imprimir:', err);
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

  // --- FUNCIONES DE CIERRE PARA NUEVOS DIÁLOGOS ---
  
  // Función para cerrar el diálogo de anular pago servicio
  const handleCloseAnularPagoServicio = () => {
    setAnularPagoServicioOpen(false);
    setSelectedMovimientoId(null);
  };

  // Función para cerrar el diálogo de eliminar cambio
  const handleCloseEliminarCambio = () => {
    setEliminarCambioOpen(false);
    setSelectedCambioId(null);
  };

  // Función para cerrar el diálogo de devolución de retiro
  const handleCerrarDialogoDevolverRetiro = () => {
    setDialogoDevolverRetiroOpen(false);
    setRetiroIdSeleccionado('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6">
          Movimientos en {monedaActiva === 'guaranies' ? 'Guaraníes' : monedaActiva === 'dolares' ? 'Dólares' : 'Reales'}
        </Typography>
        {verificandoEstadoVale && 
          <Alert severity="info" sx={{ py: 0, px: 1 }}>
            Verificando estado del vale...
          </Alert>
        }
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Filtros */}
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <FilterListIcon sx={{ mr: 0.5 }} />
                <Typography variant="subtitle1" component="div">Filtros</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha desde"
                  value={filtroFechaDesde}
                  onChange={(newValue) => setFiltroFechaDesde(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      variant: "outlined"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha hasta"
                  value={filtroFechaHasta}
                  onChange={(newValue) => setFiltroFechaHasta(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      variant: "outlined"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="tipo-select-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-select-label"
                  value={filtroTipo}
                  label="Tipo"
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  disabled={loadingTipos} // Deshabilitar mientras carga
                >
                  <MenuItem value="">Todos</MenuItem>
                  {tiposUnicos.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Concepto"
                variant="outlined"
                size="small"
                value={filtroConcepto}
                onChange={(e) => setFiltroConcepto(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: filtroConcepto ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFiltroConcepto('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon fontSize="small" />}
                  onClick={resetearFiltros}
                  title="Limpiar filtros"
                >
                  Limpiar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon fontSize="small" />}
                  onClick={cargarMovimientos}
                  title="Actualizar resultados"
                >
                  Actualizar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Tabla de movimientos */}
        <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto', ...scrollbarStyles }}>
          {loading && (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
               <CircularProgress />
             </Box>
          )}
          {!loading && error && (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          )}
          {!loading && !error && (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Fecha
                      <Tooltip title={ordenDescendente ? "Ordenar ascendente" : "Ordenar descendente"}>
                         <IconButton size="small" onClick={cambiarOrden} sx={{ ml: 0.5 }}>
                           {ordenDescendente ? <ArrowDownwardIcon fontSize="inherit" /> : <ArrowUpwardIcon fontSize="inherit" />}
                         </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center" width="50px">Editar</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell align="right">Ingreso</TableCell>
                  <TableCell align="right">Egreso</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimientosPaginados.length > 0 ? (
                  movimientosPaginados.map((movimiento) => {
                    // Definir constantes para deshabilitar la edición
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
                                onClick={() => !isEditDisabled && handleEditarMovimiento(movimiento.id, movimiento.tipo)}
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
                                  // Icono para imprimir vale
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
                                  // --- TOOLTIP INFORMATIVO PARA CAMBIOS DE MONEDA ---
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
                                {
                                  // Icono para ver comprobante de depósito
                                  isDeposito && !isDepositoCancelacion && (
                                      <Tooltip title={esComprobanteValido(movimiento.rutaComprobante) ? "Ver Comprobante" : "Comprobante no disponible"}>
                                          <span style={{ marginLeft: '4px' }}>
                                              <IconButton
                                                  size="small"
                                                  color="secondary"
                                                  sx={{ 
                                                    p: 0.25, 
                                                    opacity: esComprobanteValido(movimiento.rutaComprobante) ? 1 : 0.5
                                                  }}
                                                  onClick={() => esComprobanteValido(movimiento.rutaComprobante) ? verComprobante(movimiento.rutaComprobante ?? '') : null}
                                                  disabled={!esComprobanteValido(movimiento.rutaComprobante)}
                                              >
                                                  <DescriptionIcon fontSize="small" />
                                              </IconButton>
                                          </span>
                                      </Tooltip>
                                  )
                                }
                                {/* Icono para ver comprobante de pago de servicio */}
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
                                                onClick={() => esComprobanteValido(movimiento.rutaComprobante) ? verComprobante(movimiento.rutaComprobante ?? '') : null}
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
                        {movimiento.esIngreso ? formatearValor(movimiento.monto) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: !movimiento.esIngreso ? 'error.main' : 'inherit' }}>
                        {!movimiento.esIngreso ? formatearValor(movimiento.monto) : '-'}
                        </TableCell>
                        <TableCell align="right">
                        {formatearValor(movimiento.saldoActual)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No se encontraron movimientos con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        
        {/* --- Contenedor para Paginación y Botón Volver --- */}
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 1, // Añadir algo de padding
            mt: 'auto' // Empujar al fondo si DialogContent tiene espacio extra
          }}
        >
          {/* Paginación a la izquierda */}
          <TablePagination
            component="div"
            count={totalMovimientos}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />

          {/* Botón Volver a la derecha */}
          <Button onClick={onClose} variant="outlined" color="primary">
            Volver
          </Button>
        </Box>
      </DialogContent>

      {/* Diálogo para editar vales */}
      {editarValeOpen && (
      <EditarVale
        open={editarValeOpen}
        onClose={() => setEditarValeOpen(false)}
          onSuccess={cargarMovimientos}
          movimientoId={selectedMovimientoId}
          tipoMovimiento="Vales"
        />
      )}
      
      {/* Diálogo para editar operaciones de Uso y Devolución */}
      {editarUsoDevolucionOpen && (
        <EditarUsoDevolucion
          open={editarUsoDevolucionOpen}
          onClose={() => setEditarUsoDevolucionOpen(false)}
          onSuccess={cargarMovimientos}
          movimientoId={selectedMovimientoId}
        />
      )}
      
      {/* Diálogo para cancelar depósitos bancarios */}
      {cancelarDepositoOpen && (
        <CancelarDeposito
          open={cancelarDepositoOpen}
          onClose={() => setCancelarDepositoOpen(false)}
          onSuccess={cargarMovimientos}
        movimientoId={selectedMovimientoId}
      />
      )}

      {/* Diálogo para imprimir vales */}
      <ImprimirValeDialog
        open={imprimirValeDialogOpen}
        onClose={() => setImprimirValeDialogOpen(false)}
        movimientoId={valeParaImprimirId}
      />

      {/* Diálogo de error para vales cancelados */}
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

      {/* --- NUEVOS DIÁLOGOS IMPLEMENTADOS --- */}

      {/* Diálogo para anular pago de servicio */}
      <AnularPagoServicio
        open={anularPagoServicioOpen}
        onClose={handleCloseAnularPagoServicio}
        movimientoId={selectedMovimientoId}
        onSuccess={cargarMovimientos}
      />

      {/* Diálogo para eliminar cambio de moneda */}
      <EliminarCambio
        open={eliminarCambioOpen}
        onClose={handleCloseEliminarCambio}
        cambioId={selectedCambioId}
        onSuccess={cargarMovimientos}
      />

      {/* Diálogo para devolver retiro */}
      <DevolverRetiro
        open={dialogoDevolverRetiroOpen}
        onClose={handleCerrarDialogoDevolverRetiro}
        onGuardarExito={cargarMovimientos}
        retiroId={retiroIdSeleccionado}
      />
    </Dialog>
  );
};

export default MovimientosExpandidos; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormHelperText,
  Tabs,
  Tab,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  ButtonGroup,
  Chip,
  useTheme,
  Stack,
  Autocomplete,
  GlobalStyles
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  LocalAtm as LocalAtmIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutLargeIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarTodayIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import es from 'date-fns/locale/es';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, sub, isWithinInterval, parseISO } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, 
  AreaChart, Area
} from 'recharts';
import cotizacionService from '../../services/cotizacionService';

// Interfaces
interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Subcategoria {
  id: number;
  nombre: string;
  categoriaId: number;
  activo: boolean;
}

interface Sucursal {
  id: number;
  nombre: string;
  codigo: string;
}

interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: string;
  categoriaId: number;
  subcategoriaId: number | null;
  sucursalId: number | null;
  comprobante: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  categoria: Categoria;
  subcategoria: Subcategoria | null;
  sucursal: Sucursal | null;
  usuario: {
    id: number;
    username: string;
    nombre: string | null;
    apellido: string | null;
  };
}

interface FiltrosGastos {
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  categoriaId: string;
  subcategoriaId: string;
  sucursalId: string;
  moneda: string;
}

// Tipos para estadísticas
interface GastosPorCategoria {
  nombre: string;
  monto: number;
  color: string;
}

interface GastosPorTiempo {
  fecha: string;
  monto: number;
}

interface GastosPorSucursal {
  nombre: string;
  monto: number;
  color: string;
}

interface EstadisticasResumen {
  totalGastos: number;
  promedioMensual: number;
  gastoMasAlto: number;
  categoriaMaxGasto: string;
  tendencia: 'up' | 'down' | 'neutral';
  porcentajeCambio: number;
}

// Estado inicial para un nuevo gasto
const gastoInicial = {
  fecha: new Date(),
  descripcion: '',
  monto: '',
  moneda: 'GS',
  categoriaId: '',
  subcategoriaId: '',
  sucursalId: '',
  observaciones: '',
  comprobante: null as File | null
};

// Colores para gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57',
  '#54478C', '#2C699A', '#048BA8', '#0DB39E', '#16DB93',
  '#83E377', '#B9E769', '#EFEA5A', '#F1C453', '#F29E4C'
];

// Helper para asegurar que un valor es un número finito
const ensureNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    // console.warn(`[Nueva Lógica] Valor no numérico o infinito: ${value}, usando ${defaultValue}`);
    return defaultValue;
  }
  return num;
};

// Nueva función para generar datos de estadísticas
const generarDatosEstadisticasNueva = (
  gastosFiltradosParaEstadisticas: Gasto[], 
  cotizacionesActuales: { dolar: number, real: number }
): any => {
  console.log('[Nueva Lógica] Iniciando generación de estadísticas para', gastosFiltradosParaEstadisticas.length, 'gastos.');
  console.log('[Nueva Lógica] Cotizaciones utilizadas:', cotizacionesActuales);

  const defaultStats = {
    gastosPorCategoria: [],
    gastosPorSucursal: [],
    gastosPorTiempo: [],
    estadisticasResumen: {
      totalGastos: 0,
      promedioMensual: 0,
      gastoMasAlto: 0,
      categoriaMaxGasto: 'N/A',
      tendencia: 'neutral' as 'up' | 'down' | 'neutral',
      porcentajeCambio: 0,
    },
  };

  if (!gastosFiltradosParaEstadisticas || gastosFiltradosParaEstadisticas.length === 0) {
    console.log('[Nueva Lógica] No hay gastos para procesar.');
    return defaultStats;
  }

  // 1. Normalizar todos los gastos a Guaraníes (GS) y validar datos
  const gastosNormalizados = gastosFiltradosParaEstadisticas.map(g => {
    const montoOriginal = ensureNumber(g.monto);
    let montoEnGs = 0;

    if (g.moneda === 'GS') {
      montoEnGs = montoOriginal;
    } else if (g.moneda === 'USD') {
      montoEnGs = montoOriginal * ensureNumber(cotizacionesActuales.dolar, 1); // Usar 1 si cotización es inválida para no anular monto
    } else if (g.moneda === 'BRL') {
      montoEnGs = montoOriginal * ensureNumber(cotizacionesActuales.real, 1); // Usar 1 si cotización es inválida
    } else {
      // console.warn(`[Nueva Lógica] Moneda desconocida: ${g.moneda} para gasto ID ${g.id}. Monto no convertido.`);
    }
    
    return {
      ...g,
      montoOriginal,
      montoEnGs: ensureNumber(montoEnGs),
      fechaObj: new Date(g.fecha), 
    };
  }).filter(g => g.montoEnGs > 0 || g.montoOriginal === 0); // Incluir gastos originales de 0, filtrar negativos o NaN post-normalización

  if (gastosNormalizados.length === 0) {
    console.log('[Nueva Lógica] No hay gastos con montos válidos tras normalización.');
     return defaultStats;
  }
  
  // console.log('[Nueva Lógica] Gastos normalizados (primeros 3):', gastosNormalizados.slice(0, 3).map(g => ({ desc: g.descripcion, orig: g.montoOriginal, moneda: g.moneda, normalizado: g.montoEnGs })));
  // Descomentado y mejorado para más visibilidad:
  console.log('[Nueva Lógica] Gastos normalizados (todos, si son pocos, o hasta 5):', 
    gastosNormalizados.slice(0, Math.min(5, gastosNormalizados.length)).map(g => 
      ({ id: g.id, desc: g.descripcion, montoOriginal: g.montoOriginal, moneda: g.moneda, montoEnGs: g.montoEnGs })
    )
  );

  // 2. Calcular Total de Gastos
  const totalGastos = gastosNormalizados.reduce((sum, g) => sum + g.montoEnGs, 0);
  console.log('[Nueva Lógica] Total Gastos (GS):', totalGastos);

  // 3. Calcular Gasto Más Alto
  let gastoMasAlto = 0;
  let categoriaMaxGasto = 'N/A';
  if (gastosNormalizados.length > 0) {
    // Ordenar por montoEnGs descendente para obtener el más alto
    const gastoMax = [...gastosNormalizados].sort((a,b) => b.montoEnGs - a.montoEnGs)[0];
    gastoMasAlto = gastoMax.montoEnGs;
    categoriaMaxGasto = gastoMax.categoria?.nombre || 'Sin Categoría';
  }
  console.log('[Nueva Lógica] Gasto Más Alto (GS):', gastoMasAlto, 'Categoría:', categoriaMaxGasto);
  
  // 4. Calcular Promedio Mensual
  let promedioMensual = 0;
  if (totalGastos > 0 && gastosNormalizados.length > 0) {
    const fechasOrdenadas = gastosNormalizados.map(g => g.fechaObj.getTime()).sort((a, b) => a - b);
    const primeraFecha = new Date(fechasOrdenadas[0]);
    const ultimaFecha = new Date(fechasOrdenadas[fechasOrdenadas.length - 1]);
    
    const mesesDiferencia = 
      (ultimaFecha.getFullYear() - primeraFecha.getFullYear()) * 12 +
      (ultimaFecha.getMonth() - primeraFecha.getMonth());
      
    const numMeses = Math.max(1, mesesDiferencia + 1); // +1 para incluir el mes actual, mínimo 1
    promedioMensual = totalGastos / numMeses;
  }
  console.log('[Nueva Lógica] Promedio Mensual (GS):', promedioMensual);

  // 5. Calcular Gastos por Categoría
  const categoriaMap = new Map<string, number>();
  gastosNormalizados.forEach(g => {
    const nombreCat = g.categoria?.nombre || 'Sin Categoría';
    categoriaMap.set(nombreCat, (categoriaMap.get(nombreCat) || 0) + g.montoEnGs);
  });
  const gastosPorCategoria: GastosPorCategoria[] = Array.from(categoriaMap.entries())
    .map(([nombre, monto], index) => ({ nombre, monto: ensureNumber(monto), color: COLORS[index % COLORS.length] }))
    .sort((a, b) => b.monto - a.monto);

  // 6. Calcular Gastos por Sucursal
  const sucursalMap = new Map<string, number>();
  gastosNormalizados.forEach(g => {
    const nombreSuc = g.sucursal?.nombre || 'Sin Sucursal';
    sucursalMap.set(nombreSuc, (sucursalMap.get(nombreSuc) || 0) + g.montoEnGs);
  });
  const gastosPorSucursal: GastosPorSucursal[] = Array.from(sucursalMap.entries())
    .map(([nombre, monto], index) => ({ nombre, monto: ensureNumber(monto), color: COLORS[index % COLORS.length] }))
    .sort((a, b) => b.monto - a.monto);

  // 7. Calcular Evolución de Gastos por Tiempo (agrupados por día)
  const gastosPorDiaMap = new Map<string, number>();
  gastosNormalizados.forEach(g => {
    const fechaKey = format(g.fechaObj, 'yyyy-MM-dd'); // Usar fechaObj que es un objeto Date
    gastosPorDiaMap.set(fechaKey, (gastosPorDiaMap.get(fechaKey) || 0) + g.montoEnGs);
  });
  const gastosPorTiempo: GastosPorTiempo[] = Array.from(gastosPorDiaMap.entries())
    .map(([fechaISO, monto]) => ({ fecha: format(new Date(fechaISO), 'dd/MM/yyyy'), monto: ensureNumber(monto) }))
    .sort((a, b) => {
      const dateA = new Date(a.fecha.split('/').reverse().join('-'));
      const dateB = new Date(b.fecha.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

  // 8. Calcular Tendencia (simplificado: compara primera mitad del período con la segunda)
  let tendencia: 'up' | 'down' | 'neutral' = 'neutral';
  let porcentajeCambio = 0;
  if (gastosPorTiempo.length >= 2) {
    const mitadPeriodoIndex = Math.floor(gastosPorTiempo.length / 2);
    
    const sumaPrimeraMitad = gastosPorTiempo.slice(0, mitadPeriodoIndex).reduce((sum, item) => sum + item.monto, 0);
    const sumaSegundaMitad = gastosPorTiempo.slice(mitadPeriodoIndex).reduce((sum, item) => sum + item.monto, 0);

    const numItemsPrimeraMitad = Math.max(1, mitadPeriodoIndex);
    const numItemsSegundaMitad = Math.max(1, gastosPorTiempo.length - mitadPeriodoIndex);

    const promedioPrimeraMitad = sumaPrimeraMitad / numItemsPrimeraMitad;
    const promedioSegundaMitad = sumaSegundaMitad / numItemsSegundaMitad;

    if (promedioPrimeraMitad > 0) {
      porcentajeCambio = Math.round(((promedioSegundaMitad - promedioPrimeraMitad) / promedioPrimeraMitad) * 100);
      if (porcentajeCambio > 5) tendencia = 'up';
      else if (porcentajeCambio < -5) tendencia = 'down';
    } else if (promedioSegundaMitad > 0) { 
      tendencia = 'up';
      porcentajeCambio = 100; 
    }
  }
  // console.log('[Nueva Lógica] Tendencia:', tendencia, 'Porcentaje Cambio:', porcentajeCambio);

  const estadisticasResumen: EstadisticasResumen = {
    totalGastos: ensureNumber(totalGastos),
    promedioMensual: ensureNumber(promedioMensual),
    gastoMasAlto: ensureNumber(gastoMasAlto),
    categoriaMaxGasto,
    tendencia,
    porcentajeCambio: ensureNumber(porcentajeCambio),
  };
  
  // console.log('[Nueva Lógica] Resumen de estadísticas:', estadisticasResumen);

  return {
    gastosPorCategoria,
    gastosPorSucursal,
    gastosPorTiempo,
    estadisticasResumen,
  };
};

const GestionGastos: React.FC = () => {
  // Estados
  const [tabActual, setTabActual] = useState(0);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gasto, setGasto] = useState(gastoInicial);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState<Subcategoria[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<'crear' | 'editar'>('crear');
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [gastoIdToDelete, setGastoIdToDelete] = useState<number | null>(null);
  
  const [filtros, setFiltros] = useState<FiltrosGastos>({
    fechaDesde: null,
    fechaHasta: null,
    categoriaId: '',
    subcategoriaId: '',
    sucursalId: '',
    moneda: ''
  });
  
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [formErrors, setFormErrors] = useState({
    descripcion: false,
    monto: false,
    categoriaId: false
  });

  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para totales por moneda
  const [totales, setTotales] = useState<{
    guaranies: number;
    dolares: number;
    reales: number;
  }>({
    guaranies: 0,
    dolares: 0,
    reales: 0
  });
  
  // Estado para saber si hay filtros aplicados
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);

  // Estados para estadísticas
  const [periodoEstadisticas, setPeriodoEstadisticas] = useState<'mes' | 'trimestre' | 'anio' | 'personalizado'>('mes');
  const [fechaInicioEstadisticas, setFechaInicioEstadisticas] = useState<Date | null>(startOfMonth(new Date()));
  const [fechaFinEstadisticas, setFechaFinEstadisticas] = useState<Date | null>(endOfMonth(new Date()));
  const [estadisticasFiltradas, setEstadisticasFiltradas] = useState<Gasto[]>([]);
  const [datosEstadisticas, setDatosEstadisticas] = useState<any>({
    gastosPorCategoria: [],
    gastosPorSucursal: [],
    gastosPorTiempo: [],
    estadisticasResumen: {
      totalGastos: 0,
      promedioMensual: 0,
      gastoMasAlto: 0,
      categoriaMaxGasto: '',
      tendencia: 'neutral',
      porcentajeCambio: 0
    }
  });
  
  // Estado para las cotizaciones
  const [cotizaciones, setCotizaciones] = useState({ dolar: 7200, real: 1400 });
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);

  // Función para abrir el comprobante en una nueva ventana
  const handleViewComprobante = (comprobanteUrl: string | null) => {
    if (!comprobanteUrl) return;
    
    // Si el comprobanteUrl es un File (nueva carga), crear una URL temporal para visualizarlo
    if (gasto.comprobante instanceof File) {
      // Es un archivo recién cargado, crear una URL de objeto para visualizar
      const tempUrl = URL.createObjectURL(gasto.comprobante);
      window.open(tempUrl, '_blank');
      return;
    }
    
    // Es un archivo ya guardado, extraer nombre y usar ruta al servidor
    const nombreArchivo = comprobanteUrl.split('/').pop();
    window.open(`http://localhost:3000/uploads/comprobantes/${nombreArchivo}`, '_blank');
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarCategorias();
    cargarSubcategorias();
    cargarSucursales();
    cargarGastos();
    cargarCotizaciones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para filtrar subcategorías según la categoría seleccionada
  useEffect(() => {
    if (gasto.categoriaId) {
      const subsFiltradas = subcategorias.filter(
        (sub) => sub.categoriaId === parseInt(gasto.categoriaId as string) && sub.activo
      );
      setSubcategoriasFiltradas(subsFiltradas);
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [gasto.categoriaId, subcategorias]);

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const response = await axios.get('/api/categorias-gastos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategorias(response.data.filter((cat: Categoria) => cat.activo));
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setErrorMsg('Error al cargar categorías');
    }
  };

  // Cargar subcategorías
  const cargarSubcategorias = async () => {
    try {
      const response = await axios.get('/api/subcategorias-gastos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubcategorias(response.data.filter((sub: Subcategoria) => sub.activo));
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
      setErrorMsg('Error al cargar subcategorías');
    }
  };

  // Cargar sucursales
  const cargarSucursales = async () => {
    try {
      const response = await axios.get('/api/sucursales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSucursales(response.data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      setErrorMsg('Error al cargar sucursales');
    }
  };

  // Cargar gastos con filtros
  const cargarGastos = async () => {
    setLoading(true);
    try {
      let url = '/api/gastos?';
      
      // Añadir filtros a la URL
      if (filtros.fechaDesde) {
        // Mantener la fecha desde a las 00:00:00
        const fechaDesde = new Date(filtros.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        url += `fechaDesde=${fechaDesde.toISOString()}&`;
      }
      if (filtros.fechaHasta) {
        // Establecer la fecha hasta a las 23:59:59 para incluir todo el día
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        url += `fechaHasta=${fechaHasta.toISOString()}&`;
      }
      if (filtros.categoriaId) {
        url += `categoriaId=${filtros.categoriaId}&`;
      }
      if (filtros.subcategoriaId) {
        url += `subcategoriaId=${filtros.subcategoriaId}&`;
      }
      if (filtros.sucursalId) {
        url += `sucursalId=${filtros.sucursalId}&`;
      }
      if (filtros.moneda) {
        url += `moneda=${filtros.moneda}&`;
      }
      
      console.log("URL de filtros: ", url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGastos(response.data);
      
      // Calcular totales por moneda
      calcularTotales(response.data);
      
      // Resetear paginación al aplicar nuevos filtros
      setPage(0);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      setErrorMsg('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales por moneda
  const calcularTotales = (gastosList: Gasto[]) => {
    const nuevosTotales = {
      guaranies: 0,
      dolares: 0,
      reales: 0
    };
    
    gastosList.forEach(gasto => {
      if (gasto.moneda === 'GS') {
        // Asegurarse de que el monto sea un número
        const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto;
        nuevosTotales.guaranies += monto;
      } else if (gasto.moneda === 'USD') {
        const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto;
        nuevosTotales.dolares += monto;
      } else if (gasto.moneda === 'BRL') {
        const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto;
        nuevosTotales.reales += monto;
      }
    });
    
    console.log("Totales calculados:", nuevosTotales);
    setTotales(nuevosTotales);
  };
  
  // Manejadores para paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar cambio de tab
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabActual(newValue);
  };

  // Manejar cambio en los filtros
  const handleChangeFiltro = (campo: keyof FiltrosGastos, valor: any) => {
    setFiltros({
      ...filtros,
      [campo]: valor
    });
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setFiltrosAplicados(true);
    cargarGastos();
  };

  // Restablecer filtros
  const restablecerFiltros = () => {
    setFiltros({
      fechaDesde: null,
      fechaHasta: null,
      categoriaId: '',
      subcategoriaId: '',
      sucursalId: '',
      moneda: ''
    });
    setFiltrosAplicados(false);
    setTotales({ guaranies: 0, dolares: 0, reales: 0 });
  };

  // Manejar cambio en formulario de gasto
  const handleChangeGasto = (campo: string, valor: any) => {
    // Si el campo es el categoriaId, reset subcategoriaId
    if (campo === 'categoriaId') {
      setGasto({
        ...gasto,
        [campo]: valor,
        subcategoriaId: ''
      });
    } else if (typeof valor === 'string' && campo !== 'monto') {
      // Convertir a mayúsculas todos los campos de texto excepto monto
      setGasto({
        ...gasto,
        [campo]: valor.toUpperCase()
      });
    } else {
      setGasto({
        ...gasto,
        [campo]: valor
      });
    }
    
    // Reset errors
    if (campo in formErrors) {
      setFormErrors({
        ...formErrors,
        [campo]: false
      });
    }
  };

  // Manejar subida de comprobante
  const handleComprobanteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setGasto({
        ...gasto,
        comprobante: file
      });
      
      // Crear URL para previsualización
      const fileUrl = URL.createObjectURL(file);
      setComprobantePreview(fileUrl);
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    let formValido = true;
    const errors = {
      descripcion: false,
      monto: false,
      categoriaId: false
    };
    
    if (!gasto.descripcion.trim()) {
      errors.descripcion = true;
      formValido = false;
    }
    
    if (!gasto.monto || parseFloat(gasto.monto as string) <= 0) {
      errors.monto = true;
      formValido = false;
    }
    
    if (!gasto.categoriaId) {
      errors.categoriaId = true;
      formValido = false;
    }
    
    setFormErrors(errors);
    return formValido;
  };

  // Abrir diálogo para crear gasto
  const abrirDialogoCrear = () => {
    setGasto(gastoInicial);
    setComprobantePreview(null);
    setDialogAction('crear');
    setOpenDialog(true);
  };

  // Abrir diálogo para editar gasto
  const abrirDialogoEditar = (gastoToEdit: Gasto) => {
    // Ajustar el monto según la moneda
    let montoAjustado = gastoToEdit.monto.toString();
    
    // Para BRL y USD, multiplicar por 100 para mostrar correctamente en el formulario
    if (gastoToEdit.moneda === 'BRL' || gastoToEdit.moneda === 'USD') {
      montoAjustado = (gastoToEdit.monto * 100).toString();
      console.log(`Editando gasto en ${gastoToEdit.moneda} - Monto original: ${gastoToEdit.monto}, Monto ajustado: ${montoAjustado}`);
    }
    
    const gastoEditado = {
      fecha: new Date(gastoToEdit.fecha),
      descripcion: gastoToEdit.descripcion,
      monto: montoAjustado,
      moneda: gastoToEdit.moneda,
      categoriaId: gastoToEdit.categoriaId.toString(),
      subcategoriaId: gastoToEdit.subcategoriaId ? gastoToEdit.subcategoriaId.toString() : '',
      sucursalId: gastoToEdit.sucursalId ? gastoToEdit.sucursalId.toString() : '',
      observaciones: gastoToEdit.observaciones || '',
      comprobante: null as File | null,
      id: gastoToEdit.id
    };
    
    setGasto(gastoEditado);
    setComprobantePreview(gastoToEdit.comprobante);
    setDialogAction('editar');
    setOpenDialog(true);
  };

  // Confirmar eliminar gasto
  const confirmarEliminarGasto = (id: number) => {
    setGastoIdToDelete(id);
    setConfirmDeleteDialog(true);
  };

  // Guardar gasto (crear o editar)
  const guardarGasto = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Añadir todos los campos al formData
      formData.append('fecha', (gasto.fecha as Date).toISOString());
      formData.append('descripcion', gasto.descripcion);
      
      // Corregir el valor del monto según la moneda
      let valorMonto = gasto.monto as string;
      // Para BRL, debemos asegurarnos que el valor es correcto (sin multiplicar por 100)
      if (gasto.moneda === 'BRL') {
        // Convertir el valor a formato numérico estándar con punto decimal
        const numericValue = valorMonto.replace(/\D/g, '');
        const floatValue = parseFloat(numericValue) / 100;
        valorMonto = floatValue.toString();
        console.log(`Moneda BRL - Valor original: ${gasto.monto}, Valor numérico: ${numericValue}, Valor corregido: ${valorMonto}`);
      } else if (gasto.moneda === 'USD') {
        // Hacer lo mismo para USD
        const numericValue = valorMonto.replace(/\D/g, '');
        const floatValue = parseFloat(numericValue) / 100;
        valorMonto = floatValue.toString();
        console.log(`Moneda USD - Valor original: ${gasto.monto}, Valor numérico: ${numericValue}, Valor corregido: ${valorMonto}`);
      }
      
      formData.append('monto', valorMonto);
      formData.append('moneda', gasto.moneda);
      formData.append('categoriaId', gasto.categoriaId as string);
      
      if (gasto.subcategoriaId) {
        formData.append('subcategoriaId', gasto.subcategoriaId as string);
      }
      
      if (gasto.sucursalId) {
        formData.append('sucursalId', gasto.sucursalId as string);
      }
      
      if (gasto.observaciones) {
        formData.append('observaciones', gasto.observaciones);
      }
      
      if (gasto.comprobante) {
        formData.append('comprobante', gasto.comprobante);
      }
      
      if (dialogAction === 'crear') {
        await axios.post('/api/gastos', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccessMsg('Gasto creado correctamente');
      } else {
        // Editar (PUT)
        await axios.put(`/api/gastos/${(gasto as any).id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccessMsg('Gasto actualizado correctamente');
      }
      
      setOpenDialog(false);
      cargarGastos(); // Recargar lista de gastos
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      setErrorMsg('Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar gasto
  const eliminarGasto = async () => {
    if (!gastoIdToDelete) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/gastos/${gastoIdToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMsg('Gasto eliminado correctamente');
      setConfirmDeleteDialog(false);
      cargarGastos(); // Recargar lista de gastos
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      setErrorMsg('Error al eliminar el gasto');
    } finally {
      setLoading(false);
      setGastoIdToDelete(null);
    }
  };

  // Formatear monto para mostrar en la tabla
  const formatearMonto = (monto: number, moneda: string) => {
    if (!isFinite(monto) || isNaN(monto)) {
      return '0';
    }

    if (moneda === 'GS') {
      // Formato con punto como separador de miles para guaraníes (ej: 1.000)
      return monto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else if (moneda === 'BRL') {
      // Formato brasileño: punto como separador de miles y coma para decimales (ej: 1.234,56)
      return new Intl.NumberFormat('pt-BR', { 
        style: 'decimal',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      }).format(monto);
    } else if (moneda === 'USD') {
      // Formato estadounidense: coma como separador de miles y punto para decimales (ej: 1,234.56)
      return new Intl.NumberFormat('en-US', { 
        style: 'decimal',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      }).format(monto);
    } else {
      return new Intl.NumberFormat('es-PY', { 
        style: 'decimal',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      }).format(monto);
    }
  };

  // Manejar la navegación con tecla Enter
  const handleKeyDown = (event: React.KeyboardEvent, nextFieldId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        nextField.focus();
      }
    }
  };

  // Formatear el monto para mostrar en el input
  const formatMontoForDisplay = (value: string) => {
    if (!value) return '';
    
    // Si la moneda es guaraníes, formatear con puntos para los miles
    if (gasto.moneda === 'GS') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') return '';
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else if (gasto.moneda === 'BRL') {
      // Para reales brasileños, formato más directo
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
    } else if (gasto.moneda === 'USD') {
      // Para dólares americanos, formato directo
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

  // Manejar cambio en el campo de monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Eliminar todos los caracteres no numéricos
    const numericValue = inputValue.replace(/\D/g, '');
    
    // Actualizar el estado con solo el valor numérico
    handleChangeGasto('monto', numericValue);
  };

  // Manejar cambio en Autocomplete de categoría
  const handleCategoriaChange = (_event: React.SyntheticEvent, newValue: Categoria | null) => {
    handleChangeGasto('categoriaId', newValue ? newValue.id.toString() : '');
  };

  // Manejar cambio en Autocomplete de subcategoría
  const handleSubcategoriaChange = (_event: React.SyntheticEvent, newValue: Subcategoria | null) => {
    handleChangeGasto('subcategoriaId', newValue ? newValue.id.toString() : '');
  };

  // Manejar cambio en Autocomplete de sucursal
  const handleSucursalChange = (_event: React.SyntheticEvent, newValue: Sucursal | null) => {
    handleChangeGasto('sucursalId', newValue ? newValue.id.toString() : '');
  };

  // Cargar cotizaciones vigentes
  const cargarCotizaciones = async () => {
    setLoadingCotizaciones(true);
    try {
      const response = await cotizacionService.getCotizaciones();
      
      // Buscar la cotización vigente
      const cotizacionVigente = response.find(cot => cot.vigente);
      
      if (cotizacionVigente) {
        setCotizaciones({
          dolar: cotizacionVigente.valorDolar,
          real: cotizacionVigente.valorReal
        });
        console.log('Cotizaciones cargadas:', cotizacionVigente);
      } else if (response.length > 0) {
        // Si no hay vigente, usar la más reciente
        setCotizaciones({
          dolar: response[0].valorDolar,
          real: response[0].valorReal
        });
        console.log('No hay cotización vigente, usando la más reciente:', response[0]);
      }
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      // Mantener valores por defecto si hay error
    } finally {
      setLoadingCotizaciones(false);
    }
  };

  // Efecto para actualizar estadísticas cuando cambia el período o se cargan gastos
  useEffect(() => {
    if (gastos.length > 0 && !loadingCotizaciones) {
      const gastosFiltrados = gastos.filter(gasto => {
        const fechaGasto = new Date(gasto.fecha);
        if (fechaInicioEstadisticas && fechaFinEstadisticas) {
          return isWithinInterval(fechaGasto, {
            start: fechaInicioEstadisticas,
            end: fechaFinEstadisticas
          });
        }
        return true;
      });
      
      setEstadisticasFiltradas(gastosFiltrados);
      
      // Generar estadísticas con la nueva lógica
      if (cotizaciones.dolar > 0 && cotizaciones.real > 0) {
         const datos = generarDatosEstadisticasNueva(gastosFiltrados, cotizaciones);
         setDatosEstadisticas(datos);
      } else {
        console.warn("[Nueva Lógica] Cotizaciones no válidas o no cargadas, estadísticas no generadas.");
        setDatosEstadisticas({
            gastosPorCategoria: [],
            gastosPorSucursal: [],
            gastosPorTiempo: [],
            estadisticasResumen: {
              totalGastos: 0,
              promedioMensual: 0,
              gastoMasAlto: 0,
              categoriaMaxGasto: 'N/A',
              tendencia: 'neutral' as 'up' | 'down' | 'neutral',
              porcentajeCambio: 0,
            }
        });
      }
    } else if (gastos.length === 0 && !loadingCotizaciones) { // También resetear si no hay gastos y cotizaciones cargadas
         setEstadisticasFiltradas([]);
         setDatosEstadisticas({
            gastosPorCategoria: [],
            gastosPorSucursal: [],
            gastosPorTiempo: [],
            estadisticasResumen: {
              totalGastos: 0,
              promedioMensual: 0,
              gastoMasAlto: 0,
              categoriaMaxGasto: 'N/A',
              tendencia: 'neutral' as 'up' | 'down' | 'neutral',
              porcentajeCambio: 0,
            }
        });
    }
  }, [gastos, periodoEstadisticas, fechaInicioEstadisticas, fechaFinEstadisticas, cotizaciones, loadingCotizaciones]);
  
  // Función para cambiar el período de estadísticas
  const cambiarPeriodoEstadisticas = (periodo: 'mes' | 'trimestre' | 'anio' | 'personalizado') => {
    setPeriodoEstadisticas(periodo);
    
    const hoy = new Date();
    
    switch (periodo) {
      case 'mes':
        setFechaInicioEstadisticas(startOfMonth(hoy));
        setFechaFinEstadisticas(endOfMonth(hoy));
        break;
      case 'trimestre':
        setFechaInicioEstadisticas(sub(hoy, { months: 3 }));
        setFechaFinEstadisticas(hoy);
        break;
      case 'anio':
        setFechaInicioEstadisticas(startOfYear(hoy));
        setFechaFinEstadisticas(endOfYear(hoy));
        break;
      case 'personalizado':
        // Mantener fechas actuales para personalizado
        break;
    }
  };

  // Tema MUI para colores
  const theme = useTheme();

  const formatoGuaranies = (valor: number) => {
    // Verificar si es un número válido
    if (!isFinite(valor) || isNaN(valor)) return 'Gs. 0';
    
    // Redondear a enteros para guaraníes
    const valorRedondeado = Math.round(valor);
    
    try {
      // Intentar usar toLocaleString para evitar notación científica
      return `Gs. ${valorRedondeado.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
    } catch (error) {
      // Si falla, usar un método alternativo
      // console.log('Error formateando número:', error); // Se puede descomentar si hay problemas con toLocaleString
      return `Gs. ${valorRedondeado.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ width: '100%' }}>
        {/* Aplicar estilos globales de scrollbar */}
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
        
        <Typography variant="h5" gutterBottom>
          Gestión de Gastos
        </Typography>
        
        <Paper sx={{ p: 2, mb: 2 }}>
          <Tabs 
            value={tabActual} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Listado de Gastos" />
            <Tab label="Estadísticas" />
          </Tabs>
          
          {tabActual === 0 && (
            <Box>
              {/* Filtros */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Filtros
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="Fecha desde"
                      value={filtros.fechaDesde}
                      onChange={(date) => handleChangeFiltro('fechaDesde', date)}
                      format="dd/MM/yyyy"
                      slotProps={{ textField: { variant: 'outlined', fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="Fecha hasta"
                      value={filtros.fechaHasta}
                      onChange={(date) => handleChangeFiltro('fechaHasta', date)}
                      format="dd/MM/yyyy"
                      slotProps={{ textField: { variant: 'outlined', fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={filtros.categoriaId}
                        onChange={(e) => handleChangeFiltro('categoriaId', e.target.value)}
                        label="Categoría"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {categorias.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id.toString()}>
                            {cat.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Moneda</InputLabel>
                      <Select
                        value={filtros.moneda}
                        onChange={(e) => handleChangeFiltro('moneda', e.target.value)}
                        label="Moneda"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="GS">Guaraníes</MenuItem>
                        <MenuItem value="USD">Dólares</MenuItem>
                        <MenuItem value="BRL">Reales</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Subcategoría</InputLabel>
                      <Select
                        value={filtros.subcategoriaId}
                        onChange={(e) => handleChangeFiltro('subcategoriaId', e.target.value)}
                        label="Subcategoría"
                        disabled={!filtros.categoriaId}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {subcategorias
                          .filter((sub) => 
                            !filtros.categoriaId || sub.categoriaId === parseInt(filtros.categoriaId)
                          )
                          .map((sub) => (
                            <MenuItem key={sub.id} value={sub.id.toString()}>
                              {sub.nombre}
                            </MenuItem>
                          ))
                        }
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sucursal</InputLabel>
                      <Select
                        value={filtros.sucursalId}
                        onChange={(e) => handleChangeFiltro('sucursalId', e.target.value)}
                        label="Sucursal"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {sucursales.map((suc) => (
                          <MenuItem key={suc.id} value={suc.id.toString()}>
                            {suc.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={restablecerFiltros}
                      sx={{ mr: 1 }}
                    >
                      Restablecer
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<SearchIcon />}
                      onClick={aplicarFiltros}
                    >
                      Buscar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Mostrar totales */}
              {filtrosAplicados && gastos.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {totales.guaranies > 0 && (
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Total Guaraníes (GS)
                          </Typography>
                          <Typography variant="h6" component="div">
                            {formatearMonto(totales.guaranies, 'GS')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {totales.dolares > 0 && (
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Total Dólares (USD)
                          </Typography>
                          <Typography variant="h6" component="div">
                            {formatearMonto(totales.dolares, 'USD')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {totales.reales > 0 && (
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Total Reales (BRL)
                          </Typography>
                          <Typography variant="h6" component="div">
                            {formatearMonto(totales.reales, 'BRL')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}
              
              {/* Botón para agregar nuevo gasto */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={abrirDialogoCrear}
                >
                  Nuevo Gasto
                </Button>
              </Box>
            </Box>
          )}
          
          {tabActual === 0 && (
            <Box>
              {/* Tabla de gastos */}
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Subcategoría</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress size={24} sx={{ my: 2 }} />
                        </TableCell>
                      </TableRow>
                    ) : gastos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay gastos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Aplicar paginación a los datos
                      gastos
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((gasto) => (
                          <TableRow key={gasto.id}>
                            <TableCell>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{gasto.descripcion}</TableCell>
                            <TableCell>
                              {gasto.moneda === 'GS' ? 'Gs.' : gasto.moneda === 'USD' ? 'US$' : 'R$'} {formatearMonto(gasto.monto, gasto.moneda)}
                            </TableCell>
                            <TableCell>{gasto.categoria.nombre}</TableCell>
                            <TableCell>{gasto.subcategoria ? gasto.subcategoria.nombre : '-'}</TableCell>
                            <TableCell>{gasto.sucursal ? gasto.sucursal.nombre : '-'}</TableCell>
                            <TableCell>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => abrirDialogoEditar(gasto)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton size="small" color="error" onClick={() => confirmarEliminarGasto(gasto.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {gasto.comprobante && (
                                <Tooltip title="Ver comprobante">
                                  <IconButton 
                                    size="small" 
                                    color="info"
                                    onClick={() => handleViewComprobante(gasto.comprobante)}
                                  >
                                    <DescriptionIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Componente de paginación */}
                {gastos.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={gastos.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  />
                )}
              </TableContainer>
            </Box>
          )}
          
          {tabActual === 1 && (
            <Box>
              {/* Panel de Estadísticas */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      Estadísticas de Gastos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cotizaciones: 1 USD = Gs. {cotizaciones.dolar.toLocaleString()} | 1 BRL = Gs. {cotizaciones.real.toLocaleString()}
                      {loadingCotizaciones && <CircularProgress size={12} sx={{ ml: 1 }} />}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <ButtonGroup variant="outlined" size="small">
                      <Button 
                        onClick={() => cambiarPeriodoEstadisticas('mes')}
                        variant={periodoEstadisticas === 'mes' ? 'contained' : 'outlined'}
                      >
                        Mes
                      </Button>
                      <Button 
                        onClick={() => cambiarPeriodoEstadisticas('trimestre')}
                        variant={periodoEstadisticas === 'trimestre' ? 'contained' : 'outlined'}
                      >
                        Trimestre
                      </Button>
                      <Button 
                        onClick={() => cambiarPeriodoEstadisticas('anio')}
                        variant={periodoEstadisticas === 'anio' ? 'contained' : 'outlined'}
                      >
                        Año
                      </Button>
                      <Button 
                        onClick={() => cambiarPeriodoEstadisticas('personalizado')}
                        variant={periodoEstadisticas === 'personalizado' ? 'contained' : 'outlined'}
                      >
                        Personalizado
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  
                  {periodoEstadisticas === 'personalizado' && (
                    <Grid item xs={12} container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="Fecha inicio"
                          value={fechaInicioEstadisticas}
                          onChange={(date) => setFechaInicioEstadisticas(date)}
                          format="dd/MM/yyyy"
                          slotProps={{ textField: { variant: 'outlined', fullWidth: true, size: 'small' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="Fecha fin"
                          value={fechaFinEstadisticas}
                          onChange={(date) => setFechaFinEstadisticas(date)}
                          format="dd/MM/yyyy"
                          slotProps={{ textField: { variant: 'outlined', fullWidth: true, size: 'small' } }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
                
                {/* Chip con período seleccionado */}
                <Box sx={{ mt: 1, mb: 3, display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Período: {fechaInicioEstadisticas && fechaFinEstadisticas ? 
                      `${format(fechaInicioEstadisticas, 'dd/MM/yyyy')} - ${format(fechaFinEstadisticas, 'dd/MM/yyyy')}` : 
                      'Todos los registros'}
                  </Typography>
                  <Chip 
                    label={`${estadisticasFiltradas.length} registros`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </Box>
              
              {/* Tarjetas de resumen */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Gastos
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalAtmIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h5" component="div">
                          {formatoGuaranies(datosEstadisticas.estadisticasResumen.totalGastos)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Promedio Mensual
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="h5" component="div">
                          {formatoGuaranies(datosEstadisticas.estadisticasResumen.promedioMensual)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Mayor Gasto
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon sx={{ mr: 1, color: 'error.main' }} />
                        <Typography variant="h5" component="div">
                          {formatoGuaranies(datosEstadisticas.estadisticasResumen.gastoMasAlto)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {datosEstadisticas.estadisticasResumen.categoriaMaxGasto}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Tendencia
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {datosEstadisticas.estadisticasResumen.tendencia === 'up' ? (
                          <TrendingUpIcon sx={{ mr: 1, color: 'error.main' }} />
                        ) : datosEstadisticas.estadisticasResumen.tendencia === 'down' ? (
                          <TrendingDownIcon sx={{ mr: 1, color: 'success.main' }} />
                        ) : (
                          <TimelineIcon sx={{ mr: 1, color: 'text.secondary' }} /> // Icono neutral
                        )}
                        <Typography variant="h5" component="div" color={
                          datosEstadisticas.estadisticasResumen.tendencia === 'up' ? 'error.main' :
                          datosEstadisticas.estadisticasResumen.tendencia === 'down' ? 'success.main' :
                          'text.secondary'
                        }>
                          {datosEstadisticas.estadisticasResumen.porcentajeCambio}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Respecto al período anterior
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Gráficos principales */}
              <Grid container spacing={3}>
                {/* Gráfico de gastos por tiempo */}
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                          Evolución de Gastos
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={datosEstadisticas.gastosPorTiempo}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" />
                            <YAxis />
                            <RechartsTooltip 
                              formatter={(value: number) => formatoGuaranies(value)}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="monto" 
                              stroke={theme.palette.primary.main}
                              fill={theme.palette.primary.light}
                              name="Gasto"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Gráfico de pastel por categorías */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DonutLargeIcon sx={{ mr: 1, color: 'secondary.main' }} />
                        <Typography variant="h6">
                          Gastos por Categoría
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={datosEstadisticas.gastosPorCategoria}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="monto"
                              nameKey="nombre"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {datosEstadisticas.gastosPorCategoria.map((entry: GastosPorCategoria, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) => formatoGuaranies(value)}
                            />
                            <Legend layout="vertical" verticalAlign="bottom" align="center" />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Gráfico de barras por sucursal */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BusinessIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="h6">
                          Gastos por Sucursal
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={datosEstadisticas.gastosPorSucursal}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="nombre" 
                              type="category" 
                              tick={{ fontSize: 12 }}
                              width={130}
                            />
                            <RechartsTooltip
                              formatter={(value: number) => formatoGuaranies(value)}
                              labelFormatter={(label) => `Sucursal: ${label}`}
                            />
                            <Bar 
                              dataKey="monto" 
                              name="Monto"
                              radius={[0, 4, 4, 0]}
                            >
                              {datosEstadisticas.gastosPorSucursal.map((entry: GastosPorSucursal, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Top 5 gastos más grandes */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BarChartIcon sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="h6">
                          Top Gastos por Categoría
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={datosEstadisticas.gastosPorCategoria.slice(0, 5)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <RechartsTooltip
                              formatter={(value: number) => formatoGuaranies(value)}
                              labelFormatter={(label) => `Categoría: ${label}`}
                            />
                            <Bar 
                              dataKey="monto" 
                              name="Monto"
                              radius={[4, 4, 0, 0]}
                            >
                              {datosEstadisticas.gastosPorCategoria.slice(0, 5).map((entry: GastosPorCategoria, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
        
        {/* Diálogo para crear/editar gasto */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {dialogAction === 'crear' ? 'Nuevo Gasto' : 'Editar Gasto'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha"
                  value={gasto.fecha}
                  onChange={(date) => handleChangeGasto('fecha', date)}
                  format="dd/MM/yyyy"
                  slotProps={{ 
                    textField: { 
                      variant: 'outlined', 
                      fullWidth: true,
                      id: "fecha",
                      onKeyDown: (e) => handleKeyDown(e, 'descripcion')
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={gasto.moneda}
                    onChange={(e) => handleChangeGasto('moneda', e.target.value)}
                    label="Moneda"
                    id="moneda"
                    onKeyDown={(e) => handleKeyDown(e, 'monto')}
                  >
                    <MenuItem value="GS">Guaraníes (GS)</MenuItem>
                    <MenuItem value="USD">Dólares (USD)</MenuItem>
                    <MenuItem value="BRL">Reales (BRL)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  value={gasto.descripcion}
                  onChange={(e) => handleChangeGasto('descripcion', e.target.value)}
                  fullWidth
                  error={formErrors.descripcion}
                  helperText={formErrors.descripcion ? 'La descripción es requerida' : ''}
                  id="descripcion"
                  onKeyDown={(e) => handleKeyDown(e, 'moneda')}
                  onFocus={(e) => e.target.select()}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label={`Monto (${gasto.moneda})`}
                  value={formatMontoForDisplay(gasto.monto as string)}
                  onChange={handleMontoChange}
                  fullWidth
                  error={formErrors.monto}
                  helperText={formErrors.monto ? 'Ingrese un monto válido' : ''}
                  id="monto"
                  onKeyDown={(e) => handleKeyDown(e, 'categoriaId')}
                  onFocus={(e) => e.target.select()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {gasto.moneda === 'GS' ? 'Gs.' : gasto.moneda === 'USD' ? 'US$' : 'R$'}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="categoriaId"
                  options={categorias}
                  getOptionLabel={(option) => option.nombre}
                  value={categorias.find(cat => cat.id.toString() === gasto.categoriaId) || null}
                  onChange={handleCategoriaChange}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categoría"
                      error={formErrors.categoriaId}
                      helperText={formErrors.categoriaId ? 'Seleccione una categoría' : ''}
                      fullWidth
                      onKeyDown={(e) => handleKeyDown(e, 'subcategoriaId')}
                    />
                  )}
                  noOptionsText="No hay categorías"
                  clearText="Borrar"
                  openText="Abrir"
                  closeText="Cerrar"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="subcategoriaId"
                  options={subcategoriasFiltradas}
                  getOptionLabel={(option) => option.nombre}
                  value={subcategoriasFiltradas.find(sub => sub.id.toString() === gasto.subcategoriaId) || null}
                  onChange={handleSubcategoriaChange}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={!gasto.categoriaId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Subcategoría"
                      fullWidth
                      onKeyDown={(e) => handleKeyDown(e, 'sucursalId')}
                    />
                  )}
                  noOptionsText="No hay subcategorías"
                  clearText="Borrar"
                  openText="Abrir"
                  closeText="Cerrar"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="sucursalId"
                  options={sucursales}
                  getOptionLabel={(option) => option.nombre}
                  value={sucursales.find(suc => suc.id.toString() === gasto.sucursalId) || null}
                  onChange={handleSucursalChange}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Sucursal"
                      fullWidth
                      onKeyDown={(e) => handleKeyDown(e, 'observaciones')}
                    />
                  )}
                  noOptionsText="No hay sucursales"
                  clearText="Borrar"
                  openText="Abrir"
                  closeText="Cerrar"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={gasto.observaciones}
                  onChange={(e) => handleChangeGasto('observaciones', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  id="observaciones"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFileIcon />}
                  >
                    Adjuntar Comprobante
                    <input
                      type="file"
                      hidden
                      onChange={handleComprobanteUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </Button>
                  
                  {(comprobantePreview || gasto.comprobante) && (
                    <Tooltip title="Ver comprobante">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewComprobante(comprobantePreview || (gasto as any).comprobante)}
                        sx={{ ml: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {(comprobantePreview || gasto.comprobante) && (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {gasto.comprobante instanceof File 
                        ? gasto.comprobante.name 
                        : comprobantePreview 
                          ? comprobantePreview.split('/').pop() 
                          : 'Comprobante adjunto'}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button 
              onClick={guardarGasto} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : dialogAction === 'crear' ? 'Crear' : 'Actualizar'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Diálogo de confirmación para eliminar */}
        <Dialog
          open={confirmDeleteDialog}
          onClose={() => setConfirmDeleteDialog(false)}
        >
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteDialog(false)}>Cancelar</Button>
            <Button onClick={eliminarGasto} color="error" autoFocus>
              {loading ? <CircularProgress size={24} /> : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar para mensajes de éxito */}
        <Snackbar 
          open={!!successMsg} 
          autoHideDuration={6000} 
          onClose={() => setSuccessMsg(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSuccessMsg(null)} 
            severity="success" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {successMsg}
          </Alert>
        </Snackbar>
        
        {/* Snackbar para mensajes de error */}
        <Snackbar 
          open={!!errorMsg} 
          autoHideDuration={6000} 
          onClose={() => setErrorMsg(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setErrorMsg(null)} 
            severity="error" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default GestionGastos;
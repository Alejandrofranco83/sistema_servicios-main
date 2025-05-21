import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  ButtonGroup,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  LocalAtm as LocalAtmIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutLargeIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarTodayIcon,
  Business as BusinessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, sub, isWithinInterval } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, 
  AreaChart, Area
} from 'recharts';
import cotizacionService from '../../services/cotizacionService';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

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

// Colores para gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57',
  '#54478C', '#2C699A', '#048BA8', '#0DB39E', '#16DB93',
  '#83E377', '#B9E769', '#EFEA5A', '#F1C453', '#F29E4C'
];

// Función para generar datos de estadísticas a partir de los gastos
const generarDatosEstadisticas = (gastos: Gasto[], cotizaciones: { dolar: number, real: number }) => {
  const { dolar, real } = cotizaciones;
  
  console.log('Generando estadísticas con cotizaciones:', cotizaciones);
  console.log('Gastos originales:', gastos.map(g => ({
    descripcion: g.descripcion,
    moneda: g.moneda,
    monto: g.monto
  })));
  
  // PASO 1: Convertir todos los gastos a guaraníes con valores exactos
  const gastosNormalizados = gastos.map(gasto => {
    let montoEnGs = 0;
    
    if (gasto.moneda === 'GS') {
      montoEnGs = gasto.monto;
    } else if (gasto.moneda === 'USD') {
      montoEnGs = gasto.monto * dolar;
    } else if (gasto.moneda === 'BRL') {
      montoEnGs = gasto.monto * real;
    }
    
    return {
      ...gasto,
      montoNormalizado: montoEnGs
    };
  });
  
  // PASO 2: Calcular el total general
  const totalGastos = gastosNormalizados.reduce((sum, gasto) => {
    return sum + gasto.montoNormalizado;
  }, 0);
  
  console.log('Total calculado:', totalGastos);
  
  // PASO 3: Encontrar el gasto más grande
  let gastoMasAlto = 0;
  let categoriaMaxGasto = '';
  
  if (gastosNormalizados.length > 0) {
    const gastoMaximo = gastosNormalizados.reduce((max, gasto) => 
      gasto.montoNormalizado > max.montoNormalizado ? gasto : max, 
      gastosNormalizados[0]
    );
    
    gastoMasAlto = gastoMaximo.montoNormalizado;
    categoriaMaxGasto = gastoMaximo.categoria.nombre;
  }
  
  // PASO 4: Calcular el promedio mensual
  let promedioMensual = 0;
  
  if (gastosNormalizados.length > 0) {
    // Obtener el rango de fechas para calcular el promedio mensual
    const fechas = gastosNormalizados.map(g => new Date(g.fecha).getTime());
    const fechaMinima = new Date(Math.min(...fechas));
    const fechaMaxima = new Date(Math.max(...fechas));
    
    // Calcular la diferencia en días y convertir a meses
    const diferenciaMs = fechaMaxima.getTime() - fechaMinima.getTime();
    const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24);
    
    // Usar al menos 1 día para evitar división por cero
    const diferenciaMeses = Math.max(diferenciaDias / 30, 1);
    
    // Calcular el promedio
    promedioMensual = totalGastos / diferenciaMeses;
  }
  
  // PASO 5: Calcular gastos por categoría
  const categoriaMap = new Map<string, number>();
  
  gastosNormalizados.forEach(gasto => {
    const nombreCategoria = gasto.categoria.nombre;
    
    if (categoriaMap.has(nombreCategoria)) {
      categoriaMap.set(nombreCategoria, categoriaMap.get(nombreCategoria)! + gasto.montoNormalizado);
    } else {
      categoriaMap.set(nombreCategoria, gasto.montoNormalizado);
    }
  });
  
  const gastosPorCategoria = Array.from(categoriaMap.entries())
    .map(([nombre, monto], index) => ({
      nombre,
      monto,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.monto - a.monto);
  
  // PASO 6: Calcular gastos por sucursal
  const sucursalMap = new Map<string, number>();
  
  gastosNormalizados.forEach(gasto => {
    const nombreSucursal = gasto.sucursal ? gasto.sucursal.nombre : 'Sin sucursal';
    
    if (sucursalMap.has(nombreSucursal)) {
      sucursalMap.set(nombreSucursal, sucursalMap.get(nombreSucursal)! + gasto.montoNormalizado);
    } else {
      sucursalMap.set(nombreSucursal, gasto.montoNormalizado);
    }
  });
  
  const gastosPorSucursal = Array.from(sucursalMap.entries())
    .map(([nombre, monto], index) => ({
      nombre,
      monto,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.monto - a.monto);
  
  // PASO 7: Calcular evolución de gastos por tiempo
  const gastosPorFecha = new Map<string, number>();
  
  gastosNormalizados.forEach(gasto => {
    // Usar solo la fecha sin hora
    const fechaStr = format(new Date(gasto.fecha), 'yyyy-MM-dd');
    
    if (gastosPorFecha.has(fechaStr)) {
      gastosPorFecha.set(fechaStr, gastosPorFecha.get(fechaStr)! + gasto.montoNormalizado);
    } else {
      gastosPorFecha.set(fechaStr, gasto.montoNormalizado);
    }
  });
  
  // Ordenar fechas cronológicamente
  const fechasOrdenadas = Array.from(gastosPorFecha.keys()).sort();
  
  const gastosPorTiempo = fechasOrdenadas.map(fecha => ({
    fecha: format(new Date(fecha), 'dd/MM/yyyy'),
    monto: gastosPorFecha.get(fecha) || 0
  }));
  
  // PASO 8: Calcular tendencia
  let tendencia: 'up' | 'down' | 'neutral' = 'neutral';
  let porcentajeCambio = 0;
  
  if (fechasOrdenadas.length >= 2) {
    // Dividir fechas en dos grupos: primera mitad y segunda mitad
    const mitad = Math.floor(fechasOrdenadas.length / 2);
    const primerasMitad = fechasOrdenadas.slice(0, mitad);
    const segundaMitad = fechasOrdenadas.slice(mitad);
    
    // Calcular sumas para cada mitad
    const sumaPrimeraMitad = primerasMitad.reduce((sum, fecha) => 
      sum + (gastosPorFecha.get(fecha) || 0), 0);
    
    const sumaSegundaMitad = segundaMitad.reduce((sum, fecha) => 
      sum + (gastosPorFecha.get(fecha) || 0), 0);
    
    // Calcular promedio diario para cada mitad
    const promedioPrimeraMitad = sumaPrimeraMitad / primerasMitad.length;
    const promedioSegundaMitad = sumaSegundaMitad / segundaMitad.length;
    
    // Calcular porcentaje de cambio
    if (promedioPrimeraMitad > 0) {
      porcentajeCambio = Math.round(((promedioSegundaMitad - promedioPrimeraMitad) / promedioPrimeraMitad) * 100);
      tendencia = porcentajeCambio > 0 ? 'up' : porcentajeCambio < 0 ? 'down' : 'neutral';
      
      // Limitar valor absoluto del porcentaje para evitar valores extremos
      porcentajeCambio = Math.min(Math.abs(porcentajeCambio), 100);
      if (tendencia === 'down') {
        porcentajeCambio = -porcentajeCambio;
      }
    }
  }
  
  // Imprimir valores calculados para diagnóstico
  console.log('Valores calculados:', {
    totalGastos,
    promedioMensual,
    gastoMasAlto,
    categoriaMaxGasto,
    tendencia,
    porcentajeCambio
  });
  
  const estadisticasResumen: EstadisticasResumen = {
    totalGastos,
    promedioMensual,
    gastoMasAlto,
    categoriaMaxGasto,
    tendencia,
    porcentajeCambio
  };
  
  return {
    gastosPorCategoria,
    gastosPorSucursal,
    gastosPorTiempo,
    estadisticasResumen
  };
};

// Función para formatear números en guaraníes (con punto como separador de miles)
const formatoGuaranies = (valor: number) => {
  // Verificar si es un número válido
  if (!isFinite(valor) || isNaN(valor)) return 'Gs. 0';
  
  // Redondear a enteros para guaraníes
  const valorRedondeado = Math.round(valor);
  
  // Formatear con puntos para separador de miles - usar toLocaleString para evitar notación científica
  return `Gs. ${valorRedondeado.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
};

interface EstadisticasGastosProps {
  gastos: Gasto[];
}

const EstadisticasGastos: React.FC<EstadisticasGastosProps> = ({ gastos }) => {
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
  
  const { token } = useAuth();
  
  // Tema MUI para colores
  const theme = useTheme();
  
  // Cargar cotizaciones vigentes
  useEffect(() => {
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
        // Mantener valores por defecto
      } finally {
        setLoadingCotizaciones(false);
      }
    };
    
    cargarCotizaciones();
  }, []);
  
  // Efecto para actualizar estadísticas cuando cambia el período o se cargan gastos
  useEffect(() => {
    if (gastos.length > 0) {
      // Filtrar gastos según el período seleccionado
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
      
      // Generar estadísticas
      const datos = generarDatosEstadisticas(gastosFiltrados, cotizaciones);
      setDatosEstadisticas(datos);
    }
  }, [gastos, periodoEstadisticas, fechaInicioEstadisticas, fechaFinEstadisticas, cotizaciones]);
  
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
  
  return (
    <Box>
      {/* Panel de Estadísticas */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Estadísticas de Gastos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cotizaciones: 1 USD = Gs. {cotizaciones.dolar.toLocaleString()} | 1 BRL = Gs. {cotizaciones.real.toLocaleString()}
              {loadingCotizaciones && <CircularProgress size={12} sx={{ ml: 1 }} />}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
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
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ wordBreak: 'break-word', fontWeight: 'bold' }}
                >
                  {formatoGuaranies(datosEstadisticas.estadisticasResumen.totalGastos)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {estadisticasFiltradas.length} gastos en el período
              </Typography>
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
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ wordBreak: 'break-word', fontWeight: 'bold' }}
                >
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
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ wordBreak: 'break-word', fontWeight: 'bold' }}
                >
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
                ) : (
                  <TrendingDownIcon sx={{ mr: 1, color: 'success.main' }} />
                )}
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ 
                    color: datosEstadisticas.estadisticasResumen.tendencia === 'up' ? 'error.main' : 'success.main',
                    fontWeight: 'bold'
                  }}
                >
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
        
        {/* Tabla con datos detallados - Top 10 gastos más recientes */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">
                  Últimos Gastos Registrados
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estadisticasFiltradas.slice(0, 10).map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{gasto.descripcion}</TableCell>
                        <TableCell>{gasto.categoria.nombre}</TableCell>
                        <TableCell>{gasto.sucursal ? gasto.sucursal.nombre : '-'}</TableCell>
                        <TableCell align="right">
                          {gasto.moneda === 'GS' ? 'Gs. ' : gasto.moneda === 'USD' ? 'US$ ' : 'R$ '}
                          {gasto.moneda === 'GS' 
                            ? gasto.monto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                            : gasto.moneda === 'USD'
                              ? gasto.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : gasto.monto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                    {estadisticasFiltradas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No hay gastos en el período seleccionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EstadisticasGastos; 
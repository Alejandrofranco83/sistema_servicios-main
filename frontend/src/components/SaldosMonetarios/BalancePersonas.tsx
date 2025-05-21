import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Button,
  ButtonGroup,
  IconButton,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Switch
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TableRowsIcon from '@mui/icons-material/TableRows';
import DateRangeIcon from '@mui/icons-material/DateRange';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { 
  SaldoPersona, 
  UsoDevolucion, 
  obtenerPersonasConSaldo, 
  obtenerMovimientosPersona 
} from '../../services/usoDevolucionService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Interfaz extendida para incluir datos adicionales de persona
interface SaldoPersonaExtendido extends SaldoPersona {
  documento?: string;
}

const formatCurrency = (amount: number, currency: string) => {
  const absAmount = Math.abs(amount);
  
  if (currency === 'PYG' || currency === 'guaranies') {
    return new Intl.NumberFormat('es-PY', { 
      maximumFractionDigits: 0,
      minimumFractionDigits: 0 
    }).format(absAmount) + ' Gs';
  } else if (currency === 'USD' || currency === 'dolares') {
    return '$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absAmount);
  } else if (currency === 'BRL' || currency === 'reales') {
    return 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absAmount);
  } else {
    return absAmount.toString();
  }
};

// --- Lógica de Ordenamiento --- 
type Order = 'asc' | 'desc';

function descendingComparator(a: SaldoPersonaExtendido, b: SaldoPersonaExtendido): number {
  if (a.guaranies !== b.guaranies) return a.guaranies < b.guaranies ? 1 : -1;
  if (a.dolares !== b.dolares) return a.dolares < b.dolares ? 1 : -1;
  if (a.reales !== b.reales) return a.reales < b.reales ? 1 : -1;
  const nameA = a.nombre_completo || a.persona_nombre || '';
  const nameB = b.nombre_completo || b.persona_nombre || '';
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

function getComparator(order: Order): (a: SaldoPersonaExtendido, b: SaldoPersonaExtendido) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b)
    : (a, b) => -descendingComparator(a, b);
}

function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
// --- Fin Lógica de Ordenamiento ---

// --- Tipos para gráficos ---
type PeriodoIntervalo = 'dia' | 'semana' | 'mes' | 'año';
type TipoVisualizacion = 'total' | 'guaranies' | 'dolares' | 'reales';

// Interfaces para datos del gráfico
interface DatoGrafico {
  fecha: string;
  total?: number;
  guaranies?: number;
  dolares?: number;
  reales?: number;
  totalSigno?: number;
  guaraniesSigno?: number;
  dolaresSigno?: number;
  realesSigno?: number;
  [key: string]: any;
}

// Mock de cotizaciones para desarrollo - se reemplazaría por llamada API real
const COTIZACIONES_MOCK = {
  USD: 7300,  // 1 USD = 7300 Gs
  BRL: 1350   // 1 BRL = 1350 Gs
};

const BalancePersonas: React.FC = () => {
  const [personas, setPersonas] = useState<SaldoPersonaExtendido[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [movimientos, setMovimientos] = useState<UsoDevolucion[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<SaldoPersonaExtendido | null>(null);
  const [cargandoPersonas, setCargandoPersonas] = useState<boolean>(true);
  const [errorPersonas, setErrorPersonas] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('desc');
  const [mostrarGrafico, setMostrarGrafico] = useState<boolean>(false);
  const [cargandoMovimientos, setCargandoMovimientos] = useState<boolean>(false);
  const [errorMovimientos, setErrorMovimientos] = useState<string | null>(null);
  const [periodoIntervalo, setPeriodoIntervalo] = useState<PeriodoIntervalo>('mes');
  const [tipoVisualizacion, setTipoVisualizacion] = useState<TipoVisualizacion>('total');
  const [datosGrafico, setDatosGrafico] = useState<DatoGrafico[]>([]);

  useEffect(() => {
    cargarPersonasConSaldo();
  }, []);

  // Memoizar personas filtradas y ordenadas
  const personasFiltradasYOrdenadas = useMemo(() => {
    let personasFiltradas = personas;
    if (busqueda) {
      const terminoBusqueda = busqueda.toLowerCase().trim();
      personasFiltradas = personas.filter(persona => {
        const nombre = (persona.nombre_completo || persona.persona_nombre || '').toLowerCase();
        const documento = (persona.documento || '').toLowerCase();
        return nombre.includes(terminoBusqueda) || documento.includes(terminoBusqueda);
      });
    }
    return stableSort(personasFiltradas, getComparator(order));
  }, [personas, busqueda, order]);

  const cargarPersonasConSaldo = async () => {
    try {
      setCargandoPersonas(true);
      setErrorPersonas(null);
      const data = await obtenerPersonasConSaldo();
      setPersonas(data);
      setCargandoPersonas(false);
    } catch (err) {
      setErrorPersonas('Error al cargar las personas con saldo');
      console.error(err);
      setCargandoPersonas(false);
    }
  };

  const cargarMovimientosPersona = async (personaId: number) => {
    try {
      setCargandoMovimientos(true);
      setErrorMovimientos(null);
      setMostrarGrafico(false);
      const data = await obtenerMovimientosPersona(personaId);
      setMovimientos(data);
      
      // Después de cargar movimientos, calcular datos para el gráfico
      if (data.length > 0) {
        generarDatosGrafico(data, periodoIntervalo, tipoVisualizacion);
      }
      
      setCargandoMovimientos(false);
    } catch (err) {
      setErrorMovimientos('Error al cargar los movimientos de la persona');
      console.error(err);
      setMovimientos([]);
      setCargandoMovimientos(false);
    }
  };

  // Función para generar datos del gráfico basado en los movimientos
  const generarDatosGrafico = (
    movs: UsoDevolucion[], 
    periodo: PeriodoIntervalo, 
    tipoVis: TipoVisualizacion
  ) => {
    if (!movs || movs.length === 0) {
      setDatosGrafico([]);
      return;
    }

    // Ordenar movimientos por fecha (más antiguo primero)
    const movimientosOrdenados = [...movs].sort((a, b) => 
      new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
    );

    // Inicializar acumuladores y mapa de fechas
    let guaraniesAcum = 0;
    let dolaresAcum = 0;
    let realesAcum = 0;
    const fechasMap = new Map<string, DatoGrafico>();
    
    // Determinar formato de fecha según periodo
    const formatoFecha = (fecha: Date): string => {
      switch(periodo) {
        case 'dia':
          return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth()+1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
        case 'semana':
          // Calculamos el inicio de la semana (lunes)
          const diaSemana = fecha.getDay();
          const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Ajuste para que la semana comience el lunes
          const inicioSemana = new Date(fecha);
          inicioSemana.setDate(diff);
          return `Sem ${inicioSemana.getDate().toString().padStart(2, '0')}/${(inicioSemana.getMonth()+1).toString().padStart(2, '0')}`;
        case 'mes':
          return `${(fecha.getMonth()+1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
        case 'año':
          return fecha.getFullYear().toString();
        default:
          return fecha.toLocaleDateString();
      }
    };
    
    // Procesar cada movimiento e ir acumulando saldos
    movimientosOrdenados.forEach(mov => {
      if (mov.anulado) return; // Ignoramos movimientos anulados
      
      const fecha = new Date(mov.fecha_creacion);
      const fechaFormateada = formatoFecha(fecha);
      
      // Actualizar acumuladores según tipo (USO = negativo, DEVOLUCION = positivo)
      const factorSigno = mov.tipo === 'USO' ? -1 : 1;
      guaraniesAcum += mov.guaranies * factorSigno;
      dolaresAcum += mov.dolares * factorSigno;
      realesAcum += mov.reales * factorSigno;
      
      // Calcular total en guaraníes
      const total = guaraniesAcum + 
                   (dolaresAcum * COTIZACIONES_MOCK.USD) + 
                   (realesAcum * COTIZACIONES_MOCK.BRL);
      
      // Guardar en el mapa de fechas (usamos valores absolutos para el gráfico)
      fechasMap.set(fechaFormateada, {
        fecha: fechaFormateada,
        total: Math.abs(total),
        guaranies: Math.abs(guaraniesAcum),
        dolares: Math.abs(dolaresAcum),
        reales: Math.abs(realesAcum),
        // Guardamos también el signo para el tooltip y leyenda
        totalSigno: total,
        guaraniesSigno: guaraniesAcum,
        dolaresSigno: dolaresAcum,
        realesSigno: realesAcum
      });
    });
    
    // Convertir mapa a array ordenado por fecha
    const datosOrdenados = Array.from(fechasMap.values()).sort((a, b) => {
      // Para ordenar fechas correctamente según el formato
      if (periodo === 'dia') {
        const [diaA, mesA, anioA] = a.fecha.split('/').map(Number);
        const [diaB, mesB, anioB] = b.fecha.split('/').map(Number);
        return new Date(anioA, mesA-1, diaA).getTime() - new Date(anioB, mesB-1, diaB).getTime();
      }
      else if (periodo === 'semana') {
        const [semA, fechaA] = a.fecha.split(' ');
        const [semB, fechaB] = b.fecha.split(' ');
        const [diaA, mesA] = fechaA.split('/').map(Number);
        const [diaB, mesB] = fechaB.split('/').map(Number);
        // Asumimos que estamos en el mismo año para simplificar
        return (mesA * 100 + diaA) - (mesB * 100 + diaB);
      }
      else if (periodo === 'mes') {
        const [mesA, anioA] = a.fecha.split('/').map(Number);
        const [mesB, anioB] = b.fecha.split('/').map(Number);
        return (anioA * 100 + mesA) - (anioB * 100 + mesB);
      }
      // Para año es directo
      return a.fecha.localeCompare(b.fecha);
    });
    
    setDatosGrafico(datosOrdenados);
  };

  // Efecto para regenerar datos del gráfico cuando cambia el periodo o tipo de visualización
  useEffect(() => {
    if (movimientos.length > 0) {
      generarDatosGrafico(movimientos, periodoIntervalo, tipoVisualizacion);
    }
  }, [periodoIntervalo, tipoVisualizacion]);

  const handleSeleccionarPersona = (persona: SaldoPersonaExtendido) => {
    if (personaSeleccionada?.persona_id === persona.persona_id) {
        setPersonaSeleccionada(null);
        setMovimientos([]);
        setErrorMovimientos(null);
        setMostrarGrafico(false);
    } else {
        setPersonaSeleccionada(persona);
        cargarMovimientosPersona(persona.persona_id);
    }
  };

  const handleBusquedaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && personasFiltradasYOrdenadas.length > 0) {
      handleSeleccionarPersona(personasFiltradasYOrdenadas[0]);
    }
  };

  const handleSort = (newOrder: Order) => {
    setOrder(newOrder);
  };

  const handleToggleGrafico = () => {
    setMostrarGrafico(prev => !prev);
  };

  const handleCambioPeriodo = (event: React.MouseEvent<HTMLElement>, nuevoPeriodo: PeriodoIntervalo) => {
    if (nuevoPeriodo !== null) {
      setPeriodoIntervalo(nuevoPeriodo);
    }
  };

  const handleCambioVisualizacion = (nuevaVisualizacion: TipoVisualizacion) => {
    setTipoVisualizacion(nuevaVisualizacion);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formateando fecha:", dateString, e);
      return dateString;
    }
  };

  // Función para formatear valores en el tooltip del gráfico
  const formatearValorGrafico = (value: number, name: string, props?: any) => {
    // Asumimos que la propiedad entrada tiene los datos original
    const dataItem = props?.payload;
    let valorConSigno = value;
    
    // Si existe la propiedad con signo, usamos esa
    if (dataItem) {
      if (name === 'total' && dataItem.totalSigno !== undefined) {
        valorConSigno = dataItem.totalSigno;
      } else if (name === 'guaranies' && dataItem.guaraniesSigno !== undefined) {
        valorConSigno = dataItem.guaraniesSigno;
      } else if (name === 'dolares' && dataItem.dolaresSigno !== undefined) {
        valorConSigno = dataItem.dolaresSigno;
      } else if (name === 'reales' && dataItem.realesSigno !== undefined) {
        valorConSigno = dataItem.realesSigno;
      }
    }
    
    if (name === 'total' || name === 'guaranies') {
      return formatCurrency(valorConSigno, 'guaranies');
    } else if (name === 'dolares') {
      return formatCurrency(valorConSigno, 'dolares');
    } else if (name === 'reales') {
      return formatCurrency(valorConSigno, 'reales');
    }
    return value;
  };

  // Componente de gráfico de líneas actualizado
  const GraficoLineas = () => {
    if (datosGrafico.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="text.secondary">
            No hay datos suficientes para mostrar el gráfico
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={datosGrafico}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis domain={[0, 'auto']} /> {/* Forzar que el eje Y empiece en 0 */}
            <RechartsTooltip 
              formatter={formatearValorGrafico} 
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend />
            {tipoVisualizacion === 'total' && (
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Saldo Total (Gs)" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            )}
            {tipoVisualizacion === 'guaranies' && (
              <Line 
                type="monotone" 
                dataKey="guaranies" 
                name="Guaraníes" 
                stroke="#8884d8" 
              />
            )}
            {tipoVisualizacion === 'dolares' && (
              <Line 
                type="monotone" 
                dataKey="dolares" 
                name="Dólares" 
                stroke="#82ca9d" 
              />
            )}
            {tipoVisualizacion === 'reales' && (
              <Line 
                type="monotone" 
                dataKey="reales" 
                name="Reales" 
                stroke="#ffc658" 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Balance con Personas
      </Typography>
      
      <Grid container spacing={3}>
        {/* Columna 1: Lista de personas con saldo pendiente */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Personas con Saldo Pendiente
            </Typography>
            
            {/* Controles: Buscador, Ordenar, Gráfico */}
            <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
              {/* Buscador */}
              <Grid item xs={12} sm={6} md={7}> 
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nombre o documento..."
                  variant="outlined"
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  onKeyDown={handleKeyDown}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    onClick: (e) => { e.currentTarget.querySelector('input')?.select(); }
                  }}
                />
              </Grid>
              {/* Botones de Ordenamiento */}
              <Grid item xs={12} sm={4} md={3}>
                <ButtonGroup size="small" variant="outlined" fullWidth>
                  <Button 
                    onClick={() => handleSort('desc')} 
                    variant={order === 'desc' ? 'contained' : 'outlined'}
                    title="Ordenar Mayor a Menor"
                  >
                    <ArrowDownwardIcon fontSize="small"/>
                  </Button>
                  <Button 
                    onClick={() => handleSort('asc')} 
                    variant={order === 'asc' ? 'contained' : 'outlined'}
                    title="Ordenar Menor a Mayor"
                  >
                    <ArrowUpwardIcon fontSize="small"/>
                  </Button>
                </ButtonGroup>
              </Grid>
              {/* Botón Gráfico */}
              <Grid item xs={12} sm={2} md={2} sx={{ textAlign: 'right' }}>
                 <IconButton
                    onClick={handleToggleGrafico}
                    disabled={!personaSeleccionada || cargandoMovimientos}
                    color="primary"
                    title={mostrarGrafico ? "Ver Movimientos" : "Ver Gráfico Histórico"}
                  >
                    {mostrarGrafico ? <TableRowsIcon/> : <ShowChartIcon />}
                  </IconButton>
              </Grid>
            </Grid>
            
            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
                    <TableCell sx={{ color: 'white' }}>Documento</TableCell>
                    <TableCell sx={{ color: 'white', textAlign: 'right' }}>Le debemos</TableCell>
                    <TableCell sx={{ color: 'white', textAlign: 'right' }}>Nos debe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargandoPersonas && (
                    <TableRow>
                      <TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell>
                    </TableRow>
                  )}
                  
                  {errorPersonas && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'error.main' }}>{errorPersonas}</TableCell>
                    </TableRow>
                  )}
                  
                  {!cargandoPersonas && !errorPersonas && personasFiltradasYOrdenadas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {busqueda ? 'No hay personas que coincidan' : 'No hay personas con saldo'}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {!cargandoPersonas && !errorPersonas && personasFiltradasYOrdenadas.map((persona) => (
                    <TableRow 
                      key={persona.id || persona.persona_id}
                      onClick={() => handleSeleccionarPersona(persona)}
                      hover
                      selected={personaSeleccionada?.persona_id === persona.persona_id}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: personaSeleccionada?.persona_id === persona.persona_id ? 'action.selected' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' },
                        ...(personaSeleccionada?.persona_id === persona.persona_id && {
                            borderLeft: `3px solid #1976d2`
                        })
                      }}
                    >
                      <TableCell>{persona.nombre_completo || persona.persona_nombre || `ID: ${persona.persona_id}`}</TableCell>
                      <TableCell>{persona.documento || '---'}</TableCell>
                      <TableCell align="right">
                        {persona.guaranies > 0 && (
                          <Typography component="div" variant="body2">
                            {formatCurrency(persona.guaranies, 'guaranies')}
                          </Typography>
                        )}
                        {persona.dolares > 0 && (
                          <Typography component="div" variant="body2">
                            {formatCurrency(persona.dolares, 'dolares')}
                          </Typography>
                        )}
                        {persona.reales > 0 && (
                          <Typography component="div" variant="body2">
                            {formatCurrency(persona.reales, 'reales')}
                          </Typography>
                        )}
                        {persona.guaranies <= 0 && persona.dolares <= 0 && persona.reales <= 0 && '-'}
                      </TableCell>
                      <TableCell align="right">
                        {persona.guaranies < 0 && (
                          <Typography component="div" variant="body2" color="error">
                            {formatCurrency(Math.abs(persona.guaranies), 'guaranies')}
                          </Typography>
                        )}
                        {persona.dolares < 0 && (
                          <Typography component="div" variant="body2" color="error">
                            {formatCurrency(Math.abs(persona.dolares), 'dolares')}
                          </Typography>
                        )}
                        {persona.reales < 0 && (
                          <Typography component="div" variant="body2" color="error">
                            {formatCurrency(Math.abs(persona.reales), 'reales')}
                          </Typography>
                        )}
                        {persona.guaranies >= 0 && persona.dolares >= 0 && persona.reales >= 0 && '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Columna 2: Movimientos o Gráfico de la persona seleccionada */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              {personaSeleccionada 
                ? `${mostrarGrafico ? 'Gráfico Histórico' : 'Movimientos'}: ${personaSeleccionada.nombre_completo || personaSeleccionada.persona_nombre || `ID: ${personaSeleccionada.persona_id}`}`
                : 'Detalle Persona'}
            </Typography>
            
            {/* Contenedor para el contenido dinámico (movimientos/gráfico) */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}> 
              {!personaSeleccionada && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="text.secondary">
                      Selecciona una persona de la lista
                      </Typography>
                  </Box>
              )}

              {personaSeleccionada && cargandoMovimientos && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              )}
              
              {personaSeleccionada && errorMovimientos && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="error">{errorMovimientos}</Typography>
                 </Box>
              )}
              
              {personaSeleccionada && !cargandoMovimientos && !errorMovimientos && (
                <>
                  {mostrarGrafico ? (
                    // --- Componente de Gráfico --- 
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Controles para el gráfico */}
                      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateRangeIcon sx={{ mr: 1 }} />
                          <Typography variant="body2" mr={1}>Intervalo:</Typography>
                          <ToggleButtonGroup
                            value={periodoIntervalo}
                            exclusive
                            onChange={handleCambioPeriodo}
                            aria-label="intervalo de tiempo"
                            size="small"
                          >
                            <ToggleButton value="dia" aria-label="día">
                              DÍA
                            </ToggleButton>
                            <ToggleButton value="semana" aria-label="semana">
                              SEMANA
                            </ToggleButton>
                            <ToggleButton value="mes" aria-label="mes">
                              MES
                            </ToggleButton>
                            <ToggleButton value="año" aria-label="año">
                              AÑO
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                          <MonetizationOnIcon sx={{ mr: 1 }} />
                          <Typography variant="body2" mr={1}>Mostrar:</Typography>
                          <ButtonGroup size="small">
                            <Button 
                              variant={tipoVisualizacion === 'total' ? 'contained' : 'outlined'} 
                              onClick={() => handleCambioVisualizacion('total')}
                            >
                              Total
                            </Button>
                            <Button 
                              variant={tipoVisualizacion === 'guaranies' ? 'contained' : 'outlined'} 
                              onClick={() => handleCambioVisualizacion('guaranies')}
                            >
                              Gs
                            </Button>
                            <Button 
                              variant={tipoVisualizacion === 'dolares' ? 'contained' : 'outlined'} 
                              onClick={() => handleCambioVisualizacion('dolares')}
                            >
                              USD
                            </Button>
                            <Button 
                              variant={tipoVisualizacion === 'reales' ? 'contained' : 'outlined'} 
                              onClick={() => handleCambioVisualizacion('reales')}
                            >
                              R$
                            </Button>
                          </ButtonGroup>
                        </Box>
                      </Box>
                      
                      {/* Componente de gráfico */}
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <GraficoLineas />
                      </Box>
                    </Box>
                    // --- Fin Componente Gráfico --- 
                  ) : (
                    // --- Tabla de Movimientos --- 
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small" stickyHeader>
                        <TableHead sx={{ bgcolor: 'secondary.main' }}>
                          <TableRow>
                            <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
                            <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
                            <TableCell sx={{ color: 'white' }}>Motivo</TableCell>
                            <TableCell sx={{ color: 'white', textAlign: 'right' }}>Guaraníes</TableCell>
                            <TableCell sx={{ color: 'white', textAlign: 'right' }}>Dólares</TableCell>
                            <TableCell sx={{ color: 'white', textAlign: 'right' }}>Reales</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {movimientos.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center">No hay movimientos para mostrar</TableCell>
                            </TableRow>
                          ) : (
                            movimientos.map((movimiento) => (
                              <TableRow 
                                key={movimiento.id}
                                sx={{ 
                                  textDecoration: movimiento.anulado ? 'line-through' : 'none',
                                  opacity: movimiento.anulado ? 0.6 : 1,
                                  '&:last-child td, &:last-child th': { border: 0 }
                                }}
                              >
                                <TableCell>{formatDate(movimiento.fecha_creacion)}</TableCell>
                                <TableCell>
                                  {movimiento.tipo === 'USO' ? 'Uso' : 'Devolución'}
                                  {movimiento.anulado && <Typography variant="caption" sx={{ ml: 0.5 }}>(A)</Typography>} 
                                </TableCell>
                                <TableCell>{movimiento.motivo}</TableCell>
                                <TableCell align="right">
                                  {movimiento.guaranies !== 0 ? formatCurrency(movimiento.guaranies, 'guaranies') : '-'}
                                </TableCell>
                                <TableCell align="right">
                                  {movimiento.dolares !== 0 ? formatCurrency(movimiento.dolares, 'dolares') : '-'}
                                </TableCell>
                                <TableCell align="right">
                                  {movimiento.reales !== 0 ? formatCurrency(movimiento.reales, 'reales') : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    // --- Fin Tabla Movimientos ---
                  )}
                </>
              )}
            </Box>
      </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BalancePersonas; 
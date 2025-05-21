import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  styled,
  TextField,
  Autocomplete,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  GlobalStyles
} from '@mui/material';
import axios from 'axios';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import { usuarioService } from '../../services/usuarioService';
import { apiService } from '../../config/api';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';

// Definición de la estructura de un movimiento de caja (como viene del backend)
interface MovimientoCajaAPI {
  id: string;
  createdAt: string; // Fecha de creación del movimiento (ISO String)
  cajaId: string;
  operadora: string;
  servicio: string;
  monto: number;
  // Campos que vendrían del JOIN en el backend
  nombreUsuario?: string;
  nombreSucursal?: string;
  Caja?: { // Si el backend anida la información de la caja
    Usuario?: {
      nombre?: string;
    };
    Sucursal?: {
      nombre?: string;
    };
  };
}

// Definición de la estructura de los datos de lucro calculados para el frontend
interface LucroCalculado extends MovimientoCajaAPI {
  porcentajeLucro: number;
  lucroEstimado: number;
  moneda: '₲' | '$';
}

// Estructura para el resumen por tipo de operación
interface ResumenOperacion {
  operadora: string;
  servicio: string;
  montoTotal: number;
  lucroTotal: number;
  porcentaje: number;
  moneda: '₲' | '$';
}

// Interfaces para props personalizadas
interface TotalBoxProps {
  bgcolor?: string;
}

// Colores por operadora
const OPERADORA_COLORS: Record<string, string> = {
  tigo: '#0088ce',
  personal: '#e3006d',
  claro: '#da291c',
  aquipago: '#3eb649',
  wepaguaranies: '#0097d0',
  wepadolares: '#ffb81c',
};

// Porcentajes de lucro
const PORCENTAJES_LUCRO: Record<string, Record<string, number>> = {
  tigo: {
    minicarga: 0.05, // 5% (miniCarga -> minicarga)
    girosenviados: 0.01, // 1%
    retiros: 0.01, // 1%
    cargabilleteras: 0.01, // 1% (cargaBilleteras -> cargabilleteras)
  },
  personal: {
    maxicarga: 0.05, // 5%
    girosenviados: 0.01, // 1%
    retiros: 0.01, // 1%
    cargabilleteras: 0.01, // 1%
  },
  claro: {
    recargaclaro: 0.05, // 5%
    girosenviados: 0.01, // 1%
    retiros: 0.01, // 1%
    cargabilleteras: 0.01, // 1%
  },
  aquipago: { // (aquiPago -> aquipago)
    pagos: 0.005, // 0.5%
    retiros: 0.005, // 0.5%
  },
  wepaguaranies: { // (wepaGuaranies -> wepaguaranies)
    pagos: 0.005, // 0.5%
    retiros: 0.005, // 0.5%
  },
  wepadolares: { // (wepaDolares -> wepadolares)
    pagos: 0.005, // 0.5%
    retiros: 0.005, // 0.5%
  },
};

const formatGuaranies = (value: number) => {
  const numeroSeguro = isNaN(value) ? 0 : value;
  return new Intl.NumberFormat('es-PY').format(numeroSeguro);
};

const formatDolares = (value: number) => {
  const numeroSeguro = isNaN(value) ? 0 : value;
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeroSeguro);
};

// Estilos personalizados
const DarkPaper = styled(Paper)(() => ({
  backgroundColor: '#212121', // Un gris un poco más claro que el fondo general
  color: '#fff',
  borderRadius: 8,
}));

const StyledTableCell = styled(TableCell)(() => ({
  color: '#e0e0e0',
  borderBottom: '1px solid #424242', // Borde sutil para las celdas
}));

const StyledTableHead = styled(TableHead)(() => ({
  backgroundColor: '#333333', // Cabecera de tabla más oscura
  '& .MuiTableCell-root': {
    color: '#fff',
    fontWeight: 'bold',
  }
}));

const OperadoraPaper = styled(Paper)<{ bordercolor: string }>(({ bordercolor }) => ({
  backgroundColor: '#2d2d2d', // Fondo de la tarjeta de operadora
  borderRadius: 8,
  marginBottom: 16,
  overflow: 'hidden',
  borderLeft: `4px solid ${bordercolor}`, // Borde de color distintivo
}));

const TotalBox = styled(Box)<TotalBoxProps>(({ bgcolor }) => ({
  backgroundColor: bgcolor || '#4caf50', // Color de fondo para los totales
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 4,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16, // Asegurar que TotalBox tenga margen inferior si se usa individualmente
}));

const FiltersContainer = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12, // Espacio entre filtros
  marginBottom: 16,
  alignItems: 'flex-end',
}));

const LucroScreen: React.FC = () => {
  
  const [movimientosBase, setMovimientosBase] = useState<MovimientoCajaAPI[]>([]);
  const [lucrosCalculados, setLucrosCalculados] = useState<LucroCalculado[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState<Date | null>(new Date());
  const [fechaHasta, setFechaHasta] = useState<Date | null>(new Date());
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>('');
  const [sucursalFiltro, setSucursalFiltro] = useState<string>('');

  const [totalLucroGuaranies, setTotalLucroGuaranies] = useState<number>(0);
  const [totalLucroDolares, setTotalLucroDolares] = useState<number>(0);
  
  // Para los selectores de filtro
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [sucursales, setSucursales] = useState<string[]>([]);
  
  // Para el resumen por tipo de operación
  const [resumenOperaciones, setResumenOperaciones] = useState<ResumenOperacion[]>([]);

  // Estado para manejar pestañas
  const [tabActual, setTabActual] = useState(0);

  // Estados para datos de estadísticas
  const [lucrosPorUsuario, setLucrosPorUsuario] = useState<any[]>([]);
  const [lucrosPorSucursal, setLucrosPorSucursal] = useState<any[]>([]);
  const [lucrosPorOperadora, setLucrosPorOperadora] = useState<any[]>([]);
  const [movimientosPorDia, setMovimientosPorDia] = useState<any[]>([]);

  // Cargar usuarios y sucursales independientemente
  useEffect(() => {
    // Cargar usuarios
    const fetchUsuarios = async () => {
      try {
        const data = await usuarioService.getUsuarios();
        const nombresUsuarios = data.map(usuario => usuario.nombre || usuario.username);
        setUsuarios(nombresUsuarios);
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
      }
    };

    // Cargar sucursales
    const fetchSucursales = async () => {
      try {
        const response = await apiService.sucursales.getAll();
        if (response.data && Array.isArray(response.data)) {
          const nombresSucursales = response.data.map(sucursal => sucursal.nombre);
          setSucursales(nombresSucursales);
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      }
    };

    fetchUsuarios();
    fetchSucursales();
  }, []);

  const fetchMovimientos = async () => {
    if (!fechaDesde || !fechaHasta) {
      setError("Por favor, seleccione un rango de fechas.");
      return;
    }
    setLoading(true);
    setError(null);
    setMovimientosBase([]); // Limpiar datos anteriores
    setLucrosCalculados([]);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/movimientos-caja/all-movimientos`, {
        params: {
          fechaDesde: fechaDesde.toISOString().split('T')[0], // YYYY-MM-DD
          fechaHasta: fechaHasta.toISOString().split('T')[0], // YYYY-MM-DD
        }
      });
      
      const data = response.data.data || response.data || [];
      const movimientosConNombres: MovimientoCajaAPI[] = data.map((mov: any) => ({
        ...mov,
        monto: parseFloat(mov.monto) || 0, 
        nombreUsuario: mov.nombreUsuario || mov.Caja?.Usuario?.nombre,
        nombreSucursal: mov.nombreSucursal || mov.Caja?.Sucursal?.nombre,
      }));
      setMovimientosBase(movimientosConNombres);

    } catch (err: any) {
      console.error("Error al cargar movimientos:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error desconocido al cargar los movimientos.';
      setError(errorMsg);
      setMovimientosBase([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movimientosBase.length > 0) {
      const movimientosFiltrados = movimientosBase.filter(mov => {
        const pasaFiltroUsuario = !usuarioFiltro || mov.nombreUsuario === usuarioFiltro;
        const pasaFiltroSucursal = !sucursalFiltro || mov.nombreSucursal === sucursalFiltro;
        return pasaFiltroUsuario && pasaFiltroSucursal;
      });

      const calculados: LucroCalculado[] = movimientosFiltrados.map(mov => {
        const operadoraKey = mov.operadora.toLowerCase().replace(/\s+/g, '');
        const servicioKey = mov.servicio.toLowerCase().replace(/\s+/g, '');
        const esWepaDolares = operadoraKey === 'wepadolares';
        let porcentaje = 0;
        if (PORCENTAJES_LUCRO[operadoraKey] && PORCENTAJES_LUCRO[operadoraKey][servicioKey]) {
          porcentaje = PORCENTAJES_LUCRO[operadoraKey][servicioKey];
        }
        const lucro = mov.monto * porcentaje;
        return {
          ...mov,
          porcentajeLucro: porcentaje,
          lucroEstimado: lucro,
          moneda: esWepaDolares ? '$' : '₲',
        };
      });
      
      let totalGs = 0;
      let totalUsd = 0;
      calculados.forEach(l => {
        if (l.moneda === '₲') {
          totalGs += l.lucroEstimado;
        } else {
          totalUsd += l.lucroEstimado;
        }
      });
      setTotalLucroGuaranies(totalGs);
      setTotalLucroDolares(totalUsd);
      setLucrosCalculados(calculados);

      const resumenMap = new Map<string, ResumenOperacion>();
      calculados.forEach(mov => {
        const key = `${mov.operadora}-${mov.servicio}-${mov.moneda}`;
        if (!resumenMap.has(key)) {
          resumenMap.set(key, {
            operadora: mov.operadora,
            servicio: mov.servicio,
            montoTotal: 0,
            lucroTotal: 0,
            porcentaje: mov.porcentajeLucro,
            moneda: mov.moneda
          });
        }
        const resumen = resumenMap.get(key)!;
        resumen.montoTotal += mov.monto;
        resumen.lucroTotal += mov.lucroEstimado;
      });
      setResumenOperaciones(Array.from(resumenMap.values()));

      // Calcular estadísticas
      calcularEstadisticas(calculados);
    } else {
      setLucrosCalculados([]);
      setTotalLucroGuaranies(0);
      setTotalLucroDolares(0);
      setResumenOperaciones([]);
    }
  }, [movimientosBase, usuarioFiltro, sucursalFiltro]);

  const handleBuscarClick = () => {
    fetchMovimientos();
  };

  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; 
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };
  
  const operadoraGroups = useMemo(() => {
    if (resumenOperaciones.length === 0) return [];
    const operadorasUnicas = Array.from(new Set(resumenOperaciones.map(op => op.operadora.toLowerCase().replace(/\s+/g, ''))));
    return operadorasUnicas.map(operadoraKey => {
      const servicios = resumenOperaciones.filter(op => op.operadora.toLowerCase().replace(/\s+/g, '') === operadoraKey);
      const color = OPERADORA_COLORS[operadoraKey] || '#757575'; // Color por defecto
      return {
        operadoraNombre: servicios.length > 0 ? servicios[0].operadora : operadoraKey, // Nombre original con mayúsculas
        servicios,
        color
      };
    });
  }, [resumenOperaciones]);

  // Manejar cambio de tab
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabActual(newValue);
  };

  // Función para calcular las estadísticas
  const calcularEstadisticas = (lucros: LucroCalculado[]) => {
    if (!lucros || lucros.length === 0) return;

    // Calcular lucro por usuario
    const usuarioMap = new Map<string, number>();
    lucros.forEach(l => {
      const nombreUsuario = l.nombreUsuario || 'Sin Usuario';
      usuarioMap.set(nombreUsuario, (usuarioMap.get(nombreUsuario) || 0) + l.lucroEstimado);
    });
    const lucrosUsuario = Array.from(usuarioMap.entries())
      .map(([nombre, lucro]) => ({ nombre, lucro }))
      .sort((a, b) => b.lucro - a.lucro);
    setLucrosPorUsuario(lucrosUsuario);

    // Calcular lucro por sucursal
    const sucursalMap = new Map<string, number>();
    lucros.forEach(l => {
      const nombreSucursal = l.nombreSucursal || 'Sin Sucursal';
      sucursalMap.set(nombreSucursal, (sucursalMap.get(nombreSucursal) || 0) + l.lucroEstimado);
    });
    const lucrosSucursal = Array.from(sucursalMap.entries())
      .map(([nombre, lucro]) => ({ nombre, lucro }))
      .sort((a, b) => b.lucro - a.lucro);
    setLucrosPorSucursal(lucrosSucursal);

    // Calcular lucro por operadora
    const operadoraMap = new Map<string, number>();
    lucros.forEach(l => {
      operadoraMap.set(l.operadora, (operadoraMap.get(l.operadora) || 0) + l.lucroEstimado);
    });
    const lucrosOperadora = Array.from(operadoraMap.entries())
      .map(([nombre, lucro]) => ({ nombre, lucro }))
      .sort((a, b) => b.lucro - a.lucro);
    setLucrosPorOperadora(lucrosOperadora);

    // Calcular movimientos por día de la semana
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaMap = new Map<string, {count: number, lucro: number}>();
    
    // Inicializar todos los días
    diasSemana.forEach(dia => {
      diaMap.set(dia, {count: 0, lucro: 0});
    });
    
    // Contar movimientos y lucro por día
    lucros.forEach(l => {
      const fecha = new Date(l.createdAt);
      const diaSemana = diasSemana[fecha.getDay()];
      const actual = diaMap.get(diaSemana) || {count: 0, lucro: 0};
      diaMap.set(diaSemana, {
        count: actual.count + 1,
        lucro: actual.lucro + l.lucroEstimado
      });
    });
    
    // Convertir a array para el gráfico
    const movimientosDia = diasSemana.map(dia => ({
      dia,
      cantidad: diaMap.get(dia)?.count || 0,
      lucro: diaMap.get(dia)?.lucro || 0
    }));
    
    setMovimientosPorDia(movimientosDia);
  };

  // Colores para gráficos
  const COLORS = [
    '#0088ce', '#e3006d', '#da291c', '#3eb649', '#0097d0', 
    '#ffb81c', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        backgroundColor: '#121212', 
        minHeight: '100vh', 
        color: '#fff',
        pt: 2, // Padding top general
        pb: 4  // Padding bottom general
      }}>
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
        
        <Container maxWidth="xl"> {/* Usar maxWidth="xl" para más espacio */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'medium', color: '#64b5f6' }}> {/* Un azul más claro */}
              Reporte de Lucro por Movimientos de Caja
            </Typography>
          </Box>
          
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#212121' }}>
            <Tabs 
              value={tabActual} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              textColor="inherit"
              indicatorColor="primary"
            >
              <Tab label="Resumen de Lucro" />
              <Tab label="Estadísticas" />
            </Tabs>
            
            {tabActual === 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <FilterAltIcon sx={{ mr: 1, color: '#9e9e9e' }} />
                  <Typography variant="subtitle1" sx={{ color: '#bdbdbd' }}>Filtros</Typography> {/* Gris más claro */}
                </Box>
                <FiltersContainer>
                  <DatePicker
                    label="Fecha Desde"
                    value={fechaDesde}
                    onChange={(newValue) => setFechaDesde(newValue)}
                    slotProps={{ 
                      textField: { 
                        variant: 'outlined', 
                        size: 'small',
                        sx: { 
                          width: { xs: '100%', sm: 160 }, // Ancho responsivo
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            backgroundColor: '#333',
                            '& fieldset': { borderColor: '#555' },
                            '&:hover fieldset': { borderColor: '#777' },
                            '&.Mui-focused fieldset': { borderColor: '#64b5f6' }, // Color al enfocar
                          },
                          '& .MuiInputLabel-root': { color: '#bdbdbd' },
                          '& .MuiSvgIcon-root': { color: '#bdbdbd' }, // Color del icono del calendario
                        }
                      } 
                    }}
                  />
                  <DatePicker
                    label="Fecha Hasta"
                    value={fechaHasta}
                    onChange={(newValue) => setFechaHasta(newValue)}
                    slotProps={{ 
                      textField: { 
                        variant: 'outlined', 
                        size: 'small',
                        sx: { 
                          width: { xs: '100%', sm: 160 },
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            backgroundColor: '#333',
                            '& fieldset': { borderColor: '#555' },
                            '&:hover fieldset': { borderColor: '#777' },
                            '&.Mui-focused fieldset': { borderColor: '#64b5f6' },
                          },
                          '& .MuiInputLabel-root': { color: '#bdbdbd' },
                          '& .MuiSvgIcon-root': { color: '#bdbdbd' },
                        }
                      } 
                    }}
                  />
                  
                  {/* Autocomplete para usuarios */}
                  <Autocomplete
                    size="small"
                    options={["", ...usuarios]} // Agregar opción vacía para "Todos"
                    value={usuarioFiltro}
                    onChange={(event, newValue) => setUsuarioFiltro(newValue || "")}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Usuario" 
                        variant="outlined"
                        InputLabelProps={{
                          style: { color: '#bdbdbd' }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} style={{ color: '#e0e0e0' }}>
                        {option === "" ? "Todos" : option}
                      </li>
                    )}
                    sx={{
                      width: { xs: '100%', sm: 220 },
                      '& .MuiOutlinedInput-root': { 
                        color: '#e0e0e0',
                        backgroundColor: '#333',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#777' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' },
                      },
                      '& .MuiIconButton-root': { color: '#bdbdbd' },
                      '& .MuiAutocomplete-popupIndicator': { color: '#bdbdbd' },
                      '& .MuiAutocomplete-clearIndicator': { color: '#bdbdbd' },
                    }}
                    ListboxProps={{
                      style: { 
                        backgroundColor: '#333',
                        color: '#e0e0e0',
                        maxHeight: 300,
                      }
                    }}
                    getOptionLabel={(option) => option === "" ? "Todos" : option}
                    isOptionEqualToValue={(option, value) => {
                      if (value === "" && option === "") return true;
                      return option === value;
                    }}
                  />
                  
                  <FormControl 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      minWidth: { xs: '100%', sm: 160 },
                      '& .MuiOutlinedInput-root': { 
                        color: '#e0e0e0',
                        backgroundColor: '#333',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#777' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' },
                      },
                      '& .MuiInputLabel-root': { color: '#bdbdbd' },
                      '& .MuiSelect-icon': { color: '#bdbdbd' },
                    }}
                  >
                    <InputLabel id="sucursal-filtro-label">Sucursal</InputLabel>
                    <Select
                      labelId="sucursal-filtro-label"
                      value={sucursalFiltro}
                      label="Sucursal"
                      onChange={(e) => setSucursalFiltro(e.target.value)}
                      MenuProps={{ PaperProps: { sx: { backgroundColor: '#333', color: '#e0e0e0' } } }}
                    >
                      <MenuItem value=""><em>Todas</em></MenuItem>
                      {sucursales.map((sucursal, index) => (
                        <MenuItem key={index} value={sucursal}>{sucursal}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained" 
                    onClick={handleBuscarClick}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                    sx={{ 
                      height: 40,
                      backgroundColor: '#1e88e5', // Azul principal para el botón
                      '&:hover': { backgroundColor: '#1565c0' }, // Azul más oscuro al hover
                      flexShrink: 0, // Evitar que el botón se encoja
                      width: { xs: '100%', sm: 'auto' } // Ancho completo en móvil
                    }}
                  >
                    BUSCAR
                  </Button>
                </FiltersContainer>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TotalBox bgcolor="#2e7d32"> {/* Verde oscuro para guaraníes */}
                      <Typography variant="subtitle2">Total Lucro (₲)</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatGuaranies(totalLucroGuaranies)}
                      </Typography>
                    </TotalBox>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TotalBox bgcolor="#0277bd"> {/* Azul oscuro para dólares */}
                      <Typography variant="subtitle2">Total Lucro ($)</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatDolares(totalLucroDolares)}
                      </Typography>
                    </TotalBox>
                  </Grid>
                </Grid>

                {error && (
                  <DarkPaper sx={{ p: 2, mb: 2, borderLeft: '4px solid #d32f2f', backgroundColor: '#2a1a1a' }}> {/* Rojo oscuro para error */}
                    <Typography sx={{ color: '#ef9a9a' }}>{error}</Typography> {/* Texto de error más claro */}
                  </DarkPaper>
                )}
                
                {loading && !error && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{color: '#64b5f6'}}/>
                  </Box>
                )}
                
                {!loading && !error && movimientosBase.length > 0 && operadoraGroups.length === 0 && lucrosCalculados.length === 0 && (
                  <DarkPaper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                    <Typography sx={{ color: '#9e9e9e' }}>
                      No se encontraron movimientos que generen lucro con los criterios seleccionados.
                    </Typography>
                  </DarkPaper>
                )}

                {!loading && !error && movimientosBase.length === 0 && (
                  <DarkPaper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                    <Typography sx={{ color: '#9e9e9e' }}>
                      No se encontraron movimientos para el rango de fechas seleccionado. Intente con otro rango o verifique los filtros.
                    </Typography>
                  </DarkPaper>
                )}
                
                {movimientosBase.length > 0 && (
                  <Grid container spacing={2}>
                    {/* Columna de Lucro por Operadora (ahora a pantalla completa) */}
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mb: 1.5, color: '#bdbdbd', fontWeight:'medium' }}>
                        Lucro por Operadora
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {[...operadoraGroups].reverse()
                          .sort((a, b) => {
                            // Primero colocar operadoras específicas (TIGO, PERSONAL, CLARO)
                            const orderMap: Record<string, number> = {
                              'tigo': 1,
                              'personal': 2,
                              'claro': 3,
                              'wepaguaranies': 4, // WEPAGUARANIES y AQUIPAGO juntos (izquierda)
                              'aquipago': 5,
                              'wepadolares': 6
                            };
                            
                            const orderA = orderMap[a.operadoraNombre.toLowerCase().replace(/\s+/g, '')] || 99;
                            const orderB = orderMap[b.operadoraNombre.toLowerCase().replace(/\s+/g, '')] || 99;
                            
                            return orderA - orderB;
                          })
                          .map(group => (
                          <Grid item xs={12} sm={4} key={group.operadoraNombre}>
                            <OperadoraPaper bordercolor={group.color}>
                              <Box sx={{ backgroundColor: group.color, p: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', textAlign:'center' }}>
                                  {group.operadoraNombre.toUpperCase()}
                                </Typography>
                              </Box>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <StyledTableCell sx={{pl:1}}>Servicio</StyledTableCell>
                                      <StyledTableCell align="right">Monto Total</StyledTableCell>
                                      <StyledTableCell align="center" sx={{whiteSpace: 'nowrap'}}>% Lucro</StyledTableCell>
                                      <StyledTableCell align="right" sx={{pr:1}}>Lucro Total</StyledTableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.servicios.map((servicio, idx) => (
                                      <TableRow key={`${group.operadoraNombre}-${servicio.servicio}-${idx}`} sx={{ '&:hover': { backgroundColor: '#3c3c3c' }}}>
                                        <StyledTableCell sx={{pl:1, fontWeight:'medium'}}>
                                          {servicio.servicio}
                                        </StyledTableCell>
                                        <StyledTableCell align="right">
                                          {servicio.moneda === '₲' ? formatGuaranies(servicio.montoTotal) : formatDolares(servicio.montoTotal)}
                                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#9e9e9e' }}> {servicio.moneda}</Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="center" sx={{ color: '#9e9e9e' }}>
                                          {(servicio.porcentaje * 100).toFixed(1)}%
                                        </StyledTableCell>
                                        <StyledTableCell 
                                          align="right" 
                                          sx={{ 
                                            pr:1,
                                            color: servicio.lucroTotal > 0 ? '#66bb6a' : '#9e9e9e', // Verde para lucro positivo
                                            fontWeight: servicio.lucroTotal > 0 ? 'bold' : 'normal'
                                          }}
                                        >
                                          {servicio.moneda === '₲' ? formatGuaranies(servicio.lucroTotal) : formatDolares(servicio.lucroTotal)}
                                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#9e9e9e' }}> {servicio.moneda}</Typography>
                                        </StyledTableCell>
                                      </TableRow>
                                    ))}
                                    {/* Fila de Total de Lucro por Operadora */}
                                    <TableRow sx={{ backgroundColor: '#2d2d2d' }}>
                                      <StyledTableCell sx={{pl:1, fontWeight:'bold'}} colSpan={3}>
                                        Total Lucro {group.operadoraNombre}
                                      </StyledTableCell>
                                      <StyledTableCell 
                                        align="right" 
                                        sx={{ 
                                          pr:1,
                                          color: '#66bb6a', // Verde para el total
                                          fontWeight: 'bold',
                                          borderTop: '1px solid #555'
                                        }}
                                      >
                                        {
                                          (() => {
                                            // Verificar si todos los servicios usan la misma moneda
                                            const monedas = new Set(group.servicios.map(s => s.moneda));
                                            if (monedas.size === 1) {
                                              // Si todos usan la misma moneda, sumar directamente
                                              const moneda = group.servicios[0].moneda;
                                              const total = group.servicios.reduce((sum, s) => sum + s.lucroTotal, 0);
                                              return <>
                                                {moneda === '₲' ? formatGuaranies(total) : formatDolares(total)}
                                                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#9e9e9e' }}> {moneda}</Typography>
                                              </>;
                                            } else {
                                              // Si hay monedas mixtas, mostrar totales separados
                                              const totalGs = group.servicios
                                                .filter(s => s.moneda === '₲')
                                                .reduce((sum, s) => sum + s.lucroTotal, 0);
                                              
                                              const totalUsd = group.servicios
                                                .filter(s => s.moneda === '$')
                                                .reduce((sum, s) => sum + s.lucroTotal, 0);
                                              
                                              return <>
                                                {totalGs > 0 && <div>{formatGuaranies(totalGs)} <Typography component="span" variant="caption" sx={{ color: '#9e9e9e' }}>₲</Typography></div>}
                                                  {totalUsd > 0 && <div>{formatDolares(totalUsd)} <Typography component="span" variant="caption" sx={{ color: '#9e9e9e' }}>$</Typography></div>}
                                              </>;
                                            }
                                          })()
                                        }
                                      </StyledTableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </OperadoraPaper>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}
            
            {tabActual === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#bdbdbd' }}>
                  Estadísticas de Lucro
                </Typography>
                
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{color: '#64b5f6'}}/>
                  </Box>
                )}
                
                {!loading && lucrosCalculados.length === 0 && (
                  <DarkPaper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                    <Typography sx={{ color: '#9e9e9e' }}>
                      No hay datos para mostrar estadísticas. Por favor, realice una búsqueda primero.
                    </Typography>
                  </DarkPaper>
                )}
                
                {!loading && lucrosCalculados.length > 0 && (
                  <Grid container spacing={3}>
                    {/* Gráfico de Ranking de Lucro por Usuario */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: '#2d2d2d', height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0' }}>
                            Ranking de Lucro por Usuario
                          </Typography>
                          <Divider sx={{ mb: 2, bgcolor: '#424242' }} />
                          <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={lucrosPorUsuario.slice(0, 10)} // Mostrar solo los 10 primeros
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                                <XAxis type="number" stroke="#9e9e9e" />
                                <YAxis 
                                  dataKey="nombre" 
                                  type="category" 
                                  width={120}
                                  stroke="#9e9e9e" 
                                />
                                <RechartsTooltip 
                                  formatter={(value: number) => formatGuaranies(value)}
                                  cursor={{ fill: '#444444' }}
                                  contentStyle={{ backgroundColor: '#333333', border: 'none', color: '#e0e0e0' }}
                                />
                                <Bar dataKey="lucro" fill="#0088ce">
                                  {lucrosPorUsuario.slice(0, 10).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Gráfico de Lucro por Sucursal */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: '#2d2d2d', height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0' }}>
                            Lucro por Sucursal
                          </Typography>
                          <Divider sx={{ mb: 2, bgcolor: '#424242' }} />
                          <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={lucrosPorSucursal}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="lucro"
                                  nameKey="nombre"
                                  label={({ nombre, percent }) => 
                                    `${nombre}: ${(percent * 100).toFixed(0)}%`
                                  }
                                  labelLine={false}
                                >
                                  {lucrosPorSucursal.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: number) => formatGuaranies(value)}
                                  contentStyle={{ backgroundColor: '#333333', border: 'none', color: '#e0e0e0' }}
                                />
                                <Legend
                                  layout="vertical"
                                  verticalAlign="bottom"
                                  align="center"
                                  wrapperStyle={{ color: '#e0e0e0' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Gráfico de Lucro por Operadora */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: '#2d2d2d', height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0' }}>
                            Lucro por Operadora
                          </Typography>
                          <Divider sx={{ mb: 2, bgcolor: '#424242' }} />
                          <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={lucrosPorOperadora}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                                <XAxis dataKey="nombre" stroke="#9e9e9e" />
                                <YAxis stroke="#9e9e9e" />
                                <RechartsTooltip 
                                  formatter={(value: number) => formatGuaranies(value)}
                                  cursor={{ fill: '#444444' }}
                                  contentStyle={{ backgroundColor: '#333333', border: 'none', color: '#e0e0e0' }}
                                />
                                <Bar dataKey="lucro" fill="#0088ce">
                                  {lucrosPorOperadora.map((entry, index) => {
                                    const operadora = entry.nombre.toLowerCase().replace(/\s+/g, '');
                                    const color = OPERADORA_COLORS[operadora] || COLORS[index % COLORS.length];
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Gráfico de Movimientos por Día de la Semana */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: '#2d2d2d', height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0' }}>
                            Movimientos por Día de la Semana
                          </Typography>
                          <Divider sx={{ mb: 2, bgcolor: '#424242' }} />
                          <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={movimientosPorDia}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                                <XAxis dataKey="dia" stroke="#9e9e9e" />
                                <YAxis yAxisId="left" stroke="#9e9e9e" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <RechartsTooltip 
                                  formatter={(value: any, name: string) => {
                                    if (name === 'lucro') return formatGuaranies(value);
                                    return value;
                                  }}
                                  contentStyle={{ backgroundColor: '#333333', border: 'none', color: '#e0e0e0' }}
                                />
                                <Legend wrapperStyle={{ color: '#e0e0e0' }} />
                                <Line 
                                  yAxisId="left"
                                  type="monotone" 
                                  dataKey="cantidad" 
                                  stroke="#0088ce" 
                                  activeDot={{ r: 8 }}
                                  name="Cantidad"
                                />
                                <Line 
                                  yAxisId="right"
                                  type="monotone" 
                                  dataKey="lucro" 
                                  stroke="#82ca9d" 
                                  name="Lucro"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default LucroScreen; 
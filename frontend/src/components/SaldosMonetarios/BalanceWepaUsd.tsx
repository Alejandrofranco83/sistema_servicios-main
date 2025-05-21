import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Modal,
  GlobalStyles
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import CloseIcon from '@mui/icons-material/Close';

// Interfaces
interface MovimientoCaja {
  id: number;
  fecha: string;
  cajaId: string;
  numeroEntero?: number; // Número de caja corto
  sucursal?: string;
  usuario?: string;
  monto: number;
  operadora: string;
  rutaComprobante?: string;
  estado: string;
  servicio: string;
}

interface DepositoBancario {
  id: number;
  fecha: string;
  numeroDeposito: string;
  monto: number;
  cuentaBancariaId: number;
  observacion: string | null;
  rutaComprobante?: string;
  numeroComprobante?: string; // Campo adicional para el número de comprobante
}

interface ApiResponse {
  movimientos: MovimientoCaja[];
  depositos: DepositoBancario[];
  totalPagos: number;
  totalRetiros: number;
  totalDepositos: number;
  totalADepositar: number;
}

const BalanceWepaUsd: React.FC = () => {
  // Estados
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [depositos, setDepositos] = useState<DepositoBancario[]>([]);
  const [totalADepositar, setTotalADepositar] = useState<number>(0);
  const [totalPagos, setTotalPagos] = useState<number>(0);
  const [totalRetiros, setTotalRetiros] = useState<number>(0);
  const [totalDepositos, setTotalDepositos] = useState<number>(0);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  
  // Estados para el modal de visualización de comprobantes
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [loadingComprobante, setLoadingComprobante] = useState<boolean>(false);

  // Cargar el balance global al iniciar el componente (independiente de fechas)
  useEffect(() => {
    cargarBalanceGlobal();
  }, []);

  // Cargar datos filtrados por fecha
  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  // Nueva función para cargar el balance global (totalADepositar)
  const cargarBalanceGlobal = async () => {
    try {
      // Consultar el endpoint para obtener el saldo global a depositar
      const response = await axios.get('/api/wepa-usd/balance-global');
      
      if (response.data && response.data.totalADepositar !== undefined) {
        setTotalADepositar(response.data.totalADepositar);
      }
    } catch (err: any) {
      console.error('Error al cargar balance global de Wepa USD:', err);
      // No establecemos error aquí para no mostrar alerta, solo log
    }
  };

  // Función para cargar datos
  const cargarDatos = async () => {
    if (!fechaInicio || !fechaFin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Formatear fechas para la API
      const inicio = fechaInicio.toISOString().split('T')[0];
      const fin = fechaFin.toISOString().split('T')[0];
      
      // Usar la API específica para Wepa USD
      const response = await axios.get<ApiResponse>(`/api/wepa-usd/movimientos?fechaInicio=${inicio}&fechaFin=${fin}`);
      
      // Procesar la respuesta de la API
      if (response.data) {
        console.log('Datos recibidos de la API:', response.data);
        setMovimientos(response.data.movimientos);
        setDepositos(response.data.depositos || []);
        setTotalPagos(response.data.totalPagos);
        setTotalRetiros(response.data.totalRetiros);
        setTotalDepositos(response.data.totalDepositos || 0);
        // No actualizamos totalADepositar aquí, ese valor viene del endpoint global
      } else {
        // Si no hay datos, inicializar con valores vacíos
        setMovimientos([]);
        setDepositos([]);
        setTotalPagos(0);
        setTotalRetiros(0);
        setTotalDepositos(0);
        // Mantenemos el valor global de totalADepositar
      }
      
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al cargar los datos de Wepa USD');
      
      // Si hay un error, mostrar datos vacíos
      setMovimientos([]);
      setDepositos([]);
      setTotalPagos(0);
      setTotalRetiros(0);
      setTotalDepositos(0);
      // Mantenemos el valor global de totalADepositar
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para visualización
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Ver comprobante
  const verComprobante = async (nombreArchivo: string) => {
    try {
      if (!nombreArchivo) {
        setError('Ruta de comprobante no disponible');
        return;
      }

      setLoadingComprobante(true);
      console.log('Ruta de comprobante original:', nombreArchivo);
      
      // Obtener solo el nombre del archivo
      const nombreArchivoSolo = nombreArchivo.split('/').pop() || nombreArchivo.split('\\').pop() || nombreArchivo;
      
      // Intentar varias estrategias para obtener la URL del comprobante
      let url = '';
      
      // Estrategia 1: Usar la API directamente
      try {
        const response = await axios.get(`/api/wepa-usd/comprobante/${encodeURIComponent(nombreArchivo)}`, { 
          responseType: 'blob' 
        });
        
        // Crear URL del blob
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        url = URL.createObjectURL(blob);
      } catch (err) {
        console.log('Error en estrategia 1, intentando estrategia 2...');
        
        // Estrategia 2: Probar con el nombre de archivo limpio
        try {
          const response = await axios.get(`/api/wepa-usd/comprobante/${encodeURIComponent(nombreArchivoSolo)}`, { 
            responseType: 'blob' 
          });
          
          const blob = new Blob([response.data], { type: response.headers['content-type'] });
          url = URL.createObjectURL(blob);
        } catch (err) {
          console.log('Error en estrategia 2, intentando estrategia 3...');
          
          // Estrategia 3: Usar la ruta directa
          // Asumimos que el archivo está servido estáticamente en /uploads o /comprobante
          url = `/uploads/${encodeURIComponent(nombreArchivoSolo)}`;
        }
      }
      
      // Establecer la URL y abrir el modal
      setComprobanteUrl(url);
      setModalOpen(true);
    } catch (err) {
      console.error('Error al ver comprobante:', err);
      setError('Error al visualizar el comprobante solicitado');
    } finally {
      setLoadingComprobante(false);
    }
  };

  // Manejar cierre del modal
  const handleCloseModal = () => {
    setModalOpen(false);
    // Limpiar recursos si es un blob URL
    if (comprobanteUrl.startsWith('blob:')) {
      URL.revokeObjectURL(comprobanteUrl);
    }
    setComprobanteUrl('');
  };

  // Filtrar movimientos según estado y búsqueda
  const movimientosFiltrados = movimientos.filter(m => {
    const cumpleFiltroEstado = filtroEstado === 'TODOS' || m.estado === filtroEstado;
    const cumpleBusqueda = busqueda === '' || 
      m.cajaId.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.numeroEntero?.toString() || '').includes(busqueda) ||
      m.fecha.includes(busqueda) ||
      (m.sucursal?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (m.usuario?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      m.id.toString().includes(busqueda);
    
    return cumpleFiltroEstado && cumpleBusqueda;
  });

  // Filtrar depósitos bancarios
  const depositosFiltrados = depositos.filter(d => {
    // Filtrar depósitos que no están cancelados
    const noCancelado = !d.observacion || !d.observacion.toUpperCase().includes('CANCELADO');
    
    // Filtrar por búsqueda
    const cumpleBusqueda = busqueda === '' ||
      d.numeroDeposito.includes(busqueda) ||
      d.fecha.includes(busqueda) ||
      d.id.toString().includes(busqueda);
    
    return noCancelado && cumpleBusqueda;
  });

  // Agrupar movimientos por caja y depósitos por fecha
  const movimientosAgrupados = React.useMemo(() => {
    const agrupado: Record<string, {
      fecha: string;
      cajaId: string;
      numeroEntero: number;
      sucursal: string;
      usuario: string;
      montosPago: number;
      montosRetiro: number;
      tipo: 'CAJA' | 'DEPOSITO';
      numeroDeposito?: string;
      numeroComprobante?: string;
      comprobantes: string[];
    }> = {};
    console.log('--- Recalculando movimientosAgrupados ---'); // Log inicio
    console.log('Datos brutos - movimientos:', movimientos); // Log datos brutos
    console.log('Datos brutos - depositos:', depositos);
    console.log('Movimientos Filtrados (entrada al useMemo):', movimientosFiltrados); // Log array filtrado

    // Primer paso: agrupar movimientos de caja por fecha y caja
    movimientosFiltrados.forEach((m, index) => {
      // Log detallado de cada movimiento antes de procesar
      console.log(`Procesando mov ${index}:`, { id: m.id, servicio: m.servicio, monto: m.monto }); 

      // ---> [MODIFICACIÓN] Usar solo la fecha (YYYY-MM-DD) para la clave de agrupación
      const fechaParte = m.fecha.split('T')[0]; // Extraer solo YYYY-MM-DD
      const clave = `C_${fechaParte}_${m.cajaId}`;
      
      if (!agrupado[clave]) {
        agrupado[clave] = {
          fecha: m.fecha,
          cajaId: m.cajaId,
          numeroEntero: m.numeroEntero || 0,
          sucursal: m.sucursal || '',
          usuario: m.usuario || '',
          montosPago: 0,
          montosRetiro: 0,
          tipo: 'CAJA', // Recordar que definimos 'tipo' aquí para la visualización
          comprobantes: []
        };
      }
      
      // Acumular montos según SERVICIO
      if (m.servicio === 'pagos') { 
        console.log(`  -> Acumulando PAGO: ${m.monto} (actual: ${agrupado[clave].montosPago})`);
        agrupado[clave].montosPago += m.monto;
      } else if (m.servicio === 'retiros') { 
        console.log(`  -> Acumulando RETIRO: ${m.monto} (actual: ${agrupado[clave].montosRetiro})`);
        agrupado[clave].montosRetiro += m.monto;
      } else {
        console.warn(`  -> SERVICIO NO RECONOCIDO para mov ${m.id}: ${m.servicio}`); // Advertencia si no coincide
      }
      
      // Guardar comprobante si existe (usar rutaComprobante)
      if (m.rutaComprobante && !agrupado[clave].comprobantes.includes(m.rutaComprobante)) {
        agrupado[clave].comprobantes.push(m.rutaComprobante);
      }
    });

    // Segundo paso: agregar los depósitos bancarios
    depositosFiltrados.forEach(d => {
      const clave = `D_${d.fecha}_${d.id}`;
      
      // Determinar el número a mostrar: primero numeroComprobante, luego numeroDeposito, finalmente ID
      const numeroAMostrar = d.numeroComprobante || d.numeroDeposito || `${d.id}`;
      
      agrupado[clave] = {
        fecha: d.fecha,
        cajaId: `Depósito #${numeroAMostrar}`,
        numeroEntero: 0,
        sucursal: 'Banco',
        usuario: '',
        montosPago: 0,
        montosRetiro: d.monto, // El monto del depósito va como retiro (representa salida de dinero)
        tipo: 'DEPOSITO',
        numeroDeposito: d.numeroDeposito,
        numeroComprobante: d.numeroComprobante, // Guardar también el número de comprobante
        comprobantes: d.rutaComprobante ? [d.rutaComprobante] : []
      };
    });
    
    const resultadoAgrupado = Object.values(agrupado).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    
    // Quitar el log anterior, ya tenemos los detallados
    // console.log('Movimientos Agrupados Calculados:', resultadoAgrupado);
    console.log('--- Fin Recalculo movimientosAgrupados ---');
    
    return resultadoAgrupado;
  }, [movimientos, depositos, movimientosFiltrados, depositosFiltrados]); // Asegurar dependencias correctas

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ p: 3 }}>
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

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Balance Wepa USD
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Filtros de fecha */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#2A2A2A' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={(newValue) => setFechaInicio(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={(newValue) => setFechaFin(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={cargarDatos}
                disabled={loading || !fechaInicio || !fechaFin}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {loading ? "Cargando..." : "Buscar"}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Columna 1: Totales en columna vertical */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%', bgcolor: '#1E1E1E', color: 'white' }}>
                <CardHeader 
                  title="Resumen por Fecha" 
                  subheader="Servicios realizados y montos"
                  titleTypographyProps={{ variant: 'h6' }}
                  subheaderTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                <CardContent>
                  {/* Totales en columna vertical */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Total Pagos */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#2E7D32', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PaymentIcon sx={{ mr: 1, color: 'white' }} />
                        <Typography variant="subtitle1" color="white">Total Pagos:</Typography>
                      </Box>
                      <Typography variant="h6" color="white">
                        {formatCurrency.dollars(totalPagos)}
                      </Typography>
                    </Box>
                    
                    {/* Total Retiros */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#F57C00', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyOffIcon sx={{ mr: 1, color: 'white' }} />
                        <Typography variant="subtitle1" color="white">Total Retiros:</Typography>
                      </Box>
                      <Typography variant="h6" color="white">
                        {formatCurrency.dollars(totalRetiros)}
                      </Typography>
                    </Box>
                    
                    {/* Total Depósitos Bancarios */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#9C27B0', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1, color: 'white' }} />
                        <Typography variant="subtitle1" color="white">Total Depósitos:</Typography>
                      </Box>
                      <Typography variant="h6" color="white">
                        {formatCurrency.dollars(totalDepositos)}
                      </Typography>
                    </Box>
                    
                    {/* Total a depositar */}
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#1976D2', 
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon sx={{ mr: 1, color: 'white' }} />
                        <Typography variant="subtitle1" color="white">Total a Depositar:</Typography>
                      </Box>
                      <Typography variant="h6" color="white">
                        {formatCurrency.dollars(totalADepositar)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Columna 2: Datos de MovimientoCaja */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%', bgcolor: '#1E1E1E', color: 'white' }}>
                <CardHeader 
                  title="Detalle de Movimientos" 
                  subheader="Movimientos de Wepa USD por caja"
                  titleTypographyProps={{ variant: 'h6' }}
                  subheaderTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                <CardContent>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        placeholder="Buscar por caja, fecha o ID"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.23)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976D2',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiInputAdornment-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <TableContainer sx={{ 
                    maxHeight: 400, 
                    '&::-webkit-scrollbar': {
                      width: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '5px',
                    },
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>Fecha</TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>Caja</TableCell>
                          <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>Pagos</TableCell>
                          <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>Retiros</TableCell>
                          <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>Comprobante</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {movimientosAgrupados.length > 0 ? (
                          movimientosAgrupados.map((movimiento) => (
                            <TableRow 
                              key={movimiento.fecha + movimiento.cajaId}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: 'rgba(255, 255, 255, 0.08)' 
                                },
                                '& .MuiTableCell-root': {
                                  borderColor: 'rgba(255, 255, 255, 0.08)'
                                },
                                ...(movimiento.tipo === 'DEPOSITO' && {
                                  bgcolor: 'rgba(156, 39, 176, 0.1)',
                                  '&:hover': { 
                                    bgcolor: 'rgba(156, 39, 176, 0.2)' 
                                  }
                                })
                              }}
                            >
                              <TableCell sx={{ color: 'white' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CalendarMonthIcon sx={{ fontSize: 16, mr: 0.5, color: 'rgba(255, 255, 255, 0.7)' }} />
                                  {formatearFecha(movimiento.fecha)}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {movimiento.tipo === 'CAJA' ? (
                                    <ReceiptIcon sx={{ fontSize: 14, mr: 0.5, color: 'rgba(255, 255, 255, 0.7)' }} />
                                  ) : (
                                    <DescriptionIcon sx={{ fontSize: 14, mr: 0.5, color: 'rgba(156, 39, 176, 0.7)' }} />
                                  )}
                                  <Typography variant="body2">
                                    {movimiento.tipo === 'CAJA' 
                                      ? `Caja #${movimiento.numeroEntero} ${movimiento.sucursal} ${movimiento.usuario}`
                                      : `Depósito #${movimiento.numeroDeposito}`}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white' }}>
                                {movimiento.montosPago > 0 ? formatCurrency.dollars(movimiento.montosPago) : '-'}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white' }}>
                                {movimiento.montosRetiro > 0 ? formatCurrency.dollars(movimiento.montosRetiro) : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {movimiento.comprobantes.length > 0 ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => verComprobante(movimiento.comprobantes[0])}
                                    startIcon={<VisibilityIcon />}
                                    sx={{ 
                                      fontSize: '0.75rem', 
                                      py: 0.5,
                                      borderColor: 'rgba(255, 255, 255, 0.3)',
                                      color: 'white',
                                      '&:hover': {
                                        borderColor: '#1976D2',
                                        bgcolor: 'rgba(25, 118, 210, 0.1)'
                                      }
                                    }}
                                  >
                                    Ver
                                  </Button>
                                ) : (
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ color: 'white' }}>
                              No se encontraron movimientos
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
        )}
        
        {/* Modal para visualizar comprobantes */}
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#1E1E1E',
              color: 'white',
              maxHeight: '90vh',
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#1E1E1E', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Comprobante</Typography>
            <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#1E1E1E', display: 'flex', justifyContent: 'center', p: 1 }}>
            {loadingComprobante ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
              </Box>
            ) : comprobanteUrl ? (
              <Box sx={{ maxWidth: '100%', maxHeight: '70vh', overflow: 'auto' }}>
                <img 
                  src={comprobanteUrl} 
                  alt="Comprobante" 
                  style={{ 
                    maxWidth: '100%', 
                    display: 'block',
                    margin: '0 auto',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }} 
                  onError={() => setError('Error al cargar la imagen del comprobante')}
                />
              </Box>
            ) : (
              <Typography sx={{ color: 'white' }}>No se pudo cargar el comprobante</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#1E1E1E', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Button onClick={handleCloseModal} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BalanceWepaUsd; 
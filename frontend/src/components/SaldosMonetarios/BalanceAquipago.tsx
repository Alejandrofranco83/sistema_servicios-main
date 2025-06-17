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
  GlobalStyles
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import { formatCurrency } from '../../utils/formatUtils';
import api from '../../services/api';
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

const BalanceAquipago: React.FC = () => {
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

  // Cargar datos al iniciar el componente
  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  // Función para cargar datos
  const cargarDatos = async () => {
    if (!fechaInicio || !fechaFin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Formatear fechas para la API usando fecha local (no UTC)
      const formatearFechaLocal = (fecha: Date) => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const inicio = formatearFechaLocal(fechaInicio);
      const fin = formatearFechaLocal(fechaFin);
      
      console.log('=== DIAGNÓSTICO FILTRO FECHAS ===');
      console.log('Fechas del componente:');
      console.log('  - fechaInicio (objeto Date):', fechaInicio);
      console.log('  - fechaFin (objeto Date):', fechaFin);
      console.log('Comparación de métodos de formato:');
      console.log('  - Método anterior (UTC):', fechaInicio.toISOString().split('T')[0], 'y', fechaFin.toISOString().split('T')[0]);
      console.log('  - Método nuevo (LOCAL):', inicio, 'y', fin);
      console.log('  - URL completa:', `/api/aquipago/movimientos?fechaInicio=${inicio}&fechaFin=${fin}`);
      
      // Usar la nueva API específica para Aqui Pago
      const response = await api.get<ApiResponse>(`/api/aquipago/movimientos?fechaInicio=${inicio}&fechaFin=${fin}`);
      
      console.log('Respuesta de la API:');
      console.log('  - response.data completo:', response.data);
      
      // Procesar la respuesta de la API
      if (response.data) {
        console.log('Datos recibidos de la API:');
        console.log('  - Cantidad de movimientos:', response.data.movimientos?.length || 0);
        console.log('  - Cantidad de depósitos:', response.data.depositos?.length || 0);
        
        // Log detallado de las fechas de los movimientos
        if (response.data.movimientos && response.data.movimientos.length > 0) {
          console.log('Fechas de movimientos recibidos:');
          response.data.movimientos.forEach((mov, index) => {
            console.log(`  [${index}] ID: ${mov.id}, Fecha original: "${mov.fecha}", Fecha parseada: ${new Date(mov.fecha)}, Servicio: ${mov.servicio}`);
          });
        }
        
        // Log detallado de las fechas de los depósitos
        if (response.data.depositos && response.data.depositos.length > 0) {
          console.log('Fechas de depósitos recibidos:');
          response.data.depositos.forEach((dep, index) => {
            console.log(`  [${index}] ID: ${dep.id}, Fecha original: "${dep.fecha}", Fecha parseada: ${new Date(dep.fecha)}`);
          });
        }
        
        setMovimientos(response.data.movimientos);
        setDepositos(response.data.depositos || []);
        setTotalPagos(response.data.totalPagos);
        setTotalRetiros(response.data.totalRetiros);
        setTotalDepositos(response.data.totalDepositos || 0);
        setTotalADepositar(response.data.totalADepositar);
        
        console.log('Totales calculados por la API:');
        console.log('  - totalPagos:', response.data.totalPagos);
        console.log('  - totalRetiros:', response.data.totalRetiros);
        console.log('  - totalDepositos:', response.data.totalDepositos || 0);
        console.log('  - totalADepositar:', response.data.totalADepositar);
        
      } else {
        console.log('⚠️ No hay datos en response.data');
        // Si no hay datos, inicializar con valores vacíos
        setMovimientos([]);
        setDepositos([]);
        setTotalPagos(0);
        setTotalRetiros(0);
        setTotalDepositos(0);
        setTotalADepositar(0);
      }
      
    } catch (err: any) {
      console.error('❌ Error al cargar datos:', err);
      console.error('Detalles del error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al cargar los datos de Aquipago');
      
      // Si hay un error, mostrar datos vacíos
      setMovimientos([]);
      setDepositos([]);
      setTotalPagos(0);
      setTotalRetiros(0);
      setTotalDepositos(0);
      setTotalADepositar(0);
    } finally {
      console.log('=== FIN DIAGNÓSTICO CARGA DATOS ===');
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

      console.log('Ruta de comprobante original:', nombreArchivo);
      
      // Intentar primero con el nombre del archivo solo (última parte de la ruta)
      try {
        const nombreArchivoSolo = nombreArchivo.split('/').pop() || nombreArchivo;
        console.log('Intentando con solo el nombre del archivo:', nombreArchivoSolo);
        
        const response = await api.get(`/api/aquipago/comprobante/${encodeURIComponent(nombreArchivoSolo)}`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
        return;
      } catch (error) {
        console.log('Error con nombre de archivo, intentando con ruta completa...');
      }
      
      // Si falla, intentar con la ruta completa
      try {
        console.log('Intentando con ruta completa');
        const response = await api.get(`/api/aquipago/comprobante/${encodeURIComponent(nombreArchivo)}`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al obtener comprobante:', error);
        setError('No se pudo visualizar el comprobante solicitado');
      }
    } catch (err) {
      console.error('Error al ver comprobante:', err);
      setError('Error al visualizar el comprobante solicitado');
    }
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
    
    console.log('=== DIAGNÓSTICO AGRUPACIÓN DE MOVIMIENTOS ===');
    console.log('Entrada al useMemo:');
    console.log('  - movimientos.length:', movimientos.length);
    console.log('  - movimientosFiltrados.length:', movimientosFiltrados.length);
    console.log('  - filtroEstado actual:', filtroEstado);
    console.log('  - busqueda actual:', busqueda);

    // Primer paso: agrupar movimientos de caja por fecha y caja
    movimientosFiltrados.forEach((m, index) => {
      console.log(`--- Procesando movimiento ${index + 1} de ${movimientosFiltrados.length} ---`);
      console.log('Movimiento completo:', m);
      
      // ---> [MODIFICACIÓN] Usar solo la fecha (YYYY-MM-DD) para la clave de agrupación
      const fechaParte = m.fecha.split('T')[0]; // Extraer solo YYYY-MM-DD
      const clave = `C_${fechaParte}_${m.cajaId}`;
      
      console.log('Procesamiento de fecha:');
      console.log(`  - Fecha original: "${m.fecha}"`);
      console.log(`  - Fecha parte (solo YYYY-MM-DD): "${fechaParte}"`);
      console.log(`  - Clave generada: "${clave}"`);
      console.log(`  - Servicio: "${m.servicio}"`);
      console.log(`  - Monto: ${m.monto}`);
      
      if (!agrupado[clave]) {
        console.log(`  ✅ Creando nueva entrada para clave: ${clave}`);
        agrupado[clave] = {
          fecha: m.fecha,
          cajaId: m.cajaId,
          numeroEntero: m.numeroEntero || 0,
          sucursal: m.sucursal || '',
          usuario: m.usuario || '',
          montosPago: 0,
          montosRetiro: 0,
          tipo: 'CAJA',
          comprobantes: []
        };
      } else {
        console.log(`  ♻️ Entrada existente para clave: ${clave}`);
      }
      
      // Acumular montos según SERVICIO
      if (m.servicio === 'pagos') { 
        const montoAnterior = agrupado[clave].montosPago;
        agrupado[clave].montosPago += m.monto;
        console.log(`  💰 PAGO - Anterior: ${montoAnterior}, Nuevo: ${agrupado[clave].montosPago} (+${m.monto})`);
      } else if (m.servicio === 'retiros') { 
        const montoAnterior = agrupado[clave].montosRetiro;
        agrupado[clave].montosRetiro += m.monto;
        console.log(`  💸 RETIRO - Anterior: ${montoAnterior}, Nuevo: ${agrupado[clave].montosRetiro} (+${m.monto})`);
      } else {
        console.warn(`  ⚠️ SERVICIO NO RECONOCIDO: "${m.servicio}" para mov ID ${m.id}`);
      }
      
      // Guardar comprobante si existe (usar rutaComprobante)
      if (m.rutaComprobante && !agrupado[clave].comprobantes.includes(m.rutaComprobante)) {
        agrupado[clave].comprobantes.push(m.rutaComprobante);
        console.log(`  📄 Comprobante agregado: ${m.rutaComprobante}`);
      }
    });

    console.log('=== PROCESANDO DEPÓSITOS ===');
    console.log('  - depositos.length:', depositos.length);
    console.log('  - depositosFiltrados.length:', depositosFiltrados.length);
    
    // Segundo paso: agregar los depósitos bancarios
    depositosFiltrados.forEach((d, index) => {
      console.log(`--- Procesando depósito ${index + 1} de ${depositosFiltrados.length} ---`);
      console.log('Depósito completo:', d);
      
      const clave = `D_${d.fecha}_${d.id}`;
      
      // Determinar el número a mostrar: primero numeroComprobante, luego numeroDeposito, finalmente ID
      const numeroAMostrar = d.numeroComprobante || d.numeroDeposito || `${d.id}`;
      
      console.log('Procesamiento de depósito:');
      console.log(`  - Fecha: "${d.fecha}"`);
      console.log(`  - ID: ${d.id}`);
      console.log(`  - Número a mostrar: "${numeroAMostrar}"`);
      console.log(`  - Monto: ${d.monto}`);
      console.log(`  - Clave generada: "${clave}"`);
      
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
        numeroComprobante: d.numeroComprobante,
        comprobantes: d.rutaComprobante ? [d.rutaComprobante] : []
      };
      
      console.log(`  ✅ Depósito procesado como retiro de ${d.monto}`);
    });
    
    const resultadoAgrupado = Object.values(agrupado).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    
    console.log('=== RESULTADO FINAL DE AGRUPACIÓN ===');
    console.log(`Total de entradas agrupadas: ${resultadoAgrupado.length}`);
    console.log('Resumen por tipo:');
    const cajas = resultadoAgrupado.filter(r => r.tipo === 'CAJA');
    const depositosAgrupados = resultadoAgrupado.filter(r => r.tipo === 'DEPOSITO');
    console.log(`  - Cajas agrupadas: ${cajas.length}`);
    console.log(`  - Depósitos: ${depositosAgrupados.length}`);
    
    resultadoAgrupado.forEach((item, index) => {
      console.log(`[${index}] ${item.tipo} - Fecha: ${item.fecha}, Caja: ${item.cajaId}, Pagos: ${item.montosPago}, Retiros: ${item.montosRetiro}`);
    });
    
    console.log('=== FIN DIAGNÓSTICO AGRUPACIÓN ===');
    
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
          Balance Aqui Pago
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
                        {formatCurrency.guaranies(totalPagos)}
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
                        {formatCurrency.guaranies(totalRetiros)}
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
                        {formatCurrency.guaranies(totalDepositos)}
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
                        {formatCurrency.guaranies(totalADepositar)}
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
                  subheader="Movimientos de Aqui Pago por caja"
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
                                {movimiento.montosPago > 0 ? formatCurrency.guaranies(movimiento.montosPago) : '-'}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white' }}>
                                {movimiento.montosRetiro > 0 ? formatCurrency.guaranies(movimiento.montosRetiro) : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {(() => {
                                  // Verificar si hay comprobante válido (no vacío y no .txt)
                                  const tieneComprobanteValido = movimiento.comprobantes.length > 0 && 
                                    !movimiento.comprobantes[0].toLowerCase().endsWith('.txt');
                                  
                                  return (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      disabled={!tieneComprobanteValido}
                                      onClick={() => tieneComprobanteValido && verComprobante(movimiento.comprobantes[0])}
                                      startIcon={<VisibilityIcon />}
                                      sx={{ 
                                        fontSize: '0.75rem', 
                                        py: 0.5,
                                        borderColor: tieneComprobanteValido 
                                          ? 'rgba(255, 255, 255, 0.3)' 
                                          : 'rgba(255, 255, 255, 0.12)',
                                        color: tieneComprobanteValido 
                                          ? 'white' 
                                          : 'rgba(255, 255, 255, 0.3)',
                                        '&:hover': tieneComprobanteValido ? {
                                          borderColor: '#1976D2',
                                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                                        } : {},
                                        '&.Mui-disabled': {
                                          borderColor: 'rgba(255, 255, 255, 0.12)',
                                          color: 'rgba(255, 255, 255, 0.3)'
                                        }
                                      }}
                                    >
                                      Ver
                                    </Button>
                                  );
                                })()}
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
      </Box>
    </LocalizationProvider>
  );
};

export default BalanceAquipago; 
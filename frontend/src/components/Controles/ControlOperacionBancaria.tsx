import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isValid, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface OperacionBancaria {
  id: number;
  fechaOperacion: string;
  tipoOperacion: string;
  monto: number;
  descripcion: string;
  numeroReferencia: string;
  cuentaBancaria: {
    id: number;
    numeroCuenta: string;
    banco: string;
    sucursal: string;
  };
  sucursal: {
    id: number;
    nombre: string;
  };
  usuarioCreacion: {
    id: number;
    username: string;
  };
  caja: {
    id: number;
    numero: string;
    nombre: string;
    cajaEnteroId: number;
    sucursal: {
      id: number;
      nombre: string;
    } | null;
  };
  usuarioId: number | null; // Campo para verificación (1 = verificado, null = sin verificar)
  fechaCreacion: string;
  fechaActualizacion: string;
  montoACobrar?: number;
  montoOriginal?: number;
  rutaComprobante?: string; // Campo para el comprobante
}

interface Filtros {
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  sucursal: string;
  tipo: string;
  estado: string;
  cuenta: string;
  caja: string;
  usuario: string;
  comprobante: string;
}

const ControlOperacionBancaria: React.FC = () => {
  const [operaciones, setOperaciones] = useState<OperacionBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOperaciones, setTotalOperaciones] = useState(0);
  const [totalMontoSinVerificar, setTotalMontoSinVerificar] = useState(0);
  const [cantidadSinVerificar, setCantidadSinVerificar] = useState(0);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<OperacionBancaria | null>(null);
  const [dialogoVerificar, setDialogoVerificar] = useState(false);
  const [dialogoDetalle, setDialogoDetalle] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dialogoComprobante, setDialogoComprobante] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<string | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>({
    fechaDesde: subDays(new Date(), 30),
    fechaHasta: addDays(new Date(), 1), // Mañana para incluir todas las operaciones de hoy
    sucursal: '',
    tipo: '',
    estado: '',
    cuenta: '',
    caja: '',
    usuario: '',
    comprobante: '',
  });

  // Log inicial de fechas
  useEffect(() => {
    console.log('=== FILTROS INICIALES ===');
    console.log('fechaDesde inicial:', filtros.fechaDesde);
    console.log('fechaDesde inicial ISO:', filtros.fechaDesde?.toISOString());
    console.log('fechaHasta inicial:', filtros.fechaHasta);
    console.log('fechaHasta inicial ISO:', filtros.fechaHasta?.toISOString());
    console.log('Fecha actual:', new Date());
    console.log('Fecha hace 30 días:', subDays(new Date(), 30));
    console.log('Zona horaria actual:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Log cuando cambian los filtros
  useEffect(() => {
    console.log('=== CAMBIO EN FILTROS ===');
    console.log('Nuevo filtros.fechaDesde:', filtros.fechaDesde);
    console.log('Nuevo filtros.fechaHasta:', filtros.fechaHasta);
    if (filtros.fechaDesde) {
      console.log('fechaDesde ISO:', filtros.fechaDesde.toISOString());
    }
    if (filtros.fechaHasta) {
      console.log('fechaHasta ISO:', filtros.fechaHasta.toISOString());
    }
  }, [filtros.fechaDesde, filtros.fechaHasta]);

  // Listas para los selectores
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const tiposOperacion = ['POS', 'TRANSFERENCIA', 'DEPOSITO', 'RETIRO', 'PAGO'];
  const estadosVerificacion = [
    { value: '', label: 'Todos' },
    { value: 'verificado', label: 'Verificado' },
    { value: 'sin_verificar', label: 'Sin Verificar' }
  ];

  const { user } = useAuth();

  // Función helper para formatear fechas de manera segura
  const formatearFechaSafe = (fechaString: string | null | undefined, formatString: string = 'dd/MM/yyyy'): string => {
    if (!fechaString) return 'N/A';
    
    try {
      const fecha = parseISO(fechaString);
      if (!isValid(fecha)) return 'Fecha inválida';
      return format(fecha, formatString);
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'Fecha:', fechaString);
      return 'Fecha inválida';
    }
  };

  useEffect(() => {
    cargarOperaciones();
    cargarDatosParaFiltros();
  }, [page, rowsPerPage]);

  useEffect(() => {
    // Recargar cuando cambien los filtros
    if (page === 0) {
      cargarOperaciones();
    } else {
      setPage(0); // Esto triggeará el useEffect anterior
    }
  }, [filtros]);

  const cargarOperaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== DEBUG FECHAS EN FRONTEND ===');
      console.log('filtros.fechaDesde:', filtros.fechaDesde);
      console.log('filtros.fechaHasta:', filtros.fechaHasta);
      console.log('Tipo de fechaDesde:', typeof filtros.fechaDesde);
      console.log('Tipo de fechaHasta:', typeof filtros.fechaHasta);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });

      // Agregar filtros a la consulta
      if (filtros.fechaDesde) {
        const fechaDesdeFormatted = format(filtros.fechaDesde, 'yyyy-MM-dd');
        console.log('fechaDesde formateada:', fechaDesdeFormatted);
        console.log('fechaDesde objeto Date:', filtros.fechaDesde);
        console.log('fechaDesde ISO:', filtros.fechaDesde.toISOString());
        console.log('fechaDesde timezone offset:', filtros.fechaDesde.getTimezoneOffset());
        params.append('fechaDesde', fechaDesdeFormatted);
      }
      if (filtros.fechaHasta) {
        const fechaHastaFormatted = format(filtros.fechaHasta, 'yyyy-MM-dd');
        console.log('fechaHasta formateada:', fechaHastaFormatted);
        console.log('fechaHasta objeto Date:', filtros.fechaHasta);
        console.log('fechaHasta ISO:', filtros.fechaHasta.toISOString());
        console.log('fechaHasta timezone offset:', filtros.fechaHasta.getTimezoneOffset());
        params.append('fechaHasta', fechaHastaFormatted);
      }
      
      // Resto de filtros...
      if (filtros.sucursal) {
        params.append('sucursalId', filtros.sucursal);
      }
      if (filtros.tipo) {
        params.append('tipoOperacion', filtros.tipo);
      }
      if (filtros.estado) {
        params.append('verificado', filtros.estado === 'verificado' ? 'true' : 'false');
      }
      if (filtros.cuenta) {
        params.append('cuentaBancariaId', filtros.cuenta);
      }
      if (filtros.caja) {
        params.append('cajaId', filtros.caja);
      }
      if (filtros.usuario) {
        params.append('usuarioCreacionId', filtros.usuario);
      }
      if (filtros.comprobante) {
        params.append('search', filtros.comprobante);
      }

      const urlCompleta = `/api/operaciones-bancarias/control?${params}`;
      console.log('URL de la consulta:', urlCompleta);
      console.log('Parámetros enviados:', params.toString());

      const response = await api.get(urlCompleta);
      console.log('Respuesta del servidor:', response.data);
      
      const data = Array.isArray(response.data) ? response.data : response.data.operaciones || [];
      console.log('Datos procesados:', data.length, 'operaciones');
      
      if (data.length > 0) {
        console.log('Primera operación recibida:');
        console.log('- ID:', data[0].id);
        console.log('- Fecha:', data[0].fechaOperacion);
        console.log('- Tipo:', data[0].tipoOperacion);
        console.log('- Caja:', data[0].caja);
      }
      
      setOperaciones(data);
      setTotalOperaciones(response.data.total || data.length || 0);
      
      // Actualizar totales de operaciones sin verificar
      setTotalMontoSinVerificar(response.data.totalMontoSinVerificar || 0);
      setCantidadSinVerificar(response.data.cantidadSinVerificar || 0);
      
      console.log('Total monto sin verificar:', response.data.totalMontoSinVerificar);
      console.log('Cantidad sin verificar:', response.data.cantidadSinVerificar);
    } catch (error: any) {
      console.error('Error al cargar operaciones:', error);
      setError('Error al cargar las operaciones bancarias');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosParaFiltros = async () => {
    try {
      // Cargar sucursales
      const responseSucursales = await api.get('/api/operaciones-bancarias/sucursales');
      setSucursales(responseSucursales.data || []);

      // Cargar cuentas bancarias
      const responseCuentas = await api.get('/api/operaciones-bancarias/cuentas-bancarias');
      setCuentas(responseCuentas.data || []);

      // Cargar cajas
      const responseCajas = await api.get('/api/operaciones-bancarias/cajas');
      setCajas(responseCajas.data || []);

      // Cargar usuarios
      const responseUsuarios = await api.get('/api/operaciones-bancarias/usuarios');
      setUsuarios(responseUsuarios.data || []);
    } catch (error) {
      console.error('Error al cargar datos para filtros:', error);
    }
  };

  const handleVerificarOperacion = async (operacion: OperacionBancaria) => {
    console.log('=== DEBUG VERIFICAR OPERACION ===');
    console.log('Operación recibida:', operacion);
    console.log('ID:', operacion?.id);
    console.log('Tipo:', operacion?.tipoOperacion);
    console.log('Monto:', operacion?.monto);
    console.log('Cuenta bancaria:', operacion?.cuentaBancaria);
    setOperacionSeleccionada(operacion);
    setDialogoVerificar(true);
  };

  const confirmarVerificacion = async () => {
    if (!operacionSeleccionada) return;

    try {
      setVerificando(true);
      setError(null);

      // Usar la nueva ruta PATCH específica para verificación
      await api.patch(`/api/operaciones-bancarias/${operacionSeleccionada.id}/verificacion`, {
        usuarioId: 1 // Marcar como verificado con entero 1
      });

      setSuccess('Operación verificada correctamente');
      setDialogoVerificar(false);
      setOperacionSeleccionada(null);
      cargarOperaciones(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al verificar operación:', error);
      setError('Error al verificar la operación');
    } finally {
      setVerificando(false);
    }
  };

  const handleDesverificarOperacion = async (operacion: OperacionBancaria) => {
    try {
      setVerificando(true);
      setError(null);

      await api.patch(`/api/operaciones-bancarias/${operacion.id}/verificacion`, {
        usuarioId: null // Marcar como no verificado con null
      });

      setSuccess('Verificación removida correctamente');
      cargarOperaciones(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al desverificar operación:', error);
      setError('Error al remover la verificación');
    } finally {
      setVerificando(false);
    }
  };

  const handleVerDetalle = (operacion: OperacionBancaria) => {
    setOperacionSeleccionada(operacion);
    setDialogoDetalle(true);
  };

  const handleVerComprobante = (rutaComprobante: string) => {
    setComprobanteSeleccionado(rutaComprobante);
    setDialogoComprobante(true);
  };

  const cerrarComprobante = () => {
    setDialogoComprobante(false);
    setComprobanteSeleccionado(null);
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: subDays(new Date(), 30),
      fechaHasta: addDays(new Date(), 1), // Mañana para incluir todas las operaciones de hoy
      sucursal: '',
      tipo: '',
      estado: '',
      cuenta: '',
      caja: '',
      usuario: '',
      comprobante: '',
    });
  };

  const formatearMonto = (monto: number | string | null | undefined) => {
    // Verificar si el monto es null, undefined o cadena vacía
    if (monto === null || monto === undefined || monto === '') {
      return 'N/A';
    }

    // Convertir a número si es string
    let montoNumerico: number;
    if (typeof monto === 'string') {
      montoNumerico = parseFloat(monto);
    } else {
      montoNumerico = monto;
    }

    // Verificar si es un número válido
    if (!Number.isFinite(montoNumerico) || isNaN(montoNumerico)) {
      return 'Monto inválido';
    }

    // Formatear el monto
    try {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montoNumerico);
    } catch (error) {
      console.error('Error al formatear monto:', error, 'Monto:', monto);
      return 'Error formato';
    }
  };

  const getEstadoChip = (operacion: OperacionBancaria) => {
    const esVerificado = operacion.usuarioId === 1; // Verificar si es entero 1
    return (
      <Chip
        icon={esVerificado ? <CheckCircleIcon /> : <CancelIcon />}
        label={esVerificado ? 'Verificado' : 'Sin Verificar'}
        color={esVerificado ? 'success' : 'warning'}
        size="small"
      />
    );
  };

  // Cerrar alertas automáticamente
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Control de Operaciones Bancarias
        </Typography>

        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Controles principales */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por comprobante"
                  value={filtros.comprobante}
                  onChange={(e) => setFiltros(prev => ({ ...prev, comprobante: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={cargarOperaciones}
                    disabled={loading}
                  >
                    Buscar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filtros
                  </Button>
                  <IconButton onClick={cargarOperaciones} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    height: 140,
                    bgcolor: 'rgba(255, 152, 0, 0.12)', // Naranja claro
                    color: (theme) => theme.palette.warning.main,
                    borderRadius: 2,
                    borderLeft: (theme) => `4px solid ${theme.palette.warning.main}`,
                    transition: 'transform 0.2s',
                    boxShadow: (theme) => theme.shadows[2],
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                    <WarningIcon />
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>
                      Operaciones Sin Verificar
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', width: '100%' }}>
                    {formatearMonto(totalMontoSinVerificar)}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.7 }}>
                    {cantidadSinVerificar} operación{cantidadSinVerificar !== 1 ? 'es' : ''}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Panel de Filtros Expandible */}
            {showFilters && (
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1, 
                border: 1, 
                borderColor: 'divider',
                boxShadow: 1
              }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Filtros Avanzados
                </Typography>
                <Grid container spacing={2}>
                  {/* Fechas */}
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Fecha Desde"
                      value={filtros.fechaDesde}
                      onChange={(newValue) => setFiltros(prev => ({ ...prev, fechaDesde: newValue }))}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Fecha Hasta"
                      value={filtros.fechaHasta}
                      onChange={(newValue) => setFiltros(prev => ({ ...prev, fechaHasta: newValue }))}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>

                  {/* Sucursal */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sucursal</InputLabel>
                      <Select
                        value={filtros.sucursal}
                        label="Sucursal"
                        onChange={(e) => setFiltros(prev => ({ ...prev, sucursal: e.target.value }))}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {sucursales.map(sucursal => (
                          <MenuItem key={sucursal.id} value={sucursal.id.toString()}>
                            {sucursal.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Tipo de Operación */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={filtros.tipo}
                        label="Tipo"
                        onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {tiposOperacion.map(tipo => (
                          <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Estado */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={filtros.estado}
                        label="Estado"
                        onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                      >
                        {estadosVerificacion.map(estado => (
                          <MenuItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Cuenta Bancaria */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Cuenta</InputLabel>
                      <Select
                        value={filtros.cuenta}
                        label="Cuenta"
                        onChange={(e) => setFiltros(prev => ({ ...prev, cuenta: e.target.value }))}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {cuentas.map(cuenta => (
                          <MenuItem key={cuenta.id} value={cuenta.id.toString()}>
                            {cuenta.banco} - {cuenta.numeroCuenta}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Caja */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Caja</InputLabel>
                      <Select
                        value={filtros.caja}
                        label="Caja"
                        onChange={(e) => setFiltros(prev => ({ ...prev, caja: e.target.value }))}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {cajas.map(caja => (
                          <MenuItem key={caja.id} value={caja.id.toString()}>
                            Caja {caja.cajaEnteroId} - {caja.sucursal?.nombre || 'Sin sucursal'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Usuario */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Usuario</InputLabel>
                      <Select
                        value={filtros.usuario}
                        label="Usuario"
                        onChange={(e) => setFiltros(prev => ({ ...prev, usuario: e.target.value }))}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {usuarios.map(usuario => (
                          <MenuItem key={usuario.id} value={usuario.id.toString()}>
                            {usuario.username}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Botones de acción para filtros */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={limpiarFiltros}
                    color="secondary"
                  >
                    Limpiar Filtros
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Operaciones */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Banco/Cuenta</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Caja</TableCell>
                    <TableCell>Referencia</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Comprobante</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : operaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        No se encontraron operaciones bancarias
                      </TableCell>
                    </TableRow>
                  ) : (
                    operaciones.map((operacion) => (
                      <TableRow key={operacion.id}>
                        <TableCell>
                          {formatearFechaSafe(operacion.fechaOperacion)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={operacion.tipoOperacion || 'N/A'} 
                            size="small"
                            color={
                              operacion.tipoOperacion === 'DEPOSITO' ? 'success' :
                              operacion.tipoOperacion === 'RETIRO' ? 'error' :
                              operacion.tipoOperacion === 'POS' ? 'info' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{formatearMonto(operacion.monto)}</TableCell>
                        <TableCell>
                          {operacion.cuentaBancaria?.banco || 'N/A'}
                          <br />
                          <Typography variant="caption" color="textSecondary">
                            {operacion.cuentaBancaria?.numeroCuenta || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{operacion.sucursal?.nombre || 'N/A'}</TableCell>
                        <TableCell>
                          {operacion.caja?.numero ? `Caja ${operacion.caja.numero}` : 'N/A'}
                        </TableCell>
                        <TableCell>{operacion.numeroReferencia || 'N/A'}</TableCell>
                        <TableCell>{getEstadoChip(operacion)}</TableCell>
                        <TableCell>{operacion.usuarioCreacion?.username || 'N/A'}</TableCell>
                        <TableCell>
                          {operacion.rutaComprobante ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleVerComprobante(operacion.rutaComprobante!)}
                            >
                              Ver
                            </Button>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Sin comprobante
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Ver Detalle">
                              <IconButton 
                                size="small" 
                                onClick={() => handleVerDetalle(operacion)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            {operacion.usuarioId === 1 ? (
                              <Tooltip title="Desverificar">
                                <IconButton 
                                  size="small" 
                                  color="warning"
                                  onClick={() => handleDesverificarOperacion(operacion)}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Verificar">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleVerificarOperacion(operacion)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalOperaciones}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>

        {/* Diálogo de Verificación */}
        <Dialog open={dialogoVerificar} onClose={() => setDialogoVerificar(false)}>
          <DialogTitle>Verificar Operación Bancaria</DialogTitle>
          <DialogContent>
            {operacionSeleccionada ? (
              <Box>
                <Typography variant="body1" paragraph>
                  ¿Está seguro de que desea verificar esta operación bancaria?
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    Detalles de la Operación:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Fecha:</strong> {formatearFechaSafe(operacionSeleccionada.fechaOperacion)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Tipo:</strong> {operacionSeleccionada.tipoOperacion || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Monto:</strong> {formatearMonto(operacionSeleccionada.monto)}
                  </Typography>
                  {operacionSeleccionada.montoACobrar && operacionSeleccionada.montoACobrar !== operacionSeleccionada.monto && (
                    <>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Monto Base:</strong> {formatearMonto(operacionSeleccionada.montoOriginal || operacionSeleccionada.monto)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Monto a Cobrar:</strong> {formatearMonto(operacionSeleccionada.montoACobrar)}
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Banco:</strong> {operacionSeleccionada.cuentaBancaria?.banco || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Cuenta:</strong> {operacionSeleccionada.cuentaBancaria?.numeroCuenta || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Caja:</strong> {operacionSeleccionada.caja?.numero ? `Caja ${operacionSeleccionada.caja.numero}` : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Referencia:</strong> {operacionSeleccionada.numeroReferencia || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="error">
                  Error: No se pudieron cargar los detalles de la operación.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoVerificar(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmarVerificacion} 
              variant="contained" 
              color="success"
              disabled={verificando || !operacionSeleccionada}
            >
              {verificando ? <CircularProgress size={20} /> : 'Verificar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Detalle */}
        <Dialog 
          open={dialogoDetalle} 
          onClose={() => setDialogoDetalle(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Detalle de Operación Bancaria</DialogTitle>
          <DialogContent>
            {operacionSeleccionada && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Información General</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>ID:</strong> {operacionSeleccionada.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fecha Operación:</strong> {formatearFechaSafe(operacionSeleccionada.fechaOperacion, 'dd/MM/yyyy HH:mm')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {operacionSeleccionada.tipoOperacion || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Monto:</strong> {formatearMonto(operacionSeleccionada.monto)}
                  </Typography>
                  {operacionSeleccionada.montoACobrar && operacionSeleccionada.montoACobrar !== operacionSeleccionada.monto && (
                    <>
                      <Typography variant="body2">
                        <strong>Monto Base:</strong> {formatearMonto(operacionSeleccionada.montoOriginal || operacionSeleccionada.monto)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Monto a Cobrar:</strong> {formatearMonto(operacionSeleccionada.montoACobrar)}
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2">
                    <strong>Número Referencia:</strong> {operacionSeleccionada.numeroReferencia || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Estado:</strong> {getEstadoChip(operacionSeleccionada)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Cuenta Bancaria</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Banco:</strong> {operacionSeleccionada.cuentaBancaria?.banco || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Número Cuenta:</strong> {operacionSeleccionada.cuentaBancaria?.numeroCuenta || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sucursal Banco:</strong> {operacionSeleccionada.cuentaBancaria?.sucursal || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">Descripción</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {operacionSeleccionada.descripcion || 'Sin descripción'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Sucursal</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {operacionSeleccionada.sucursal?.nombre || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Caja</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {operacionSeleccionada.caja?.numero ? `Caja ${operacionSeleccionada.caja.numero}` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Usuario Creación</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {operacionSeleccionada.usuarioCreacion?.username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Fecha Creación</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {formatearFechaSafe(operacionSeleccionada.fechaCreacion, 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Última Actualización</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {formatearFechaSafe(operacionSeleccionada.fechaActualizacion, 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
                {operacionSeleccionada.rutaComprobante && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">Comprobante</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleVerComprobante(operacionSeleccionada.rutaComprobante!)}
                      >
                        Ver Comprobante
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoDetalle(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Comprobante */}
        <Dialog 
          open={dialogoComprobante} 
          onClose={cerrarComprobante}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Comprobante</Typography>
              <Box>
                {comprobanteSeleccionado && (
                  <IconButton
                    onClick={() => window.open(`${api.defaults.baseURL}${comprobanteSeleccionado}`, '_blank')}
                    sx={{ mr: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                )}
                <IconButton onClick={cerrarComprobante}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {comprobanteSeleccionado && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '500px',
                  position: 'relative'
                }}
              >
                {comprobanteSeleccionado.toLowerCase().includes('.pdf') ? (
                  // Para PDFs
                  <iframe
                    src={`${api.defaults.baseURL}${comprobanteSeleccionado}`}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: 'none'
                    }}
                    title="Comprobante PDF"
                  />
                ) : (
                  // Para imágenes
                  <img
                    src={`${api.defaults.baseURL}${comprobanteSeleccionado}`}
                    alt="Comprobante"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      console.error('Error cargando imagen:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ControlOperacionBancaria; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Info as InfoIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';

// Interfaz para representar una sucursal
interface Sucursal {
  id: number | string;
  nombre: string;
  codigo?: string;
}

// Interfaz para representar un retiro
interface Retiro {
  id: string;
  cajaId: string;
  cajaEnteroId: number;
  cajaNombre: string;
  sucursalId: string;
  sucursalNombre: string;
  personaId: string;
  personaNombre: string;
  fecha: string;
  montoPYG: number;
  montoBRL: number;
  montoUSD: number;
  observacion: string;
  estadoRecepcion: 'PENDIENTE' | 'RECIBIDO' | 'RECHAZADO';
  fechaRecepcion?: string;
  usuarioRecepcion?: string;
  observacionRecepcion?: string;
}

interface RecibirRetirosProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
}

const RecibirRetiros: React.FC<RecibirRetirosProps> = ({ open, onClose, onGuardarExito }) => {
  const { cotizacionVigente } = useCotizacion();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para la lista de retiros pendientes
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [retirosFiltrados, setRetirosFiltrados] = useState<Retiro[]>([]);
  const [retiroSeleccionados, setRetirosSeleccionados] = useState<string[]>([]);
  
  // Estados para filtros
  const [filtroSucursal, setFiltroSucursal] = useState<string>('');
  const [filtroCaja, setFiltroCaja] = useState<string>('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  
  // Estado del formulario para observaciones al recibir
  const [observacionRecepcion, setObservacionRecepcion] = useState<string>('');

  // Lista de sucursales y cajas 
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cajas, setCajas] = useState<{id: string; nombre: string}[]>([]);

  // Cargar sucursales
  const cargarSucursales = async () => {
    try {
      const response = await axios.get('/api/sucursales');
      setSucursales(response.data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  // Extraer las cajas de los retiros cargados
  const extraerCajas = () => {
    if (!retiros || retiros.length === 0) return;
    
    // Crear un Map para mantener cajas únicas
    const cajasMap = new Map();
    
    retiros.forEach(retiro => {
      if (retiro.cajaId && !cajasMap.has(retiro.cajaId)) {
        cajasMap.set(retiro.cajaId, {
          id: retiro.cajaId,
          nombre: retiro.cajaNombre || `Caja ${retiro.cajaId.substring(0, 6)}`
        });
      }
    });
    
    // Convertir el Map a un array
    setCajas(Array.from(cajasMap.values()));
  };
  
  // Cargar retiros pendientes al abrir el diálogo
  useEffect(() => {
    if (open) {
      cargarSucursales();
      cargarRetirosPendientes();
    } else {
      // Resetear estados cuando se cierra
      resetearEstados();
    }
  }, [open]);
  
  // Extraer cajas cuando cambian los retiros
  useEffect(() => {
    extraerCajas();
  }, [retiros]);
  
  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [retiros, filtroSucursal, filtroCaja, filtroFechaDesde, filtroFechaHasta, busqueda]);
  
  // Resetear los estados cuando se cierra el dialog
  const resetearEstados = () => {
    setRetiros([]);
    setRetirosFiltrados([]);
    setRetirosSeleccionados([]);
    setFiltroSucursal('');
    setFiltroCaja('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setBusqueda('');
    setMostrarFiltros(false);
    setObservacionRecepcion('');
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para cargar los retiros pendientes
  const cargarRetirosPendientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamada real a la API para obtener los retiros pendientes
      const response = await axios.get('/api/cajas-mayor/retiros/pendientes');
      
      setRetiros(response.data);
      setRetirosFiltrados(response.data);
      
    } catch (error) {
      setError('Error al cargar los retiros pendientes. Intente nuevamente.');
      console.error('Error al cargar retiros:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Aplicar filtros a la lista de retiros
  const aplicarFiltros = () => {
    if (!retiros || retiros.length === 0) return;
    
    let resultado = [...retiros];
    
    // Filtrar por sucursal
    if (filtroSucursal) {
      resultado = resultado.filter(r => r.sucursalId === filtroSucursal);
    }
    
    // Filtrar por caja
    if (filtroCaja) {
      resultado = resultado.filter(r => r.cajaId === filtroCaja);
    }
    
    // Filtrar por fecha desde
    if (filtroFechaDesde) {
      const fechaDesde = new Date(filtroFechaDesde);
      fechaDesde.setHours(0, 0, 0, 0); // Inicio del día
      resultado = resultado.filter(r => new Date(r.fecha) >= fechaDesde);
    }
    
    // Filtrar por fecha hasta
    if (filtroFechaHasta) {
      const fechaHasta = new Date(filtroFechaHasta);
      fechaHasta.setHours(23, 59, 59, 999); // Fin del día
      resultado = resultado.filter(r => new Date(r.fecha) <= fechaHasta);
    }
    
    // Filtrar por búsqueda en texto
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase();
      resultado = resultado.filter(r => 
        (r.personaNombre?.toLowerCase() || '').includes(terminoBusqueda) || 
        (r.cajaNombre?.toLowerCase() || '').includes(terminoBusqueda) ||
        (r.sucursalNombre?.toLowerCase() || '').includes(terminoBusqueda) ||
        (r.observacion?.toLowerCase() || '').includes(terminoBusqueda)
      );
    }
    
    setRetirosFiltrados(resultado);
  };
  
  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroSucursal('');
    setFiltroCaja('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setBusqueda('');
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaIso: string) => {
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fechaIso;
    }
  };

  // Formatear montos
  const formatearMontoPYG = (monto: number): string => {
    return monto > 0 ? formatCurrency.guaranies(monto) : '-';
  };
  
  const formatearMontoBRL = (monto: number): string => {
    return monto > 0 ? `R$ ${monto.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  };
  
  const formatearMontoUSD = (monto: number): string => {
    return monto > 0 ? `US$ ${monto.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  };
  
  // Manejar cambio en checkboxes de selección
  const handleToggleSeleccion = (retiroId: string) => {
    setRetirosSeleccionados(prev => {
      if (prev.includes(retiroId)) {
        return prev.filter(id => id !== retiroId);
      } else {
        return [...prev, retiroId];
      }
    });
  };
  
  // Seleccionar o deseleccionar todos
  const toggleSeleccionarTodos = () => {
    if (retiroSeleccionados.length === retirosFiltrados.length) {
      setRetirosSeleccionados([]);
    } else {
      setRetirosSeleccionados(retirosFiltrados.map(r => r.id));
    }
  };
  
  // Manejar cambios en los Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    switch(name) {
      case 'filtroSucursal':
        setFiltroSucursal(value);
        break;
      case 'filtroCaja':
        setFiltroCaja(value);
        break;
      default:
        break;
    }
  };
  
  // Manejar cambios en los inputs de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    switch(name) {
      case 'filtroFechaDesde':
        setFiltroFechaDesde(value);
        break;
      case 'filtroFechaHasta':
        setFiltroFechaHasta(value);
        break;
      case 'busqueda':
        setBusqueda(value);
        break;
      case 'observacionRecepcion':
        setObservacionRecepcion(value);
        break;
      default:
        break;
    }
  };

  // Recibir retiros seleccionados
  const recibirRetiros = async () => {
    // Validar que haya retiros seleccionados
    if (retiroSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un retiro para recibir');
      return;
    }
    
    // Validar que tengamos un usuario autenticado
    if (!user) {
      setError('Error de autenticación. No se pudo identificar al usuario.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataToSend = {
        ids: retiroSeleccionados,
        observacion: observacionRecepcion,
        usuarioRecepcionId: user.id // Usar user.id numérico
      };
      
      console.log("Enviando datos para recibir retiros:", dataToSend);
      
      // Enviar solicitud a la API para recibir los retiros seleccionados
      const response = await axios.post('/api/cajas-mayor/retiros/recibir', dataToSend);
      
      // Mostrar mensaje de éxito
      setSuccessMessage(response.data.message || 'Retiros recibidos correctamente');
      
      // Limpiar selección
      setRetirosSeleccionados([]);
      setObservacionRecepcion('');
      
      // Recargar la lista de retiros pendientes
      await cargarRetirosPendientes();
      
      // Esperar 2 segundos antes de cerrar o llamar a onGuardarExito
      setTimeout(() => {
        setSuccessMessage(null);
        // Llamar a la función de refresco del componente padre
        onGuardarExito();
      }, 2000);
      
    } catch (error) {
      setError('Error al procesar los retiros. Intente nuevamente.');
      console.error('Error al procesar retiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar el diálogo
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Recibir Retiros en Caja Mayor</Typography>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs>
            <Typography variant="subtitle1">
              Retiros pendientes
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Buscar..."
                name="busqueda"
                value={busqueda}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <Tooltip title="Mostrar filtros avanzados">
                <IconButton 
                  color={mostrarFiltros ? "primary" : "default"} 
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Button 
                variant="outlined"
                onClick={cargarRetirosPendientes}
                disabled={loading}
                size="small"
              >
                Actualizar
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {mostrarFiltros && (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sucursal</InputLabel>
                  <Select
                    name="filtroSucursal"
                    value={filtroSucursal}
                    label="Sucursal"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {sucursales.map((sucursal) => (
                      <MenuItem key={sucursal.id} value={sucursal.id.toString()}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Caja</InputLabel>
                  <Select
                    name="filtroCaja"
                    value={filtroCaja}
                    label="Caja"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {cajas.map((caja) => (
                      <MenuItem key={caja.id} value={caja.id}>
                        {caja.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha desde"
                  name="filtroFechaDesde"
                  type="date"
                  value={filtroFechaDesde}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha hasta"
                  name="filtroFechaHasta"
                  type="date"
                  value={filtroFechaHasta}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="text" 
                color="secondary" 
                onClick={limpiarFiltros}
                size="small"
              >
                Limpiar filtros
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {retirosFiltrados.length > 0 ? (
              <>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={retiroSeleccionados.length > 0 && retiroSeleccionados.length === retirosFiltrados.length}
                            indeterminate={retiroSeleccionados.length > 0 && retiroSeleccionados.length < retirosFiltrados.length}
                            onChange={toggleSeleccionarTodos}
                          />
                        </TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Sucursal</TableCell>
                        <TableCell>Caja</TableCell>
                        <TableCell>Responsable</TableCell>
                        <TableCell align="right">Guaraníes</TableCell>
                        <TableCell align="right">Reales</TableCell>
                        <TableCell align="right">Dólares</TableCell>
                        <TableCell>Observación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {retirosFiltrados.map((retiro) => (
                        <TableRow 
                          key={retiro.id}
                          selected={retiroSeleccionados.includes(retiro.id)}
                          hover
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={retiroSeleccionados.includes(retiro.id)}
                              onChange={() => handleToggleSeleccion(retiro.id)}
                              disabled={retiro.estadoRecepcion !== 'PENDIENTE'}
                            />
                          </TableCell>
                          <TableCell>{formatearFecha(retiro.fecha)}</TableCell>
                          <TableCell>{retiro.sucursalNombre}</TableCell>
                          <TableCell>{retiro.cajaEnteroId}</TableCell>
                          <TableCell>{retiro.personaNombre}</TableCell>
                          <TableCell align="right">{formatearMontoPYG(retiro.montoPYG)}</TableCell>
                          <TableCell align="right">{formatearMontoBRL(retiro.montoBRL)}</TableCell>
                          <TableCell align="right">{formatearMontoUSD(retiro.montoUSD)}</TableCell>
                          <TableCell>{retiro.observacion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Collapse in={retiroSeleccionados.length > 0} timeout={500}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Confirmar recepción de {retiroSeleccionados.length} {retiroSeleccionados.length === 1 ? 'retiro' : 'retiros'}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      label="Observaciones de recepción (opcional)"
                      name="observacionRecepcion"
                      value={observacionRecepcion}
                      onChange={handleInputChange}
                      margin="normal"
                      autoFocus
                    />
                  </Box>
                </Collapse>
              </>
            ) : (
              <Alert severity="info">
                No hay retiros pendientes de recepción con los filtros aplicados.
              </Alert>
            )}
          </>
        )}
        
        {cotizacionVigente && (
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Cotización Vigente
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Dólar: {formatCurrency.guaranies(cotizacionVigente.valorDolar)}
              </Typography>
              <Typography variant="body2">
                Real: {formatCurrency.guaranies(cotizacionVigente.valorReal)}
              </Typography>
            </Box>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        
        {retiroSeleccionados.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={recibirRetiros}
              disabled={loading}
            >
              Confirmar Recepción
            </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RecibirRetiros; 
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Autocomplete,
  Alert,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface PagosServiciosProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
}

// Interfaz para representar una sucursal
interface Sucursal {
  id: number;
  nombre: string;
}

// Interfaz para representar una caja
interface Caja {
  id: string;
  cajaEnteroId: number;
  nombre: string;
  sucursalId: string;
  sucursalNombre: string;
  responsable: string;
  usuario?: string; // Campo para el nombre de usuario
  estado: 'ABIERTA' | 'CERRADA';
  fechaApertura: string;
  fechaCierre?: string;
  saldoPYG?: number;
  saldoBRL?: number;
  saldoUSD?: number;
}

// Definición de operadoras y servicios
const operadorasYServicios = [
  { 
    operadora: 'Tigo',
    servicios: [
      { id: 'tigo-mini-carga', nombre: 'Mini Carga' },
      { id: 'tigo-billetera', nombre: 'Billetera' }
    ]
  },
  {
    operadora: 'Personal',
    servicios: [
      { id: 'personal-maxi-carga', nombre: 'Maxi Carga' },
      { id: 'personal-billetera', nombre: 'Billetera' }
    ]
  },
  {
    operadora: 'Claro',
    servicios: [
      { id: 'claro-recarga', nombre: 'Recarga' },
      { id: 'claro-billetera', nombre: 'Billetera' }
    ]
  },
  {
    operadora: 'Otros',
    servicios: [
      { id: 'efectivo', nombre: 'Efectivo' }
    ]
  }
];

const PagosServicios: React.FC<PagosServiciosProps> = ({ open, onClose, onGuardarExito }) => {
  const { user } = useAuth();
  const { cotizacionVigente } = useCotizacion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para el servicio seleccionado
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  
  // Estado para el monto
  const [monto, setMonto] = useState('');
  
  // Estado para la observación
  const [observacion, setObservacion] = useState('');

  // Estado para el comprobante
  const [comprobante, setComprobante] = useState<File | null>(null);
  
  // Estados para la selección de sucursal y caja
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>('');
  const [cajaBuscada, setCajaBuscada] = useState<string>('');
  const [cajaSeleccionada, setCajaSeleccionada] = useState<Caja | null>(null);
  const [cajasFiltradas, setCajasFiltradas] = useState<Caja[]>([]);
  const [buscandoCajas, setBuscandoCajas] = useState(false);
  
  // Estado para almacenar las sucursales obtenidas de la API
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  // Estado para almacenar todas las cajas obtenidas de la API
  const [cajas, setCajas] = useState<Caja[]>([]);
  // Estados de carga
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [cargandoCajas, setCargandoCajas] = useState(false);

  // Dentro del componente PagosServicios, añadir un nuevo estado para la moneda
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<'PYG' | 'USD' | 'BRL'>('PYG');

  // Cargar cajas desde la API cuando se abre el diálogo
  useEffect(() => {
    const obtenerCajas = async () => {
      try {
        setCargandoCajas(true);
        
        // Obtener fecha de hace 3 días
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 3);
        
        // Formatear la fecha para la API (YYYY-MM-DD)
        const fechaFormateada = fechaLimite.toISOString().split('T')[0];
        
        console.log('Solicitando cajas desde:', fechaFormateada);
        
        // Llamada a la API para obtener cajas sin filtrar por estado
        // Utilizamos un parámetro que asegure traer todas las cajas de los últimos 3 días
        const response = await axios.get('/api/cajas');
        
        console.log('Cajas recibidas (todas):', response.data);
        
        // Obtener todas las sucursales
        const sucursalesResponse = await axios.get('/api/sucursales');
        const sucursalesData = sucursalesResponse.data || [];
        console.log('Sucursales recibidas:', sucursalesData);
        
        // Crear mapa de sucursales por ID
        const sucursalesMap = sucursalesData.reduce((map: Record<string, any>, sucursal: any) => {
          map[sucursal.id] = sucursal.nombre;
          return map;
        }, {});
        
        // Filtramos en el frontend para asegurar que tengamos cajas de los últimos 3 días
        const fechaLimiteMs = fechaLimite.getTime();
        const cajasFiltradas = response.data.filter((caja: Caja) => {
          const fechaApertura = new Date(caja.fechaApertura).getTime();
          return fechaApertura >= fechaLimiteMs;
        });
        
        console.log('Cajas filtradas por fecha en frontend:', cajasFiltradas);
        
        // Normalizar el estado de las cajas para asegurar consistencia
        const cajasNormalizadas = cajasFiltradas.map((caja: Caja) => ({
          ...caja,
          // Asegurar que el estado esté en mayúsculas para comparaciones consistentes
          estado: typeof caja.estado === 'string' 
            ? caja.estado.toUpperCase() === 'CERRADA' ? 'CERRADA' : 'ABIERTA'
            : 'ABIERTA', // Por defecto abierta si no hay estado
          // Asegurar que sucursalNombre está disponible
          sucursalNombre: caja.sucursalNombre || sucursalesMap[caja.sucursalId] || 'No disponible'
        }));
        
        console.log('Cajas normalizadas:', cajasNormalizadas);
        setCajas(cajasNormalizadas);
      } catch (error) {
        console.error('Error al obtener cajas:', error);
        setError('No se pudieron cargar las cajas. Intente nuevamente.');
      } finally {
        setCargandoCajas(false);
      }
    };

    if (open) {
      obtenerCajas();
    }
  }, [open]);

  // Cargar sucursales desde la API
  useEffect(() => {
    const obtenerSucursales = async () => {
      try {
        setCargandoSucursales(true);
        // Llamada a la API para obtener las sucursales
        const response = await axios.get('/api/sucursales');
        setSucursales(response.data);
      } catch (error) {
        console.error('Error al obtener sucursales:', error);
        setError('No se pudieron cargar las sucursales. Intente nuevamente.');
      } finally {
        setCargandoSucursales(false);
      }
    };

    if (open) {
      obtenerSucursales();
    }
  }, [open]);

  // Resetear los estados cuando se abre o cierra el diálogo
  useEffect(() => {
    if (open) {
      // No hacemos nada especial al abrir
    } else {
      // Limpiar estados al cerrar
      resetearEstados();
    }
  }, [open]);
  
  // Filtrar cajas cuando cambia la sucursal seleccionada o la búsqueda
  useEffect(() => {
    filtrarCajas();
  }, [sucursalSeleccionada, cajaBuscada, cajas]);
  
  // Función para resetear todos los estados
  const resetearEstados = () => {
    setServicioSeleccionado('');
    setMonto('');
    setObservacion('');
    setComprobante(null);
    setSucursalSeleccionada('');
    setCajaBuscada('');
    setCajaSeleccionada(null);
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para filtrar cajas según la sucursal y el texto de búsqueda
  const filtrarCajas = () => {
    setBuscandoCajas(true);
    
    try {
      let cajasFiltradas = [...cajas];
      
      // Filtrar por sucursal si está seleccionada
      if (sucursalSeleccionada) {
        cajasFiltradas = cajasFiltradas.filter(caja => 
          caja.sucursalId === sucursalSeleccionada
        );
      }
      
      // Filtrar por texto de búsqueda
      if (cajaBuscada.trim()) {
        const terminoBusqueda = cajaBuscada.toLowerCase();
        cajasFiltradas = cajasFiltradas.filter(caja => 
          (caja.id || '').toLowerCase().includes(terminoBusqueda) ||
          (caja.nombre || '').toLowerCase().includes(terminoBusqueda) ||
          (caja.usuario || '').toLowerCase().includes(terminoBusqueda) ||
          (caja.responsable || '').toLowerCase().includes(terminoBusqueda)
        );
      }
      
      console.log('Cajas filtradas para mostrar:', cajasFiltradas);
      setCajasFiltradas(cajasFiltradas);
    } catch (error) {
      console.error("Error al filtrar cajas:", error);
    } finally {
      setBuscandoCajas(false);
    }
  };

  // Función para formatear valores en guaraníes
  const formatGuaranies = (value: string): string => {
    // Remover caracteres no numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Si está vacío, retornar vacío
    if (!numericValue) return '';
    
    // Convertir a número para validar
    const number = parseInt(numericValue, 10);
    
    // Formatear con separadores de miles
    return number ? new Intl.NumberFormat('es-PY').format(number) : '';
  };

  // Función para formatear el valor seleccionado en el dropdown
  const formatServicioSeleccionado = (id: string): string => {
    if (!id) return '';
    
    for (const operadora of operadorasYServicios) {
      for (const servicio of operadora.servicios) {
        if (servicio.id === id) {
          return `${operadora.operadora}: ${servicio.nombre}`;
        }
      }
    }
    return '';
  };

  // Función para obtener operadora y servicio desde el ID seleccionado
  const getOperadoraYServicio = (id: string): { operadora: string, servicio: string } => {
    for (const op of operadorasYServicios) {
      for (const serv of op.servicios) {
        if (serv.id === id) {
          return { operadora: op.operadora, servicio: serv.nombre };
        }
      }
    }
    return { operadora: '', servicio: '' };
  };

  // Dentro del componente PagosServicios, modificar la función para formatear el ID de caja
  const formatearIdCaja = (id?: string): string => {
    // Si el ID es undefined o null, devolver un texto por defecto
    if (!id) return 'ID No disponible';
    
    // Si el ID es un UUID, extraer los primeros 8 caracteres
    if (id.includes('-') && id.length > 8) {
      const primeraParte = id.split('-')[0].toUpperCase();
      return `#${primeraParte}`;
    }
    
    // En otro caso, devolvemos el ID original sin "CAJA"
    return id.startsWith('CAJA #') ? id.substring(5) : `#${id}`;
  };

  // Función para formatear fechas
  const formatearFecha = (fechaISO?: string): string => {
    // Si la fecha es undefined o null, devolver un texto por defecto
    if (!fechaISO) return 'Fecha no disponible';
    
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Función para guardar el pago
  const handleGuardarPago = async () => {
    // Validaciones
    if (!cajaSeleccionada) {
      setError('Debe seleccionar una caja');
      return;
    }
    
    if (!servicioSeleccionado) {
      setError('Debe seleccionar un servicio');
      return;
    }
    
    // Verificar si el monto está vacío
    if (!monto || monto.trim() === '') {
      setError('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Eliminar puntos de miles para obtener el valor numérico
    const montoSinFormato = monto.replace(/\./g, '');
    
    // Verificar que el monto sin formato no esté vacío
    if (!montoSinFormato || montoSinFormato === '0') {
      setError('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Convertir a número
    const montoNumerico = parseInt(montoSinFormato, 10);
    
    // Verificar que sea un número válido y mayor a cero
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Validar que tengamos un usuario
    if (!user) {
      setError('Error de autenticación. No se pudo identificar al usuario.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Obtener la operadora y servicio del ID seleccionado
      const { operadora, servicio } = getOperadoraYServicio(servicioSeleccionado);
      
      // Determinar la moneda a usar
      // Si es efectivo, usar la moneda seleccionada, sino siempre PYG
      const monedaUsada = servicioSeleccionado === 'efectivo' ? monedaSeleccionada : 'PYG';
      
      // Crear un FormData para enviar los datos
      const formData = new FormData();
      formData.append('cajaId', cajaSeleccionada.id);
      formData.append('operadora', operadora);
      formData.append('servicio', servicio);
      formData.append('monto', montoNumerico.toString());
      formData.append('moneda', monedaUsada);
      formData.append('usuarioId', user.id.toString());
      formData.append('estado', 'PENDIENTE'); // Agregar estado inicial como PENDIENTE
      
      if (observacion) {
        formData.append('observacion', observacion);
      }
      
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }
      
      // Realizar la llamada a la API para guardar el pago
      console.log('Enviando datos del pago de servicio:', Object.fromEntries(formData));
      const response = await axios.post('/api/pagos-servicios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Llamar a la función de refresco del componente padre
      onGuardarExito();
      
      // Mensaje según la moneda
      let mensajeExito = `Pago realizado correctamente para ${servicio} en ${cajaSeleccionada.nombre || formatearIdCaja(cajaSeleccionada.id)}`;
      if (monedaUsada === 'PYG') {
        mensajeExito = `Pago de ${formatCurrency.guaranies(montoNumerico)} ${mensajeExito}`;
      } else if (monedaUsada === 'USD') {
        mensajeExito = `Pago de ${formatCurrency.dollars(montoNumerico)} ${mensajeExito}`;
      } else if (monedaUsada === 'BRL') {
        mensajeExito = `Pago de ${formatCurrency.reals(montoNumerico)} ${mensajeExito}`;
      }
      
      setSuccessMessage(mensajeExito);
      
      // Limpiar el formulario después de 2 segundos
      setTimeout(() => {
        resetearEstados();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setError('Error al registrar el pago. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la subida de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setComprobante(file);
      setSuccessMessage(`Comprobante ${file.name} subido correctamente`);
      
      // Limpiar mensaje después de 2 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    }
  };

  // Función para ver el comprobante
  const handleVerComprobante = () => {
    if (comprobante) {
      // Abrir en una nueva ventana
      window.open(URL.createObjectURL(comprobante), '_blank');
    } else {
      setError('No hay comprobante disponible');
      
      // Limpiar mensaje después de 2 segundos
      setTimeout(() => {
        setError(null);
      }, 2000);
    }
  };

  // Función para navegar al siguiente campo con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>, nextId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      }
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Pagos de Servicios/ Efectivo a Cajas</Typography>
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
        
        <Grid container spacing={3}>
          {/* Selección de Sucursal y Caja */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selección de Caja
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="sucursal-label">Sucursal</InputLabel>
                <Select
                  labelId="sucursal-label"
                  id="sucursal"
                  value={sucursalSeleccionada}
                  label="Sucursal"
                  onChange={(e) => setSucursalSeleccionada(e.target.value)}
                  disabled={loading || cargandoSucursales}
                >
                  <MenuItem value="">Todas las sucursales</MenuItem>
                  {sucursales.map((sucursal) => (
                    <MenuItem key={sucursal.id} value={sucursal.id.toString()}>
                      {sucursal.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {cargandoSucursales && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Cargando sucursales...</Typography>
                  </Box>
                )}
              </FormControl>
              
              <Autocomplete
                id="caja-autocomplete"
                options={cajasFiltradas}
                getOptionLabel={(option) => 
                  `Caja #${option.cajaEnteroId} - ${option.usuario || option.responsable} - ${formatearFecha(option.fechaApertura)} - ${option.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}`
                }
                value={cajaSeleccionada}
                onChange={(_event, newValue) => setCajaSeleccionada(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar Caja"
                    value={cajaBuscada}
                    onChange={(e) => setCajaBuscada(e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {buscandoCajas ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    disabled={loading || cargandoCajas}
                  />
                )}
                loading={buscandoCajas || cargandoCajas}
                loadingText="Buscando cajas..."
                noOptionsText="No se encontraron cajas de los últimos 3 días"
                disabled={loading || cargandoCajas}
              />
              
              {cajaSeleccionada && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {formatearIdCaja(cajaSeleccionada.id)} - {cajaSeleccionada.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
                  </Typography>
                  <Typography variant="body2">
                    Responsable: {cajaSeleccionada.responsable || cajaSeleccionada.usuario || 'No disponible'}
                  </Typography>
                  <Typography variant="body2">
                    Sucursal: {cajaSeleccionada.sucursalNombre || 'No disponible'}
                  </Typography>
                  <Typography variant="body2">
                    Fecha Apertura: {formatearFecha(cajaSeleccionada.fechaApertura)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    Estado: <span style={{ fontWeight: 'bold', color: cajaSeleccionada.estado === 'ABIERTA' ? 'green' : 'red' }}>
                      {cajaSeleccionada.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Formulario de Pago */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Detalle del Pago
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="servicio-label">Servicio</InputLabel>
                <Select
                  labelId="servicio-label"
                  id="servicio"
                  value={servicioSeleccionado}
                  label="Servicio"
                  onChange={(e) => setServicioSeleccionado(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'monto')}
                  disabled={loading}
                  renderValue={(selected) => formatServicioSeleccionado(selected as string)}
                >
                  {operadorasYServicios.map((operadora) => [
                    <MenuItem key={operadora.operadora} disabled>
                      <Typography variant="subtitle2">{operadora.operadora}:</Typography>
                    </MenuItem>,
                    ...operadora.servicios.map((servicio) => (
                      <MenuItem 
                        key={servicio.id} 
                        value={servicio.id}
                        sx={{ pl: 4 }}
                      >
                        {servicio.nombre}
                      </MenuItem>
                    ))
                  ])}
                </Select>
              </FormControl>
              
              <Box sx={{ mb: 2 }}>
                {/* Selector de moneda (solo visible si el servicio es Efectivo) */}
                {servicioSeleccionado === 'efectivo' && (
                  <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel id="moneda-label">Moneda</InputLabel>
                    <Select
                      labelId="moneda-label"
                      id="moneda"
                      value={monedaSeleccionada}
                      label="Moneda"
                      onChange={(e) => setMonedaSeleccionada(e.target.value as 'PYG' | 'USD' | 'BRL')}
                      disabled={loading}
                    >
                      <MenuItem value="PYG">Guaraníes (Gs)</MenuItem>
                      <MenuItem value="USD">Dólares (US$)</MenuItem>
                      <MenuItem value="BRL">Reales (R$)</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                {/* Campo de monto */}
                <TextField
                  fullWidth
                  id="monto"
                  label="Monto"
                  value={monto}
                  onChange={(e) => {
                    const formattedValue = formatGuaranies(e.target.value);
                    setMonto(formattedValue);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'observacion')}
                  disabled={loading}
                  autoComplete="off"
                  placeholder="0"
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: <Typography variant="caption">&nbsp;{monedaSeleccionada === 'PYG' ? 'Gs' : monedaSeleccionada === 'USD' ? 'US$' : 'R$'}</Typography>
                  }}
                />
              </Box>
              
              {/* Campo de observaciones */}
              <TextField
                fullWidth
                id="observacion"
                label="Observaciones"
                multiline
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, 'guardar-button')}
                disabled={loading}
                autoComplete="off"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFileIcon />}
                  disabled={loading}
                >
                  Adjuntar Comprobante (Opcional)
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </Button>
                {comprobante && (
                  <>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }} title={comprobante.name}>
                      {comprobante.name}
                    </Typography>
                    <Tooltip title="Ver comprobante">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={handleVerComprobante}
                        disabled={loading}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Cotización Vigente */}
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
          CANCELAR
        </Button>
        
        <Button
          id="guardar-button"
          variant="contained" 
          color="primary"
          onClick={handleGuardarPago}
          disabled={loading || !cajaSeleccionada || !servicioSeleccionado || !monto}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Procesando...' : 'GUARDAR PAGO'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagosServicios; 
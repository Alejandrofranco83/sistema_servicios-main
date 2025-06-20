import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
  Collapse,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
  FilterAlt as FilterAltIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as CajaIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as OpenIcon,
  MonetizationOn as MonetizationOnIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useMobileSucursal } from '../../contexts/MobileSucursalContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import VerDetalleCaja from './VerDetalleCaja';
import FormAperturaMobile from './FormAperturaMobile';

interface Caja {
  id: number;
  cajaEnteroId: number;
  usuarioId: string;
  usuario: {
    username: string;
  };
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'abierta' | 'cerrada';
  montoApertura: number;
  montoCierre?: number;
  sucursalId: string;
  sucursal?: {
    nombre: string;
  };
}

const MobileCajas: React.FC = () => {
  const theme = useTheme();
  const { sucursalMovil, validarAccesoSucursal } = useMobileSucursal();
  const { user } = useAuth();
  
  // Estados principales
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de dialogs
  const [nuevaCajaOpen, setNuevaCajaOpen] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<Caja | null>(null);
  
  // Estados del formulario nueva caja ya no necesarios
  // Se manejará en FormAperturaMobile
  
  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const isOperador = user?.rol?.nombre.toUpperCase() === 'OPERADOR';
  const isAdmin = user?.rol?.nombre.toUpperCase() === 'ADMINISTRADOR';

  // Cargar cajas al montar el componente
  useEffect(() => {
    if (validarAccesoSucursal()) {
      cargarCajas();
    }
  }, [sucursalMovil]);

  // Función para cargar cajas
  const cargarCajas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/cajas');
      let cajasFiltradas = response.data || [];
      
      // Filtrar por sucursal seleccionada
      if (sucursalMovil) {
        cajasFiltradas = cajasFiltradas.filter((caja: Caja) => 
          caja.sucursalId === sucursalMovil.id
        );
      }
      
      // Filtros específicos para operadores
      if (isOperador) {
        cajasFiltradas = cajasFiltradas.filter((caja: Caja) => {
          // Solo cajas del usuario actual
          const esCajaDelUsuario = caja.usuarioId === user?.id?.toString();
          
          // Solo cajas del día actual
          const fechaAperturaCaja = new Date(caja.fechaApertura);
          const fechaActual = new Date();
          const esMismoDia = fechaAperturaCaja.getFullYear() === fechaActual.getFullYear() &&
                           fechaAperturaCaja.getMonth() === fechaActual.getMonth() &&
                           fechaAperturaCaja.getDate() === fechaActual.getDate();
          
          return esCajaDelUsuario && esMismoDia;
        });
      }
      
      // Ordenar por fecha más reciente
      cajasFiltradas.sort((a: Caja, b: Caja) => 
        new Date(b.fechaApertura).getTime() - new Date(a.fechaApertura).getTime()
      );
      
      setCajas(cajasFiltradas);
      console.log(`📱 Cajas cargadas: ${cajasFiltradas.length}`);
      
    } catch (err: any) {
      console.error('Error al cargar cajas:', err);
      setError('Error al cargar las cajas');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el éxito de creación de caja
  const handleNuevaCajaExito = async () => {
    await cargarCajas();
    console.log('✅ Nueva caja creada exitosamente');
  };

  // Funciones de acciones
  const handleVerDetalle = (caja: Caja) => {
    console.log('📱 Ver detalle de caja:', caja.cajaEnteroId);
    setCajaSeleccionada(caja);
    setVerDetalleOpen(true);
  };

  const handleVerApertura = (caja: Caja) => {
    console.log('Ver apertura de caja:', caja.cajaEnteroId);
    // TODO: Implementar ver apertura
  };

  const handleVerMovimientos = (caja: Caja) => {
    console.log('Ver movimientos de caja:', caja.cajaEnteroId);
    // TODO: Implementar ver movimientos
  };

  const handleRetiros = (caja: Caja) => {
    console.log('Retiros de caja:', caja.cajaEnteroId);
    // TODO: Implementar retiros
  };

  const handleOperacionesBancarias = (caja: Caja) => {
    console.log('Operaciones bancarias de caja:', caja.cajaEnteroId);
    // TODO: Implementar operaciones bancarias
  };

  const handlePagos = (caja: Caja) => {
    console.log('Pagos de caja:', caja.cajaEnteroId);
    // TODO: Implementar pagos
  };

  const handleCerrarCaja = (caja: Caja) => {
    console.log('Cerrar caja:', caja.cajaEnteroId);
    // TODO: Implementar cerrar caja
  };

  // Función para formatear moneda
  const formatearMoneda = (monto: number | undefined | null): string => {
    if (monto === undefined || monto === null || isNaN(monto)) {
      return 'Gs. 0';
    }
    
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Aplicar filtros
  const cajasFiltradas = cajas.filter(caja => {
    let cumpleFiltro = true;

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      cumpleFiltro = cumpleFiltro && caja.estado === filtroEstado;
    }

    // Filtro por fecha
    if (fechaDesde) {
      const fechaDesdeObj = new Date(fechaDesde + 'T00:00:00');
      const fechaCaja = new Date(caja.fechaApertura);
      cumpleFiltro = cumpleFiltro && fechaCaja >= fechaDesdeObj;
    }

    if (fechaHasta) {
      const fechaHastaObj = new Date(fechaHasta + 'T23:59:59');
      const fechaCaja = new Date(caja.fechaApertura);
      cumpleFiltro = cumpleFiltro && fechaCaja <= fechaHastaObj;
    }

    return cumpleFiltro;
  });

  // Acciones disponibles para cada caja
  const getAccionesCaja = (caja: Caja) => [
    {
      icon: <VisibilityIcon />,
      nombre: 'Ver Detalle',
      onClick: () => handleVerDetalle(caja),
      color: 'primary' as const
    },
    {
      icon: <MonetizationOnIcon />,
      nombre: 'Ver Apertura',
      onClick: () => handleVerApertura(caja),
      color: 'info' as const
    },
    {
      icon: <AssignmentIcon />,
      nombre: 'Movimientos',
      onClick: () => handleVerMovimientos(caja),
      color: 'secondary' as const
    },
    {
      icon: <AttachMoneyIcon />,
      nombre: 'Retiros',
      onClick: () => handleRetiros(caja),
      color: 'warning' as const
    },
    {
      icon: <AccountBalanceIcon />,
      nombre: 'Op. Bancarias',
      onClick: () => handleOperacionesBancarias(caja),
      color: 'success' as const
    },
    {
      icon: <PaymentIcon />,
      nombre: 'Pagos',
      onClick: () => handlePagos(caja),
      color: 'info' as const
    },
    ...(caja.estado === 'abierta' ? [{
      icon: <CloseIcon />,
      nombre: 'Cerrar Caja',
      onClick: () => handleCerrarCaja(caja),
      color: 'error' as const
    }] : [{
      icon: <EditIcon />,
      nombre: 'Editar Cierre',
      onClick: () => handleCerrarCaja(caja),
      color: 'error' as const
    }])
  ];

  if (!validarAccesoSucursal()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Acceso Requerido
          </Typography>
          <Typography>
            Primero debes escanear el QR de la sucursal para acceder a las cajas.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 1 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          🏪 {sucursalMovil?.nombre}
        </Typography>
        <Typography variant="h6" color="primary">
          {isOperador ? 'Panel de Operaciones' : 'Gestión de Cajas'}
        </Typography>
      </Box>

      {/* Error alert */}
      {error && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Filtros */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterAltIcon />}
          endIcon={filtrosOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setFiltrosOpen(!filtrosOpen)}
          fullWidth
          sx={{ borderRadius: 3 }}
        >
          Filtros {cajasFiltradas.length !== cajas.length && `(${cajasFiltradas.length}/${cajas.length})`}
        </Button>
        
        <Collapse in={filtrosOpen}>
          <Card sx={{ mt: 2, borderRadius: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filtroEstado}
                      label="Estado"
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                      <MenuItem value="todas">Todas</MenuItem>
                      <MenuItem value="abierta">Abiertas</MenuItem>
                      <MenuItem value="cerrada">Cerradas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Desde"
                    type="date"
                    size="small"
                    fullWidth
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Hasta"
                    type="date"
                    size="small"
                    fullWidth
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setFiltroEstado('todas');
                    setFechaDesde('');
                    setFechaHasta('');
                  }}
                >
                  Limpiar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Collapse>
      </Box>

      {/* Lista de cajas */}
      <Box sx={{ px: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : cajasFiltradas.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CajaIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No hay cajas
              </Typography>
              <Typography color="text.secondary">
                {cajas.length === 0 ? 'Crea tu primera caja' : 'No hay cajas que coincidan con los filtros'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List sx={{ p: 0 }}>
            {cajasFiltradas.map((caja, index) => (
              <React.Fragment key={caja.id}>
                <Card sx={{ mb: 2, borderRadius: 3 }}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      p: 3
                    }}
                  >
                    {/* Header de la caja */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: caja.estado === 'abierta' ? 'success.main' : 'grey.500',
                          mr: 2
                        }}
                      >
                        {caja.estado === 'abierta' ? <OpenIcon /> : <CheckCircleIcon />}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Caja #{caja.cajaEnteroId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {caja.usuario.username} • {formatearFecha(caja.fechaApertura)}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={caja.estado.toUpperCase()}
                        color={caja.estado === 'abierta' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    {/* Acciones en Grid - Todas visibles */}
                    <Grid container spacing={1}>
                      {getAccionesCaja(caja).map((accion, idx) => (
                        <Grid item xs={6} key={idx}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={accion.icon}
                            onClick={accion.onClick}
                            color={accion.color}
                            fullWidth
                            sx={{ borderRadius: 2, py: 1.25 }}
                          >
                            {accion.nombre}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </ListItem>
                </Card>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* FAB Nueva Caja */}
      <Fab
        color="primary"
        aria-label="nueva caja"
        onClick={() => setNuevaCajaOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 80, // Espacio para bottom navigation
          right: 20,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog Nueva Caja */}
      <FormAperturaMobile
        open={nuevaCajaOpen}
        onClose={() => setNuevaCajaOpen(false)}
        onSuccess={handleNuevaCajaExito}
      />

      {/* Dialog Ver Detalle */}
      <VerDetalleCaja
        open={verDetalleOpen}
        onClose={() => setVerDetalleOpen(false)}
        caja={cajaSeleccionada}
      />
    </Box>
  );
};

export default MobileCajas; 
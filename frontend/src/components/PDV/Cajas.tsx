import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PointOfSale as PointOfSaleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { useSucursal } from '../../contexts/SucursalContext';
import { formatCurrency } from '../../utils/formatUtils';

// Interface para representar una caja
interface Caja {
  id: number;
  nombre: string;
  responsable: string;
  estado: 'abierta' | 'cerrada' | 'en_proceso';
  moneda: 'guaranies' | 'dolares' | 'reales' | 'todas';
  saldo: number;
  fechaApertura: string;
  fechaCierre?: string;
  sucursalId: string; // Identificador de la sucursal a la que pertenece la caja
}

// Tipos para el formulario
type FormData = Omit<Caja, 'id' | 'fechaApertura' | 'fechaCierre' | 'sucursalId'>;

// Tipo para el estado de una caja
type EstadoCaja = 'abierta' | 'cerrada' | 'en_proceso';

// Información sobre el estado de la caja
interface EstadoInfo {
  color: 'success' | 'error' | 'warning' | 'default';
  label: string;
}

const Cajas: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { cotizacionVigente } = useCotizacion();
  const { sucursalActual, loading: loadingSucursal } = useSucursal();

  // Estado para el formulario de nueva caja
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    responsable: '',
    estado: 'abierta',
    moneda: 'guaranies',
    saldo: 0
  });

  // Datos de ejemplo para las cajas (esto debe venir de una API)
  const cajasEjemplo: Caja[] = [
    {
      id: 1,
      nombre: 'Caja Principal',
      responsable: 'Juan Pérez',
      estado: 'abierta',
      moneda: 'guaranies',
      saldo: 1500000,
      fechaApertura: '2023-04-01T08:00:00',
      sucursalId: 'SUC001'
    },
    {
      id: 2,
      nombre: 'Caja Secundaria',
      responsable: 'María López',
      estado: 'cerrada',
      moneda: 'guaranies',
      saldo: 0,
      fechaApertura: '2023-04-01T08:00:00',
      fechaCierre: '2023-04-01T17:00:00',
      sucursalId: 'SUC001'
    },
    {
      id: 3,
      nombre: 'Caja Dólares',
      responsable: 'Carlos Gómez',
      estado: 'abierta',
      moneda: 'dolares',
      saldo: 500,
      fechaApertura: '2023-04-01T08:30:00',
      sucursalId: 'SUC002'
    },
    {
      id: 4,
      nombre: 'Caja Reales',
      responsable: 'Ana Martínez',
      estado: 'abierta',
      moneda: 'reales',
      saldo: 1200,
      fechaApertura: '2023-04-01T09:00:00',
      sucursalId: 'SUC002'
    },
    {
      id: 5,
      nombre: 'Caja Multimoneda',
      responsable: 'Roberto Sánchez',
      estado: 'en_proceso',
      moneda: 'todas',
      saldo: 2000000,
      fechaApertura: '2023-04-01T08:15:00',
      sucursalId: 'SUC003'
    }
  ];

  // Cargar las cajas al montar el componente
  useEffect(() => {
    const fetchCajas = async () => {
      if (!sucursalActual) return;
      
      setLoading(true);
      try {
        // Simulando carga de datos
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Filtrar cajas por sucursal actual
        const cajasDeSucursal = cajasEjemplo.filter(
          caja => caja.sucursalId === sucursalActual.id
        );
        
        setCajas(cajasDeSucursal);
      } catch (err) {
        setError('Error al cargar las cajas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCajas();
  }, [sucursalActual]);

  // Formatear fecha
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear valor según la moneda
  const formatearValor = (valor: number, moneda: Caja['moneda']): string => {
    switch (moneda) {
      case 'guaranies':
        return formatCurrency.guaranies(valor);
      case 'dolares':
        return formatCurrency.dollars(valor);
      case 'reales':
        return formatCurrency.reals(valor);
      case 'todas':
        return formatCurrency.guaranies(valor); // Para cajas multimoneda, mostramos el valor en guaraníes
      default:
        return formatCurrency.guaranies(valor);
    }
  };

  // Obtener color y etiqueta del estado
  const getEstadoInfo = (estado: EstadoCaja): EstadoInfo => {
    switch (estado) {
      case 'abierta':
        return { color: 'success', label: 'Abierta' };
      case 'cerrada':
        return { color: 'error', label: 'Cerrada' };
      case 'en_proceso':
        return { color: 'warning', label: 'En Proceso' };
      default:
        return { color: 'default', label: 'Desconocido' };
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent): void => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (!sucursalActual) {
      setError('No se puede crear una caja sin una sucursal seleccionada');
      return;
    }
    
    // Simulando creación de caja
    const nuevaCaja: Caja = {
      id: cajas.length + 1,
      ...formData,
      fechaApertura: new Date().toISOString(),
      sucursalId: sucursalActual.id // Asignar la sucursal actual
    };
    
    setCajas([...cajas, nuevaCaja]);
    setSuccessMessage(`Caja creada exitosamente en ${sucursalActual.nombre}`);
    setDialogOpen(false);
    
    // Resetear el formulario
    setFormData({
      nombre: '',
      responsable: '',
      estado: 'abierta',
      moneda: 'guaranies',
      saldo: 0
    });
  };

  // Contadores para el resumen
  const cajasAbiertas = cajas.filter(caja => caja.estado === 'abierta').length;
  const cajasEnProceso = cajas.filter(caja => caja.estado === 'en_proceso').length;
  const cajasCerradas = cajas.filter(caja => caja.estado === 'cerrada').length;

  // Si está cargando la información de la sucursal, mostrar indicador
  if (loadingSucursal) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si no hay sucursal seleccionada, mostrar mensaje
  if (!sucursalActual) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No hay una sucursal seleccionada. Por favor, contacte al administrador del sistema.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Gestión de Cajas
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sucursal: {sucursalActual.nombre} ({sucursalActual.codigo})
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nueva Caja
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Cotización vigente */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Cotización Vigente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  Dólar: {cotizacionVigente ? formatCurrency.guaranies(cotizacionVigente.valorDolar) : 'No disponible'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  Real: {cotizacionVigente ? formatCurrency.guaranies(cotizacionVigente.valorReal) : 'No disponible'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Resumen de las cajas */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Cajas
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {cajas.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cajas Abiertas
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {cajasAbiertas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cajas en Proceso
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {cajasEnProceso}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cajas Cerradas
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {cajasCerradas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabla de cajas */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Listado de Cajas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Moneda</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Cierre</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cajas.map((caja) => {
                    const estadoInfo = getEstadoInfo(caja.estado);
                    return (
                      <TableRow key={caja.id}>
                        <TableCell>{caja.nombre}</TableCell>
                        <TableCell>{caja.responsable}</TableCell>
                        <TableCell>
                          <Chip
                            label={estadoInfo.label}
                            color={estadoInfo.color}
                            size="small"
                            icon={
                              caja.estado === 'abierta' ? <CheckCircleIcon /> : 
                              caja.estado === 'cerrada' ? <CancelIcon /> : 
                              <PointOfSaleIcon />
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {caja.moneda === 'guaranies' ? 'Guaraníes' : 
                           caja.moneda === 'dolares' ? 'Dólares' : 
                           caja.moneda === 'reales' ? 'Reales' : 
                           'Multimoneda'}
                        </TableCell>
                        <TableCell align="right">
                          {formatearValor(caja.saldo, caja.moneda)}
                        </TableCell>
                        <TableCell>{formatDate(caja.fechaApertura)}</TableCell>
                        <TableCell>{formatDate(caja.fechaCierre)}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" size="small" title="Ver detalles">
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            color="secondary" 
                            size="small" 
                            title="Editar caja"
                            disabled={caja.estado === 'cerrada'}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Diálogo para crear nueva caja */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Caja en {sucursalActual.nombre}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              name="nombre"
              label="Nombre de la Caja"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
            
            <TextField
              name="responsable"
              label="Responsable"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.responsable}
              onChange={handleChange}
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Moneda</InputLabel>
              <Select
                name="moneda"
                value={formData.moneda}
                label="Moneda"
                onChange={handleChange}
              >
                <MenuItem value="guaranies">Guaraníes</MenuItem>
                <MenuItem value="dolares">Dólares</MenuItem>
                <MenuItem value="reales">Reales</MenuItem>
                <MenuItem value="todas">Multimoneda</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              name="saldo"
              label="Saldo Inicial"
              fullWidth
              margin="normal"
              variant="outlined"
              type="number"
              inputProps={{ min: 0 }}
              value={formData.saldo}
              onChange={handleChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              variant="contained"
              disabled={!formData.nombre || !formData.responsable}
            >
              Crear Caja
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Cajas; 
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
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Stack,
  GlobalStyles
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { useSucursal } from '../../contexts/SucursalContext';
import { formatCurrency } from '../../utils/formatUtils';
import { handleInputClick } from '../../utils/inputUtils';

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
  sucursalId: string;
  transacciones: number; // Cantidad de transacciones
  totalIngresos: number; // Total de ingresos en guaranies
  totalEgresos: number; // Total de egresos en guaranies
  movimientos: CajaMovimiento[];
}

// Interface para representar un movimiento de caja
interface CajaMovimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  fecha: string;
  responsable: string;
}

const ControlCajas: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<Caja | null>(null);
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false);
  const [dialogCierreOpen, setDialogCierreOpen] = useState(false);
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const { cotizacionVigente } = useCotizacion();
  const { sucursalActual, loading: loadingSucursal } = useSucursal();

  // Datos de ejemplo para los movimientos de caja
  const movimientosEjemplo: CajaMovimiento[] = [
    {
      id: 1,
      tipo: 'ingreso',
      concepto: 'Venta de medicamentos',
      monto: 150000,
      fecha: '2023-04-01T09:30:00',
      responsable: 'Juan Pérez'
    },
    {
      id: 2,
      tipo: 'egreso',
      concepto: 'Pago a proveedor',
      monto: 50000,
      fecha: '2023-04-01T11:15:00',
      responsable: 'Juan Pérez'
    },
    {
      id: 3,
      tipo: 'ingreso',
      concepto: 'Recarga telefónica',
      monto: 25000,
      fecha: '2023-04-01T14:20:00',
      responsable: 'Juan Pérez'
    }
  ];

  // Datos de ejemplo para las cajas
  const cajasEjemplo: Caja[] = [
    {
      id: 1,
      nombre: 'Caja Principal',
      responsable: 'Juan Pérez',
      estado: 'abierta',
      moneda: 'guaranies',
      saldo: 1500000,
      fechaApertura: '2023-04-01T08:00:00',
      sucursalId: 'SUC001',
      transacciones: 15,
      totalIngresos: 1800000,
      totalEgresos: 300000,
      movimientos: movimientosEjemplo
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
      sucursalId: 'SUC001',
      transacciones: 8,
      totalIngresos: 950000,
      totalEgresos: 950000,
      movimientos: []
    },
    {
      id: 3,
      nombre: 'Caja Dólares',
      responsable: 'Carlos Gómez',
      estado: 'abierta',
      moneda: 'dolares',
      saldo: 500,
      fechaApertura: '2023-04-01T08:30:00',
      sucursalId: 'SUC002',
      transacciones: 5,
      totalIngresos: 1000,
      totalEgresos: 500,
      movimientos: []
    },
    {
      id: 4,
      nombre: 'Caja Reales',
      responsable: 'Ana Martínez',
      estado: 'en_proceso',
      moneda: 'reales',
      saldo: 1200,
      fechaApertura: '2023-04-01T09:00:00',
      sucursalId: 'SUC002',
      transacciones: 3,
      totalIngresos: 2000,
      totalEgresos: 800,
      movimientos: []
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
        return formatCurrency.guaranies(valor);
      default:
        return formatCurrency.guaranies(valor);
    }
  };

  const verDetallesCaja = (caja: Caja) => {
    setCajaSeleccionada(caja);
    setDialogDetalleOpen(true);
  };

  const cerrarCaja = (caja: Caja) => {
    setCajaSeleccionada(caja);
    setDialogCierreOpen(true);
  };

  const confirmarCierreCaja = () => {
    if (!cajaSeleccionada) return;
    
    // Simular cierre de caja
    const cajasCopia = cajas.map(c => {
      if (c.id === cajaSeleccionada.id) {
        return {
          ...c,
          estado: 'cerrada' as const,
          fechaCierre: new Date().toISOString()
        };
      }
      return c;
    });

    setCajas(cajasCopia);
    setDialogCierreOpen(false);
    setObservacionesCierre('');
  };

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
            Control de Cajas
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sucursal: {sucursalActual.nombre} ({sucursalActual.codigo})
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Resumen de las cajas activas */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Cajas Activas
            </Typography>
            <Grid container spacing={3}>
              {cajas.filter(c => c.estado === 'abierta' || c.estado === 'en_proceso').length > 0 ? (
                cajas
                  .filter(c => c.estado === 'abierta' || c.estado === 'en_proceso')
                  .map(caja => (
                    <Grid item xs={12} md={6} key={caja.id}>
                      <Card 
                        variant="outlined" 
                        sx={{
                          borderColor: caja.estado === 'abierta' ? 'success.main' : 'warning.main',
                          borderWidth: 2
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6">{caja.nombre}</Typography>
                            <Chip 
                              label={caja.estado === 'abierta' ? 'Abierta' : 'En Proceso'} 
                              color={caja.estado === 'abierta' ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Responsable: {caja.responsable}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Apertura:
                              </Typography>
                              <Typography variant="body2">
                                {formatDate(caja.fechaApertura)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Moneda:
                              </Typography>
                              <Typography variant="body2">
                                {caja.moneda === 'guaranies' ? 'Guaraníes' : 
                                caja.moneda === 'dolares' ? 'Dólares' : 
                                caja.moneda === 'reales' ? 'Reales' : 
                                'Multimoneda'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Saldo actual:
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {formatearValor(caja.saldo, caja.moneda)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Transacciones:
                              </Typography>
                              <Typography variant="body1">
                                {caja.transacciones}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<VisibilityIcon />}
                              onClick={() => verDetallesCaja(caja)}
                            >
                              Detalles
                            </Button>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="error" 
                              startIcon={<CloseIcon />}
                              onClick={() => cerrarCaja(caja)}
                            >
                              Cerrar Caja
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No hay cajas activas en esta sucursal.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Tabla de cajas cerradas */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Historial de Cajas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Moneda</TableCell>
                    <TableCell align="right">Saldo Final</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Cierre</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cajas
                    .filter(caja => caja.estado === 'cerrada')
                    .map((caja) => (
                      <TableRow key={caja.id}>
                        <TableCell>{caja.nombre}</TableCell>
                        <TableCell>{caja.responsable}</TableCell>
                        <TableCell>
                          <Chip
                            label="Cerrada"
                            color="error"
                            size="small"
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
                          <IconButton 
                            color="primary" 
                            size="small" 
                            title="Ver detalles"
                            onClick={() => verDetallesCaja(caja)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            color="secondary" 
                            size="small" 
                            title="Imprimir reporte"
                          >
                            <PrintIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Diálogo para ver detalles de caja */}
      <Dialog
        open={dialogDetalleOpen}
        onClose={() => setDialogDetalleOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {cajaSeleccionada && (
          <>
            <DialogTitle>
              Detalles de {cajaSeleccionada.nombre}
              <Typography variant="subtitle2" color="text.secondary">
                {cajaSeleccionada.estado === 'abierta' ? 'Caja Abierta' : 
                 cajaSeleccionada.estado === 'en_proceso' ? 'Caja En Proceso' : 
                 'Caja Cerrada'}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Información General
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Responsable:
                          </Typography>
                          <Typography variant="body1">
                            {cajaSeleccionada.responsable}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Moneda:
                          </Typography>
                          <Typography variant="body1">
                            {cajaSeleccionada.moneda === 'guaranies' ? 'Guaraníes' : 
                            cajaSeleccionada.moneda === 'dolares' ? 'Dólares' : 
                            cajaSeleccionada.moneda === 'reales' ? 'Reales' : 
                            'Multimoneda'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Apertura:
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(cajaSeleccionada.fechaApertura)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Cierre:
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(cajaSeleccionada.fechaCierre)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Resumen de Operaciones
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Transacciones:
                          </Typography>
                          <Typography variant="body1">
                            {cajaSeleccionada.transacciones}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Saldo:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatearValor(cajaSeleccionada.saldo, cajaSeleccionada.moneda)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Ingresos:
                          </Typography>
                          <Typography variant="body1" color="success.main">
                            {formatearValor(cajaSeleccionada.totalIngresos, cajaSeleccionada.moneda)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Egresos:
                          </Typography>
                          <Typography variant="body1" color="error.main">
                            {formatearValor(cajaSeleccionada.totalEgresos, cajaSeleccionada.moneda)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Movimientos
              </Typography>
              {cajaSeleccionada.movimientos.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Responsable</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cajaSeleccionada.movimientos.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            <Chip 
                              label={mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} 
                              color={mov.tipo === 'ingreso' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{mov.concepto}</TableCell>
                          <TableCell align="right">
                            {formatearValor(mov.monto, cajaSeleccionada.moneda)}
                          </TableCell>
                          <TableCell>{formatDate(mov.fecha)}</TableCell>
                          <TableCell>{mov.responsable}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No hay movimientos registrados para esta caja.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              {cajaSeleccionada.estado === 'cerrada' && (
                <Button
                  startIcon={<PdfIcon />}
                  color="primary"
                >
                  Generar PDF
                </Button>
              )}
              <Button onClick={() => setDialogDetalleOpen(false)}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Diálogo para cerrar caja */}
      <Dialog
        open={dialogCierreOpen}
        onClose={() => setDialogCierreOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {cajaSeleccionada && (
          <>
            <DialogTitle>
              Cerrar {cajaSeleccionada.nombre}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                ¿Está seguro que desea cerrar esta caja? Esta acción no se puede deshacer.
              </DialogContentText>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Responsable:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.responsable}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Saldo actual:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatearValor(cajaSeleccionada.saldo, cajaSeleccionada.moneda)}
                  </Typography>
                </Grid>
              </Grid>
              
              <TextField
                label="Observaciones de cierre"
                multiline
                rows={4}
                fullWidth
                value={observacionesCierre}
                onChange={(e) => setObservacionesCierre(e.target.value)}
                onClick={handleInputClick}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogCierreOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmarCierreCaja} 
                color="error" 
                variant="contained"
                startIcon={<CheckIcon />}
              >
                Confirmar Cierre
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ControlCajas; 
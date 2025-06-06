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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
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
  usuarioId: string | null; // Campo para verificación
  fechaCreacion: string;
  fechaActualizacion: string;
}

const ControlOperacionBancaria: React.FC = () => {
  const [operaciones, setOperaciones] = useState<OperacionBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOperaciones, setTotalOperaciones] = useState(0);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<OperacionBancaria | null>(null);
  const [dialogoVerificar, setDialogoVerificar] = useState(false);
  const [dialogoDetalle, setDialogoDetalle] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
  }, [page, rowsPerPage]);

  const cargarOperaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/api/operaciones-bancarias?${params}`);
      const data = Array.isArray(response.data) ? response.data : response.data.operaciones || [];
      setOperaciones(data);
      setTotalOperaciones(response.data.total || data.length || 0);
    } catch (error: any) {
      console.error('Error al cargar operaciones:', error);
      setError('Error al cargar las operaciones bancarias');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarOperacion = async (operacion: OperacionBancaria) => {
    setOperacionSeleccionada(operacion);
    setDialogoVerificar(true);
  };

  const confirmarVerificacion = async () => {
    if (!operacionSeleccionada) return;

    try {
      setVerificando(true);
      setError(null);

      // Usar la ruta PUT existente para actualizar el usuarioId
      await api.put(`/api/operaciones-bancarias/${operacionSeleccionada.id}`, {
        usuarioId: '1' // Marcar como verificado
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
      setLoading(true);
      setError(null);

      await api.put(`/api/operaciones-bancarias/${operacion.id}`, {
        usuarioId: null // Marcar como no verificado
      });

      setSuccess('Verificación removida correctamente');
      cargarOperaciones(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al desverificar operación:', error);
      setError('Error al remover la verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (operacion: OperacionBancaria) => {
    setOperacionSeleccionada(operacion);
    setDialogoDetalle(true);
  };

  const formatearMonto = (monto: number) => {
    if (typeof monto !== 'number' || isNaN(monto)) {
      return 'Monto inválido';
    }
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  const getEstadoChip = (operacion: OperacionBancaria) => {
    const esVerificado = operacion.usuarioId === '1';
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

      {/* Filtros básicos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por referencia o descripción"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  onClick={cargarOperaciones}
                  disabled={loading}
                >
                  Buscar
                </Button>
                <IconButton onClick={cargarOperaciones} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
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
                  <TableCell>Referencia</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : operaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
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
                      <TableCell>{operacion.numeroReferencia || 'N/A'}</TableCell>
                      <TableCell>{getEstadoChip(operacion)}</TableCell>
                      <TableCell>{operacion.usuarioCreacion?.username || 'N/A'}</TableCell>
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
                          {operacion.usuarioId === '1' ? (
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
          {operacionSeleccionada && (
            <Box>
              <Typography variant="body1" paragraph>
                ¿Está seguro de que desea verificar esta operación bancaria?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2">Detalles de la Operación:</Typography>
                <Typography variant="body2">
                  <strong>Fecha:</strong> {formatearFechaSafe(operacionSeleccionada.fechaOperacion)}
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo:</strong> {operacionSeleccionada.tipoOperacion || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Monto:</strong> {formatearMonto(operacionSeleccionada.monto)}
                </Typography>
                <Typography variant="body2">
                  <strong>Banco:</strong> {operacionSeleccionada.cuentaBancaria?.banco || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Referencia:</strong> {operacionSeleccionada.numeroReferencia || 'N/A'}
                </Typography>
              </Box>
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
            disabled={verificando}
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
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoDetalle(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlOperacionBancaria; 
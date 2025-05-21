import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';
import { Close as CloseIcon } from '@mui/icons-material';

interface AnularPagoServicioProps {
  open: boolean;
  onClose: () => void;
  movimientoId: number | null;
  onSuccess: () => void;
}

interface PagoServicio {
  id: number;
  cajaId: string;
  cajaEnteroId?: number;
  operadora: string;
  servicio: string;
  monto: number;
  moneda: string;
  observacion: string | null;
  rutaComprobante: string | null;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

const AnularPagoServicio: React.FC<AnularPagoServicioProps> = ({ 
  open, 
  onClose, 
  movimientoId, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pagoServicio, setPagoServicio] = useState<PagoServicio | null>(null);
  const [observacionAnulacion, setObservacionAnulacion] = useState('');
  const [pagoServicioId, setPagoServicioId] = useState<number | null>(null);

  // Cargar datos del pago al abrir el diálogo
  useEffect(() => {
    const fetchPagoServicio = async () => {
      if (!open || !movimientoId) return;
      
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        // Primero obtenemos el ID del pago desde el movimiento
        const movResponse = await axios.get(`/api/caja_mayor_movimientos/${movimientoId}`);
        if (movResponse.data && movResponse.data.pagoServicioId) {
          const pagoId = movResponse.data.pagoServicioId;
          setPagoServicioId(pagoId);
          
          // Luego obtenemos los detalles del pago
          const pagoResponse = await axios.get(`/api/pagos-servicios/${pagoId}`);
          if (pagoResponse.data) {
            setPagoServicio(pagoResponse.data);
          } else {
            setError('No se encontraron datos del pago de servicio');
          }
        } else {
          setError('No se pudo obtener el ID del pago de servicio desde el movimiento');
        }
      } catch (err: any) {
        console.error('Error al obtener datos del pago:', err);
        setError(err.response?.data?.error || 'Error al cargar los datos del pago de servicio');
      } finally {
        setLoading(false);
      }
    };

    fetchPagoServicio();
  }, [open, movimientoId]);

  // Función para anular el pago
  const handleAnularPago = async () => {
    if (!pagoServicioId) {
      setError('No se ha identificado el pago a anular');
      return;
    }
    
    if (!observacionAnulacion.trim()) {
      setError('Debe ingresar un motivo para la anulación');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Cambiar estado del pago a ANULADO
      const response = await axios.patch(`/api/pagos-servicios/${pagoServicioId}/estado`, {
        estado: 'ANULADO',
        observacionAnulacion: observacionAnulacion.trim().toUpperCase()
      });
      
      // 2. Crear movimiento contrario (se hace en el backend)
      setSuccess('Pago de servicio anulado correctamente');
      
      // Esperar 1.5 segundos y cerrar
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error al anular pago de servicio:', err);
      setError(err.response?.data?.error || 'Error al anular el pago de servicio');
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda según el tipo
  const formatearMonto = (monto: number, moneda: string): string => {
    if (moneda === 'PYG') {
      return formatCurrency.guaranies(monto);
    } else if (moneda === 'USD') {
      return formatCurrency.dollars(monto);
    } else if (moneda === 'BRL') {
      return formatCurrency.reals(monto);
    }
    return monto.toString();
  };

  // Formatear fecha
  const formatearFecha = (fechaISO: string): string => {
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

  // Obtener color según el estado del pago
  const getEstadoColor = (estado: string): string => {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return 'warning';
      case 'PROCESADO':
        return 'success';
      case 'ANULADO':
        return 'error';
      case 'RECHAZADO':
        return 'error';
      default:
        return 'default';
    }
  };

  // Verificar si el pago ya está anulado
  const isPagoAnulado = pagoServicio?.estado === 'ANULADO';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Anular Pago de Servicio</Typography>
          <Button 
            variant="text" 
            color="inherit" 
            onClick={onClose}
            disabled={loading}
            startIcon={<CloseIcon />}
          >
            Cerrar
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!loading && pagoServicio && (
          <>
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      Detalles del Pago #{pagoServicio.id}
                    </Typography>
                    <Chip 
                      label={pagoServicio.estado} 
                      color={getEstadoColor(pagoServicio.estado) as any}
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Servicio</Typography>
                  <Typography variant="body1">{pagoServicio.operadora}: {pagoServicio.servicio}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Monto</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatearMonto(pagoServicio.monto, pagoServicio.moneda)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha de Creación</Typography>
                  <Typography variant="body1">{formatearFecha(pagoServicio.fechaCreacion)}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Caja ID</Typography>
                  <Typography variant="body1">{pagoServicio.cajaId}</Typography>
                  {pagoServicio.cajaEnteroId && (
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Caja #
                    </Typography>
                  )}
                  {pagoServicio.cajaEnteroId && (
                     <Typography variant="body1" fontWeight="bold">{pagoServicio.cajaEnteroId}</Typography>
                  )}
                </Grid>
                
                {pagoServicio.observacion && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Observación Original</Typography>
                    <Typography variant="body1">{pagoServicio.observacion}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {!isPagoAnulado ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Motivo de Anulación
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Especifique el motivo de la anulación"
                  value={observacionAnulacion}
                  onChange={(e) => setObservacionAnulacion(e.target.value)}
                  disabled={loading}
                  required
                  error={!observacionAnulacion.trim() && error !== null}
                  helperText={!observacionAnulacion.trim() && error !== null ? "El motivo es obligatorio" : ""}
                  placeholder="Ej: Error en el registro de pago, Servicio no utilizado, etc."
                />
              </Box>
            ) : (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Este pago ya se encuentra anulado y no puede modificarse.
              </Alert>
            )}
          </>
        )}

        {!loading && !pagoServicio && !error && (
          <Alert severity="info">
            Cargando información del pago...
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button
          variant="contained" 
          color="error"
          onClick={handleAnularPago}
          disabled={loading || !pagoServicio || isPagoAnulado || !observacionAnulacion.trim()}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Procesando...' : 'Anular Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnularPagoServicio; 
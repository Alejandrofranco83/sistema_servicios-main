import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Grid,
  Paper,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';

// Constante con la URL base de la API
const API_URL = 'http://localhost:3000/api';

interface EliminarCambioProps {
  open: boolean;
  onClose: () => void;
  cambioId: string | null;
  onSuccess: () => void; // Callback para recargar datos
}

// Interfaz para los datos del cambio
interface CambioData {
  id: string;
  fecha: string;
  monedaOrigen: 'PYG' | 'USD' | 'BRL';
  monedaDestino: 'PYG' | 'USD' | 'BRL';
  monto: number;
  cotizacion: number;
  resultado: number;
  observacion: string;
  usuarioId: number;
  usuario?: {
    id: number;
    nombre: string;
  };
  estado: string;
  cajaId?: string | null;
  movimientoId?: number;
}

// Mapeo de monedas para mostrar
const getNombreMoneda = (moneda: string): string => {
  switch(moneda) {
    case 'PYG': return 'Guaraníes';
    case 'USD': return 'Dólares';
    case 'BRL': return 'Reales';
    default: return moneda;
  }
};

const EliminarCambio: React.FC<EliminarCambioProps> = ({
  open,
  onClose,
  cambioId,
  onSuccess
}) => {
  const [cambioData, setCambioData] = useState<CambioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [exito, setExito] = useState(false);

  // Cargar datos del cambio según el cambioId
  useEffect(() => {
    const cargarCambio = async () => {
      if (!cambioId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);

        console.log('Intentando cargar cambio con ID:', cambioId);
        const response = await axios.get(`${API_URL}/cambios-moneda/${cambioId}`);
        console.log('Datos recibidos del cambio:', response.data);
        
        if (!response.data || !response.data.id) {
          setError('Datos del cambio incompletos o no válidos');
          setLoading(false);
          return;
        }
        
        // Mapear los datos del backend al formato esperado por el frontend
        const cambioDB = response.data;
        
        // Mostrar todo el objeto para debug
        console.log('Datos completos del cambio:', JSON.stringify(cambioDB, null, 2));
        
        setCambioData({
          id: cambioDB.id,
          fecha: cambioDB.fecha || new Date().toISOString(),
          monedaOrigen: cambioDB.monedaOrigen,
          monedaDestino: cambioDB.monedaDestino,
          monto: parseFloat(cambioDB.monto) || 0,
          cotizacion: parseFloat(cambioDB.cotizacion) || 0,
          resultado: parseFloat(cambioDB.resultado) || 0,
          observacion: cambioDB.observacion || '',
          usuarioId: cambioDB.usuarioId,
          usuario: cambioDB.usuario,
          estado: cambioDB.cajaId === 'cancelado' ? 'cancelado' : 'activo',
          cajaId: cambioDB.cajaId,
          movimientoId: cambioDB.movimientoId
        });
      } catch (err: any) {
        console.error('Error al cargar el cambio:', err);
        console.error('URL solicitada:', `${API_URL}/cambios-moneda/${cambioId}`);
        setError(
          err.response?.data?.error || 
          err.response?.data?.mensaje || 
          err.message || 
          'Error al cargar los datos del cambio'
        );
      } finally {
        setLoading(false);
      }
    };

    if (open && cambioId) {
      cargarCambio();
    } else {
      setCambioData(null);
      setError(null);
      setExito(false);
      setConfirmEliminar(false);
    }
  }, [cambioId, open]);

  // Verificar si el cambio está cancelado
  const estaCancelado = cambioData?.estado === 'cancelado' || cambioData?.cajaId === 'cancelado';

  // Formatear valor según la moneda
  const formatearValor = (valor: number, moneda: string): string => {
    if (!valor) return '-';
    
    switch (moneda) {
      case 'PYG':
        // Usar formato 1.000 para guaraníes
        return new Intl.NumberFormat('es-PY', { 
          useGrouping: true,
          maximumFractionDigits: 0
        }).format(valor);
      case 'USD':
        return formatCurrency.dollars(valor);
      case 'BRL':
        return formatCurrency.reals(valor);
      default:
        return valor.toString();
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return '-';
    }
  };

  // Mostrar confirmación para eliminar cambio
  const handleShowConfirmEliminar = () => {
    setConfirmEliminar(true);
  };

  // Cancelar el proceso de eliminación
  const handleCancelEliminar = () => {
    setConfirmEliminar(false);
  };

  // Procesar la eliminación del cambio
  const handleEliminarCambio = async () => {
    if (!cambioData || !cambioId) return;
    
    try {
      setCancelando(true);
      setError(null);
      
      console.log('Enviando solicitud para cancelar cambio:', cambioId);
      
      // La ruta ya está implementada en el backend
      const response = await axios.post(`${API_URL}/cambios-moneda/cancelar/${cambioId}`, {
        observacion: 'Cambio cancelado por usuario'
      });
      
      console.log('Respuesta de cancelación:', response.data);
      
      setExito(true);
      setConfirmEliminar(false);
      
      // Después de un tiempo, cerrar y notificar éxito
      setTimeout(() => {
        onSuccess(); // Recargar datos
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error al cancelar el cambio:', err);
      console.error('URL solicitada:', `${API_URL}/cambios-moneda/cancelar/${cambioId}`);
      
      // Obtener el mensaje específico del error
      const mensajeError = err.response?.data?.error || 
                         err.response?.data?.mensaje || 
                         err.message || 
                         'Intente nuevamente.';
      
      setError('No se pudo cancelar el cambio. ' + mensajeError);
    } finally {
      setCancelando(false);
      setConfirmEliminar(false); // Cerrar el diálogo de confirmación en caso de error
    }
  };

  // Función para seleccionar todo el texto al hacer clic en un TextField
  const handleTextFieldClick = (event: React.MouseEvent<HTMLElement>) => {
    // Verificar que el elemento actual tiene el método select antes de llamarlo
    if (event.currentTarget instanceof HTMLInputElement || 
        event.currentTarget instanceof HTMLTextAreaElement) {
      event.currentTarget.select();
    }
  };

  // Obtener el símbolo de la moneda
  const getSimbolo = (moneda: string): string => {
    switch(moneda) {
      case 'PYG': return 'G$';
      case 'USD': return 'U$D';
      case 'BRL': return 'R$';
      default: return '';
    }
  };

  // Formatear el monto con su símbolo
  const formatearMontoCompleto = (monto: number, moneda: string): string => {
    if (!monto) return '-';
    return `${getSimbolo(moneda)} ${formatearValor(monto, moneda)}`;
  };

  return (
    <Dialog
      open={open}
      onClose={!cancelando ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6">
          {estaCancelado ? 'Detalles de Cambio (Cancelado)' : 'Eliminar Cambio'}
        </Typography>
        <IconButton 
          onClick={onClose}
          disabled={cancelando}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : exito ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            El cambio ha sido cancelado exitosamente
          </Alert>
        ) : cambioData ? (
          <>
            {estaCancelado && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Este cambio ya ha sido cancelado y no puede ser modificado.
              </Alert>
            )}
            
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Información del Cambio
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha"
                    value={formatDate(cambioData.fecha)}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={estaCancelado ? 'Cancelado' : 'Activo'}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Moneda Origen"
                    value={`${getNombreMoneda(cambioData.monedaOrigen)} (${getSimbolo(cambioData.monedaOrigen)})`}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Moneda Destino"
                    value={`${getNombreMoneda(cambioData.monedaDestino)} (${getSimbolo(cambioData.monedaDestino)})`}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monto Origen"
                    value={formatearMontoCompleto(cambioData.monto, cambioData.monedaOrigen)}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monto Destino"
                    value={formatearMontoCompleto(cambioData.resultado, cambioData.monedaDestino)}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cotización"
                    value={`1 ${getSimbolo(cambioData.monedaOrigen)} = ${formatearValor(cambioData.cotizacion, cambioData.monedaDestino === 'PYG' ? 'PYG' : cambioData.monedaDestino)} ${getSimbolo(cambioData.monedaDestino)}`}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Usuario"
                    value={cambioData.usuario?.nombre || `ID: ${cambioData.usuarioId}`}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observación"
                    value={cambioData.observacion || 'Sin observaciones'}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
            
            {confirmEliminar ? (
              <Box sx={{ 
                p: 3, 
                border: '1px solid #f44336', 
                borderRadius: '4px',
                bgcolor: 'rgba(244, 67, 54, 0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" color="error">
                    Confirmar cancelación de cambio
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  ¿Está seguro que desea cancelar este cambio de moneda? Esta acción:
                </Typography>
                
                <ul>
                  <li>
                    <Typography variant="body2">
                      Marcará el cambio como "Cancelado" en el sistema
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Creará un movimiento opuesto para anular el efecto del cambio
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Esta acción no se puede deshacer
                    </Typography>
                  </li>
                </ul>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEliminar}
                    sx={{ mr: 1 }}
                    disabled={cancelando}
                  >
                    No, Mantener Cambio
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleEliminarCambio}
                    disabled={cancelando}
                    startIcon={cancelando ? <CircularProgress size={20} /> : <DeleteIcon />}
                  >
                    {cancelando ? 'Procesando...' : 'Sí, Cancelar Cambio'}
                  </Button>
                </Box>
              </Box>
            ) : null}
          </>
        ) : (
          <Alert severity="warning">
            No se encontró información del cambio
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        {cambioData && !estaCancelado && !confirmEliminar && (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleShowConfirmEliminar}
          >
            Cancelar Cambio
          </Button>
        )}
        
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={cancelando}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EliminarCambio; 
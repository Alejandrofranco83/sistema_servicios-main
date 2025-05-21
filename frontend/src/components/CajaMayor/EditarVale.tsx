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

interface EditarValeProps {
  open: boolean;
  onClose: () => void;
  movimientoId: number | null;
  onSuccess: () => void; // Callback para recargar datos
  tipoMovimiento?: string; // Propiedad adicional para conocer el tipo de movimiento
}

// Interfaz para los datos del vale
interface ValeData {
  id: string;
  numero: string;
  fecha: string;
  fecha_emision?: string;
  persona: {
    id: number;
    nombre: string;
    documento?: string;
  };
  monto: number;
  moneda: 'guaranies' | 'dolares' | 'reales';
  estado: 'activo' | 'cancelado' | 'pagado' | 'pendiente' | 'cobrado' | 'anulado';
  observacion: string;
  observaciones_internas?: string;
  movimientoId: number;
}

// Mapeo entre códigos de moneda del backend y frontend
const mapearMoneda = (monedaBackend: string): 'guaranies' | 'dolares' | 'reales' => {
  switch(monedaBackend) {
    case 'PYG': return 'guaranies';
    case 'USD': return 'dolares';
    case 'BRL': return 'reales';
    default: return 'guaranies';
  }
};

// Mapeo entre estados del backend y frontend
const mapearEstado = (estadoBackend: string): string => {
  switch(estadoBackend) {
    case 'pendiente': return 'Activo';
    case 'cobrado': return 'Pagado';
    case 'anulado': return 'Cancelado';
    default: return estadoBackend.charAt(0).toUpperCase() + estadoBackend.slice(1);
  }
};

const EditarVale: React.FC<EditarValeProps> = ({
  open,
  onClose,
  movimientoId,
  onSuccess,
  tipoMovimiento = 'Vales' // Valor por defecto
}) => {
  const [valeData, setValeData] = useState<ValeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [exito, setExito] = useState(false);

  // Cargar datos del vale según el movimientoId
  useEffect(() => {
    const cargarVale = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!movimientoId) {
          setError('ID de movimiento no válido');
          setLoading(false);
          return;
        }

        // Verificar el tipo de movimiento
        if (tipoMovimiento && !['Vales', 'Vale', 'vales', 'vale'].includes(tipoMovimiento.trim())) {
          console.log(`No se procesa el movimiento ID ${movimientoId} porque es de tipo "${tipoMovimiento}" y no "Vales"`);
          setError(`Este movimiento es de tipo "${tipoMovimiento}" y no corresponde a un vale.`);
          setLoading(false);
          return;
        }

        console.log(`Cargando vale para el movimiento ID: ${movimientoId}`);

        const response = await axios.get(`${API_URL}/vales/por-movimiento/${movimientoId}`);
        console.log('Datos recibidos del vale:', response.data);
        
        if (!response.data || !response.data.id) {
          setError('Datos del vale incompletos o no válidos');
          setLoading(false);
          return;
        }
        
        // Mapear los datos del backend al formato esperado por el frontend
        const valeBackend = response.data;
        
        // Mostrar todo el objeto para debug
        console.log('Datos completos del vale:', JSON.stringify(valeBackend, null, 2));
        
        setValeData({
          id: valeBackend.id,
          numero: valeBackend.numero || '',
          fecha: valeBackend.fecha_emision || '',
          persona: {
            id: valeBackend.persona?.id || 0,
            nombre: valeBackend.persona?.nombreCompleto || valeBackend.persona_nombre || '-',
            documento: valeBackend.persona?.documento || '-'
          },
          monto: parseFloat(valeBackend.monto) || 0,
          moneda: mapearMoneda(valeBackend.moneda),
          estado: valeBackend.estado || 'pendiente',
          observacion: valeBackend.observaciones_internas || valeBackend.motivo || 'Sin observaciones',
          movimientoId: movimientoId || 0
        });
      } catch (err: any) {
        console.error('Error al cargar el vale:', err);
        
        // Manejar específicamente errores 404 (no encontrado)
        if (err.response && err.response.status === 404) {
          setError('No se encontró vale asociado a este movimiento. Es posible que este movimiento no corresponda a un vale.');
        } else {
        setError(
          err.response?.data?.error || 
          err.response?.data?.mensaje || 
          err.message || 
          'Error al cargar el vale'
        );
        }
      } finally {
        setLoading(false);
      }
    };

    if (open && movimientoId) {
      cargarVale();
    }
  }, [movimientoId, open, tipoMovimiento]);

  // Verificar si el vale está cancelado o el movimiento es de cancelación
  const esCancelado = valeData?.estado === 'anulado' || valeData?.estado === 'cancelado';

  // Formatear valor según la moneda
  const formatearValor = (valor: number, moneda?: 'guaranies' | 'dolares' | 'reales'): string => {
    if (!moneda) return formatCurrency.guaranies(valor);
    
    switch (moneda) {
      case 'guaranies':
        // Usar formato 1.000 para guaraníes
        return new Intl.NumberFormat('es-PY', { 
          useGrouping: true,
          maximumFractionDigits: 0
        }).format(valor);
      case 'dolares':
        return formatCurrency.dollars(valor);
      case 'reales':
        return formatCurrency.reals(valor);
      default:
        return formatCurrency.guaranies(valor);
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

  // Mostrar confirmación para cancelar vale
  const handleShowConfirmCancelar = () => {
    setConfirmCancelar(true);
  };

  // Cancelar el proceso de cancelación
  const handleCancelCancelacion = () => {
    setConfirmCancelar(false);
  };

  // Procesar la cancelación del vale
  const handleCancelarVale = async () => {
    if (!valeData || !movimientoId) return;
    
    try {
      setCancelando(true);
      setError(null);
      
      // Llamada a la API para cancelar el vale
      await axios.post(`${API_URL}/vales/cancelar/${valeData.id}`, {
        movimientoId: movimientoId,
        razon: 'Vale cancelado'
      });
      
      setExito(true);
      setConfirmCancelar(false);
      
      // Después de un tiempo, cerrar y notificar éxito
      setTimeout(() => {
        onSuccess(); // Recargar datos
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error al cancelar el vale:', err);
      setError('No se pudo cancelar el vale. ' + 
              (err.response?.data?.mensaje || err.message || 'Intente nuevamente.'));
    } finally {
      setCancelando(false);
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
      case 'guaranies': return 'G$';
      case 'dolares': return 'U$D';
      case 'reales': return 'R$';
      default: return '';
    }
  };

  // Formatear el monto con su símbolo
  const formatearMontoCompleto = (monto: number, moneda: string): string => {
    if (!monto) return '-';
    return `${getSimbolo(moneda)} ${formatearValor(monto, moneda as any)}`;
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
          {esCancelado ? 'Detalles de Vale (Cancelado)' : 'Editar Vale'}
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
            El vale ha sido cancelado exitosamente
          </Alert>
        ) : valeData ? (
          <>
            {esCancelado && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Este vale ha sido cancelado y no puede ser modificado.
              </Alert>
            )}
            
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Información del Vale
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Persona"
                    value={valeData.persona?.nombre || '-'}
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
                    label="Documento"
                    value={valeData.persona?.documento || '-'}
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
                    label="Fecha"
                    value={formatDate(valeData.fecha)}
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
                    value={mapearEstado(valeData.estado)}
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
                    label="Monto"
                    value={formatearMontoCompleto(valeData.monto, valeData.moneda)}
                    InputProps={{
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Moneda"
                    fullWidth
                    variant="outlined"
                    size="small"
                    margin="normal"
                    InputProps={{ 
                      readOnly: true,
                      onClick: handleTextFieldClick
                    }}
                    value={valeData.moneda === 'guaranies' ? 'Guaraníes' : 
                           valeData.moneda === 'dolares' ? 'Dólares' : 
                           valeData.moneda === 'reales' ? 'Reales' : '-'}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observación"
                    value={valeData.observacion || 'Sin observaciones'}
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
            
            {confirmCancelar ? (
              <Box sx={{ 
                p: 3, 
                border: '1px solid #f44336', 
                borderRadius: '4px',
                bgcolor: 'rgba(244, 67, 54, 0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" color="error">
                    Confirmar cancelación de vale
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  ¿Está seguro que desea cancelar este vale? Esta acción:
                </Typography>
                
                <ul>
                  <li>
                    <Typography variant="body2">
                      Marcará el vale como "Cancelado" en el sistema
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Creará un movimiento opuesto en caja para anular el efecto del vale
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
                    onClick={handleCancelCancelacion}
                    sx={{ mr: 1 }}
                    disabled={cancelando}
                  >
                    No, Mantener Vale
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCancelarVale}
                    disabled={cancelando}
                    startIcon={cancelando ? <CircularProgress size={20} /> : <DeleteIcon />}
                  >
                    {cancelando ? 'Procesando...' : 'Sí, Cancelar Vale'}
                  </Button>
                </Box>
              </Box>
            ) : null}
          </>
        ) : (
          <Alert severity="warning">
            No se encontró información del vale
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        {valeData && !esCancelado && !confirmCancelar && (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleShowConfirmCancelar}
          >
            Cancelar Vale
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

export default EditarVale; 
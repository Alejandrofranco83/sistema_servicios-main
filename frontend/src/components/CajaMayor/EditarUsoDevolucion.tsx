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
  IconButton,
  Stack // Asegúrate de importar Stack si lo usas
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatUtils';
import { handleInputClick } from '../../utils/inputUtils'; // Reutilizar si aplica
import axios from 'axios'; // Asumiendo que usarás axios

// Constante con la URL base de la API
const API_URL = 'http://localhost:3000/api'; // Ajusta si es necesario

interface EditarUsoDevolucionProps {
  open: boolean;
  onClose: () => void;
  movimientoId: number | null;
  onSuccess: () => void; // Callback para recargar datos
}

// Interfaz para los datos de Uso/Devolución
interface UsoDevolucionData {
  id: number; // ID de la tabla uso_devolucion
  tipo: 'USO' | 'DEVOLUCION';
  fecha: string; // Fecha de la operación (del movimiento?)
  persona: {
    id: number;
    nombre: string;
    documento?: string;
  };
  guaranies: number;
  dolares: number;
  reales: number;
  motivo: string;
  anulado: boolean; // Estado de anulación
  movimientoId: number; // ID del movimiento asociado
}

// Mapeo de tipos para visualización
const mapearTipo = (tipo: 'USO' | 'DEVOLUCION'): string => {
  switch(tipo) {
    case 'USO': return 'Uso de Efectivo';
    case 'DEVOLUCION': return 'Devolución de Efectivo';
    default: return tipo;
  }
};

const EditarUsoDevolucion: React.FC<EditarUsoDevolucionProps> = ({
  open,
  onClose,
  movimientoId,
  onSuccess
}) => {
  const [operacionData, setOperacionData] = useState<UsoDevolucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [exito, setExito] = useState(false);

  // Cargar datos de la operación según el movimientoId
  useEffect(() => {
    const cargarOperacion = async () => {
      try {
        setLoading(true);
        setError(null);
        setExito(false);
        setConfirmCancelar(false);
        setOperacionData(null); // Limpiar datos previos

        if (!movimientoId) {
          setError('ID de movimiento no válido');
          setLoading(false);
          return;
        }

        // TODO: Ajustar el endpoint según tu API
        const response = await axios.get(`${API_URL}/uso-devolucion/por-movimiento/${movimientoId}`);
        console.log('Datos recibidos de Uso/Devolución:', response.data);

        if (!response.data || !response.data.id) {
          setError('Datos de la operación incompletos o no válidos');
          setLoading(false);
          return;
        }

        const opBackend = response.data;

        setOperacionData({
          id: opBackend.id,
          tipo: opBackend.tipo, // Asume que el backend devuelve 'USO' o 'DEVOLUCION'
          fecha: opBackend.cajaMayorMovimiento?.fecha || new Date().toISOString(), // Obtener fecha del movimiento asociado
          persona: {
            id: opBackend.persona?.id || opBackend.persona_id || 0,
            nombre: opBackend.persona?.nombreCompleto || opBackend.persona_nombre || '-',
            documento: opBackend.persona?.documento || '-'
          },
          guaranies: parseFloat(opBackend.guaranies) || 0,
          dolares: parseFloat(opBackend.dolares) || 0,
          reales: parseFloat(opBackend.reales) || 0,
          motivo: opBackend.motivo || '-',
          anulado: opBackend.anulado || false,
          movimientoId: movimientoId || 0
        });
      } catch (err: any) {
        console.error('Error al cargar la operación:', err);
        setError(
          err.response?.data?.error ||
          err.response?.data?.mensaje ||
          err.message ||
          'Error al cargar los detalles de la operación'
        );
      } finally {
        setLoading(false);
      }
    };

    if (open && movimientoId) {
      cargarOperacion();
    } else if (!open) {
      // Resetear estados cuando se cierra el diálogo
      setLoading(true);
      setError(null);
      setExito(false);
      setConfirmCancelar(false);
      setOperacionData(null);
    }
  }, [movimientoId, open]);

  const esAnulado = operacionData?.anulado;

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

  // Mostrar confirmación para cancelar
  const handleShowConfirmCancelar = () => {
    setConfirmCancelar(true);
  };

  // Ocultar confirmación
  const handleCancelCancelacion = () => {
    setConfirmCancelar(false);
  };

  // Procesar la cancelación
  const handleCancelarOperacion = async () => {
    if (!operacionData) return;

    try {
      setCancelando(true);
      setError(null);

      // Llamada a la API para cancelar la operación
      // TODO: Ajustar el endpoint y payload según tu API
      await axios.post(`${API_URL}/uso-devolucion/cancelar/${operacionData.id}`, {
        // Podrías enviar el movimientoId si el backend lo necesita para crear el inverso
        movimientoId: operacionData.movimientoId,
        razon: `Cancelación de ${operacionData.tipo.toLowerCase()} ID ${operacionData.id}`
      });

      setExito(true);
      setConfirmCancelar(false);

      // Después de un tiempo, cerrar y notificar éxito
      setTimeout(() => {
        onSuccess(); // Recargar datos en la tabla principal
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error al cancelar la operación:', err);
      setError('No se pudo cancelar la operación. ' +
              (err.response?.data?.mensaje || err.message || 'Intente nuevamente.'));
    } finally {
      setCancelando(false);
    }
  };

  // Función para renderizar montos
  const renderMonto = (valor: number, moneda: 'G$' | 'U$D' | 'R$'): JSX.Element | null => {
    if (valor === 0) return null;

    let formateado = "";
    switch (moneda) {
      case 'G$':
        // Asegurar formato 1.000 para guaraníes
        formateado = new Intl.NumberFormat('es-PY', { 
          useGrouping: true,
          maximumFractionDigits: 0
        }).format(valor);
        break;
      case 'U$D':
        // Formato 1,234.56 para dólares
        formateado = new Intl.NumberFormat('en-US', { 
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(valor);
        break;
      case 'R$':
        // Formato 1.234,56 para reales
        formateado = new Intl.NumberFormat('pt-BR', { 
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(valor);
        break;
    }

    return (
      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{moneda}:</span>
        <span>{formateado}</span>
      </Typography>
    );
  };


  return (
    <Dialog
      open={open}
      onClose={!cancelando ? onClose : undefined} // No permitir cerrar mientras se cancela
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6">
          {esAnulado ? 'Detalles de Operación (Anulada)' : 'Detalles de Uso/Devolución'}
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
            La operación ha sido cancelada exitosamente.
          </Alert>
        ) : operacionData ? (
          <>
            {esAnulado && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Esta operación ha sido anulada y no puede ser modificada.
              </Alert>
            )}

            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Información de la Operación
              </Typography>

              <Grid container spacing={2}>
                {/* Fila 1: Tipo y Fecha */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tipo de Operación"
                    value={mapearTipo(operacionData.tipo)}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense" // Usar dense para menor espacio vertical
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha y Hora"
                    value={formatDate(operacionData.fecha)}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                </Grid>

                {/* Fila 2: Persona y Documento */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Persona"
                    value={operacionData.persona?.nombre || '-'}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Documento"
                    value={operacionData.persona?.documento || '-'}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                </Grid>

                {/* Fila 3: Montos */}
                <Grid item xs={12}>
                   <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Montos</Typography>
                   <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={0.5}>
                      {renderMonto(operacionData.guaranies, 'G$')}
                      {renderMonto(operacionData.dolares, 'U$D')}
                      {renderMonto(operacionData.reales, 'R$')}
                      {(operacionData.guaranies === 0 && operacionData.dolares === 0 && operacionData.reales === 0) && (
                        <Typography variant="body2" color="text.secondary">Sin montos registrados.</Typography>
                      )}
                    </Stack>
                   </Paper>
                </Grid>

                {/* Fila 4: Motivo */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Motivo / Observación"
                    value={operacionData.motivo || 'Sin motivo'}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Sección de Confirmación de Cancelación */}
            {confirmCancelar ? (
              <Box sx={{
                p: 3,
                border: '1px solid #f44336',
                borderRadius: '4px',
                bgcolor: 'rgba(244, 67, 54, 0.08)',
                mt: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" color="error">
                    Confirmar cancelación de operación
                  </Typography>
                </Box>

                <Typography variant="body2" paragraph>
                  ¿Está seguro que desea cancelar esta operación de '{mapearTipo(operacionData.tipo)}'? Esta acción:
                </Typography>

                <ul>
                  <li><Typography variant="body2">Marcará la operación como "Anulada".</Typography></li>
                  <li><Typography variant="body2">Creará un movimiento contrario en caja para anular su efecto financiero.</Typography></li>
                  <li><Typography variant="body2">Esta acción no se puede deshacer.</Typography></li>
                </ul>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelCancelacion}
                    sx={{ mr: 1 }}
                    disabled={cancelando}
                  >
                    No, Mantener Operación
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCancelarOperacion}
                    disabled={cancelando}
                    startIcon={cancelando ? <CircularProgress size={20} /> : <DeleteIcon />}
                  >
                    {cancelando ? 'Procesando...' : 'Sí, Cancelar Operación'}
                  </Button>
                </Box>
              </Box>
            ) : null}
          </>
        ) : (
          // Mensaje cuando no hay datos y no está cargando ni hay error
          !loading && !error && (
            <Alert severity="info">
              Cargando detalles de la operación...
            </Alert>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {operacionData && !esAnulado && !confirmCancelar && (
          <>
            {operacionData.persona?.nombre === 'FARMACIA FRANCO' ? (
              <Alert severity="warning" sx={{ flexGrow: 1, mr: 2 }}>
                NO SE PUEDE ANULAR ESTA OPERACIÓN
              </Alert>
            ) : (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleShowConfirmCancelar}
                disabled={loading || cancelando} // Deshabilitar si está cargando o cancelando
              >
                Anular Operación
              </Button>
            )}
          </>
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

export default EditarUsoDevolucion; 
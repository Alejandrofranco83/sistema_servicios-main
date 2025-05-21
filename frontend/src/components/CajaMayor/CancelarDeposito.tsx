import React, { useState, useEffect, useRef } from 'react';
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
  Stack,
  Input
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  AccountBalance as BankIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatUtils';
import { handleInputClick } from '../../utils/inputUtils';
import axios from 'axios';

// Constante con la URL base de la API
const API_URL = 'http://localhost:3000/api';

/**
 * Componente para ver, cancelar o editar depósitos bancarios
 */
interface CancelarDepositoProps {
  open: boolean;
  onClose: () => void;
  movimientoId: number | null;
  onSuccess: () => void; // Callback para recargar datos
}

// Interfaz para los datos de Depósito
interface DepositoData {
  id: number;
  fecha: string;
  banco: {
    id: number;
    nombre: string;
  };
  cuenta: {
    id: number;
    numero: string;
    tipoCuenta: string;
  };
  numeroBoleta: string;
  monto: number;
  moneda: 'guaranies' | 'dolares' | 'reales';
  observacion: string;
  anulado: boolean;
  movimientoId: number;
  rutaComprobante?: string | null;
}

// Tipos para el modo del diálogo
type DialogMode = 'view' | 'cancel' | 'edit';

const CancelarDeposito: React.FC<CancelarDepositoProps> = ({
  open,
  onClose,
  movimientoId,
  onSuccess
}) => {
  const [depositoData, setDepositoData] = useState<DepositoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const [razonCancelacion, setRazonCancelacion] = useState<string>('');
  const [mode, setMode] = useState<DialogMode>('view');

  // Estados para la edición
  const [editedNumeroBoleta, setEditedNumeroBoleta] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos del depósito según el movimientoId
  useEffect(() => {
    const cargarDeposito = async () => {
      try {
        setLoading(true);
        setError(null);
        setExito(null);
        setConfirmCancelar(false);
        setMode('view');
        setDepositoData(null);
        setRazonCancelacion('');
        setEditedNumeroBoleta('');
        setSelectedFile(null);

        if (!movimientoId) {
          setError('ID de movimiento no válido');
          setLoading(false);
          return;
        }

        console.log(`Cargando datos del depósito para el movimiento ID: ${movimientoId}`);
        
        const response = await axios.get(`${API_URL}/depositos-bancarios/por-movimiento/${movimientoId}`);
        console.log('Datos recibidos de Depósito:', response.data);

        if (!response.data || !response.data.id) {
          setError('Datos del depósito incompletos o no válidos');
          setLoading(false);
          return;
        }

        const depBackend = response.data;
        const observacion = depBackend.observacion || '';
        const estaCancelado = observacion.includes('CANCELADO') || depBackend.estado === 'anulado';

        const mappedData: DepositoData = {
          id: depBackend.id,
          fecha: depBackend.fecha || new Date().toISOString(),
          banco: {
            id: depBackend.banco?.id || 0,
            nombre: depBackend.bancoNombre || depBackend.banco?.nombre || '-'
          },
          cuenta: {
            id: depBackend.cuentaBancaria?.id || 0,
            numero: depBackend.numeroCuenta || depBackend.cuentaBancaria?.numeroCuenta || '-',
            tipoCuenta: depBackend.tipoCuenta || depBackend.cuentaBancaria?.tipo || '-'
          },
          numeroBoleta: depBackend.numeroBoleta || '-',
          monto: parseFloat(depBackend.monto) || 0,
          moneda: depBackend.moneda || 'guaranies',
          observacion: observacion,
          anulado: estaCancelado,
          movimientoId: movimientoId || 0,
          rutaComprobante: depBackend.rutaComprobante || null
        };

        setDepositoData(mappedData);
        setEditedNumeroBoleta(mappedData.numeroBoleta);

      } catch (err: any) {
        console.error('Error al cargar el depósito:', err);
        setError(
          err.response?.data?.error ||
          err.response?.data?.mensaje ||
          err.message ||
          'Error al cargar los detalles del depósito'
        );
      } finally {
        setLoading(false);
      }
    };

    if (open && movimientoId) {
      cargarDeposito();
    } else if (!open) {
      setLoading(true);
      setError(null);
      setExito(null);
      setMode('view');
      setConfirmCancelar(false);
      setDepositoData(null);
      setRazonCancelacion('');
      setEditedNumeroBoleta('');
      setSelectedFile(null);
    }
  }, [movimientoId, open]);

  // Verificar si el depósito está anulado
  const esAnulado = depositoData?.anulado;

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

  // Cambiar a modo edición
  const handleEdit = () => {
    if (depositoData) {
      setMode('edit');
      setEditedNumeroBoleta(depositoData.numeroBoleta);
      setSelectedFile(null);
      setError(null);
      setExito(null);
    }
  };

  // Cambiar a modo cancelación (confirmación)
  const handleShowConfirmCancelar = () => {
    setMode('cancel');
    setConfirmCancelar(true);
    setError(null);
    setExito(null);
  };

  // Salir del modo cancelación o edición y volver a view
  const handleCancelAction = () => {
    setMode('view');
    setConfirmCancelar(false);
    setError(null);
    if (depositoData) {
        setEditedNumeroBoleta(depositoData.numeroBoleta);
    }
    setSelectedFile(null);
  };

  // Procesar la cancelación
  const handleCancelarDeposito = async () => {
    if (!depositoData) return;
    if (!razonCancelacion.trim()) {
      setError('Debe ingresar un motivo para la cancelación');
      return;
    }

    try {
      setCancelando(true);
      setError(null);

      await axios.post(`${API_URL}/depositos-bancarios/cancelar/${depositoData.id}`, {
        movimientoId: depositoData.movimientoId,
        razon: razonCancelacion
      });

      setExito('El depósito ha sido cancelado exitosamente.');
      setMode('view');
      setConfirmCancelar(false);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error al cancelar el depósito:', err);
      setError('No se pudo cancelar el depósito. ' + (err.response?.data?.mensaje || err.message || 'Intente nuevamente.'));
    } finally {
      setCancelando(false);
    }
  };

  // Procesar el guardado de cambios (Edición)
  const handleGuardarCambios = async () => {
      if (!depositoData || !editedNumeroBoleta.trim()) {
          setError('El número de boleta no puede estar vacío.');
          return;
      }

      setEditando(true);
      setError(null);
      setExito(null);

      const formData = new FormData();
      formData.append('numeroBoleta', editedNumeroBoleta.trim());
      if (selectedFile) {
          formData.append('comprobante', selectedFile);
      }
      formData.append('movimientoId', depositoData.movimientoId.toString());

      try {
          const response = await axios.put(`${API_URL}/depositos-bancarios/${depositoData.id}`, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          });

          console.log('Respuesta de actualización:', response.data);
          setExito('Depósito actualizado exitosamente.');
          setMode('view');

          setTimeout(() => {
              onSuccess();
          }, 1500);

      } catch (err: any) {
          console.error('Error al actualizar el depósito:', err);
          setError('No se pudo actualizar el depósito. ' +
                    (err.response?.data?.error || err.response?.data?.mensaje || err.message || 'Intente nuevamente.'));
      } finally {
          setEditando(false);
      }
  };

  // Manejador para el cambio de archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Formatear monto según moneda
  const formatearMonto = (valor: number, moneda: string): string => {
    switch (moneda) {
      case 'dolares':
        return formatCurrency.dollars(valor);
      case 'reales':
        return formatCurrency.reals(valor);
      default:
        return formatCurrency.guaranies(valor);
    }
  };

  // Determinar título del diálogo
  const getDialogTitle = () => {
    if (mode === 'edit') return 'Editar Depósito Bancario';
    if (mode === 'cancel') return 'Confirmar Cancelación de Depósito';
    return esAnulado ? 'Detalles de Depósito (Anulado)' : 'Detalles del Depósito Bancario';
  };

  // Deshabilitar cierre mientras se procesa algo
  const disableClose = cancelando || editando;

  return (
    <Dialog
      open={open}
      onClose={!disableClose ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6">
          {getDialogTitle()}
        </Typography>
        <IconButton
          onClick={onClose}
          disabled={disableClose}
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
            {exito}
          </Alert>
        ) : depositoData ? (
          <>
            {esAnulado && mode !== 'cancel' && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Este depósito ha sido anulado y no puede ser modificado.
              </Alert>
            )}

            <Paper elevation={mode === 'edit' ? 6 : 3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Información del Depósito
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha y Hora"
                    value={formatDate(depositoData.fecha)}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Boleta"
                    value={mode === 'edit' ? editedNumeroBoleta : depositoData.numeroBoleta}
                    onChange={(e) => setEditedNumeroBoleta(e.target.value.toUpperCase())}
                    InputProps={{
                      readOnly: mode !== 'edit',
                      onClick: mode !== 'edit' ? handleInputClick : undefined
                    }}
                    variant={mode === 'edit' ? "filled" : "outlined"}
                    size="small"
                    margin="dense"
                    required={mode === 'edit'}
                    error={mode === 'edit' && !editedNumeroBoleta.trim()}
                    helperText={mode === 'edit' && !editedNumeroBoleta.trim() ? "El número de boleta es obligatorio" : ""}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Banco"
                    value={depositoData.banco?.nombre || '-'}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Cuenta"
                    value={depositoData.cuenta?.numero || '-'}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                </Grid>

                <Grid item xs={12}>
                   <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Monto</Typography>
                   <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>{depositoData.moneda === 'guaranies' ? 'Guaraníes:' : 
                               depositoData.moneda === 'dolares' ? 'Dólares:' : 'Reales:'}</span>
                        <span>{formatearMonto(depositoData.monto, depositoData.moneda)}</span>
                      </Typography>
                    </Stack>
                   </Paper>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observación / Comentario"
                    value={depositoData.observacion || 'Sin observaciones'}
                    InputProps={{ readOnly: true, onClick: handleInputClick }}
                    variant="outlined"
                    size="small"
                    margin="dense"
                    multiline
                    rows={2}
                  />
                </Grid>

                {mode === 'edit' && (
                  <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>Comprobante</Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                          <Button
                              variant="outlined"
                              component="label"
                              startIcon={<UploadFileIcon />}
                              size="small"
                          >
                              {selectedFile ? "Cambiar Archivo" : "Seleccionar Archivo"}
                              <input
                                  type="file"
                                  hidden
                                  onChange={handleFileChange}
                                  ref={fileInputRef}
                                  accept="image/*,.pdf"
                              />
                          </Button>
                          {selectedFile && (
                              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                  {selectedFile.name}
                              </Typography>
                          )}
                          {!selectedFile && depositoData.rutaComprobante && (
                              <Typography variant="body2">
                                  Actual: <a href={`${API_URL}/uploads/${depositoData.rutaComprobante}`} target="_blank" rel="noopener noreferrer">{depositoData.rutaComprobante.split('/').pop()}</a>
                              </Typography>
                          )}
                          {selectedFile && (
                               <IconButton size="small" onClick={() => setSelectedFile(null)}>
                                   <CloseIcon fontSize="small" />
                               </IconButton>
                           )}
                      </Stack>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {mode === 'cancel' && confirmCancelar && (
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
                    Confirmar cancelación de depósito
                  </Typography>
                </Box>

                <Typography variant="body2" paragraph>
                  ¿Está seguro que desea cancelar este depósito? Esta acción:
                </Typography>

                <ul>
                  <li><Typography variant="body2">Marcará el depósito como "Anulado".</Typography></li>
                  <li><Typography variant="body2">Creará un movimiento contrario en caja para anular su efecto financiero.</Typography></li>
                  <li><Typography variant="body2">Esta acción no se puede deshacer.</Typography></li>
                </ul>

                <TextField
                  fullWidth
                  label="Motivo de la cancelación"
                  value={razonCancelacion}
                  onChange={(e) => setRazonCancelacion(e.target.value.toUpperCase())}
                  required
                  multiline
                  rows={2}
                  sx={{ mt: 2, mb: 2 }}
                  error={cancelando && !razonCancelacion.trim()}
                  helperText={cancelando && !razonCancelacion.trim() ? "El motivo es obligatorio" : ""}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelAction}
                    sx={{ mr: 1 }}
                    disabled={cancelando}
                    startIcon={<CancelIcon />}
                  >
                    No, Mantener Depósito
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCancelarDeposito}
                    disabled={cancelando || !razonCancelacion.trim()}
                    startIcon={cancelando ? <CircularProgress size={20} /> : <DeleteIcon />}
                  >
                    {cancelando ? 'Procesando...' : 'Sí, Cancelar Depósito'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        ) : (
          !loading && !error && (
            <Alert severity="info">
              Cargando detalles del depósito...
            </Alert>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {depositoData && !esAnulado && mode === 'view' && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleShowConfirmCancelar}
              disabled={loading || editando}
            >
              Anular Depósito
            </Button>
             <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              disabled={loading || cancelando}
            >
              Editar
            </Button>
          </>
        )}

        {mode === 'edit' && (
            <>
                <Button
                    variant="outlined"
                    onClick={handleCancelAction}
                    disabled={editando}
                    startIcon={<CancelIcon />}
                >
                    Cancelar Edición
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGuardarCambios}
                    disabled={editando || !editedNumeroBoleta.trim()}
                    startIcon={editando ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                    {editando ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </>
        )}

         {mode === 'view' && (
            <Button
            onClick={onClose}
            variant="outlined"
            disabled={disableClose}
            >
            Cerrar
            </Button>
        )}

      </DialogActions>
    </Dialog>
  );
};

export default CancelarDeposito; 
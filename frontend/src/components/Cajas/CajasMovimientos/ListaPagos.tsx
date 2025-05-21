import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja, formatearMontoServicio } from '../helpers';
import PagosDialog from './PagosDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ListaPagosProps {
  open: boolean;
  onClose: () => void;
}

const ListaPagos: React.FC<ListaPagosProps> = ({ open, onClose }) => {
  const {
    cajaSeleccionada,
    pagos,
    pagosDialogOpen,
    setPagosDialogOpen,
    handleNuevoPago,
    handleEliminarPago,
    confirmarEliminarPagoId,
    setConfirmarEliminarPagoId,
    formPago,
    setFormPago,
    loading,
    confirmarEliminacionPago,
    cancelarEliminacionPago
  } = useCajas();

  // Estado para manejar el modo de edición
  const [modoEdicion, setModoEdicion] = useState(false);

  // Función para editar un pago existente
  const handleEditarPago = (pagoId: string) => {
    const pagoSeleccionado = pagos.find(pago => pago.id === pagoId);
    if (pagoSeleccionado) {
      // Convertir monto a string formateado
      setFormPago({
        id: pagoId,
        operadora: pagoSeleccionado.operadora,
        servicio: pagoSeleccionado.servicio,
        monto: formatearMontoServicio(pagoSeleccionado.monto),
        moneda: pagoSeleccionado.moneda,
        observacion: pagoSeleccionado.observacion || ''
      });
      setModoEdicion(true);
      setPagosDialogOpen(true);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Lista de Pagos
        </DialogTitle>
        {cajaSeleccionada && (
          <Box sx={{ px: 3, mt: -2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId})
            </Typography>
          </Box>
        )}
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setModoEdicion(false);
                handleNuevoPago();
              }}
            >
              Nuevo Pago
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : pagos.length === 0 ? (
            <Alert severity="info">
              No hay pagos registrados para esta caja.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Servicio</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Observación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{format(new Date(pago.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                      <TableCell>
                        <Tooltip title={`Operadora: ${pago.operadora}`}>
                          <span>{pago.servicio}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        {pago.moneda === 'PYG' 
                          ? `${formatearMontoServicio(pago.monto)} Gs` 
                          : `$ ${new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(pago.monto)}`
                        }
                      </TableCell>
                      <TableCell>{pago.observacion || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditarPago(pago.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmarEliminarPagoId(pago.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={!!confirmarEliminarPagoId}
        onClose={cancelarEliminacionPago}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar este pago? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelarEliminacionPago} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmarEliminacionPago} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Formulario de pago */}
      <PagosDialog 
        open={pagosDialogOpen} 
        onClose={() => {
          setPagosDialogOpen(false);
          setModoEdicion(false);
        }}
        modoEdicion={modoEdicion}
      />
    </>
  );
};

export default ListaPagos; 
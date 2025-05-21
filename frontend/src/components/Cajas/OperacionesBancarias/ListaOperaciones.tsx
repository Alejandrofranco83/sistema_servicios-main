import React, { useEffect } from 'react';
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
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja, formatearMontoConSeparadores } from '../helpers';
import FormOperacion from './FormOperacion';

interface ListaOperacionesProps {
  open: boolean;
  onClose: () => void;
}

const ListaOperaciones: React.FC<ListaOperacionesProps> = ({ open, onClose }) => {
  const {
    cajaSeleccionada,
    operacionesBancarias,
    formOperacionDialogOpen,
    setFormOperacionDialogOpen,
    handleNuevaOperacion,
    handleEditarOperacion,
    handleEliminarOperacion,
    cargarOperacionesBancarias
  } = useCajas();

  // Cargar operaciones bancarias cuando se abre el diálogo
  useEffect(() => {
    const cargarDatos = async () => {
      if (open && cajaSeleccionada) {
        console.log('ListaOperaciones: Cargando operaciones bancarias para la caja:', cajaSeleccionada.id);
        const operaciones = await cargarOperacionesBancarias(cajaSeleccionada.id);
        console.log('ListaOperaciones: Operaciones cargadas:', operaciones);
      }
    };
    
    cargarDatos();
  }, [open, cajaSeleccionada, cargarOperacionesBancarias]);

  // Añadir log para verificar las operaciones cada vez que cambian
  useEffect(() => {
    console.log('ListaOperaciones: Estado actual de operaciones:', operacionesBancarias);
  }, [operacionesBancarias]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Operaciones Bancarias
        </DialogTitle>
        <DialogContent>
          {cajaSeleccionada && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId})
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNuevaOperacion}
            >
              Nueva Operación
            </Button>
          </Box>
          
          {operacionesBancarias.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No hay operaciones bancarias registradas para esta caja.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Servicio</TableCell>
                    <TableCell>Detalles</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Monto Cobrado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operacionesBancarias.map((operacion) => (
                    <TableRow key={operacion.id}>
                      <TableCell>{operacion.fecha}</TableCell>
                      <TableCell>{operacion.tipo === 'pos' ? 'POS' : 'Transferencia'}</TableCell>
                      <TableCell>{operacion.tipoServicio}</TableCell>
                      <TableCell>
                        {operacion.tipo === 'pos' 
                          ? `${operacion.posDescripcion} - Comprobante: ${operacion.numeroComprobante}` 
                          : operacion.cuentaBancaria ? `${operacion.cuentaBancaria.banco} - ${operacion.cuentaBancaria.numeroCuenta}` : ''}
                      </TableCell>
                      <TableCell align="right">{formatearMontoConSeparadores(operacion.monto)} ₲</TableCell>
                      <TableCell align="right">
                        {operacion.montoACobrar ? `${formatearMontoConSeparadores(operacion.montoACobrar)} ₲` : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditarOperacion(operacion)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminarOperacion(operacion.id || '')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
      
      {/* Formulario de operación */}
      <FormOperacion 
        open={formOperacionDialogOpen} 
        onClose={() => setFormOperacionDialogOpen(false)}
      />
    </>
  );
};

export default ListaOperaciones; 
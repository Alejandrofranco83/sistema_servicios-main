import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Box,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { handleInputClick } from '../../utils/inputUtils';
import api, { conteoService, DetalleDenominacion } from '../../services/api';

// Interfaz para el componente de conteo
interface ConteoGuaraniesProps {
  open: boolean;
  onClose: () => void;
  onSaveTotal: (total: number, observacion: string) => void;
  saldoSistema: number;
  usuarioId: number;
}

// Interfaz para denominación
interface Denominacion {
  valor: number;
  cantidad: number;
}

const ConteoGuaranies: React.FC<ConteoGuaraniesProps> = ({ 
  open, 
  onClose, 
  onSaveTotal,
  saldoSistema = 0,
  usuarioId = 1
}) => {
  // Referencias para navegación con teclado
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // Estado para las denominaciones
  const [denominaciones, setDenominaciones] = useState<Denominacion[]>([
    { valor: 100000, cantidad: 0 },
    { valor: 50000, cantidad: 0 },
    { valor: 20000, cantidad: 0 },
    { valor: 10000, cantidad: 0 },
    { valor: 5000, cantidad: 0 },
    { valor: 2000, cantidad: 0 },
    { valor: 1000, cantidad: 0 },
    { valor: 500, cantidad: 0 }
  ]);
  
  // Estado para el total
  const [total, setTotal] = useState<number>(0);
  
  // Estado para la observación
  const [observacion, setObservacion] = useState<string>('');
  
  // Estado para manejar loading y errores
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Función para formatear montos con separadores
  const formatearMontoConSeparadores = (monto: number): string => {
    return new Intl.NumberFormat('es-PY').format(monto);
  };
  
  // Registrar referencias para campos input
  const registerInputRef = (id: string, ref: HTMLInputElement | null) => {
    inputRefs.current[id] = ref;
  };
  
  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId && inputRefs.current[nextFieldId]) {
      e.preventDefault();
      inputRefs.current[nextFieldId]?.focus();
      inputRefs.current[nextFieldId]?.select();
    }
  };
  
  // Calcular total al cambiar denominaciones
  useEffect(() => {
    const nuevoTotal = denominaciones.reduce((sum, denom) => sum + (denom.valor * denom.cantidad), 0);
    setTotal(nuevoTotal);
  }, [denominaciones]);
  
  // Función para manejar cambios en cantidades
  const handleCantidadChange = (index: number, value: string) => {
    const nuevasDenominaciones = [...denominaciones];
    // Convertir a número solo si hay un valor, de lo contrario usar 0
    const cantidad = value === '' ? 0 : parseInt(value);
    nuevasDenominaciones[index].cantidad = cantidad;
    setDenominaciones(nuevasDenominaciones);
  };
  
  // Función para limpiar el conteo
  const handleLimpiarConteo = useCallback(() => {
    setDenominaciones(prev => prev.map(d => ({ ...d, cantidad: 0 })));
    setObservacion('');
  }, []);
  
  // Limpiar el formulario cuando se abre
  useEffect(() => {
    if (open) {
      handleLimpiarConteo();
    }
  }, [open, handleLimpiarConteo]);
  
  // Función para guardar el total en la base de datos
  const handleGuardarTotal = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar los datos para enviar a la API
      const detalles: DetalleDenominacion[] = denominaciones.map(denom => ({
        denominacion: denom.valor,
        cantidad: denom.cantidad,
        subtotal: denom.valor * denom.cantidad
      }));
      
      // Calcular la diferencia para saber si sobró o faltó
      const diferencia = total - saldoSistema;
      
      const conteoData = {
        moneda: 'guaranies',
        total,
        saldo_sistema: saldoSistema,
        observaciones: observacion,
        usuario_id: usuarioId,
        detalles,
        // Agregar información para el movimiento
        generarMovimiento: true,
        concepto: diferencia > 0 
          ? 'Sobró - Diferencia en arqueo' 
          : diferencia < 0 
            ? 'Faltó - Diferencia en arqueo' 
            : 'Conteo sin diferencia'
      };
      
      console.log('Enviando datos de conteo a la API:', conteoData);
      
      // Llamar a la API para crear el conteo
      const response = await conteoService.createConteo(conteoData);
      
      console.log('Respuesta del servidor:', response);
      
      // Notificar éxito
      setSuccess(true);
      
      // Actualizar el saldo local y cerrar el diálogo
      onSaveTotal(total, observacion);
      
      // Resetear estados
      setLoading(false);
      
      // Esperar un poco para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (err: any) {
      console.error('Error al guardar conteo:', err);
      const errorMsg = err.response?.data?.error || 'Ocurrió un error al guardar el conteo. Intente nuevamente.';
      console.error('Mensaje de error:', errorMsg);
      console.error('Estado HTTP:', err.response?.status);
      console.error('Datos de respuesta:', err.response?.data);
      
      setError(errorMsg);
      setLoading(false);
    }
  };
  
  // Función para manejar el primer clic en un campo
  const handleFirstClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Solo seleccionar el texto si el campo no está vacío
    const input = e.currentTarget.querySelector('input');
    if (input && input.value !== '0' && input.value !== '') {
      handleInputClick(e);
    }
  }, []);
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Conteo de Guaraníes
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Denominación</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {denominaciones.map((denom, index) => {
                  const isLast = index === denominaciones.length - 1;
                  const nextFieldId = !isLast ? `denom-${index + 1}` : '';
                  const fieldId = `denom-${index}`;
                  
                  return (
                    <TableRow key={`PYG-${denom.valor}`}>
                      <TableCell>
                        {formatearMontoConSeparadores(denom.valor)} Gs
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={denom.cantidad}
                          onChange={(e) => handleCantidadChange(index, e.target.value)}
                          InputProps={{ 
                            inputProps: { min: 0 },
                            inputRef: (ref) => registerInputRef(fieldId, ref)
                          }}
                          onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                          onClick={handleFirstClick}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        {formatearMontoConSeparadores(denom.valor * denom.cantidad)} Gs
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={2} align="right">
                    <Typography variant="subtitle2">Total:</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                      {formatearMontoConSeparadores(total)} Gs
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Saldo en sistema: {formatearMontoConSeparadores(saldoSistema)} Gs
            </Typography>
            <Typography variant="subtitle2" color={total - saldoSistema > 0 ? 'success.main' : (total - saldoSistema < 0 ? 'error.main' : 'inherit')}>
              Diferencia: {formatearMontoConSeparadores(total - saldoSistema)} Gs
            </Typography>
          </Box>
          
          {/* Campo de observación */}
          <TextField
            fullWidth
            label="Observaciones"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value.toUpperCase())}
            multiline
            rows={2}
            variant="outlined"
            placeholder="Detalles adicionales sobre el conteo"
            onClick={handleFirstClick}
          />
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleLimpiarConteo} 
            color="inherit"
            disabled={loading}
          >
            Limpiar
          </Button>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarTotal} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Total'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para errores */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      {/* Snackbar para mensajes de éxito */}
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Conteo guardado exitosamente
        </Alert>
      </Snackbar>
    </>
  );
};

export default ConteoGuaranies; 
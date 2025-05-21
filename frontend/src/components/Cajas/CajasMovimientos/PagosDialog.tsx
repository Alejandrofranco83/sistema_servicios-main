import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja } from '../helpers';
import { handleInputClick } from '../../../utils/inputUtils';
import axios from 'axios';

interface PagosDialogProps {
  open: boolean;
  onClose: () => void;
  modoEdicion?: boolean;
}

// Definición de operadoras y servicios
const operadorasYServicios = [
  { 
    operadora: 'Tigo',
    servicios: [
      { id: 'tigo-mini-carga', nombre: 'Mini Carga' },
      { id: 'tigo-billetera', nombre: 'Billetera' }
    ]
  },
  {
    operadora: 'Personal',
    servicios: [
      { id: 'personal-maxi-carga', nombre: 'Maxi Carga' },
      { id: 'personal-billetera', nombre: 'Billetera' }
    ]
  },
  {
    operadora: 'Claro',
    servicios: [
      { id: 'claro-recarga', nombre: 'Recarga' },
      { id: 'claro-billetera', nombre: 'Billetera' }
    ]
  }
];

const PagosDialog: React.FC<PagosDialogProps> = ({ open, onClose, modoEdicion = false }) => {
  const { 
    cajaSeleccionada, 
    setSuccessMessage, 
    setErrorMessage, 
    formPago, 
    setFormPago, 
    handleGuardarPago,
    setLoading,
    setPagos
  } = useCajas();

  // Estado para el servicio seleccionado
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  
  // Estado para el monto
  const [monto, setMonto] = useState('');
  
  // Estado para la observación
  const [observacion, setObservacion] = useState('');

  // Estado para el comprobante
  const [comprobante, setComprobante] = useState<File | null>(null);
  
  // ID del pago que estamos editando
  const [editandoPagoId, setEditandoPagoId] = useState<string | null>(null);

  // Reset de campos cuando se abre el diálogo o cambia formPago
  React.useEffect(() => {
    if (open) {
      // Si estamos en modo edición, cargamos los datos del formPago
      if (modoEdicion && formPago) {
        // Buscar el ID del servicio basado en la operadora y servicio
        let idServicioEncontrado = '';
        for (const op of operadorasYServicios) {
          if (op.operadora === formPago.operadora) {
            for (const serv of op.servicios) {
              if (serv.nombre === formPago.servicio) {
                idServicioEncontrado = serv.id;
                break;
              }
            }
          }
          if (idServicioEncontrado) break;
        }
        
        setServicioSeleccionado(idServicioEncontrado);
        setMonto(formPago.monto ? formatGuaranies(formPago.monto) : '');
        setObservacion(formPago.observacion || '');
        // Establecer el ID del pago que estamos editando
        setEditandoPagoId(formPago.id || null);
      } else {
        // Modo nuevo pago
        setServicioSeleccionado('');
        setMonto('');
        setObservacion('');
        setComprobante(null);
        setEditandoPagoId(null);
      }
    }
  }, [open, formPago, modoEdicion]);

  if (!cajaSeleccionada) {
    return null;
  }

  // Función para formatear valores en guaraníes
  const formatGuaranies = (value: string): string => {
    // Remover caracteres no numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Si está vacío, retornar vacío
    if (!numericValue) return '';
    
    // Convertir a número para validar
    const number = parseInt(numericValue, 10);
    
    // Formatear con separadores de miles
    return number ? new Intl.NumberFormat('es-PY').format(number) : '';
  };

  // Función para formatear el valor seleccionado en el dropdown
  const formatServicioSeleccionado = (id: string): string => {
    if (!id) return '';
    
    for (const operadora of operadorasYServicios) {
      for (const servicio of operadora.servicios) {
        if (servicio.id === id) {
          return `${operadora.operadora}: ${servicio.nombre}`;
        }
      }
    }
    return '';
  };

  // Función para obtener operadora y servicio desde el ID seleccionado
  const getOperadoraYServicio = (id: string): { operadora: string, servicio: string } => {
    for (const op of operadorasYServicios) {
      for (const serv of op.servicios) {
        if (serv.id === id) {
          return { operadora: op.operadora, servicio: serv.nombre };
        }
      }
    }
    return { operadora: '', servicio: '' };
  };

  // Función para guardar el pago
  const handleGuardarNuevoPago = () => {
    if (!servicioSeleccionado) {
      setErrorMessage('Debe seleccionar un servicio');
      return;
    }
    
    // Depurar valores
    console.log('Monto original:', monto);
    console.log('Monto sin puntos:', monto.replace(/\./g, ''));
    
    // Verificar si el monto está vacío
    if (!monto || monto.trim() === '') {
      setErrorMessage('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Eliminar puntos de miles para obtener el valor numérico
    const montoSinFormato = monto.replace(/\./g, '');
    
    // Verificar que el monto sin formato no esté vacío
    if (!montoSinFormato || montoSinFormato === '0') {
      setErrorMessage('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Convertir a número
    const montoNumerico = parseInt(montoSinFormato, 10);
    console.log('Monto numérico:', montoNumerico);
    
    // Verificar que sea un número válido y mayor a cero
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setErrorMessage('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Obtener la operadora y servicio del ID seleccionado
    const { operadora, servicio } = getOperadoraYServicio(servicioSeleccionado);
    
    // Crear el objeto de pago directamente sin actualizar el estado
    const nuevoPago = {
      operadora: operadora,
      servicio: servicio,
      monto: montoSinFormato, // Usar el monto sin formato
      moneda: 'PYG' as 'PYG', // Especificar el tipo exacto
      comprobante: comprobante,
      observacion: observacion
    };
    
    // Actualizar el estado formPago (aunque esto es asíncrono y no se usará inmediatamente)
    setFormPago(nuevoPago);
    
    // Crear un FormData directamente para enviar los datos
    const formData = new FormData();
    formData.append('operadora', operadora);
    formData.append('servicio', servicio);
    formData.append('monto', montoNumerico.toString());
    formData.append('moneda', 'PYG');
    
    if (observacion) {
      formData.append('observacion', observacion);
    }
    
    if (comprobante) {
      formData.append('comprobante', comprobante);
    }
    
    // Enviar los datos al servidor
    if (cajaSeleccionada) {
      setLoading(true);
      
      // URL y método dependen de si estamos creando o actualizando
      const url = modoEdicion && editandoPagoId
        ? `/api/cajas/pagos/${editandoPagoId}`
        : `/api/cajas/${cajaSeleccionada.id}/pagos`;
      
      const method = modoEdicion && editandoPagoId ? 'put' : 'post';
      
      axios({
        method,
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(response => {
        if (modoEdicion && editandoPagoId) {
          // Actualizar el pago en la lista
          setPagos(prevPagos => prevPagos.map(pago => 
            pago.id === editandoPagoId ? response.data : pago
          ));
          setSuccessMessage('Pago actualizado correctamente');
        } else {
          // Añadir el nuevo pago a la lista
          setPagos(prevPagos => [...prevPagos, response.data]);
          setSuccessMessage('Pago registrado correctamente');
        }
        
        // Limpiar el formulario
        setServicioSeleccionado('');
        setMonto('');
        setObservacion('');
        setComprobante(null);
        setEditandoPagoId(null);
        
        // Cerrar el diálogo después de guardar
        onClose();
      })
      .catch(error => {
        console.error('Error al guardar el pago:', error);
        setErrorMessage('Error al registrar el pago. Por favor, inténtelo de nuevo.');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setErrorMessage('No hay una caja seleccionada');
    }
  };

  // Función para manejar la subida de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setComprobante(file);
      setSuccessMessage(`Comprobante ${file.name} subido correctamente`);
    }
  };

  // Función para ver el comprobante
  const handleVerComprobante = () => {
    if (comprobante) {
      // Abrir en una nueva ventana
      window.open(URL.createObjectURL(comprobante), '_blank');
    } else {
      setErrorMessage('No hay comprobante disponible');
    }
  };

  // Función para navegar al siguiente campo con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>, nextId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { width: '400px', maxWidth: '95%' } }}
    >
      <DialogTitle>
        Registrar Pago
      </DialogTitle>
      <Box sx={{ px: 3, mt: -2, mb: 0 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId})
        </Typography>
      </Box>
      <DialogContent>
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="servicio-label">Servicio</InputLabel>
                <Select
                  labelId="servicio-label"
                  id="servicio"
                  value={servicioSeleccionado}
                  label="Servicio"
                  onChange={(e) => setServicioSeleccionado(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'monto')}
                  autoComplete="off"
                  renderValue={(selected) => formatServicioSeleccionado(selected as string)}
                >
                  {operadorasYServicios.map((operadora) => [
                    <MenuItem key={operadora.operadora} disabled>
                      <Typography variant="subtitle2">{operadora.operadora}:</Typography>
                    </MenuItem>,
                    ...operadora.servicios.map((servicio) => (
                      <MenuItem 
                        key={servicio.id} 
                        value={servicio.id}
                        sx={{ pl: 4 }}
                      >
                        {servicio.nombre}
                      </MenuItem>
                    ))
                  ])}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="monto"
                label="Monto"
                value={monto}
                onChange={(e) => {
                  const formattedValue = formatGuaranies(e.target.value);
                  setMonto(formattedValue);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'observacion')}
                onClick={handleInputClick}
                autoComplete="off"
                placeholder="0"
                InputProps={{
                  endAdornment: <Typography variant="caption">&nbsp;Gs</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="observacion"
                label="Observaciones"
                multiline
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, 'guardar-button')}
                autoComplete="off"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFileIcon />}
                >
                  Adjuntar Comprobante
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </Button>
                {comprobante && (
                  <>
                    <Typography variant="body2">
                      {comprobante.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={handleVerComprobante}
                      title="Ver comprobante"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          id="guardar-button"
          variant="contained" 
          color="primary"
          onClick={handleGuardarNuevoPago}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagosDialog; 
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useCajas } from '../CajasContext';
import { Maletin, FormularioApertura, SaldoServicio } from '../interfaces';
import { formatearMontoConSeparadores, formatearMontoServicio } from '../helpers';
import { handleInputClick } from '../../../utils/inputUtils';
import axios from 'axios';

interface FormAperturaProps {
  open: boolean;
  onClose: () => void;
}

// Componente para el formulario de apertura de caja
const FormApertura: React.FC<FormAperturaProps> = ({ open, onClose }) => {
  const {
    maletines,
    maletinesEnUso,
    formApertura,
    setFormApertura,
    setErrorMessage,
    setSuccessMessage,
    loading,
    loadCajas
  } = useCajas();

  // Estado para controlar errores de validación
  const [maletinError, setMaletinError] = useState(false);
  
  // Referencias para los campos de entrada (para navegación con teclado)
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // Función para registrar las refs de los inputs
  const registerInputRef = (id: string, ref: HTMLInputElement | null) => {
    inputRefs.current[id] = ref;
  };

  // Obtener ID del campo de denominación
  const getDenominacionFieldId = (moneda: string, valor: number): string => {
    return `denom-${moneda}-${valor}`;
  };

  // Verificar si un maletín está en uso
  const estaEnUso = (maletinId: string): boolean => {
    return maletinesEnUso.includes(maletinId);
  };

  // Obtener mensaje de estado del maletín
  const getMensajeEstadoMaletin = (maletin: Maletin): string => {
    return estaEnUso(maletin.id) ? ' (En uso)' : '';
  };

  // Función para manejar cambios en selects
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormApertura(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Función para manejar cambios en denominaciones
  const handleDenominacionChange = (index: number, cantidad: number) => {
    const nuevasDenominaciones = [...formApertura.saldoInicial.denominaciones];
    nuevasDenominaciones[index].cantidad = cantidad;

    // Recalcular totales
    const totalPYG = nuevasDenominaciones
      .filter(d => d.moneda === 'PYG')
      .reduce((sum, d) => sum + (d.valor * d.cantidad), 0);
    
    const totalBRL = nuevasDenominaciones
      .filter(d => d.moneda === 'BRL')
      .reduce((sum, d) => sum + (d.valor * d.cantidad), 0);
    
    const totalUSD = nuevasDenominaciones
      .filter(d => d.moneda === 'USD')
      .reduce((sum, d) => sum + (d.valor * d.cantidad), 0);

    setFormApertura(prev => ({
      ...prev,
      saldoInicial: {
        ...prev.saldoInicial,
        denominaciones: nuevasDenominaciones,
        total: {
          PYG: totalPYG,
          BRL: totalBRL,
          USD: totalUSD
        }
      }
    }));
  };

  // Función para manejar cambios en servicios iniciales
  const handleServicioChange = (index: number, monto: number) => {
    const nuevosServicios = [...formApertura.saldosServiciosInicial];
    nuevosServicios[index].monto = monto;

    setFormApertura(prev => ({
      ...prev,
      saldosServiciosInicial: nuevosServicios
    }));
  };

  // Función para manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId && inputRefs.current[nextFieldId]) {
      e.preventDefault();
      inputRefs.current[nextFieldId]?.focus();
      inputRefs.current[nextFieldId]?.select();
    }
  };

  // Función para volver al listado
  const handleVolverAListado = () => {
    onClose();
  };

  // Función para guardar la apertura de caja
  const handleGuardarApertura = async () => {
    // Validar que se seleccionó un maletín
    if (!formApertura.maletinId) {
      setMaletinError(true);
      setErrorMessage('Debe seleccionar un maletín para abrir la caja');
      return;
    }
    // Limpiar error si pasa la validación
    setMaletinError(false);
    setErrorMessage(null);

    try {
      // Enviar los datos al backend para crear la nueva caja
      const response = await axios.post('/api/cajas', formApertura);

      if (response.status === 201) {
        setSuccessMessage('Caja abierta correctamente');
        // Recargar la lista de cajas para la sucursal actual
        if (formApertura.sucursalId) {
          await loadCajas(formApertura.sucursalId);
        }
        onClose();
      } else {
        // Manejar otros códigos de estado si es necesario
        setErrorMessage(response.data.message || 'Error al abrir la caja');
      }
    } catch (error: any) {
      console.error('Error al abrir la caja:', error);
      // Mostrar mensaje de error específico del backend si está disponible
      const apiErrorMessage = error.response?.data?.message || 'Error de conexión al intentar abrir la caja.';
      setErrorMessage(apiErrorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        Apertura de Caja
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Selección de Maletín */}
          <Grid item xs={12}>
            <FormControl 
              fullWidth 
              variant="outlined" 
              size="small" 
              error={maletinError}
              required
            >
              <InputLabel id="maletin-label">Maletín</InputLabel>
              <Select
                labelId="maletin-label"
                id="maletinId"
                name="maletinId"
                value={formApertura.maletinId}
                onChange={(e) => {
                  setMaletinError(false); // Limpiar el error cuando selecciona un maletín
                  handleSelectChange(e as any);
                }}
                label="Maletín"
              >
                <MenuItem value="">
                  <em>Seleccione un maletín</em>
                </MenuItem>
                {maletines.map((maletin) => (
                  <MenuItem 
                    key={maletin.id} 
                    value={maletin.id}
                    disabled={estaEnUso(maletin.id)}
                    sx={{ 
                      color: estaEnUso(maletin.id) ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {maletin.codigo} {getMensajeEstadoMaletin(maletin)}
                  </MenuItem>
                ))}
              </Select>
              {maletinError && (
                <FormHelperText>Debe seleccionar un maletín para continuar</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Conteo de Guaraníes */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Conteo de Guaraníes
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Denominación</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formApertura.saldoInicial.denominaciones
                    .filter(d => d.moneda === 'PYG')
                    .map((denom, index, arr) => {
                      const originalIndex = formApertura.saldoInicial.denominaciones.indexOf(denom);
                      const isLast = index === arr.length - 1;
                      
                      // Determinar el ID del siguiente campo
                      let nextFieldId: string = '';
                      if (isLast) {
                        // Si es el último Guaraní, ir al primer Real
                        const primerReal = formApertura.saldoInicial.denominaciones.find(d => d.moneda === 'BRL');
                        nextFieldId = primerReal 
                          ? getDenominacionFieldId('BRL', primerReal.valor) 
                          : '';
                      } else {
                        // Ir al siguiente Guaraní
                        nextFieldId = getDenominacionFieldId('PYG', arr[index + 1].valor);
                      }
                      
                      const thisFieldId = getDenominacionFieldId('PYG', denom.valor);
                      
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
                              onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                              InputProps={{ 
                                inputProps: { min: 0 },
                                inputRef: (ref) => registerInputRef(thisFieldId, ref)
                              }}
                              onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                              onClick={handleInputClick}
                            />
                          </TableCell>
                          <TableCell>
                            {formatearMontoConSeparadores(denom.valor * denom.cantidad)} Gs
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  <TableRow>
                    <TableCell colSpan={2} align="right"><strong>Total Gs:</strong></TableCell>
                    <TableCell>
                      <strong>
                        {formatearMontoConSeparadores(formApertura.saldoInicial.total.PYG)} Gs
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Conteo de Reales */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Conteo de Reales
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Denominación</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formApertura.saldoInicial.denominaciones
                    .filter(d => d.moneda === 'BRL')
                    .map((denom, index, arr) => {
                      const originalIndex = formApertura.saldoInicial.denominaciones.indexOf(denom);
                      const isLast = index === arr.length - 1;
                      
                      // Determinar el ID del siguiente campo
                      let nextFieldId: string = '';
                      if (isLast) {
                        // Si es el último Real, ir al primer Dólar
                        const primerDolar = formApertura.saldoInicial.denominaciones.find(d => d.moneda === 'USD');
                        nextFieldId = primerDolar 
                          ? getDenominacionFieldId('USD', primerDolar.valor) 
                          : '';
                      } else {
                        // Ir al siguiente Real
                        nextFieldId = getDenominacionFieldId('BRL', arr[index + 1].valor);
                      }
                      
                      const thisFieldId = getDenominacionFieldId('BRL', denom.valor);
                      
                      return (
                        <TableRow key={`BRL-${denom.valor}`}>
                          <TableCell>
                            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor)}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={denom.cantidad}
                              onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                              InputProps={{ 
                                inputProps: { min: 0 },
                                inputRef: (ref) => registerInputRef(thisFieldId, ref)
                              }}
                              onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                              onClick={handleInputClick}
                            />
                          </TableCell>
                          <TableCell>
                            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor * denom.cantidad)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  <TableRow>
                    <TableCell colSpan={2} align="right"><strong>Total R$:</strong></TableCell>
                    <TableCell>
                      <strong>
                        R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formApertura.saldoInicial.total.BRL)}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Conteo de Dólares */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Conteo de Dólares
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Denominación</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formApertura.saldoInicial.denominaciones
                    .filter(d => d.moneda === 'USD')
                    .map((denom, index, arr) => {
                      const originalIndex = formApertura.saldoInicial.denominaciones.indexOf(denom);
                      const isLast = index === arr.length - 1;
                      
                      // Determinar el ID del siguiente campo
                      let nextFieldId: string = '';
                      if (isLast && formApertura.saldosServiciosInicial.length > 0) {
                        // Si es el último Dólar, ir al primer servicio
                        nextFieldId = `servicio-${0}`;
                      } else if (!isLast) {
                        // Ir al siguiente Dólar
                        nextFieldId = getDenominacionFieldId('USD', arr[index + 1].valor);
                      }
                      
                      const thisFieldId = getDenominacionFieldId('USD', denom.valor);
                      
                      return (
                        <TableRow key={`USD-${denom.valor}`}>
                          <TableCell>
                            $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor)}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={denom.cantidad}
                              onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                              InputProps={{ 
                                inputProps: { min: 0 },
                                inputRef: (ref) => registerInputRef(thisFieldId, ref)
                              }}
                              onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                              onClick={handleInputClick}
                            />
                          </TableCell>
                          <TableCell>
                            $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor * denom.cantidad)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  <TableRow>
                    <TableCell colSpan={2} align="right"><strong>Total $:</strong></TableCell>
                    <TableCell>
                      <strong>
                        $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formApertura.saldoInicial.total.USD)}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Saldos de Servicios */}
          {formApertura.saldosServiciosInicial.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Saldos de Servicios
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formApertura.saldosServiciosInicial.map((servicio, index) => {
                      const nextIndex = index < formApertura.saldosServiciosInicial.length - 1 
                        ? index + 1 
                        : -1;
                      
                      const nextFieldId = nextIndex >= 0 
                        ? `servicio-${nextIndex}` 
                        : '';
                      
                      const thisFieldId = `servicio-${index}`;
                      
                      return (
                        <TableRow key={`servicio-${index}`}>
                          <TableCell>{servicio.servicio}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={formatearMontoServicio(servicio.monto)}
                              onChange={(e) => {
                                // Eliminar todos los caracteres no numéricos
                                const numericValue = e.target.value.replace(/\D/g, '');
                                const montoNumerico = parseInt(numericValue) || 0;
                                handleServicioChange(index, montoNumerico);
                              }}
                              InputProps={{ 
                                endAdornment: <Typography variant="caption">&nbsp;Gs</Typography>,
                                inputProps: { 
                                  min: 0,
                                  style: { textAlign: 'right' }
                                },
                                inputRef: (ref) => registerInputRef(thisFieldId, ref)
                              }}
                              onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                              onClick={handleInputClick}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleVolverAListado}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleGuardarApertura}
          variant="contained" 
          color="primary"
          disabled={loading || !formApertura.maletinId}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormApertura; 
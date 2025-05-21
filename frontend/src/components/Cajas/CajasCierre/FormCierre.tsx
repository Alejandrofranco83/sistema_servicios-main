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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider
} from '@mui/material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja, formatearMontoConSeparadores, formatearMontoServicio } from '../helpers';
import { Denominacion, SaldoServicio } from '../interfaces';
import { denominacionesGuaranies, denominacionesReales, denominacionesDolares, serviciosIniciales } from '../constants';
import { handleInputClick } from '../../../utils/inputUtils';
import axios from 'axios';

interface FormCierreProps {
  open: boolean;
  onClose: () => void;
}

// Define una interfaz para el formulario de cierre
interface FormularioCierre {
  cajaId: string;
  saldoFinal: {
    denominaciones: Denominacion[];
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
  };
  saldosServiciosFinal: SaldoServicio[];
}

// Componente para el formulario de cierre de caja
const FormCierre: React.FC<FormCierreProps> = ({ open, onClose }) => {
  const {
    cajaSeleccionada,
    setErrorMessage,
    setSuccessMessage,
    loading,
    cerrarCajaActual
  } = useCajas();

  // Estado local para el formulario de cierre
  const [formCierre, setFormCierre] = useState<FormularioCierre | null>(null);
  const [cerrandoCaja, setCerrandoCaja] = useState(false);
  
  // Referencias para los campos de entrada (para navegación con teclado)
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // Inicializar el formulario cuando cambia la caja seleccionada
  useEffect(() => {
    if (cajaSeleccionada) {
      setFormCierre(inicializarFormularioCierre(cajaSeleccionada));
    }
  }, [cajaSeleccionada]);

  // Función para inicializar el formulario de cierre
  const inicializarFormularioCierre = (caja: any): FormularioCierre | null => {
    if (!caja) return null;
    
    // Verificar si estamos en modo edición (caja ya cerrada)
    const esEdicion = caja.estado === 'cerrada';
    
    // Si estamos en modo edición y hay datos de saldoFinal, usarlos
    if (esEdicion && caja.saldoFinal) {
      console.log('Usando datos existentes para edición:', caja.saldoFinal);
      
      // Verificar si hay datos cargados desde la API
      return {
        cajaId: caja.id,
        saldoFinal: caja.saldoFinal,
        saldosServiciosFinal: caja.saldosServiciosFinal || []
      };
    }
    
    // Caso para una nueva caja o cuando no hay datos existentes
    // Inicializar el saldo final con valores en cero
    const saldoFinal: {
      denominaciones: Denominacion[];
      total: {
        PYG: number;
        BRL: number;
        USD: number;
      };
    } = {
      denominaciones: [],
      total: { PYG: 0, BRL: 0, USD: 0 }
    };
    
    // Inicializar denominaciones de Guaraníes
    const denomsPYG = denominacionesGuaranies.map(denom => ({...denom, cantidad: 0}));
    
    // Inicializar denominaciones de Reales
    const denomsBRL = denominacionesReales.map(denom => ({...denom, cantidad: 0}));
    
    // Inicializar denominaciones de Dólares
    const denomsUSD = denominacionesDolares.map(denom => ({...denom, cantidad: 0}));
    
    // Combinar todas las denominaciones
    saldoFinal.denominaciones = [...denomsPYG, ...denomsBRL, ...denomsUSD];
    
    // Inicializar los saldos de servicios finales
    let saldosServiciosFinal = [];
    
    // Si hay saldos de servicios iniciales, usar como base pero con montos en cero
    if (Array.isArray(caja.saldosServiciosInicial) && caja.saldosServiciosInicial.length > 0) {
      saldosServiciosFinal = caja.saldosServiciosInicial.map((s: SaldoServicio) => ({...s, monto: 0}));
    } else {
      // Si no hay saldos de servicios iniciales, usar los servicios por defecto
      console.log('Inicializando servicios finales con valores por defecto');
      saldosServiciosFinal = serviciosIniciales.map(s => ({...s, monto: 0}));
    }
    
    console.log('Saldos de servicios finales inicializados:', saldosServiciosFinal);
    
    return {
      cajaId: caja.id,
      saldoFinal,
      saldosServiciosFinal
    };
  };

  // Función para registrar las refs de los inputs
  const registerInputRef = (id: string, ref: HTMLInputElement | null) => {
    inputRefs.current[id] = ref;
  };

  // Obtener ID del campo de denominación
  const getDenominacionFieldId = (moneda: string, valor: number): string => {
    return `cierre-denom-${moneda}-${valor}`;
  };

  // Obtener ID del campo de servicio
  const getServicioFieldId = (servicio: string): string => {
    return `cierre-servicio-${servicio}`;
  };

  // Función para manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId && inputRefs.current[nextFieldId]) {
      e.preventDefault();
      inputRefs.current[nextFieldId]?.focus();
      inputRefs.current[nextFieldId]?.select();
    }
  };

  // Función para manejar cambios en denominaciones
  const handleDenominacionChange = (index: number, cantidad: number) => {
    if (!formCierre) return;
    
    const nuevasDenominaciones = [...formCierre.saldoFinal.denominaciones];
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

    setFormCierre({
      ...formCierre,
      saldoFinal: {
        ...formCierre.saldoFinal,
        denominaciones: nuevasDenominaciones,
        total: {
          PYG: totalPYG,
          BRL: totalBRL,
          USD: totalUSD
        }
      }
    });
  };

  // Función para manejar cambios en servicios
  const handleServicioChange = (index: number, monto: number) => {
    if (!formCierre) return;
    
    const nuevosServicios = [...formCierre.saldosServiciosFinal];
    nuevosServicios[index].monto = monto;

    setFormCierre({
      ...formCierre,
      saldosServiciosFinal: nuevosServicios
    });
  };

  // Función para cancelar el cierre
  const handleCancelarCierre = () => {
    onClose();
  };

  // Función para confirmar el cierre de caja
  const handleConfirmarCierre = async () => {
    if (!cajaSeleccionada || !formCierre) return;
    
    try {
      setCerrandoCaja(true);
      
      const datosCierre = {
        saldoFinal: formCierre.saldoFinal,
        saldosServiciosFinal: formCierre.saldosServiciosFinal
      };
      
      console.log('Cerrando caja:', datosCierre);
      
      // Usar el método del contexto para cerrar la caja
      await cerrarCajaActual(datosCierre);
      
      onClose();
    } catch (error) {
      console.error('Error al cerrar la caja:', error);
      setErrorMessage('Error al cerrar la caja');
    } finally {
      setCerrandoCaja(false);
    }
  };

  // Función para actualizar datos de cierre (para cajas ya cerradas)
  const handleActualizarCierre = async () => {
    if (!cajaSeleccionada || !formCierre) return;
    
    try {
      setCerrandoCaja(true);
      
      const datosCierre = {
        saldoFinal: formCierre.saldoFinal,
        saldosServiciosFinal: formCierre.saldosServiciosFinal
      };
      
      console.log('Actualizando datos de cierre:', datosCierre);
      
      // Llamar al endpoint para actualizar los datos de cierre
      await axios.put(`/api/cajas/${cajaSeleccionada.id}/datos-cierre`, datosCierre);
      
      setSuccessMessage('Datos de cierre actualizados correctamente');
      onClose();
    } catch (error) {
      console.error('Error al actualizar datos de cierre:', error);
      setErrorMessage('Error al actualizar datos de cierre');
    } finally {
      setCerrandoCaja(false);
    }
  };

  // Si no hay caja seleccionada o formCierre, no renderizar nada
  if (!cajaSeleccionada || !formCierre) {
    return null;
  }

  // Determinar si estamos en modo edición
  const esEdicion = cajaSeleccionada.estado === 'cerrada';

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
        {esEdicion ? 'Editar Datos de Cierre' : 'Cierre de Caja'}
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          component="div"
        >
          {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId})
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información de la caja */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Usuario:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.usuario}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha Apertura:
                  </Typography>
                  <Typography variant="body1">
                    {new Date(cajaSeleccionada.fechaApertura).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Maletín:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.maletinId}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
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
                  {formCierre.saldoFinal.denominaciones
                    .filter((d: Denominacion) => d.moneda === 'PYG')
                    .map((denom: Denominacion, index: number, arr: Denominacion[]) => {
                      const originalIndex = formCierre.saldoFinal.denominaciones.indexOf(denom);
                      const isLast = index === arr.length - 1;
                      
                      // Determinar el ID del siguiente campo
                      let nextFieldId: string = '';
                      if (isLast) {
                        // Si es el último Guaraní, ir al primer Real
                        const primerReal = formCierre.saldoFinal.denominaciones.find((d: Denominacion) => d.moneda === 'BRL');
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
                        {formatearMontoConSeparadores(formCierre.saldoFinal.total.PYG)} Gs
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
                  {formCierre.saldoFinal.denominaciones
                    .filter((d: Denominacion) => d.moneda === 'BRL')
                    .map((denom: Denominacion, index: number, arr: Denominacion[]) => {
                      const originalIndex = formCierre.saldoFinal.denominaciones.indexOf(denom);
                      const isLast = index === arr.length - 1;
                      
                      // Determinar el ID del siguiente campo
                      let nextFieldId: string = '';
                      if (isLast) {
                        // Si es el último Real, ir al primer Dólar
                        const primerDolar = formCierre.saldoFinal.denominaciones.find((d: Denominacion) => d.moneda === 'USD');
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
                        R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formCierre.saldoFinal.total.BRL)}
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
                  {formCierre.saldoFinal.denominaciones
                    .filter((d: Denominacion) => d.moneda === 'USD')
                    .map((denom: Denominacion, index: number, arr: Denominacion[]) => {
                      const originalIndex = formCierre.saldoFinal.denominaciones.indexOf(denom);
                      const isLast = index === arr.length - 1;
                      
                      // Determinar el ID del siguiente campo
                      let nextFieldId: string = '';
                      if (isLast && formCierre.saldosServiciosFinal && formCierre.saldosServiciosFinal.length > 0) {
                        // Si es el último Dólar, ir al primer servicio
                        nextFieldId = formCierre.saldosServiciosFinal[0] 
                          ? getServicioFieldId(formCierre.saldosServiciosFinal[0].servicio)
                          : '';
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
                        $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formCierre.saldoFinal.total.USD)}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Saldos de Servicios */}
          {formCierre && formCierre.saldosServiciosFinal && Array.isArray(formCierre.saldosServiciosFinal) && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Saldos Finales de Servicios
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
                    {formCierre && formCierre.saldosServiciosFinal && Array.isArray(formCierre.saldosServiciosFinal) ? 
                      formCierre.saldosServiciosFinal.map((servicio: SaldoServicio, index: number) => {
                        const nextIndex = index < formCierre.saldosServiciosFinal.length - 1 
                          ? index + 1 
                          : -1;
                        
                        const nextFieldId = nextIndex >= 0 
                          ? getServicioFieldId(formCierre.saldosServiciosFinal[nextIndex].servicio) 
                          : '';
                        
                        const thisFieldId = getServicioFieldId(servicio.servicio);
                        
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
                      })
                    : <TableRow><TableCell colSpan={2}>No hay servicios disponibles</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCancelarCierre}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button 
          onClick={esEdicion ? handleActualizarCierre : handleConfirmarCierre}
          variant="contained" 
          color="primary"
          disabled={loading || cerrandoCaja}
        >
          {cerrandoCaja ? 
            <CircularProgress size={24} /> : 
            (esEdicion ? 'Guardar Cambios' : 'Cerrar Caja')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormCierre; 
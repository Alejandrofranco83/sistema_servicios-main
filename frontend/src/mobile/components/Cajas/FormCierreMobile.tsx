import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
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
  Collapse,
  IconButton,
  Alert,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { formatearMontoConSeparadores, formatearMontoServicio } from '../../../components/Cajas/helpers';
import { handleInputClick } from '../../../utils/inputUtils';
import api from '../../../services/api';

// Interfaces
interface Denominacion {
  valor: number;
  cantidad: number;
  moneda: 'PYG' | 'BRL' | 'USD';
}

interface SaldoServicio {
  servicio: string;
  monto: number;
}

interface CajaCierre {
  id: string;
  cajaEnteroId: number;
  estado: 'abierta' | 'cerrada';
  usuario: string;
  fechaApertura: string;
  fechaCierre?: string;
  sucursal?: {
    nombre: string;
  };
  maletin?: {
    codigo: string;
    sucursal?: {
      nombre: string;
    };
  };
  maletinId?: string;
  saldosServiciosInicial?: SaldoServicio[];
  saldoFinal?: {
    denominaciones: Denominacion[];
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
  };
  saldosServiciosFinal?: SaldoServicio[];
}

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

interface Props {
  open: boolean;
  onClose: () => void;
  caja: CajaCierre | null;
  onSuccess?: () => void;
}

// Denominaciones por defecto
const denominacionesGuaranies = [
  { valor: 100000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 50000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 20000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 10000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 5000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 2000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 1000, cantidad: 0, moneda: 'PYG' as const },
  { valor: 500, cantidad: 0, moneda: 'PYG' as const }
];

const denominacionesReales = [
  { valor: 200, cantidad: 0, moneda: 'BRL' as const },
  { valor: 100, cantidad: 0, moneda: 'BRL' as const },
  { valor: 50, cantidad: 0, moneda: 'BRL' as const },
  { valor: 20, cantidad: 0, moneda: 'BRL' as const },
  { valor: 10, cantidad: 0, moneda: 'BRL' as const },
  { valor: 5, cantidad: 0, moneda: 'BRL' as const },
  { valor: 2, cantidad: 0, moneda: 'BRL' as const },
  { valor: 1, cantidad: 0, moneda: 'BRL' as const }
];

const denominacionesDolares = [
  { valor: 100, cantidad: 0, moneda: 'USD' as const },
  { valor: 50, cantidad: 0, moneda: 'USD' as const },
  { valor: 20, cantidad: 0, moneda: 'USD' as const },
  { valor: 10, cantidad: 0, moneda: 'USD' as const },
  { valor: 5, cantidad: 0, moneda: 'USD' as const },
  { valor: 1, cantidad: 0, moneda: 'USD' as const }
];

const serviciosIniciales = [
  { servicio: 'Minicarga', monto: 0 },
  { servicio: 'Tigo Money', monto: 0 },
  { servicio: 'Maxicarga', monto: 0 },
  { servicio: 'Billetera Personal', monto: 0 },
  { servicio: 'Recarga Claro', monto: 0 },
  { servicio: 'Billetera Claro', monto: 0 }
];

const FormCierreMobile: React.FC<Props> = ({ open, onClose, caja, onSuccess }) => {
  const [formCierre, setFormCierre] = useState<FormularioCierre | null>(null);
  const [cerrandoCaja, setCerrandoCaja] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados de expansión para móvil
  const [expandedSections, setExpandedSections] = useState({
    guaranies: true,
    reales: false,
    dolares: false,
    servicios: false
  });

  // Referencias para los campos de entrada
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // Inicializar el formulario cuando cambia la caja
  useEffect(() => {
    if (caja && open) {
      setFormCierre(inicializarFormularioCierre(caja));
      setError(null);
      setSuccess(null);
    }
  }, [caja, open]);

  // Función para inicializar el formulario de cierre
  const inicializarFormularioCierre = (cajaData: CajaCierre): FormularioCierre | null => {
    if (!cajaData) return null;
    
    const esEdicion = cajaData.estado === 'cerrada';
    
    // Si estamos en modo edición y hay datos existentes, usarlos
    if (esEdicion && cajaData.saldoFinal) {
      console.log('Modo edición - usando datos existentes');
      return {
        cajaId: cajaData.id,
        saldoFinal: cajaData.saldoFinal,
        saldosServiciosFinal: cajaData.saldosServiciosFinal || []
      };
    }
    
    // Inicializar nuevo cierre
    const saldoFinal = {
      denominaciones: [...denominacionesGuaranies, ...denominacionesReales, ...denominacionesDolares],
      total: { PYG: 0, BRL: 0, USD: 0 }
    };
    
    // Inicializar servicios
    let saldosServiciosFinal: SaldoServicio[] = [];
    
    if (Array.isArray(cajaData.saldosServiciosInicial) && cajaData.saldosServiciosInicial.length > 0) {
      saldosServiciosFinal = cajaData.saldosServiciosInicial.map(s => ({ ...s, monto: 0 }));
    } else {
      saldosServiciosFinal = serviciosIniciales.map(s => ({ ...s }));
    }
    
    return {
      cajaId: cajaData.id,
      saldoFinal,
      saldosServiciosFinal
    };
  };

  // Toggle de secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Función para registrar refs de inputs
  const registerInputRef = (id: string, ref: HTMLInputElement | null) => {
    inputRefs.current[id] = ref;
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
        total: { PYG: totalPYG, BRL: totalBRL, USD: totalUSD }
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

  // Función para formatear moneda según el tipo
  const formatearMoneda = (monto: number, moneda: string): string => {
    switch (moneda) {
      case 'PYG':
        return formatearMontoConSeparadores(monto) + ' Gs';
      case 'BRL':
        return 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(monto);
      case 'USD':
        return '$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(monto);
      default:
        return monto.toString();
    }
  };

  // Función para confirmar el cierre
  const handleConfirmarCierre = async () => {
    if (!caja || !formCierre) return;
    
    try {
      setCerrandoCaja(true);
      setError(null);
      
      const datosCierre = {
        saldoFinal: formCierre.saldoFinal,
        saldosServiciosFinal: formCierre.saldosServiciosFinal
      };
      
      const esEdicion = caja.estado === 'cerrada';
      
      if (esEdicion) {
        // Actualizar datos de cierre existentes
        await api.put(`/api/cajas/${caja.id}/datos-cierre`, datosCierre);
        setSuccess('Datos de cierre actualizados correctamente');
      } else {
        // Cerrar caja nueva
        await api.put(`/api/cajas/${caja.id}/cerrar`, datosCierre);
        setSuccess('Caja cerrada correctamente');
      }
      
      if (onSuccess) onSuccess();
      
      // Cerrar el modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error al procesar cierre:', error);
      setError('Error al procesar el cierre de caja');
    } finally {
      setCerrandoCaja(false);
    }
  };

  if (!caja || !formCierre) {
    return null;
  }

  const esEdicion = caja.estado === 'cerrada';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: 3,
          m: 2,
          maxHeight: '95vh'
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonetizationOnIcon />
              {esEdicion ? 'Editar Cierre' : 'Cerrar Caja'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Caja #{caja.cajaEnteroId} • {caja.sucursal?.nombre}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Información General */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ℹ️ Información de la Caja
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Usuario
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {caja.usuario}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Fecha Apertura
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {new Date(caja.fechaApertura).toLocaleString('es-PY', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Maletín
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {caja.maletin 
                    ? `${caja.maletin.codigo}${caja.maletin.sucursal ? ` (${caja.maletin.sucursal.nombre})` : ''}`
                    : caja.maletinId || '-'
                  }
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Conteo de Guaraníes */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('guaranies')}
              endIcon={expandedSections.guaranies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                💰 Guaraníes - {formatearMoneda(formCierre.saldoFinal.total.PYG, 'PYG')}
              </Typography>
            </Button>

            <Collapse in={expandedSections.guaranies}>
              <TableContainer>
                <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '32%', maxWidth: '90px', padding: '8px 4px' }}><strong>Denominación</strong></TableCell>
                      <TableCell sx={{ width: '35%', maxWidth: '85px', padding: '8px 4px', textAlign: 'center' }}><strong>Cantidad</strong></TableCell>
                      <TableCell sx={{ width: '33%', padding: '8px 4px' }}><strong>Subtotal</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formCierre.saldoFinal.denominaciones
                      .filter(d => d.moneda === 'PYG')
                      .map((denom, index) => {
                        const originalIndex = formCierre.saldoFinal.denominaciones.indexOf(denom);
                        return (
                          <TableRow key={`PYG-${denom.valor}`}>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              {formatearMontoConSeparadores(denom.valor)} Gs
                            </TableCell>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              <TextField
                                size="small"
                                type="number"
                                value={denom.cantidad}
                                onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                InputProps={{ 
                                  inputProps: { min: 0, style: { textAlign: 'center' } },
                                  inputRef: (ref) => registerInputRef(`pyg-${denom.valor}`, ref)
                                }}
                                onClick={handleInputClick}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              {formatearMontoConSeparadores(denom.valor * denom.cantidad)} Gs
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </CardContent>
        </Card>

        {/* Conteo de Reales */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('reales')}
              endIcon={expandedSections.reales ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                🇧🇷 Reales - {formatearMoneda(formCierre.saldoFinal.total.BRL, 'BRL')}
              </Typography>
            </Button>

            <Collapse in={expandedSections.reales}>
              <TableContainer>
                <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '32%', maxWidth: '90px', padding: '8px 4px' }}><strong>Denominación</strong></TableCell>
                      <TableCell sx={{ width: '35%', maxWidth: '85px', padding: '8px 4px', textAlign: 'center' }}><strong>Cantidad</strong></TableCell>
                      <TableCell sx={{ width: '33%', padding: '8px 4px' }}><strong>Subtotal</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formCierre.saldoFinal.denominaciones
                      .filter(d => d.moneda === 'BRL')
                      .map((denom) => {
                        const originalIndex = formCierre.saldoFinal.denominaciones.indexOf(denom);
                        return (
                          <TableRow key={`BRL-${denom.valor}`}>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(denom.valor)}
                            </TableCell>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              <TextField
                                size="small"
                                type="number"
                                value={denom.cantidad}
                                onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                InputProps={{ 
                                  inputProps: { min: 0, style: { textAlign: 'center' } },
                                  inputRef: (ref) => registerInputRef(`brl-${denom.valor}`, ref)
                                }}
                                onClick={handleInputClick}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(denom.valor * denom.cantidad)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </CardContent>
        </Card>

        {/* Conteo de Dólares */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('dolares')}
              endIcon={expandedSections.dolares ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                🇺🇸 Dólares - {formatearMoneda(formCierre.saldoFinal.total.USD, 'USD')}
              </Typography>
            </Button>

            <Collapse in={expandedSections.dolares}>
              <TableContainer>
                <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '32%', maxWidth: '90px', padding: '8px 4px' }}><strong>Denominación</strong></TableCell>
                      <TableCell sx={{ width: '35%', maxWidth: '85px', padding: '8px 4px', textAlign: 'center' }}><strong>Cantidad</strong></TableCell>
                      <TableCell sx={{ width: '33%', padding: '8px 4px' }}><strong>Subtotal</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formCierre.saldoFinal.denominaciones
                      .filter(d => d.moneda === 'USD')
                      .map((denom) => {
                        const originalIndex = formCierre.saldoFinal.denominaciones.indexOf(denom);
                        return (
                          <TableRow key={`USD-${denom.valor}`}>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(denom.valor)}
                            </TableCell>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              <TextField
                                size="small"
                                type="number"
                                value={denom.cantidad}
                                onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                InputProps={{ 
                                  inputProps: { min: 0, style: { textAlign: 'center' } },
                                  inputRef: (ref) => registerInputRef(`usd-${denom.valor}`, ref)
                                }}
                                onClick={handleInputClick}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '8px 4px' }}>
                              $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(denom.valor * denom.cantidad)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </CardContent>
        </Card>

        {/* Servicios */}
        {formCierre.saldosServiciosFinal.length > 0 && (
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => toggleSection('servicios')}
                endIcon={expandedSections.servicios ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  🏪 Servicios
                </Typography>
              </Button>

              <Collapse in={expandedSections.servicios}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Servicio</strong></TableCell>
                        <TableCell align="right"><strong>Monto Final</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formCierre.saldosServiciosFinal.map((servicio, index) => (
                        <TableRow key={`servicio-${index}`}>
                          <TableCell>{servicio.servicio}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              value={formatearMontoServicio(servicio.monto)}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                const montoNumerico = parseInt(numericValue) || 0;
                                handleServicioChange(index, montoNumerico);
                              }}
                              InputProps={{ 
                                endAdornment: <Typography variant="caption">&nbsp;Gs</Typography>,
                                inputProps: { 
                                  style: { textAlign: 'right' }
                                },
                                inputRef: (ref) => registerInputRef(`servicio-${index}`, ref)
                              }}
                              onClick={handleInputClick}
                              sx={{ width: 150 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2 }}
          disabled={cerrandoCaja}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmarCierre}
          variant="contained"
          sx={{ borderRadius: 2, minWidth: 120 }}
          disabled={cerrandoCaja}
        >
          {cerrandoCaja ? (
            <CircularProgress size={24} />
          ) : (
            esEdicion ? 'Guardar Cambios' : 'Cerrar Caja'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormCierreMobile; 
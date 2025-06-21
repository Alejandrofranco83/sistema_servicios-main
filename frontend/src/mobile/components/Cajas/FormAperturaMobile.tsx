import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
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
  DialogActions,
  Collapse,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useMobileSucursal } from '../../contexts/MobileSucursalContext';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  denominacionesGuaranies, 
  denominacionesReales, 
  denominacionesDolares,
  serviciosIniciales as serviciosDefault 
} from '../../../components/Cajas/constants';
import { formatearMontoServicio } from '../../../components/Cajas/helpers';
import api from '../../../services/api';

interface Maletin {
  id: string;
  codigo: string;
  sucursal?: {
    nombre: string;
  };
}

interface Denominacion {
  moneda: 'PYG' | 'BRL' | 'USD';
  valor: number;
  cantidad: number;
}

interface SaldoServicio {
  servicio: string;
  monto: number;
}

interface FormularioApertura {
  maletinId: string;
  sucursalId: string;
  usuarioId: string;
  usuario: string;
  saldoInicial: {
    denominaciones: Denominacion[];
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
  };
  saldosServiciosInicial: SaldoServicio[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FormAperturaMobile: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const { sucursalMovil } = useMobileSucursal();
  const { user } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Estados del formulario
  const [maletines, setMaletines] = useState<Maletin[]>([]);
  const [maletinesEnUso, setMaletinesEnUso] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormularioApertura>({
    maletinId: '',
    sucursalId: sucursalMovil?.id || '',
    usuarioId: user?.id?.toString() || '',
    usuario: user?.username || '',
    saldoInicial: {
      denominaciones: [
        ...denominacionesGuaranies.map(d => ({...d, cantidad: 0})),
        ...denominacionesReales.map(d => ({...d, cantidad: 0})),
        ...denominacionesDolares.map(d => ({...d, cantidad: 0}))
      ],
      total: { PYG: 0, BRL: 0, USD: 0 }
    },
    saldosServiciosInicial: serviciosDefault.map(s => ({...s, monto: 0}))
  });

  // Estados de expansión
  const [expandedSections, setExpandedSections] = useState({
    guaranies: true,
    reales: false,
    dolares: false,
    servicios: false
  });

  // Cargar datos iniciales y reiniciar formulario
  useEffect(() => {
    if (open) {
      console.log('🏢 Sucursal móvil:', sucursalMovil);
      console.log('👤 Usuario autenticado:', {
        id: user?.id,
        username: user?.username,
        rolId: user?.rolId
      });
      cargarMaletines();
      cargarServicios();
      setError(null);
      setActiveStep(0);
             // Reiniciar formulario con denominaciones completas
       setFormData({
         maletinId: '',
         sucursalId: sucursalMovil?.id || '',
         usuarioId: user?.id?.toString() || '',
         usuario: user?.username || '',
         saldoInicial: {
           denominaciones: [
             ...denominacionesGuaranies.map(d => ({...d, cantidad: 0})),
             ...denominacionesReales.map(d => ({...d, cantidad: 0})),
             ...denominacionesDolares.map(d => ({...d, cantidad: 0}))
           ],
           total: { PYG: 0, BRL: 0, USD: 0 }
         },
         saldosServiciosInicial: serviciosDefault.map(s => ({...s, monto: 0}))
       });
    }
  }, [open, sucursalMovil, user]);

    const cargarMaletines = async () => {
    try {
      if (!sucursalMovil?.id) {
        console.error('❌ No hay sucursal seleccionada');
        setError('No hay sucursal seleccionada');
        return;
      }

      console.log('🔍 Cargando maletines para sucursal:', sucursalMovil);

      // Usar el mismo endpoint que el contexto: maletines por sucursal
      let backendSucursalId = sucursalMovil.id;
      if (sucursalMovil.id.startsWith('SUC')) {
        const numericId = parseInt(sucursalMovil.id.replace('SUC', ''), 10);
        backendSucursalId = numericId.toString();
      }

      console.log(`🌐 Llamando API: /api/maletines/sucursal/${backendSucursalId}`);
      const response = await api.get(`/api/maletines/sucursal/${backendSucursalId}`);
      console.log('📦 Maletines cargados:', response.data);
      setMaletines(response.data || []);
      
      // Cargar también las cajas para determinar maletines en uso
      await cargarCajasParaMaletines();
    } catch (error: any) {
      console.error('❌ Error al cargar maletines:', error);
      console.error('📄 Error response:', error.response?.data);
      setError(`Error al cargar maletines: ${error.response?.data?.error || error.message}`);
    }
  };

  const cargarCajasParaMaletines = async () => {
    try {
      const response = await api.get('/api/cajas');
      const todasLasCajas = response.data || [];
      
      // Filtrar cajas abiertas y extraer sus IDs de maletín
      const maletinesUsados = todasLasCajas
        .filter((caja: any) => caja.estado === 'abierta')
        .map((caja: any) => caja.maletinId);
      
             console.log('🔒 Maletines en uso:', maletinesUsados);
       setMaletinesEnUso(maletinesUsados);
    } catch (error) {
      console.error('Error al cargar cajas para maletines:', error);
      setMaletinesEnUso([]);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await api.get('/api/servicios-iniciales');
      const servicios = response.data || [];
      
      // Si hay servicios del backend, usarlos; sino usar servicios por defecto
      if (servicios.length > 0) {
        setFormData(prev => ({
          ...prev,
          saldosServiciosInicial: servicios.map((s: any) => ({
            servicio: s.nombre,
            monto: 0
          }))
        }));
      } else {
        // Usar servicios por defecto de constants.ts
        console.log('📋 Usando servicios por defecto');
        setFormData(prev => ({
          ...prev,
          saldosServiciosInicial: serviciosDefault.map(s => ({...s, monto: 0}))
        }));
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      // Si hay error, usar servicios por defecto
      console.log('📋 Error al cargar servicios, usando servicios por defecto');
      setFormData(prev => ({
        ...prev,
        saldosServiciosInicial: serviciosDefault.map(s => ({...s, monto: 0}))
      }));
    }
  };

  const handleDenominacionChange = (index: number, cantidad: number) => {
    const nuevasDenominaciones = [...formData.saldoInicial.denominaciones];
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

    setFormData(prev => ({
      ...prev,
      saldoInicial: {
        ...prev.saldoInicial,
        denominaciones: nuevasDenominaciones,
        total: { PYG: totalPYG, BRL: totalBRL, USD: totalUSD }
      }
    }));
  };

  const handleServicioChange = (index: number, monto: number) => {
    const nuevosServicios = [...formData.saldosServiciosInicial];
    nuevosServicios[index].monto = monto;
    setFormData(prev => ({
      ...prev,
      saldosServiciosInicial: nuevosServicios
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatearMoneda = (monto: number, moneda: string): string => {
    switch (moneda) {
      case 'PYG':
        return new Intl.NumberFormat('es-PY').format(monto) + ' Gs';
      case 'BRL':
        return 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(monto);
      case 'USD':
        return '$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(monto);
      default:
        return monto.toString();
    }
  };

  // Función para ordenar denominaciones de mayor a menor
  const ordenarDenominaciones = (denominaciones: Denominacion[], moneda: 'PYG' | 'BRL' | 'USD'): Denominacion[] => {
    return [...denominaciones]
      .filter(d => d.moneda === moneda)
      .sort((a, b) => b.valor - a.valor); // De mayor a menor
  };

  // Función para seleccionar todo el texto en el input al hacer click
  const handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    // Usar setTimeout para asegurar que el input esté enfocado primero
    setTimeout(() => {
      input.select();
    }, 0);
  };

  const handleGuardarApertura = async () => {
    if (!formData.maletinId) {
      setError('Debe seleccionar un maletín');
      return;
    }

    if (!formData.usuarioId) {
      setError('No se pudo obtener la información del usuario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar datos con conversiones necesarias para el backend
      let sucursalIdNumerico = parseInt(formData.sucursalId) || 0;
      
      // Si el sucursalId es del formato SUC001, extraer el número
      if (formData.sucursalId.startsWith('SUC')) {
        sucursalIdNumerico = parseInt(formData.sucursalId.replace('SUC', ''), 10);
      }
      
      const datosParaEnviar = {
        ...formData,
        // Convertir IDs a números como espera el backend
        sucursalId: sucursalIdNumerico,
        usuarioId: parseInt(formData.usuarioId) || 0,
        maletinId: parseInt(formData.maletinId) || 0
      };

      console.log('🚀 Enviando datos de apertura:', {
        sucursalId: datosParaEnviar.sucursalId,
        usuarioId: datosParaEnviar.usuarioId,
        maletinId: datosParaEnviar.maletinId,
        usuario: datosParaEnviar.usuario,
        saldoInicialTotales: datosParaEnviar.saldoInicial.total,
        serviciosCount: datosParaEnviar.saldosServiciosInicial.length
      });
      
      // Validaciones antes del envío
      if (!datosParaEnviar.sucursalId || datosParaEnviar.sucursalId === 0) {
        throw new Error('ID de sucursal inválido');
      }
      if (!datosParaEnviar.usuarioId || datosParaEnviar.usuarioId === 0) {
        throw new Error('ID de usuario inválido');
      }
      if (!datosParaEnviar.maletinId || datosParaEnviar.maletinId === 0) {
        throw new Error('ID de maletín inválido');
      }

      const response = await api.post('/api/cajas', datosParaEnviar);
      
      if (response.status === 201) {
        console.log('✅ Caja creada exitosamente:', response.data);
        onSuccess();
        onClose();
      } else {
        console.log('⚠️ Respuesta inesperada:', response);
        setError(response.data.message || 'Error al crear la caja');
      }
    } catch (error: any) {
      console.error('❌ Error al crear caja:', error);
      console.error('📄 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Mejorar el mensaje de error
      let errorMessage = 'Error al crear la caja';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Datos inválidos. Verifique la información ingresada.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Maletín', 'Efectivo', 'Servicios'];
  const estaEnUso = (maletinId: string) => maletinesEnUso.includes(maletinId);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
                         <Typography variant="h6" gutterBottom>
               Seleccionar Maletín
             </Typography>
             <Typography variant="caption" color="text.secondary" gutterBottom>
               Maletines disponibles: {maletines.length} | En uso: {maletinesEnUso.length}
             </Typography>
            <FormControl fullWidth error={!formData.maletinId && error !== null}>
              <InputLabel>Maletín</InputLabel>
              <Select
                value={formData.maletinId}
                label="Maletín"
                onChange={(e) => setFormData(prev => ({ ...prev, maletinId: e.target.value }))}
              >
                                 <MenuItem value="">
                   <em>Seleccione un maletín</em>
                 </MenuItem>
                 {maletines.length === 0 ? (
                   <MenuItem disabled>
                     <em>No hay maletines disponibles</em>
                   </MenuItem>
                 ) : (
                   maletines.map((maletin) => (
                  <MenuItem 
                    key={maletin.id} 
                    value={maletin.id}
                    disabled={estaEnUso(maletin.id)}
                  >
                    {maletin.codigo || maletin.id}
                                         {estaEnUso(maletin.id) && ' (En uso)'}
                     {maletin.sucursal && ` (${maletin.sucursal.nombre})`}
                   </MenuItem>
                   ))
                 )}
              </Select>
              {!formData.maletinId && error && (
                <FormHelperText>Debe seleccionar un maletín</FormHelperText>
              )}
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Conteo de Efectivo
            </Typography>
            
            {/* Guaraníes */}
            <Card sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => toggleSection('guaranies')}
                  endIcon={expandedSections.guaranies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="subtitle1">
                    💰 Guaraníes: {formatearMoneda(formData.saldoInicial.total.PYG, 'PYG')}
                  </Typography>
                </Button>

                <Collapse in={expandedSections.guaranies}>
                  <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '32%', maxWidth: '90px', padding: '8px 4px' }}>Denominación</TableCell>
                        <TableCell sx={{ width: '35%', maxWidth: '85px', padding: '8px 4px', textAlign: 'center' }}>Cantidad</TableCell>
                        <TableCell sx={{ width: '33%', padding: '8px 4px' }}>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordenarDenominaciones(formData.saldoInicial.denominaciones, 'PYG')
                        .map((denom, index) => {
                          const originalIndex = formData.saldoInicial.denominaciones.indexOf(denom);
                          return (
                            <TableRow key={`PYG-${denom.valor}`}>
                              <TableCell sx={{ padding: '8px 4px' }}>{formatearMoneda(denom.valor, 'PYG')}</TableCell>
                              <TableCell sx={{ padding: '8px 4px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={denom.cantidad}
                                  onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                  inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                  onClick={handleInputClick}
                                />
                              </TableCell>
                              <TableCell sx={{ padding: '8px 4px' }}>
                                {formatearMoneda(denom.valor * denom.cantidad, 'PYG')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Collapse>
              </CardContent>
            </Card>

            {/* Reales */}
            <Card sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => toggleSection('reales')}
                  endIcon={expandedSections.reales ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="subtitle1">
                    💵 Reales: {formatearMoneda(formData.saldoInicial.total.BRL, 'BRL')}
                  </Typography>
                </Button>

                <Collapse in={expandedSections.reales}>
                  <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '32%', maxWidth: '90px', padding: '8px 4px' }}>Denominación</TableCell>
                        <TableCell sx={{ width: '35%', maxWidth: '85px', padding: '8px 4px', textAlign: 'center' }}>Cantidad</TableCell>
                        <TableCell sx={{ width: '33%', padding: '8px 4px' }}>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordenarDenominaciones(formData.saldoInicial.denominaciones, 'BRL')
                        .map((denom, index) => {
                          const originalIndex = formData.saldoInicial.denominaciones.indexOf(denom);
                          return (
                            <TableRow key={`BRL-${denom.valor}`}>
                              <TableCell sx={{ padding: '8px 4px' }}>{formatearMoneda(denom.valor, 'BRL')}</TableCell>
                              <TableCell sx={{ padding: '8px 4px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={denom.cantidad}
                                  onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                  inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                  onClick={handleInputClick}
                                />
                              </TableCell>
                              <TableCell sx={{ padding: '8px 4px' }}>
                                {formatearMoneda(denom.valor * denom.cantidad, 'BRL')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Collapse>
              </CardContent>
            </Card>

            {/* Dólares */}
            <Card sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => toggleSection('dolares')}
                  endIcon={expandedSections.dolares ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="subtitle1">
                    💶 Dólares: {formatearMoneda(formData.saldoInicial.total.USD, 'USD')}
                  </Typography>
                </Button>

                <Collapse in={expandedSections.dolares}>
                  <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '32%', maxWidth: '90px', padding: '8px 4px' }}>Denominación</TableCell>
                        <TableCell sx={{ width: '35%', maxWidth: '85px', padding: '8px 4px', textAlign: 'center' }}>Cantidad</TableCell>
                        <TableCell sx={{ width: '33%', padding: '8px 4px' }}>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordenarDenominaciones(formData.saldoInicial.denominaciones, 'USD')
                        .map((denom, index) => {
                          const originalIndex = formData.saldoInicial.denominaciones.indexOf(denom);
                          return (
                            <TableRow key={`USD-${denom.valor}`}>
                              <TableCell sx={{ padding: '8px 4px' }}>{formatearMoneda(denom.valor, 'USD')}</TableCell>
                              <TableCell sx={{ padding: '8px 4px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={denom.cantidad}
                                  onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                  inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                  onClick={handleInputClick}
                                />
                              </TableCell>
                              <TableCell sx={{ padding: '8px 4px' }}>
                                {formatearMoneda(denom.valor * denom.cantidad, 'USD')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Saldos de Servicios
            </Typography>
            
            {formData.saldosServiciosInicial.length > 0 ? (
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Servicio</TableCell>
                        <TableCell>Monto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.saldosServiciosInicial.map((servicio, index) => (
                        <TableRow key={index}>
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
                              inputProps={{ 
                                min: 0, 
                                style: { textAlign: 'right' } 
                              }}
                              InputProps={{
                                endAdornment: <Typography variant="caption">&nbsp;Gs</Typography>,
                              }}
                              onClick={handleInputClick}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">
                No hay servicios configurados para esta sucursal
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

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
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            📦 Nueva Caja
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {sucursalMovil?.nombre}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
                 {error && (
           <Alert severity="error" sx={{ mb: 2 }}>
             {error}
           </Alert>
         )}

         {!sucursalMovil && (
           <Alert severity="warning" sx={{ mb: 2 }}>
             No hay sucursal seleccionada. Escanee un código QR primero.
           </Alert>
         )}

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => {
            if (activeStep === 0) {
              onClose();
            } else {
              setActiveStep(activeStep - 1);
            }
          }}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {activeStep === 0 ? 'Cancelar' : 'Anterior'}
        </Button>

        {activeStep < steps.length - 1 ? (
          <Button
            onClick={() => setActiveStep(activeStep + 1)}
            variant="contained"
            disabled={activeStep === 0 && !formData.maletinId}
            sx={{ borderRadius: 2 }}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={handleGuardarApertura}
            variant="contained"
            disabled={loading || !formData.maletinId}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Creando...' : 'Crear Caja'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FormAperturaMobile;
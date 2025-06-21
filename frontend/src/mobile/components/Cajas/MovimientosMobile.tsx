import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Alert,
  Collapse,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachFile as AttachFileIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../../../services/api';
import { API_BASE_URL } from '../../../config';

interface MovimientosData {
  tigo: {
    miniCarga: number;
    girosEnviados: number;
    retiros: number;
    cargaBilleteras: number;
  };
  personal: {
    maxiCarga: number;
    girosEnviados: number;
    retiros: number;
    cargaBilleteras: number;
  };
  claro: {
    recargaClaro: number;
    girosEnviados: number;
    retiros: number;
    cargaBilleteras: number;
  };
  aquiPago: {
    pagos: number;
    retiros: number;
  };
  wepaGuaranies: {
    pagos: number;
    retiros: number;
  };
  wepaDolares: {
    pagos: string;
    retiros: string;
  };
}

interface Caja {
  id: number;
  cajaEnteroId: number;
  usuarioId: string;
  usuario: {
    username: string;
  };
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'abierta' | 'cerrada';
  montoApertura: number;
  montoCierre?: number;
  sucursalId: string;
  sucursal?: {
    nombre: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  caja: Caja | null;
  onSuccess?: () => void;
}

const MovimientosMobile: React.FC<Props> = ({ open, onClose, caja, onSuccess }) => {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estilos comunes para campos de entrada
  const inputStyles = {
    fontSize: '12px',
    textAlign: 'right' as const
  };
  
  // Estados de expansión para móvil
  const [expandedSections, setExpandedSections] = useState({
    tigo: true,
    personal: false,
    claro: false,
    aquiPago: false,
    wepaGuaranies: false,
    wepaDolares: false
  });

  // Estado para los datos de movimientos
  const [movimientosData, setMovimientosData] = useState<MovimientosData>({
    tigo: {
      miniCarga: 0,
      girosEnviados: 0,
      retiros: 0,
      cargaBilleteras: 0
    },
    personal: {
      maxiCarga: 0,
      girosEnviados: 0,
      retiros: 0,
      cargaBilleteras: 0
    },
    claro: {
      recargaClaro: 0,
      girosEnviados: 0,
      retiros: 0,
      cargaBilleteras: 0
    },
    aquiPago: {
      pagos: 0,
      retiros: 0
    },
    wepaGuaranies: {
      pagos: 0,
      retiros: 0
    },
    wepaDolares: {
      pagos: "0",
      retiros: "0"
    }
  });

  // Estado para los comprobantes
  const [comprobantes, setComprobantes] = useState<Record<string, File | null>>({
    tigo_miniCarga: null,
    tigo_girosEnviados: null,
    tigo_retiros: null,
    tigo_cargaBilleteras: null,
    personal_maxiCarga: null,
    personal_girosEnviados: null,
    personal_retiros: null,
    personal_cargaBilleteras: null,
    claro_recargaClaro: null,
    claro_girosEnviados: null,
    claro_retiros: null,
    claro_cargaBilleteras: null,
    aquiPago: null,
    wepaGuaranies: null,
    wepaDolares: null
  });

  // Función para formatear valores en guaraníes
  const formatGuaranies = (value: number) => {
    const numeroSeguro = isNaN(value) ? 0 : value;
    return new Intl.NumberFormat('es-PY').format(numeroSeguro);
  };

  // Toggle de secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Función para manejar cambios en los campos de movimientos
  const handleMovimientoChange = (operadora: string, servicio: string, valor: string) => {
    const numericValue = valor === '' ? 0 : parseInt(valor.replace(/\D/g, ''), 10);
    
    setMovimientosData(prev => ({
      ...prev,
      [operadora]: {
        ...prev[operadora as keyof typeof prev],
        [servicio]: numericValue
      }
    }));
  };

  // Función para manejar el focus en inputs numéricos
  const handleNumericInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    try {
      const input = e.target;
      setTimeout(() => {
        if (input && document.activeElement === input && 'select' in input) {
          input.select();
          if ('setSelectionRange' in input) {
            const length = input.value.length;
            input.setSelectionRange(0, length);
          }
        }
      }, 10);
    } catch (error) {
      console.error('Error al seleccionar texto:', error);
    }
  };

  // Función para guardar los movimientos
  const handleGuardarMovimientos = async () => {
    if (!caja) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Preparar los datos para enviar
      const datosAEnviar = {
        ...movimientosData,
        actualizarTodos: true
      };
      
      // Guardar movimientos
      await api.post(`/api/cajas/${caja.id}/movimiento`, datosAEnviar);
      
      // Filtrar comprobantes nuevos
      const nuevosComprobantesEntries = Object.entries(comprobantes)
        .filter(([_, file]) => file !== null && !(file as any).comprobanteId);
      
      if (nuevosComprobantesEntries.length > 0) {
        // Preparar FormData para subida en lote
        const formData = new FormData();
        const tiposArchivos: string[] = [];

        nuevosComprobantesEntries.forEach(([id, file]) => {
          const fileReal = file as File;
          formData.append('comprobantes', fileReal, fileReal.name);
          
          // Mapear ID frontend a tipo backend
          let tipoBackend = "";
          if (id === 'tigo_miniCarga') { tipoBackend = 'minicargas'; }
          else if (id === 'tigo_girosEnviados') { tipoBackend = 'girosEnviadosTigo'; }
          else if (id === 'tigo_retiros') { tipoBackend = 'retirosTigoMoney'; }
          else if (id === 'tigo_cargaBilleteras') { tipoBackend = 'cargasBilleteraTigo'; }
          else if (id === 'personal_maxiCarga') { tipoBackend = 'maxicargas'; }
          else if (id === 'personal_girosEnviados') { tipoBackend = 'girosEnviadosPersonal'; }
          else if (id === 'personal_retiros') { tipoBackend = 'retirosBilleteraPersonal'; }
          else if (id === 'personal_cargaBilleteras') { tipoBackend = 'cargasBilleteraPersonal'; }
          else if (id === 'claro_recargaClaro') { tipoBackend = 'recargaClaro'; }
          else if (id === 'claro_girosEnviados') { tipoBackend = 'girosEnviadosClaro'; }
          else if (id === 'claro_retiros') { tipoBackend = 'retirosBilleteraClaro'; }
          else if (id === 'claro_cargaBilleteras') { tipoBackend = 'cargasBilleteraClaro'; }
          else if (id === 'aquiPago') { tipoBackend = 'aquiPago'; }
          else if (id === 'wepaGuaranies') { tipoBackend = 'wepaGuaranies'; }
          else if (id === 'wepaDolares') { tipoBackend = 'wepaDolares'; }
          else { 
            console.warn(`Tipo de comprobante no mapeado: ${id}`);
            tipoBackend = 'minicargas';
          }
          tiposArchivos.push(tipoBackend);
        });

        formData.append('tipos', JSON.stringify(tiposArchivos));

        // Subir comprobantes en lote
        await api.post(
          `/api/cajas/${caja.id}/comprobantes/batch`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      
      setSuccessMessage('Movimientos guardados correctamente');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Cerrar después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error al guardar movimientos:', err);
      setError('Error al guardar los movimientos: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar movimientos existentes cuando se abre el diálogo
  useEffect(() => {
    if (open && caja && caja.id) {
      setLoading(true);
      
      api.get(`/api/cajas/${caja.id}/movimiento`)
        .then(response => {
          console.log('Movimientos cargados:', response.data);
          
          if (response.data && response.data.data) {
            const movimientosGuardados = response.data.data;
            
            setMovimientosData(prevData => {
              const newData = JSON.parse(JSON.stringify(prevData));
              
              Object.keys(newData).forEach(operadora => {
                if (movimientosGuardados[operadora]) {
                  Object.keys(newData[operadora]).forEach(servicio => {
                    if (operadora in movimientosGuardados && 
                        servicio in movimientosGuardados[operadora]) {
                      newData[operadora][servicio] = movimientosGuardados[operadora][servicio];
                    }
                  });
                }
              });
              
              return newData;
            });

            // Cargar comprobantes existentes
            if (response.data && response.data.serviciosData) {
              const servicios = response.data.serviciosData;
              const nuevosComprobantes = {...comprobantes};
              
              const tipoToId: Record<string, string> = {
                'minicargas': 'tigo_miniCarga',
                'maxicargas': 'personal_maxiCarga',
                'recargaClaro': 'claro_recargaClaro',
                'retirosTigoMoney': 'tigo_retiros',
                'retirosBilleteraPersonal': 'personal_retiros',
                'retirosBilleteraClaro': 'claro_retiros',
                'cargasBilleteraTigo': 'tigo_cargaBilleteras',
                'cargasBilleteraPersonal': 'personal_cargaBilleteras',
                'cargasBilleteraClaro': 'claro_cargaBilleteras',
                'girosEnviadosTigo': 'tigo_girosEnviados',
                'girosEnviadosPersonal': 'personal_girosEnviados',
                'girosEnviadosClaro': 'claro_girosEnviados',
                'aquiPago': 'aquiPago',
                'wepaGuaranies': 'wepaGuaranies',
                'wepaDolares': 'wepaDolares'
              };
              
              Object.keys(tipoToId).forEach(tipo => {
                if (servicios[tipo] && typeof servicios[tipo] === 'string') {
                  const dummyFile = new File([""], `comprobante_${tipo}.jpg`, {
                    type: "image/jpeg",
                  });
                  
                  Object.defineProperty(dummyFile, 'comprobanteId', {
                    value: tipo,
                    writable: false
                  });
                  
                  const frontendId = tipoToId[tipo];
                  if (frontendId) {
                    nuevosComprobantes[frontendId] = dummyFile;
                  }
                }
              });
              
              setComprobantes(nuevosComprobantes);
            }
          }
        })
        .catch(error => {
          console.error('Error al cargar movimientos:', error);
          if (error.response && error.response.status !== 404) {
            setError('Error al cargar los movimientos existentes');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, caja]);

  if (!caja) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              📊 Movimientos por Operadora
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
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Registra los movimientos por operadora para esta caja
        </Typography>

        {/* TIGO */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('tigo')}
              endIcon={expandedSections.tigo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1, color: 'primary.main' }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                📱 TIGO
              </Typography>
            </Button>

            <Collapse in={expandedSections.tigo}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell align="right"><strong>Monto Gs</strong></TableCell>
                    <TableCell align="center" sx={{ width: '70px' }}><strong>Comp.</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Mini Carga</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.tigo.miniCarga)}
                        onChange={(e) => handleMovimientoChange('tigo', 'miniCarga', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  tigo_miniCarga: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Mini Carga TIGO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.tigo_miniCarga}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.tigo_miniCarga) {
                              window.open(URL.createObjectURL(comprobantes.tigo_miniCarga), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Giros Enviados</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.tigo.girosEnviados)}
                        onChange={(e) => handleMovimientoChange('tigo', 'girosEnviados', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  tigo_girosEnviados: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Giros Enviados TIGO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.tigo_girosEnviados}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.tigo_girosEnviados) {
                              window.open(URL.createObjectURL(comprobantes.tigo_girosEnviados), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Retiros</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.tigo.retiros)}
                        onChange={(e) => handleMovimientoChange('tigo', 'retiros', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  tigo_retiros: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Retiros TIGO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.tigo_retiros}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.tigo_retiros) {
                              window.open(URL.createObjectURL(comprobantes.tigo_retiros), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Carga de Billeteras</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.tigo.cargaBilleteras)}
                        onChange={(e) => handleMovimientoChange('tigo', 'cargaBilleteras', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  tigo_cargaBilleteras: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Carga de Billeteras TIGO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.tigo_cargaBilleteras}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.tigo_cargaBilleteras) {
                              window.open(URL.createObjectURL(comprobantes.tigo_cargaBilleteras), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* PERSONAL */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('personal')}
              endIcon={expandedSections.personal ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1, color: 'secondary.main' }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                📞 PERSONAL
              </Typography>
            </Button>

            <Collapse in={expandedSections.personal}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell align="right"><strong>Monto Gs</strong></TableCell>
                    <TableCell align="center" sx={{ width: '70px' }}><strong>Comp.</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Maxi Carga</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.personal.maxiCarga)}
                        onChange={(e) => handleMovimientoChange('personal', 'maxiCarga', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  personal_maxiCarga: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Maxi Carga PERSONAL');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.personal_maxiCarga}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.personal_maxiCarga) {
                              window.open(URL.createObjectURL(comprobantes.personal_maxiCarga), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Giros Enviados</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.personal.girosEnviados)}
                        onChange={(e) => handleMovimientoChange('personal', 'girosEnviados', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  personal_girosEnviados: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Giros Enviados PERSONAL');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.personal_girosEnviados}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.personal_girosEnviados) {
                              window.open(URL.createObjectURL(comprobantes.personal_girosEnviados), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Retiros</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.personal.retiros)}
                        onChange={(e) => handleMovimientoChange('personal', 'retiros', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  personal_retiros: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Retiros PERSONAL');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.personal_retiros}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.personal_retiros) {
                              window.open(URL.createObjectURL(comprobantes.personal_retiros), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Carga de Billeteras</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.personal.cargaBilleteras)}
                        onChange={(e) => handleMovimientoChange('personal', 'cargaBilleteras', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  personal_cargaBilleteras: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Carga de Billeteras PERSONAL');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.personal_cargaBilleteras}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.personal_cargaBilleteras) {
                              window.open(URL.createObjectURL(comprobantes.personal_cargaBilleteras), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* CLARO */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('claro')}
              endIcon={expandedSections.claro ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1, color: 'error.main' }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                🔴 CLARO
              </Typography>
            </Button>

            <Collapse in={expandedSections.claro}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell align="right"><strong>Monto Gs</strong></TableCell>
                    <TableCell align="center" sx={{ width: '70px' }}><strong>Comp.</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Recarga Claro</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.claro.recargaClaro)}
                        onChange={(e) => handleMovimientoChange('claro', 'recargaClaro', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  claro_recargaClaro: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Recarga Claro');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.claro_recargaClaro}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.claro_recargaClaro) {
                              window.open(URL.createObjectURL(comprobantes.claro_recargaClaro), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Giros Enviados</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.claro.girosEnviados)}
                        onChange={(e) => handleMovimientoChange('claro', 'girosEnviados', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  claro_girosEnviados: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Giros Enviados CLARO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.claro_girosEnviados}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.claro_girosEnviados) {
                              window.open(URL.createObjectURL(comprobantes.claro_girosEnviados), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Retiros</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.claro.retiros)}
                        onChange={(e) => handleMovimientoChange('claro', 'retiros', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  claro_retiros: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Retiros CLARO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.claro_retiros}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.claro_retiros) {
                              window.open(URL.createObjectURL(comprobantes.claro_retiros), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Carga de Billeteras</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.claro.cargaBilleteras)}
                        onChange={(e) => handleMovimientoChange('claro', 'cargaBilleteras', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '85px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          component="label" 
                          color="primary"
                          title="Subir comprobante"
                        >
                          <AttachFileIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setComprobantes(prev => ({
                                  ...prev,
                                  claro_cargaBilleteras: e.target.files![0]
                                }));
                                setSuccessMessage('Comprobante seleccionado para Carga de Billeteras CLARO');
                              }
                            }}
                          />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info"
                          disabled={!comprobantes.claro_cargaBilleteras}
                          title="Ver comprobante"
                          onClick={() => {
                            if (comprobantes.claro_cargaBilleteras) {
                              window.open(URL.createObjectURL(comprobantes.claro_cargaBilleteras), '_blank');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* AQUÍ PAGO */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Button
                variant="text"
                onClick={() => toggleSection('aquiPago')}
                endIcon={expandedSections.aquiPago ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ color: 'success.main', p: 0, minWidth: 'auto' }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  💳 AQUÍ PAGO
                </Typography>
              </Button>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  component="label" 
                  color="primary"
                  title="Subir comprobante general"
                >
                  <AttachFileIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setComprobantes(prev => ({
                          ...prev,
                          aquiPago: e.target.files![0]
                        }));
                        setSuccessMessage('Comprobante seleccionado para AQUÍ PAGO');
                      }
                    }}
                  />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="info"
                  disabled={!comprobantes.aquiPago}
                  title="Ver comprobante"
                  onClick={() => {
                    if (comprobantes.aquiPago) {
                      window.open(URL.createObjectURL(comprobantes.aquiPago), '_blank');
                    }
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={expandedSections.aquiPago}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell align="right"><strong>Monto Gs</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Pagos</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.aquiPago.pagos)}
                        onChange={(e) => handleMovimientoChange('aquiPago', 'pagos', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Retiros</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.aquiPago.retiros)}
                        onChange={(e) => handleMovimientoChange('aquiPago', 'retiros', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* WEPA GUARANÍES */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Button
                variant="text"
                onClick={() => toggleSection('wepaGuaranies')}
                endIcon={expandedSections.wepaGuaranies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ color: 'info.main', p: 0, minWidth: 'auto' }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  💰 WEPA GUARANÍES
                </Typography>
              </Button>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  component="label" 
                  color="primary"
                  title="Subir comprobante general"
                >
                  <AttachFileIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setComprobantes(prev => ({
                          ...prev,
                          wepaGuaranies: e.target.files![0]
                        }));
                        setSuccessMessage('Comprobante seleccionado para WEPA GUARANÍES');
                      }
                    }}
                  />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="info"
                  disabled={!comprobantes.wepaGuaranies}
                  title="Ver comprobante"
                  onClick={() => {
                    if (comprobantes.wepaGuaranies) {
                      window.open(URL.createObjectURL(comprobantes.wepaGuaranies), '_blank');
                    }
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={expandedSections.wepaGuaranies}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell align="right"><strong>Monto Gs</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Pagos</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.wepaGuaranies.pagos)}
                        onChange={(e) => handleMovimientoChange('wepaGuaranies', 'pagos', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Retiros</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={formatGuaranies(movimientosData.wepaGuaranies.retiros)}
                        onChange={(e) => handleMovimientoChange('wepaGuaranies', 'retiros', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* WEPA DÓLARES */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Button
                variant="text"
                onClick={() => toggleSection('wepaDolares')}
                endIcon={expandedSections.wepaDolares ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ color: 'warning.main', p: 0, minWidth: 'auto' }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  💵 WEPA DÓLARES
                </Typography>
              </Button>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  component="label" 
                  color="primary"
                  title="Subir comprobante general"
                >
                  <AttachFileIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setComprobantes(prev => ({
                          ...prev,
                          wepaDolares: e.target.files![0]
                        }));
                        setSuccessMessage('Comprobante seleccionado para WEPA DÓLARES');
                      }
                    }}
                  />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="info"
                  disabled={!comprobantes.wepaDolares}
                  title="Ver comprobante"
                  onClick={() => {
                    if (comprobantes.wepaDolares) {
                      window.open(URL.createObjectURL(comprobantes.wepaDolares), '_blank');
                    }
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={expandedSections.wepaDolares}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell align="right"><strong>Monto</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Pagos</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={movimientosData.wepaDolares.pagos}
                        onChange={(e) => handleMovimientoChange('wepaDolares', 'pagos', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          endAdornment: <Typography variant="caption">$</Typography>,
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Retiros</TableCell>
                    <TableCell align="right">
                      <TextField
                        variant="outlined"
                        size="small"
                        value={movimientosData.wepaDolares.retiros}
                        onChange={(e) => handleMovimientoChange('wepaDolares', 'retiros', e.target.value)}
                        autoComplete="off"
                        InputProps={{ 
                          endAdornment: <Typography variant="caption">$</Typography>,
                          inputProps: { 
                            style: inputStyles,
                            onFocus: handleNumericInputFocus
                          }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2 }}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          sx={{ borderRadius: 2, minWidth: 100 }}
          variant="contained"
          disabled={loading}
          onClick={handleGuardarMovimientos}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientosMobile; 

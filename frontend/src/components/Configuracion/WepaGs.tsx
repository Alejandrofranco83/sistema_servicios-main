import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card,
  CardContent,
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
  CircularProgress,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatUtils';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Interfaces
interface CuentaBancaria {
  id: number;
  numeroCuenta: string;
  tipo: string;
  moneda: string;
  banco: string;
}

interface WepaGsConfig {
  id: number;
  cuentaBancariaId: number;
  cuentaBancaria?: CuentaBancaria;
  limiteCredito: number;
  fechaInicioVigencia: string;
  fechaFinVigencia: string;
  fechaCreacion: string;
  nombreArchivoContrato?: string;
  pathArchivoContrato?: string;
  usuario?: {
    id: number;
    username: string;
    nombre: string;
  };
}

// Servicios
const cuentaBancariaService = {
  getAllCuentasBancarias: async (): Promise<CuentaBancaria[]> => {
    try {
      const response = await axios.get('/api/cuentas-bancarias');
      return response.data;
    } catch (error) {
      console.error('Error al obtener cuentas bancarias:', error);
      throw error;
    }
  }
};

const wepaGsService = {
  getLatestConfig: async (): Promise<WepaGsConfig | null> => {
    try {
      const response = await axios.get('/api/configuracion/wepa-gs/actual');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // No hay configuración
      }
      console.error('Error al obtener configuración actual:', error);
      throw error;
    }
  },
  
  getConfigHistory: async (): Promise<WepaGsConfig[]> => {
    try {
      const response = await axios.get('/api/configuracion/wepa-gs/historial');
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de configuraciones:', error);
      throw error;
    }
  },
  
  createConfig: async (formData: FormData): Promise<WepaGsConfig> => {
    try {
      const response = await axios.post('/api/configuracion/wepa-gs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear configuración:', error);
      throw error;
    }
  },
  
  downloadContrato: async (id: number): Promise<Blob> => {
    try {
      const response = await axios.get(`/api/configuracion/wepa-gs/${id}/contrato`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al descargar contrato:', error);
      throw error;
    }
  }
};

const WepaGs: React.FC = () => {
  // Estados
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [configActual, setConfigActual] = useState<WepaGsConfig | null>(null);
  const [historialConfig, setHistorialConfig] = useState<WepaGsConfig[]>([]);
  const [showHistorial, setShowHistorial] = useState<boolean>(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    cuentaBancariaId: 0,
    limiteCredito: '',
    fechaInicioVigencia: new Date(),
    fechaFinVigencia: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    contratoFile: null as File | null
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cargar cuentas bancarias
        const cuentasResponse = await cuentaBancariaService.getAllCuentasBancarias();
        setCuentasBancarias(cuentasResponse);

        // Cargar configuración actual
        const configResponse = await wepaGsService.getLatestConfig();
        if (configResponse) {
          setConfigActual(configResponse);
          // Llenar formulario con datos actuales
          setFormData({
            cuentaBancariaId: configResponse.cuentaBancariaId,
            limiteCredito: configResponse.limiteCredito.toString().replace(/\./g, ''),
            fechaInicioVigencia: new Date(configResponse.fechaInicioVigencia),
            fechaFinVigencia: new Date(configResponse.fechaFinVigencia),
            contratoFile: null
          });
        }
        
        // Cargar historial
        const historialResponse = await wepaGsService.getConfigHistory();
        setHistorialConfig(historialResponse);
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
      setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Manejar cambios en formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'limiteCredito') {
      // Formatear como número
      const numericValue = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        [name]: numericValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (e: any) => {
    const name = e.target.name as string;
    const value = e.target.value as number;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        [name]: date
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        contratoFile: e.target.files[0]
      });
    }
  };

  // Guardar configuración
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.cuentaBancariaId) {
      setError('Debe seleccionar una cuenta bancaria.');
      return;
    }
    
    if (!formData.limiteCredito || parseInt(formData.limiteCredito) <= 0) {
      setError('El límite de crédito debe ser mayor a cero.');
      return;
    }
    
    if (!formData.fechaInicioVigencia || !formData.fechaFinVigencia) {
      setError('Las fechas de vigencia son requeridas.');
      return;
    }
    
    if (formData.fechaInicioVigencia >= formData.fechaFinVigencia) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    
    // Si es nueva configuración, requerir contrato
    if (!configActual && !formData.contratoFile) {
      setError('El archivo de contrato es requerido para una nueva configuración.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Crear FormData para enviar
      const data = new FormData();
      data.append('cuentaBancariaId', formData.cuentaBancariaId.toString());
      data.append('limiteCredito', formData.limiteCredito);
      data.append('fechaInicioVigencia', formData.fechaInicioVigencia.toISOString().split('T')[0]);
      data.append('fechaFinVigencia', formData.fechaFinVigencia.toISOString().split('T')[0]);
      
      if (formData.contratoFile) {
        data.append('contratoFile', formData.contratoFile);
    }

      // Guardar configuración
      const response = await wepaGsService.createConfig(data);
      
      // Actualizar datos
      setConfigActual(response);
      
      // Actualizar historial
      const historialResponse = await wepaGsService.getConfigHistory();
      setHistorialConfig(historialResponse);
      
      // Mostrar mensaje
      toast.success('Configuración guardada exitosamente');
    } catch (err: any) {
      console.error('Error al guardar la configuración:', err);
      setError(err.response?.data?.message || 'Error al guardar la configuración. Por favor, intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Descargar contrato
  const handleDownloadContrato = async (id: number) => {
      try {
      const response = await wepaGsService.downloadContrato(id);
      const url = window.URL.createObjectURL(new Blob([response]));
          const link = document.createElement('a');
          link.href = url;
      link.setAttribute('download', `contrato-wepa-gs-${id}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar contrato:', err);
      toast.error('Error al descargar el contrato');
      }
  };

  // Renderizar tabla historial
  const renderHistorialTable = () => {
    return (
      <TableContainer component={Paper} sx={{ mt: 2, backgroundColor: '#1E1E1E' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Fecha de Creación</TableCell>
              <TableCell sx={{ color: 'white' }}>Cuenta Bancaria</TableCell>
              <TableCell sx={{ color: 'white' }}>Límite de Crédito</TableCell>
              <TableCell sx={{ color: 'white' }}>Vigencia</TableCell>
              <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
              <TableCell sx={{ color: 'white' }}>Contrato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historialConfig.map((config) => (
              <TableRow key={config.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' } }}>
                <TableCell sx={{ color: 'white' }}>{format(new Date(config.fechaCreacion), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell sx={{ color: 'white' }}>
                  {config.cuentaBancaria ? 
                    `${config.cuentaBancaria.banco} - ${config.cuentaBancaria.numeroCuenta}` : 
                    `ID: ${config.cuentaBancariaId}`}
                </TableCell>
                <TableCell sx={{ color: 'white' }}>{formatCurrency.guaranies(Number(config.limiteCredito))}</TableCell>
                <TableCell sx={{ color: 'white' }}>
                  {format(new Date(config.fechaInicioVigencia), 'dd/MM/yyyy')} al {format(new Date(config.fechaFinVigencia), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell sx={{ color: 'white' }}>{config.usuario?.nombre || config.usuario?.username || '-'}</TableCell>
                <TableCell>
                  {config.nombreArchivoContrato ? (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleDownloadContrato(config.id)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>-</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Obtener nombre de banco para mostrar
  const getBankName = (id: number): string => {
    const cuenta = cuentasBancarias.find(c => c.id === id);
    return cuenta ? `${cuenta.banco} - ${cuenta.numeroCuenta} (${cuenta.moneda})` : `ID: ${id}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Configuración de Wepa GS
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Información actual */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3, backgroundColor: '#1E1E1E', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuración Actual
                  </Typography>
                  
                  {configActual ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.7)">
                          Cuenta Bancaria
                        </Typography>
                        <Typography variant="body1">
                          {configActual.cuentaBancaria ? 
                            `${configActual.cuentaBancaria.banco} - ${configActual.cuentaBancaria.numeroCuenta}` : 
                            `ID: ${configActual.cuentaBancariaId}`}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.7)">
                          Límite de Crédito
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency.guaranies(configActual.limiteCredito)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.7)">
                          Vigencia
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(configActual.fechaInicioVigencia), 'dd/MM/yyyy')} al {format(new Date(configActual.fechaFinVigencia), 'dd/MM/yyyy')}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.7)">
                          Última Actualización
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(configActual.fechaCreacion), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {configActual.nombreArchivoContrato && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadContrato(configActual.id)}
                          >
                            Contrato
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      No hay configuración registrada para Wepa GS.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Formulario para nueva configuración */}
          <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1E1E1E', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {configActual ? 'Actualizar Configuración' : 'Nueva Configuración'}
                  </Typography>
                  
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                          <InputLabel id="cuenta-bancaria-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Cuenta Bancaria
                          </InputLabel>
              <Select
                labelId="cuenta-bancaria-label"
                name="cuentaBancariaId"
                            value={formData.cuentaBancariaId}
                            onChange={handleSelectChange}
                label="Cuenta Bancaria"
                            required
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.4)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976D2',
                              },
                            }}
              >
                            <MenuItem value={0} disabled>Seleccione una cuenta bancaria</MenuItem>
                {cuentasBancarias.map((cuenta) => (
                  <MenuItem key={cuenta.id} value={cuenta.id}>
                    {cuenta.banco} - {cuenta.numeroCuenta} ({cuenta.moneda})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                name="limiteCredito"
                          label="Límite de Crédito (G$)"
                          value={formData.limiteCredito ? formData.limiteCredito.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                          onChange={handleInputChange}
                          required
                          sx={{
                            mb: 2,
                            input: { color: 'white' },
                            label: { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.4)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976D2',
                              },
                            },
                }}
              />
          </Grid>

                      <Grid item xs={12} sm={6}>
            <DatePicker
                          label="Fecha de Inicio"
                          value={formData.fechaInicioVigencia}
                          onChange={(date) => handleDateChange('fechaInicioVigencia', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                              required: true,
                              sx: {
                                mb: 2,
                                input: { color: 'white' },
                                label: { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976D2',
                },
                                },
                              } 
                            } 
              }}
            />
          </Grid>

                      <Grid item xs={12} sm={6}>
            <DatePicker
                          label="Fecha de Fin"
                          value={formData.fechaFinVigencia}
                          onChange={(date) => handleDateChange('fechaFinVigencia', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                              required: true,
                              sx: {
                                mb: 2,
                                input: { color: 'white' },
                                label: { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976D2',
                },
                                },
                              } 
                            } 
              }}
            />
          </Grid>
          
                      <Grid item xs={12}>
            <Button
                          component="label"
              variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          sx={{ mb: 2 }}
            >
                          {configActual ? 'Actualizar Contrato (Opcional)' : 'Subir Contrato (Requerido)'}
              <input
                type="file"
                hidden
                            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </Button>
                        {formData.contratoFile && (
                          <Typography variant="caption" display="block" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Archivo seleccionado: {formData.contratoFile.name}
                          </Typography>
             )}
          </Grid>

                      <Grid item xs={12}>
            <Button 
                          type="submit"
              variant="contained" 
              color="primary" 
                          disabled={submitting}
                          startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            >
                          {submitting ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Grid>
        </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Información adicional y botones */}
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1E1E1E', color: 'white', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información Adicional
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2, color: 'black' }}>
                    La configuración de Wepa GS determina la cuenta bancaria donde se depositarán los fondos
                    y establece el límite de crédito para operar.
                  </Alert>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      Consideraciones importantes:
                    </Typography>
                    <ul>
                      <li>
                        <Typography variant="body2">
                          El límite de crédito establece el monto máximo disponible para transferencias.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          La fecha de vigencia determina el período durante el cual estará activa esta configuración.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          El contrato debe ser un documento oficial firmado entre las partes.
                        </Typography>
                      </li>
                    </ul>
                  </Box>
                  
                  <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setShowHistorial(!showHistorial)}
                      sx={{ mr: 1 }}
                    >
                      {showHistorial ? 'Ocultar Historial' : 'Ver Historial de Configuraciones'}
                    </Button>
                    
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => window.location.href = '/dashboard/saldos-monetarios/wepa-gs'}
                    >
                      Ir a Balance Wepa GS
                    </Button>
                  </Box>
                  
                  {showHistorial && historialConfig.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
           Historial de Configuraciones
         </Typography>
                      {renderHistorialTable()}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
                       )}
      </Box>
    </LocalizationProvider>
  );
};

export default WepaGs; 
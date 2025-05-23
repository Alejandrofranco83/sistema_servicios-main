import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { scrollbarStyles } from '../../utils/scrollbarStyles';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api'; // Usar instancia global configurada

// ELIMINAMOS: const API_BASE_URL = 'http://localhost:3000/api';

// Definimos las interfaces
interface CuentaBancaria {
  id: number;
  banco: string;
  moneda: string;
  numeroCuenta: string;
}

interface Pos {
  id: number;
  nombre: string;
  codigoBarras: string;
  cuentaBancariaId: number;
  cuentaBancaria?: CuentaBancaria;
  createdAt?: string;
  updatedAt?: string;
}

// Servicios para POS y Cuentas Bancarias - usando instancia api global
const posService = {
  // Obtener todos los dispositivos POS
  getAllPos: async (): Promise<Pos[]> => {
    try {
      console.log('Obteniendo dispositivos POS desde: /api/pos');
      const response = await api.get('/api/pos');
      console.log('Respuesta del servidor (POS):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener dispositivos POS:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Buscar un POS por código de barras
  getPosByCodigoBarras: async (codigo: string): Promise<Pos | null> => {
    try {
      console.log(`Buscando POS con código de barras ${codigo}`);
      console.log('URL:', `/api/pos/codigo/${codigo}`);
      
      const response = await api.get(`/api/pos/codigo/${codigo}`);
      console.log('Respuesta del servidor (buscar POS por código):', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al buscar POS con código ${codigo}:`, error.message);
      if (error.response && error.response.status === 404) {
        return null;
      }
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Crear un nuevo dispositivo POS
  createPos: async (pos: Omit<Pos, 'id'>): Promise<Pos> => {
    try {
      console.log('Creando dispositivo POS con datos:', pos);
      console.log('URL: /api/pos');
      
      const response = await api.post('/api/pos', pos);
      console.log('Respuesta del servidor (crear POS):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear dispositivo POS:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Actualizar un dispositivo POS existente
  updatePos: async (id: number, pos: Partial<Pos>): Promise<Pos> => {
    try {
      console.log(`Actualizando dispositivo POS ${id} con datos:`, pos);
      console.log('URL:', `/api/pos/${id}`);
      
      const response = await api.put(`/api/pos/${id}`, pos);
      console.log('Respuesta del servidor (actualizar POS):', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar dispositivo POS ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Eliminar un dispositivo POS
  deletePos: async (id: number): Promise<void> => {
    try {
      console.log(`Eliminando dispositivo POS ${id}`);
      console.log('URL:', `/api/pos/${id}`);
      
      await api.delete(`/api/pos/${id}`);
      console.log(`Dispositivo POS ${id} eliminado correctamente`);
    } catch (error: any) {
      console.error(`Error al eliminar dispositivo POS ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  }
};

const cuentaBancariaService = {
  // Obtener todas las cuentas bancarias
  getAllCuentasBancarias: async (): Promise<CuentaBancaria[]> => {
    try {
      console.log('Obteniendo cuentas bancarias desde: /api/cuentas-bancarias');
      const response = await api.get('/api/cuentas-bancarias');
      console.log('Respuesta del servidor (cuentas bancarias):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener cuentas bancarias:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  }
};

// Componente principal
const Pos: React.FC = () => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispositivos, setDispositivos] = useState<Pos[]>([]);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Pos | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const nombrePosRef = useRef<HTMLInputElement>(null); // Ref for Nombre POS input
  const submitButtonRef = useRef<HTMLButtonElement>(null); // Ref for submit button

  // Estado para el formulario
  const [formData, setFormData] = useState<Omit<Pos, 'id'>>({
    nombre: '',
    codigoBarras: '',
    cuentaBancariaId: 0,
  });

  // Cargar dispositivos POS y cuentas bancarias al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener las cuentas bancarias reales
        const cuentasResponse = await cuentaBancariaService.getAllCuentasBancarias();
        setCuentasBancarias(cuentasResponse);
        
        // Obtener los dispositivos POS reales
        const posResponse = await posService.getAllPos();
        setDispositivos(posResponse);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        setError('Error al cargar los datos. Intente nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Manejar cambios en el formulario para inputs de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = value.toUpperCase(); // Convertir a mayúsculas
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Manejar cambios en el Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: parseInt(value, 10)
    }));
  };

  // Seleccionar texto al hacer focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Manejar navegación con Enter
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    // Changed event type to HTMLFormElement
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();

      const form = event.currentTarget;
      const focusableElements = Array.from(
        form.querySelectorAll('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [role="button"]:not([disabled])')
      ).filter(el => {
        const style = window.getComputedStyle(el as HTMLElement);
        return (el as HTMLElement).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];

      const currentFocusedIndex = focusableElements.findIndex(el => el === document.activeElement || el.contains(document.activeElement));

      if (currentFocusedIndex !== -1 && currentFocusedIndex < focusableElements.length - 1) {
        const nextElement = focusableElements[currentFocusedIndex + 1];
        nextElement?.focus();
      } else if (currentFocusedIndex === focusableElements.length - 2) { // Assuming Cancel is before Submit
        const submitBtn = submitButtonRef.current;
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.focus();
        }
      }
    }
  };

  // Abrir diálogo para crear un nuevo POS
  const handleOpenDialog = () => {
    setEditingPos(null);
    setFormData({
      nombre: '',
      codigoBarras: '',
      cuentaBancariaId: 0,
    });
    setDialogOpen(true);
  };

  // Abrir diálogo para editar un POS existente
  const handleEdit = (pos: Pos) => {
    setEditingPos(pos);
    setFormData({
      nombre: pos.nombre,
      codigoBarras: pos.codigoBarras,
      cuentaBancariaId: pos.cuentaBancariaId,
    });
    setDialogOpen(true);
  };

  // Cerrar el diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingPos) {
        // Actualizar un POS existente
        const response = await posService.updatePos(editingPos.id, formData);
        
        // Actualizar el estado local
        const updatedDispositivos = dispositivos.map(d => 
          d.id === editingPos.id 
            ? response
            : d
        );
        setDispositivos(updatedDispositivos);
        setSuccessMessage(`Dispositivo POS ${formData.nombre} actualizado exitosamente`);
      } else {
        // Crear un nuevo POS
        const response = await posService.createPos(formData);
        
        // Actualizar el estado local
        setDispositivos([...dispositivos, response]);
        setSuccessMessage(`Dispositivo POS ${formData.nombre} creado exitosamente`);
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar el dispositivo POS:', error);
      setError('Error al guardar el dispositivo POS. Intente nuevamente más tarde.');
    } finally {
      setLoading(false);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  // Eliminar un POS
  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      
      // Obtener el POS que se va a eliminar para mostrar el mensaje de éxito
      const posToDelete = dispositivos.find(pos => pos.id === id);
      
      // Eliminar el POS del servidor
      await posService.deletePos(id);
      
      // Actualizar el estado local
      const updatedDispositivos = dispositivos.filter(pos => pos.id !== id);
      setDispositivos(updatedDispositivos);
      
      setSuccessMessage(`Dispositivo POS ${posToDelete?.nombre} eliminado exitosamente`);
    } catch (error) {
      console.error('Error al eliminar el dispositivo POS:', error);
      setError('Error al eliminar el dispositivo POS. Intente nuevamente más tarde.');
    } finally {
      setLoading(false);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  // Obtener el nombre del banco por Id de cuenta bancaria
  const getNombreBanco = (cuentaBancariaId: number): string => {
    const cuenta = cuentasBancarias.find(cuenta => cuenta.id === cuentaBancariaId);
    return cuenta ? `${cuenta.banco} (${cuenta.numeroCuenta})` : 'No asignado';
  };

  // Obtener la moneda de la cuenta bancaria seleccionada
  const getMonedaCuenta = (cuentaBancariaId: number): string => {
    const cuenta = cuentasBancarias.find(cuenta => cuenta.id === cuentaBancariaId);
    return cuenta ? cuenta.moneda : '';
  };

  // Verificar si el usuario tiene permisos de edición
  const tienePermisoEdicion = () => {
    // En un caso real, esto vendría de los permisos del usuario
    return true;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h4" component="h1">
          Dispositivos POS
        </Typography>
        {tienePermisoEdicion() && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Nuevo Dispositivo POS
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {dispositivos.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" color="textSecondary">
                No hay dispositivos POS registrados
              </Typography>
              {tienePermisoEdicion() && (
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={{ mt: 2 }}
                >
                  Registrar el primer dispositivo POS
                </Button>
              )}
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Código de Barras</TableCell>
                    <TableCell>Cuenta Bancaria</TableCell>
                    <TableCell>Moneda</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dispositivos.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell>{pos.id}</TableCell>
                      <TableCell>{pos.nombre}</TableCell>
                      <TableCell>{pos.codigoBarras}</TableCell>
                      <TableCell>{getNombreBanco(pos.cuentaBancariaId)}</TableCell>
                      <TableCell>{getMonedaCuenta(pos.cuentaBancariaId)}</TableCell>
                      <TableCell align="center">
                        {tienePermisoEdicion() && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton 
                                color="primary" 
                                onClick={() => handleEdit(pos)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton 
                                color="error" 
                                onClick={() => handleDelete(pos.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Diálogo para crear/editar dispositivo POS */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        TransitionProps={{
          onEntered: () => {
            if (!editingPos && nombrePosRef.current) {
              nombrePosRef.current.focus();
            }
          }
        }}
      >
        <DialogTitle>
          {editingPos ? 'Editar Dispositivo POS' : 'Nuevo Dispositivo POS'}
        </DialogTitle>
        <DialogContent>
          <form 
            noValidate 
            style={{ marginTop: '16px' }}
            onKeyDown={handleKeyDown} 
            onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="nombre"
                  label="Nombre del POS"
                  fullWidth
                  variant="outlined"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  onFocus={handleFocus}
                  inputRef={nombrePosRef}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="codigoBarras"
                  label="Código de Barras"
                  fullWidth
                  variant="outlined"
                  value={formData.codigoBarras}
                  onChange={handleInputChange}
                  required
                  helperText="Ingrese el código que aparece en la parte inferior del dispositivo"
                  onFocus={handleFocus}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Cuenta Bancaria</InputLabel>
                  <Select
                    name="cuentaBancariaId"
                    value={formData.cuentaBancariaId.toString()} // Asegúrate que el valor sea string
                    onChange={handleSelectChange}
                    label="Cuenta Bancaria"
                  >
                    <MenuItem value="0" disabled>Seleccione una cuenta bancaria</MenuItem> {/* Cambiado a string "0" */}
                    {cuentasBancarias.map(cuenta => (
                      <MenuItem key={cuenta.id} value={cuenta.id.toString()}> {/* Asegúrate que el valor del MenuItem sea string */}
                        {cuenta.banco} - {cuenta.numeroCuenta} ({cuenta.moneda})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.nombre || !formData.codigoBarras || formData.cuentaBancariaId === 0} // Comprueba contra 0
            ref={submitButtonRef}
          >
            {editingPos ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes de éxito */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Pos; 
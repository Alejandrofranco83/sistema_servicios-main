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
} from '@mui/icons-material';
import api from '../../services/api'; // Usar instancia global configurada
import { useAuth } from '../../contexts/AuthContext';

// Definimos las interfaces
interface CuentaBancaria {
  id: number;
  banco: string;
  numeroCuenta: string;
  moneda: string;
  tipo: string;
  createdAt?: string;
  updatedAt?: string;
}

// Servicio para Cuentas Bancarias
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
  },

  // Crear una nueva cuenta bancaria
  createCuentaBancaria: async (cuenta: Omit<CuentaBancaria, 'id'>): Promise<CuentaBancaria> => {
    try {
      console.log('Creando cuenta bancaria con datos:', cuenta);
      console.log('URL: /api/cuentas-bancarias');
      const response = await api.post('/api/cuentas-bancarias', cuenta);
      console.log('Respuesta del servidor (crear cuenta):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear cuenta bancaria:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Actualizar una cuenta bancaria existente
  updateCuentaBancaria: async (id: number, cuenta: Partial<CuentaBancaria>): Promise<CuentaBancaria> => {
    try {
      console.log(`Actualizando cuenta bancaria ${id} con datos:`, cuenta);
      console.log('URL:', `/api/cuentas-bancarias/${id}`);
      const response = await api.put(`/api/cuentas-bancarias/${id}`, cuenta);
      console.log('Respuesta del servidor (actualizar cuenta):', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar cuenta bancaria ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Eliminar una cuenta bancaria
  deleteCuentaBancaria: async (id: number): Promise<void> => {
    try {
      console.log(`Eliminando cuenta bancaria ${id}`);
      console.log('URL:', `/api/cuentas-bancarias/${id}`);
      await api.delete(`/api/cuentas-bancarias/${id}`);
      console.log(`Cuenta bancaria ${id} eliminada correctamente`);
    } catch (error: any) {
      console.error(`Error al eliminar cuenta bancaria ${id}:`, error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  }
};

// Componente principal
const CuentasBancarias: React.FC = () => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const bancoInputRef = useRef<HTMLInputElement>(null); // Ref for Banco input
  const submitButtonRef = useRef<HTMLButtonElement>(null); // Ref for Guardar button

  // Estado para el formulario
  const [formData, setFormData] = useState<Omit<CuentaBancaria, 'id'>>({
    banco: '',
    numeroCuenta: '',
    moneda: '',
    tipo: '',
  });

  // Cargar cuentas bancarias al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener las cuentas bancarias reales
        const cuentasResponse = await cuentaBancariaService.getAllCuentasBancarias();
        setCuentas(cuentasResponse);
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
      [name as string]: value
    }));
  };

  // Seleccionar texto al hacer focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Manejar navegación con Enter
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();

      const form = event.currentTarget;
      const focusableElements = Array.from(
        form.querySelectorAll('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [role="button"]:not([disabled])') // Added [role="button"] for Select components
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

  // Abrir diálogo para crear una nueva cuenta bancaria
  const handleOpenDialog = () => {
    setEditingCuenta(null);
    setFormData({
      banco: '',
      numeroCuenta: '',
      moneda: '',
      tipo: '',
    });
    setDialogOpen(true);
  };

  // Abrir diálogo para editar una cuenta bancaria existente
  const handleEdit = (cuenta: CuentaBancaria) => {
    setEditingCuenta(cuenta);
    setFormData({
      banco: cuenta.banco,
      numeroCuenta: cuenta.numeroCuenta,
      moneda: cuenta.moneda,
      tipo: cuenta.tipo,
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
      
      // Validaciones básicas
      if (!formData.banco.trim()) {
        setError('El nombre del banco es obligatorio');
        setLoading(false);
        return;
      }
      
      if (!formData.numeroCuenta.trim()) {
        setError('El número de cuenta es obligatorio');
        setLoading(false);
        return;
      }
      
      if (!formData.moneda) {
        setError('La moneda es obligatoria');
        setLoading(false);
        return;
      }
      
      if (!formData.tipo) {
        setError('El tipo de cuenta es obligatorio');
        setLoading(false);
        return;
      }
      
      if (editingCuenta) {
        // Actualizar una cuenta existente
        const response = await cuentaBancariaService.updateCuentaBancaria(editingCuenta.id, formData);
        
        // Actualizar el estado local
        const updatedCuentas = cuentas.map(c => 
          c.id === editingCuenta.id 
            ? response
            : c
        );
        setCuentas(updatedCuentas);
        setSuccessMessage(`Cuenta bancaria ${formData.banco} actualizada exitosamente`);
      } else {
        // Crear una nueva cuenta
        const response = await cuentaBancariaService.createCuentaBancaria(formData);
        
        // Actualizar el estado local
        setCuentas([...cuentas, response]);
        setSuccessMessage(`Cuenta bancaria ${formData.banco} creada exitosamente`);
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar la cuenta bancaria:', error);
      setError('Error al guardar la cuenta bancaria. Intente nuevamente más tarde.');
    } finally {
      setLoading(false);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  // Eliminar una cuenta bancaria
  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      
      // Obtener la cuenta que se va a eliminar para mostrar el mensaje de éxito
      const cuentaToDelete = cuentas.find(cuenta => cuenta.id === id);
      
      // Eliminar la cuenta del servidor
      await cuentaBancariaService.deleteCuentaBancaria(id);
      
      // Actualizar el estado local
      const updatedCuentas = cuentas.filter(cuenta => cuenta.id !== id);
      setCuentas(updatedCuentas);
      
      setSuccessMessage(`Cuenta bancaria ${cuentaToDelete?.banco} eliminada exitosamente`);
    } catch (error: any) {
      console.error('Error al eliminar la cuenta bancaria:', error);
      
      // Mostrar mensaje específico para el caso de cuentas con dispositivos asociados
      if (error.response && error.response.data && error.response.data.details === 'La cuenta tiene dispositivos POS asociados') {
        setError('No se puede eliminar la cuenta porque tiene dispositivos POS asociados');
      } else {
        setError('Error al eliminar la cuenta bancaria. Intente nuevamente más tarde.');
      }
    } finally {
      setLoading(false);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  // Verificar si el usuario tiene permisos de edición
  const tienePermisoEdicion = () => {
    // En un caso real, esto vendría de los permisos del usuario
    return true;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cuentas Bancarias
        </Typography>
        {tienePermisoEdicion() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Nueva Cuenta Bancaria
          </Button>
        )}
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}
      
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && cuentas.length === 0 && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay cuentas bancarias registradas. ¡Crea una nueva!
        </Alert>
      )}

      {!loading && cuentas.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Banco</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número de Cuenta</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Moneda</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuentas.map((cuenta) => (
                <TableRow key={cuenta.id}>
                  <TableCell>{cuenta.id}</TableCell>
                  <TableCell>{cuenta.banco}</TableCell>
                  <TableCell>{cuenta.numeroCuenta}</TableCell>
                  <TableCell>{cuenta.moneda}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(cuenta)}
                      disabled={!tienePermisoEdicion()}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(cuenta.id)}
                      disabled={!tienePermisoEdicion()}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para crear/editar cuenta bancaria */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionProps={{
          onEntered: () => {
            if (!editingCuenta && bancoInputRef.current) {
              bancoInputRef.current.focus();
            }
          }
        }}
      >
        <DialogTitle>
          {editingCuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }} onKeyDown={handleKeyDown}>
            <TextField
              fullWidth
              margin="normal"
              label="Banco"
              name="banco"
              value={formData.banco}
              onChange={handleInputChange}
              required
              onFocus={handleFocus}
              inputRef={bancoInputRef}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Número de Cuenta"
              name="numeroCuenta"
              value={formData.numeroCuenta}
              onChange={handleInputChange}
              required
              onFocus={handleFocus}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Tipo de Cuenta</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleSelectChange}
                label="Tipo de Cuenta"
              >
                <MenuItem value="" disabled>Seleccione un tipo de cuenta</MenuItem>
                <MenuItem value="CORRIENTE">Cuenta Corriente</MenuItem>
                <MenuItem value="AHORRO">Caja de Ahorro</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Moneda</InputLabel>
              <Select
                name="moneda"
                value={formData.moneda}
                onChange={handleSelectChange}
                label="Moneda"
              >
                <MenuItem value="" disabled>Seleccione una moneda</MenuItem>
                <MenuItem value="PYG">Guaraníes (PYG)</MenuItem>
                <MenuItem value="BRL">Reales (BRL)</MenuItem>
                <MenuItem value="USD">Dólares (USD)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
            ref={submitButtonRef}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes de éxito */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};

export default CuentasBancarias;
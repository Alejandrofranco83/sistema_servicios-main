import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import cotizacionService, { Cotizacion, CotizacionInput } from '../../services/cotizacionService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatUtils';

const Cotizaciones: React.FC = () => {
  const { hasPermission } = useAuth();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CotizacionInput>({
    valorDolar: 0,
    valorReal: 0
  });
  
  const guardarButtonRef = useRef<HTMLButtonElement>(null); // Ref for the save button

  // Estado para validación de formulario
  const [formErrors, setFormErrors] = useState({
    valorDolar: '',
    valorReal: ''
  });

  // Cargar las cotizaciones al montar el componente
  useEffect(() => {
    loadCotizaciones();
  }, []);

  // Función para cargar las cotizaciones
  const loadCotizaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cotizacionService.getCotizaciones();
      setCotizaciones(data);
    } catch (error: any) {
      console.error('Error al cargar cotizaciones:', error);
      setError(error.response?.data?.error || 'Error al cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    
    // Validaciones
    if (parseFloat(value) <= 0) {
      setFormErrors((prev) => ({ ...prev, [name]: 'El valor debe ser mayor que 0' }));
    } else {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar el foco en los campos de texto
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  // Manejar navegación con Enter
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();

      const form = event.currentTarget;
      const focusableElements = Array.from(
        form.querySelectorAll('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])')
      ).filter(el => {
          const style = window.getComputedStyle(el as HTMLElement);
          return (el as HTMLElement).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];

      const currentFocusedIndex = focusableElements.findIndex(el => el === document.activeElement);

      if (currentFocusedIndex !== -1 && currentFocusedIndex < focusableElements.length - 1) {
        const nextElement = focusableElements[currentFocusedIndex + 1];
        nextElement?.focus();
      } else if (currentFocusedIndex === focusableElements.length - 2) { // -2 because Cancelar is before Guardar
        // If Enter is pressed on the last input field, focus the Guardar button
        const saveButton = guardarButtonRef.current;
        if (saveButton && !saveButton.disabled) {
            saveButton.focus();
        }
      }
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que los valores sean positivos
    if (formData.valorDolar <= 0 || formData.valorReal <= 0) {
      setFormErrors({
        valorDolar: formData.valorDolar <= 0 ? 'El valor debe ser mayor que 0' : '',
        valorReal: formData.valorReal <= 0 ? 'El valor debe ser mayor que 0' : ''
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await cotizacionService.createCotizacion(formData);
      setSuccessMessage('Cotización creada correctamente');
      setDialogOpen(false);
      loadCotizaciones();
      // Resetear el formulario
      setFormData({
        valorDolar: 0,
        valorReal: 0
      });
    } catch (error: any) {
      console.error('Error al crear cotización:', error);
      setError(error.response?.data?.error || 'Error al crear la cotización');
    } finally {
      setLoading(false);
    }
  };

  // Formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
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
          Cotizaciones
        </Typography>
        
        {hasPermission('Configuracion', 'Crear') && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Nueva Cotización
          </Button>
        )}
      </Box>
      
      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Mensaje de éxito */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success"
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Tabla de cotizaciones */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
                <TableCell sx={{ color: 'white' }}>Cotización Dólar</TableCell>
                <TableCell sx={{ color: 'white' }}>Cotización Real</TableCell>
                <TableCell sx={{ color: 'white' }}>Estado</TableCell>
                <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cotizaciones.length > 0 ? (
                cotizaciones.map((cotizacion) => (
                  <TableRow key={cotizacion.id} sx={{ 
                    backgroundColor: cotizacion.vigente ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                  }}>
                    <TableCell>{formatDate(cotizacion.fecha)}</TableCell>
                    <TableCell>{formatCurrency.guaranies(cotizacion.valorDolar)}</TableCell>
                    <TableCell>{formatCurrency.guaranies(cotizacion.valorReal)}</TableCell>
                    <TableCell>
                      {cotizacion.vigente ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'success.main',
                            fontWeight: 'bold'
                          }}
                        >
                          VIGENTE
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Histórico
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{cotizacion.usuario?.nombre || 'Desconocido'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay cotizaciones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo para crear nueva cotización */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Cotización</DialogTitle>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} >
          <DialogContent>
            <TextField
              name="valorDolar"
              label="Cotización del Dólar (G$)"
              fullWidth
              margin="normal"
              variant="outlined"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={formData.valorDolar}
              onChange={handleChange}
              onFocus={handleFocus}
              error={!!formErrors.valorDolar}
              helperText={formErrors.valorDolar}
              required
            />
            
            <TextField
              name="valorReal"
              label="Cotización del Real (G$)"
              fullWidth
              margin="normal"
              variant="outlined"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={formData.valorReal}
              onChange={handleChange}
              onFocus={handleFocus}
              error={!!formErrors.valorReal}
              helperText={formErrors.valorReal}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              variant="contained"
              disabled={loading || formData.valorDolar <= 0 || formData.valorReal <= 0}
              ref={guardarButtonRef}
            >
              {loading ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Cotizaciones; 
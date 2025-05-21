import React, { useState, useEffect } from 'react';
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
import sueldoMinimoService, { type SueldoMinimo, SueldoMinimoInput } from '../../services/sueldoMinimoService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatUtils';

const SueldoMinimoComponent: React.FC = () => {
  const { hasPermission } = useAuth();
  const [sueldosMinimos, setSueldosMinimos] = useState<SueldoMinimo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SueldoMinimoInput>({
    valor: 0
  });
  
  // Estado para validación de formulario
  const [formError, setFormError] = useState('');

  // Cargar los sueldos mínimos al montar el componente
  useEffect(() => {
    loadSueldosMinimos();
  }, []);

  // Función para cargar los sueldos mínimos
  const loadSueldosMinimos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sueldoMinimoService.getSueldosMinimos();
      setSueldosMinimos(data);
    } catch (error: any) {
      console.error('Error al cargar sueldos mínimos:', error);
      setError(error.response?.data?.error || 'Error al cargar los sueldos mínimos');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData({ valor: value });
    
    // Validación
    if (value <= 0) {
      setFormError('El valor debe ser mayor que 0');
    } else {
      setFormError('');
    }
  };

  // Manejar el foco en los campos de texto
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el valor sea positivo
    if (formData.valor <= 0) {
      setFormError('El valor debe ser mayor que 0');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await sueldoMinimoService.createSueldoMinimo(formData);
      setSuccessMessage('Sueldo mínimo registrado correctamente');
      setDialogOpen(false);
      loadSueldosMinimos();
      // Resetear el formulario
      setFormData({
        valor: 0
      });
    } catch (error: any) {
      console.error('Error al registrar sueldo mínimo:', error);
      setError(error.response?.data?.error || 'Error al registrar el sueldo mínimo');
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
          Sueldo Mínimo
        </Typography>
        
        {hasPermission('CONFIGURACION', 'SUELDO_MINIMO') && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Nuevo Sueldo Mínimo
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
      
      {/* Tabla de sueldos mínimos */}
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
                <TableCell sx={{ color: 'white' }}>Valor</TableCell>
                <TableCell sx={{ color: 'white' }}>Estado</TableCell>
                <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sueldosMinimos.length > 0 ? (
                sueldosMinimos.map((sueldoMinimo) => (
                  <TableRow key={sueldoMinimo.id} sx={{ 
                    backgroundColor: sueldoMinimo.vigente ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                  }}>
                    <TableCell>{formatDate(sueldoMinimo.fecha)}</TableCell>
                    <TableCell>{formatCurrency.guaranies(sueldoMinimo.valor)}</TableCell>
                    <TableCell>
                      {sueldoMinimo.vigente ? (
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
                    <TableCell>{sueldoMinimo.usuario?.nombre || 'Desconocido'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay registros de sueldo mínimo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo para registrar nuevo sueldo mínimo */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Sueldo Mínimo</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              name="valor"
              label="Valor del Sueldo Mínimo (G$)"
              fullWidth
              margin="normal"
              variant="outlined"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={formData.valor}
              onChange={handleChange}
              onFocus={handleFocus}
              error={!!formError}
              helperText={formError}
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
              disabled={loading || formData.valor <= 0}
            >
              {loading ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SueldoMinimoComponent; 
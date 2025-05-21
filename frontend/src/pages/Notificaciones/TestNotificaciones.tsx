import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent
} from '@mui/material';
import { notificacionService } from '../../services/notificacionService';

const TestNotificaciones: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });
  
  // Formulario
  const [formData, setFormData] = useState({
    titulo: 'Notificación de prueba',
    mensaje: 'Este es un mensaje de prueba para el sistema de notificaciones',
    tipo: 'info',
    esGlobal: true
  });

  // Manejar cambios en los campos de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en los Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en los checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Enviando notificación:', formData);
      
      // Enviar notificación global
      await notificacionService.crearNotificacion({
        titulo: formData.titulo,
        mensaje: formData.mensaje,
        tipo: formData.tipo as 'info' | 'warning' | 'error' | 'success',
        esGlobal: formData.esGlobal
      });
      
      setMessage({ text: 'Notificación enviada correctamente', type: 'success' });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      setMessage({ text: 'Error al enviar la notificación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cerrar el mensaje de alerta
  const handleCloseAlert = () => {
    setMessage({ text: '', type: 'info' });
  };

  // Revisar el contador de notificaciones
  const checkNotificationCount = async () => {
    try {
      setLoading(true);
      const count = await notificacionService.contarMisNotificacionesNoLeidas();
      setMessage({ 
        text: `Contador de notificaciones no leídas: ${count}`, 
        type: 'info' 
      });
    } catch (error) {
      console.error('Error al verificar contador:', error);
      setMessage({ 
        text: 'Error al verificar contador de notificaciones', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar notificaciones no leídas
  const loadUnreadNotifications = async () => {
    try {
      setLoading(true);
      const notifications = await notificacionService.obtenerMisNotificacionesNoLeidas();
      setMessage({ 
        text: `Notificaciones no leídas obtenidas: ${notifications.length}`, 
        type: 'info' 
      });
      console.log('Notificaciones no leídas:', notifications);
    } catch (error) {
      console.error('Error al cargar notificaciones no leídas:', error);
      setMessage({ 
        text: 'Error al cargar notificaciones no leídas', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await notificacionService.marcarTodasComoLeidas();
      setMessage({ 
        text: 'Todas las notificaciones marcadas como leídas', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      setMessage({ 
        text: 'Error al marcar notificaciones como leídas', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Prueba de Notificaciones
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contenido de la notificación
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                required
                fullWidth
                label="Título"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel id="tipo-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-label"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleSelectChange}
                  label="Tipo"
                >
                  <MenuItem value="info">Información</MenuItem>
                  <MenuItem value="success">Éxito</MenuItem>
                  <MenuItem value="warning">Advertencia</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.esGlobal}
                    onChange={handleCheckboxChange}
                    name="esGlobal"
                  />
                }
                label="Notificación global (para todos los usuarios)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Enviar Notificación
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Sección de diagnóstico */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Diagnóstico
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            onClick={checkNotificationCount}
            disabled={loading}
          >
            Verificar contador
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={loadUnreadNotifications}
            disabled={loading}
          >
            Cargar no leídas
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={markAllAsRead}
            disabled={loading}
            color="warning"
          >
            Marcar todas como leídas
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              try {
                console.log('Verificando estado actual del sistema de notificaciones...');
                
                // Limpiar cualquier mensaje anterior
                setMessage({ text: 'Verificando estado del sistema...', type: 'info' });
                setLoading(true);
                
                // Realizar diagnóstico completo
                Promise.all([
                  notificacionService.contarMisNotificacionesNoLeidas(),
                  notificacionService.obtenerMisNotificacionesNoLeidas(),
                  notificacionService.obtenerMisNotificaciones()
                ]).then(([contador, noLeidas, todas]) => {
                  console.log('Resultado del diagnóstico:');
                  console.log('- Contador:', contador);
                  console.log('- No leídas:', noLeidas);
                  console.log('- Todas:', todas);
                  
                  const mensaje = `Estado del sistema:
                    • Contador de no leídas: ${contador}
                    • Notificaciones no leídas: ${noLeidas.length}
                    • Total de notificaciones: ${todas.length}
                  `;
                  
                  setMessage({ text: mensaje, type: 'info' });
                }).catch(error => {
                  console.error('Error en diagnóstico:', error);
                  setMessage({ 
                    text: 'Error al realizar diagnóstico: ' + (error?.message || 'Error desconocido'), 
                    type: 'error' 
                  });
                }).finally(() => {
                  setLoading(false);
                });
              } catch (error) {
                console.error('Error general en diagnóstico:', error);
                setLoading(false);
              }
            }}
            disabled={loading}
            color="primary"
          >
            Diagnóstico completo
          </Button>
        </Box>
      </Paper>
      
      <Snackbar 
        open={!!message.text} 
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={message.type} sx={{ width: '100%' }}>
          {message.text}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestNotificaciones; 
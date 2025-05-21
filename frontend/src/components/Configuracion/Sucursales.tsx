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
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useSucursal, Sucursal } from '../../contexts/SucursalContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../config/api';

const Sucursales: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { sucursalActual, setSucursal } = useSucursal();
  const { user } = useAuth();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const nombreSucursalRef = useRef<HTMLInputElement>(null);

  // Estado para el formulario
  const [formData, setFormData] = useState<Omit<Sucursal, 'id'>>({
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  // Cargar sucursales al montar el componente
  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await apiService.sucursales.getAll();
      
      // Verificar si se recibieron datos
      if (response.data && Array.isArray(response.data)) {
        // Convertir los IDs numéricos a string si es necesario
        const sucursalesFormateadas = response.data.map(sucursal => ({
          ...sucursal,
          id: String(sucursal.id)
        }));
        
        setSucursales(sucursalesFormateadas);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error en el formato de datos de las sucursales');
      }
    } catch (err) {
      console.error('Error al cargar las sucursales:', err);
      setError('Error al cargar las sucursales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'email' ? value : value.toUpperCase();
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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
        form.querySelectorAll('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])')
      ).filter(el => {
        const style = window.getComputedStyle(el as HTMLElement);
        return (el as HTMLElement).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];

      const currentFocusedIndex = focusableElements.findIndex(el => el === document.activeElement);

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

  // Abrir diálogo para crear una nueva sucursal
  const handleOpenDialog = () => {
    setEditingSucursal(null);
    setFormData({
      nombre: '',
      codigo: '',
      direccion: '',
      telefono: '',
      email: '',
    });
    setDialogOpen(true);
  };

  // Abrir diálogo para editar una sucursal existente
  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      nombre: sucursal.nombre,
      codigo: sucursal.codigo,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      email: sucursal.email || '',
    });
    setDialogOpen(true);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingSucursal) {
        // Actualizar una sucursal existente
        await apiService.sucursales.update(editingSucursal.id, formData);
        setSuccessMessage(`Sucursal ${formData.nombre} actualizada exitosamente`);
      } else {
        // Crear una nueva sucursal
        await apiService.sucursales.create(formData);
        setSuccessMessage(`Sucursal ${formData.nombre} creada exitosamente`);
      }
      
      // Recargar las sucursales
      await fetchSucursales();
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error al guardar la sucursal:', err);
      setError(err.response?.data?.error || 'Error al guardar la sucursal');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una sucursal
  const handleDelete = async (sucursal: Sucursal) => {
    if (window.confirm(`¿Está seguro que desea eliminar la sucursal ${sucursal.nombre}?`)) {
      setLoading(true);
      try {
        await apiService.sucursales.delete(sucursal.id);
        setSuccessMessage(`Sucursal ${sucursal.nombre} eliminada exitosamente`);
        
        // Si la sucursal eliminada era la actual, eliminar la selección
        if (sucursalActual?.id === sucursal.id) {
          setSucursal(null);
        }
        
        // Recargar las sucursales
        await fetchSucursales();
      } catch (err: any) {
        console.error('Error al eliminar la sucursal:', err);
        setError(err.response?.data?.error || 'Error al eliminar la sucursal');
      } finally {
        setLoading(false);
      }
    }
  };

  // Cambiar la sucursal activa
  const handleChangeSucursal = (sucursal: Sucursal) => {
    setSucursal(sucursal);
    setSuccessMessage(`Sucursal activa cambiada a ${sucursal.nombre} y guardada en este equipo`);
    
    // Limpiar el mensaje después de 3 segundos
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Verificar si el usuario es administrador (para simplificar, asumimos que si tiene permiso de configuración)
  const isAdmin = true; // En un caso real, esto vendría de los permisos del usuario

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
          Sucursales
        </Typography>
        
        {isAdmin && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Nueva Sucursal
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          La sucursal que seleccione como activa quedará guardada en este equipo. Cada vez que inicie la aplicación en este dispositivo, se cargará automáticamente la última sucursal seleccionada.
        </Typography>
      </Alert>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

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

      {loading && sucursales.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Sucursal actual */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Sucursal Actual
            </Typography>
            {sucursalActual ? (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h5">{sucursalActual.nombre}</Typography>
                      <Chip label={sucursalActual.codigo} color="primary" size="small" sx={{ mr: 1 }} />
                    </Box>
                    <Box>
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Sucursal Activa" 
                        color="success" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Esta sucursal quedará seleccionada en este equipo">
                        <Chip
                          icon={<LocationOnIcon />}
                          label="Guardada localmente"
                          color="secondary"
                          variant="outlined"
                          size="small"
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">{sucursalActual.direccion}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">{sucursalActual.telefono}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">{sucursalActual.email || 'No disponible'}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="warning">
                No hay una sucursal seleccionada.
              </Alert>
            )}
          </Paper>

          {/* Listado de sucursales */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Todas las Sucursales
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sucursales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay sucursales disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    sucursales.map((sucursal) => (
                      <TableRow key={sucursal.id}>
                        <TableCell>
                          {sucursal.nombre}
                          {sucursalActual?.id === sucursal.id && (
                            <Chip 
                              label="Activa" 
                              color="success" 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{sucursal.codigo}</TableCell>
                        <TableCell>{sucursal.direccion}</TableCell>
                        <TableCell>{sucursal.telefono}</TableCell>
                        <TableCell>{sucursal.email || '—'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Seleccionar como sucursal activa y guardar en este equipo">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleChangeSucursal(sucursal)}
                              disabled={sucursalActual?.id === sucursal.id}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {isAdmin && (
                            <>
                              <Tooltip title="Editar">
                                <IconButton 
                                  color="secondary" 
                                  onClick={() => handleEdit(sucursal)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Eliminar">
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDelete(sucursal)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Diálogo para crear/editar sucursal */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        TransitionProps={{ 
          onEntered: () => {
            if (!editingSucursal && nombreSucursalRef.current) {
              nombreSucursalRef.current.focus();
            }
          }
        }}
      >
        <DialogTitle>
          {editingSucursal ? `Editar Sucursal: ${editingSucursal.nombre}` : 'Nueva Sucursal'}
        </DialogTitle>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <DialogContent>
            <TextField
              name="nombre"
              label="Nombre de la Sucursal"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.nombre}
              onChange={handleChange}
              required
              autoComplete="off"
              onFocus={handleFocus}
              inputRef={nombreSucursalRef}
            />
            
            <TextField
              name="codigo"
              label="Código"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.codigo}
              onChange={handleChange}
              required
              autoComplete="off"
              onFocus={handleFocus}
            />
            
            <TextField
              name="direccion"
              label="Dirección"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.direccion}
              onChange={handleChange}
              required
              autoComplete="off"
              onFocus={handleFocus}
            />
            
            <TextField
              name="telefono"
              label="Teléfono"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.telefono}
              onChange={handleChange}
              required
              autoComplete="off"
              onFocus={handleFocus}
            />
            
            <TextField
              name="email"
              label="Email"
              fullWidth
              margin="normal"
              variant="outlined"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              onFocus={handleFocus}
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
              disabled={!formData.nombre || !formData.codigo || !formData.direccion || !formData.telefono || loading}
              ref={submitButtonRef}
            >
              {loading ? <CircularProgress size={24} /> : (editingSucursal ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Sucursales; 
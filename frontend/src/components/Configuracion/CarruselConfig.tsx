import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  CircularProgress,
  FormHelperText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon,
  PointOfSale as PointOfSaleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Interfaz para los slides del carrusel
interface CarouselSlide {
  id: number;
  title: string;
  content: string;
  bgColor: string;
  imageUrl: string;
  orden: number;
  activo: boolean;
}

// Crear una nueva interfaz para la información del panel derecho
interface InfoPanel {
  id?: number;
  title: string;
  content: string;
  notaImportante: string;
}

const CarruselConfig: React.FC = () => {
  // Estados para manejar los slides
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para el formulario de edición
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<CarouselSlide>({
    id: 0,
    title: '',
    content: '',
    bgColor: '#f0f0f0',
    imageUrl: '',
    orden: 0,
    activo: true
  });
  
  // Estado para el panel informativo
  const [infoPanel, setInfoPanel] = useState<InfoPanel>({
    title: 'Información importante',
    content: 'Bienvenido al sistema de servicios de nuestra empresa.',
    notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
  });
  
  // Estado para controlar la edición del panel informativo
  const [isEditingInfoPanel, setIsEditingInfoPanel] = useState<boolean>(false);
  
  // Para la vista previa
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);
  
  // Estados para manejar la subida de imágenes
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  
  // Obtener datos de autenticación
  const { user } = useAuth();
  
  // Cargar los slides del carrusel al iniciar
  useEffect(() => {
    loadSlides();
    loadInfoPanel();
  }, []);
  
  // Función para cargar los slides desde el backend
  const loadSlides = async () => {
    try {
      setLoading(true);
      console.log('Cargando slides desde la API...');
      
      const token = localStorage.getItem('token');
      
      // Obtener los slides del backend
      const response = await axios.get('/api/carousel/slides', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Respuesta de slides:', response.data);
      
      if (response.data && response.data.length > 0) {
        setSlides(response.data);
      } else {
        console.warn('No se encontraron slides');
        setSlides([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar los slides del carrusel:', err);
      setError('Error al cargar los datos. Intente nuevamente.');
      setLoading(false);
    }
  };
  
  // Función para cargar el panel informativo desde el backend
  const loadInfoPanel = async () => {
    try {
      console.log('Cargando panel informativo desde la API...');
      
      const token = localStorage.getItem('token');
      
      // Obtener el panel informativo del backend
      const response = await axios.get('/api/carousel/info-panel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Respuesta del panel informativo:', response.data);
      
      if (response.data) {
        setInfoPanel(response.data);
      } else {
        console.warn('No se encontró panel informativo');
      }
    } catch (err) {
      console.error('Error al cargar el panel informativo:', err);
      setError('Error al cargar la información del panel. Intente nuevamente.');
    }
  };
  
  // Función para guardar un slide (crear nuevo o actualizar existente)
  const handleSaveSlide = async () => {
    try {
      if (currentSlide.title.trim() === '' || currentSlide.content.trim() === '') {
        setError('El título y el contenido son obligatorios');
        return;
      }
      
      // Cerrar el diálogo
      setOpenDialog(false);
      
      // Mostrar indicador de carga
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (isEditing) {
        // Actualizar el slide existente
        console.log('Actualizando slide existente:', currentSlide);
        
        await axios.put(`/api/carousel/slides/${currentSlide.id}`, currentSlide, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Actualizar en el estado local
        setSlides(prevSlides => 
          prevSlides.map(slide => 
            slide.id === currentSlide.id ? currentSlide : slide
          )
        );
        setSuccess('Slide actualizado correctamente');
      } else {
        // Crear un nuevo slide
        console.log('Creando nuevo slide:', currentSlide);
        
        const response = await axios.post('/api/carousel/slides', currentSlide, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Añadir el nuevo slide a la lista
        const newSlide = response.data;
        setSlides(prevSlides => [...prevSlides, newSlide]);
        setSuccess('Nuevo slide creado correctamente');
      }
      
      // Finalizar la carga
      setLoading(false);
      
      // Reiniciar el formulario
      resetForm();
    } catch (err) {
      console.error('Error al guardar el slide:', err);
      setError('Error al guardar los datos. Intente nuevamente.');
      setLoading(false);
    }
  };
  
  // Función para guardar la información del panel
  const handleSaveInfoPanel = async () => {
    try {
      if (!infoPanel.title || !infoPanel.content || !infoPanel.notaImportante) {
        setError('Todos los campos del panel informativo son obligatorios');
        return;
      }
      
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      console.log('Guardando panel informativo:', infoPanel);
      
      // Enviar la actualización al backend
      const response = await axios.put('/api/carousel/info-panel', infoPanel, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInfoPanel(response.data);
      setSuccess('Información actualizada correctamente');
      setIsEditingInfoPanel(false);
      setLoading(false);
    } catch (err) {
      console.error('Error al actualizar panel informativo:', err);
      setError('Error al actualizar la información. Intente nuevamente.');
      setLoading(false);
    }
  };
  
  // Función para actualizar el panel informativo
  const handleInfoPanelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInfoPanel(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Función para eliminar un slide
  const handleDeleteSlide = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este slide?')) {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        
        console.log('Eliminando slide con ID:', id);
        
        // Eliminar el slide en el backend
        await axios.delete(`/api/carousel/slides/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Actualizar en el estado local
        setSlides(prevSlides => prevSlides.filter(slide => slide.id !== id));
        setSuccess('Slide eliminado correctamente');
        setLoading(false);
      } catch (err) {
        console.error('Error al eliminar el slide:', err);
        setError('Error al eliminar el slide. Intente nuevamente.');
        setLoading(false);
      }
    }
  };
  
  // Función para cambiar el orden de un slide
  const handleChangeOrder = async (id: number, direction: 'up' | 'down') => {
    try {
      const slideIndex = slides.findIndex(s => s.id === id);
      if (
        (direction === 'up' && slideIndex === 0) || 
        (direction === 'down' && slideIndex === slides.length - 1)
      ) {
        return; // No se puede mover más arriba/abajo
      }
      
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      console.log(`Cambiando orden del slide ${id} hacia ${direction}`);
      
      // Enviar la solicitud de reordenamiento al backend
      await axios.post(`/api/carousel/slides/${id}/reorder`, 
        { direction }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Recargar todos los slides para tener el orden actualizado
      await loadSlides();
      
      setSuccess('Orden actualizado correctamente');
      setLoading(false);
    } catch (err) {
      console.error('Error al cambiar el orden:', err);
      setError('Error al cambiar el orden. Intente nuevamente.');
      setLoading(false);
    }
  };
  
  // Función para abrir el diálogo de edición
  const handleEditSlide = (slide: CarouselSlide) => {
    setCurrentSlide({ ...slide });
    setIsEditing(true);
    setOpenDialog(true);
  };
  
  // Función para abrir el diálogo de creación
  const handleAddSlide = () => {
    resetForm();
    setIsEditing(false);
    setOpenDialog(true);
  };
  
  // Función para reiniciar el formulario
  const resetForm = () => {
    setCurrentSlide({
      id: 0,
      title: '',
      content: '',
      bgColor: '#f0f0f0',
      imageUrl: '',
      orden: slides.length + 1,
      activo: true
    });
  };
  
  // Función para actualizar el slide actual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSlide(prev => ({ ...prev, [name]: value }));
  };
  
  // Función para ver la vista previa del carrusel
  const handlePreview = () => {
    setPreviewSlideIndex(0);
  };
  
  // Avanzar en la vista previa
  const handleNextPreview = () => {
    setPreviewSlideIndex(prev => (prev + 1) % slides.length);
  };
  
  // Retroceder en la vista previa
  const handlePrevPreview = () => {
    setPreviewSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
  };
  
  // Manejar la subida de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setImageLoading(true);
      
      // Crear un objeto FormData para enviar la imagen
      const formData = new FormData();
      formData.append('image', file);
      
      // Subir la imagen al servidor
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/carousel/uploads', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Imagen subida correctamente:', response.data);
      
      // Actualizar el slide con la URL de la imagen
      setCurrentSlide(prev => ({
        ...prev,
        imageUrl: response.data.url
      }));
      
      setImageLoading(false);
    } catch (err) {
      console.error('Error al subir la imagen:', err);
      setError('Error al subir la imagen. Intente nuevamente.');
      setImageLoading(false);
      
      // Si hay un error, mostrar una vista previa temporal
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentSlide(prev => ({
          ...prev,
          imageUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configuración del Carrusel y Panel Informativo
      </Typography>
      
      <Grid container spacing={3}>
        {/* Sección de configuración del Carrusel */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Slides del Carrusel
              </Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />} 
                  onClick={loadSlides}
                  sx={{ mr: 1 }}
                >
                  Actualizar
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddSlide}
                >
                  Nuevo Slide
                </Button>
              </Box>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Orden</TableCell>
                      <TableCell>Imagen</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Contenido</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slides.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No hay slides configurados. Haga clic en "Nuevo Slide" para añadir uno.
                        </TableCell>
                      </TableRow>
                    ) : (
                      slides.map((slide) => (
                        <TableRow key={slide.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {slide.orden}
                              <Box>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleChangeOrder(slide.id, 'up')}
                                  disabled={slide.orden === 1}
                                >
                                  <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleChangeOrder(slide.id, 'down')}
                                  disabled={slide.orden === slides.length}
                                >
                                  <ArrowDownwardIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {slide.imageUrl ? (
                              <Box 
                                component="img"
                                src={slide.imageUrl}
                                alt={slide.title}
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  objectFit: 'cover',
                                  borderRadius: 1
                                }}
                              />
                            ) : (
                              <Box 
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  bgcolor: slide.bgColor,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }} 
                              >
                                <ImageIcon fontSize="small" />
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>{slide.title}</TableCell>
                          <TableCell>{slide.content}</TableCell>
                          <TableCell>
                            {slide.activo ? 'Activo' : 'Inactivo'}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleEditSlide(slide)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteSlide(slide.id)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        
        {/* Sección de configuración del Panel Informativo */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Panel Informativo
              </Typography>
              {isEditingInfoPanel ? (
                <Box>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    onClick={() => setIsEditingInfoPanel(false)}
                    sx={{ mr: 1 }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSaveInfoPanel}
                  >
                    Guardar
                  </Button>
                </Box>
              ) : (
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />} 
                  onClick={() => setIsEditingInfoPanel(true)}
                >
                  Editar
                </Button>
              )}
            </Box>
            
            {isEditingInfoPanel ? (
              <Box>
                <TextField
                  fullWidth
                  label="Título"
                  name="title"
                  value={infoPanel.title}
                  onChange={handleInfoPanelChange}
                  margin="normal"
                  required
                  error={!infoPanel.title}
                  helperText={!infoPanel.title ? 'El título es obligatorio' : ''}
                />
                
                <TextField
                  fullWidth
                  label="Contenido principal"
                  name="content"
                  value={infoPanel.content}
                  onChange={handleInfoPanelChange}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                  error={!infoPanel.content}
                  helperText={!infoPanel.content ? 'El contenido es obligatorio' : ''}
                />
                
                <TextField
                  fullWidth
                  label="Nota importante"
                  name="notaImportante"
                  value={infoPanel.notaImportante}
                  onChange={handleInfoPanelChange}
                  margin="normal"
                  required
                  error={!infoPanel.notaImportante}
                  helperText={!infoPanel.notaImportante ? 'La nota importante es obligatoria' : ''}
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom>{infoPanel.title}</Typography>
                
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    minHeight: '30vh', 
                    fontSize: '1.1rem',
                    overflow: 'auto'
                  }}
                >
                  {infoPanel.content}
                </Typography>
                
                <Typography variant="body2" color="error.main" paragraph>
                  {infoPanel.notaImportante}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Vista previa */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vista previa
        </Typography>
        
        {slides.length === 0 ? (
          <Alert severity="info">
            No hay slides para mostrar en la vista previa.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {/* Operaciones de Caja (columna izquierda) */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <PointOfSaleIcon fontSize="large" color="primary" />
                  </Box>
                  <Typography variant="h5" component="div" align="center">
                    Operaciones de Caja
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Registrar ingresos, egresos y movimientos
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body1" paragraph>
                      Desde aquí podrás:
                    </Typography>
                    <ul>
                      <li>Registrar ingresos de efectivo</li>
                      <li>Procesar pagos de servicios</li>
                      <li>Realizar cierres de caja</li>
                      <li>Consultar movimientos</li>
                    </ul>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Acceder
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            {/* Carrusel (columna central) */}
            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'relative', height: 375, margin: 0, padding: 0 }}>
                {/* Fondo del carrusel */}
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: slides[previewSlideIndex].bgColor,
                    textAlign: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {/* Imagen del carrusel */}
                  {slides[previewSlideIndex].imageUrl ? (
                    <Box
                      component="img"
                      src={slides[previewSlideIndex].imageUrl}
                      alt={slides[previewSlideIndex].title}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        margin: 0,
                        padding: 0
                      }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 60, opacity: 0.5 }} />
                    </Box>
                  )}
                </Paper>
                
                {/* Botones de navegación */}
                <IconButton 
                  onClick={handlePrevPreview} 
                  size="small"
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                >
                  <ArrowUpwardIcon style={{ transform: 'rotate(-90deg)' }} />
                </IconButton>
                
                <IconButton 
                  onClick={handleNextPreview} 
                  size="small"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                >
                  <ArrowUpwardIcon style={{ transform: 'rotate(90deg)' }} />
                </IconButton>
                
                {/* Indicadores */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    left: 0, 
                    right: 0, 
                    display: 'flex', 
                    justifyContent: 'center',
                    zIndex: 2
                  }}
                >
                  {slides.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        mx: 0.5,
                        bgcolor: index === previewSlideIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setPreviewSlideIndex(index)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            
            {/* Panel informativo (columna derecha) */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="div" align="center" gutterBottom>
                    {infoPanel.title}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    paragraph 
                    sx={{ 
                      minHeight: '30vh', 
                      fontSize: '1.1rem',
                      overflow: 'auto'
                    }}
                  >
                    {infoPanel.content}
                  </Typography>

                  <Typography variant="body1" paragraph sx={{ color: 'error.main' }}>
                    {infoPanel.notaImportante}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      {/* Diálogo para añadir/editar slide */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Editar Slide' : 'Nuevo Slide'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Título"
              name="title"
              value={currentSlide.title}
              onChange={handleInputChange}
              margin="normal"
              required
              error={currentSlide.title.trim() === ''}
              helperText={currentSlide.title.trim() === '' ? 'El título es obligatorio' : ''}
            />
            
            <TextField
              fullWidth
              label="Contenido"
              name="content"
              value={currentSlide.content}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
              required
              error={currentSlide.content.trim() === ''}
              helperText={currentSlide.content.trim() === '' ? 'El contenido es obligatorio' : ''}
            />
            
            <TextField
              fullWidth
              label="Color de fondo (código hexadecimal)"
              name="bgColor"
              value={currentSlide.bgColor}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <Box 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: currentSlide.bgColor,
                      borderRadius: 1,
                      border: '1px solid rgba(0,0,0,0.1)',
                      mr: 1
                    }} 
                  />
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                disabled={imageLoading}
              >
                {imageLoading ? 'Subiendo...' : 'Subir Imagen'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                  disabled={imageLoading}
                />
              </Button>
              
              {imageLoading && (
                <CircularProgress size={24} sx={{ ml: 2 }} />
              )}
              
              {currentSlide.imageUrl && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Box
                    component="img"
                    src={currentSlide.imageUrl}
                    alt="Vista previa"
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      mr: 1
                    }}
                  />
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setCurrentSlide(prev => ({ ...prev, imageUrl: '' }))}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Vista previa
            </Typography>
            
            <Box 
              sx={{ 
                position: 'relative',
                height: 250,
                bgcolor: currentSlide.bgColor, 
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              {currentSlide.imageUrl ? (
                <Box
                  component="img"
                  src={currentSlide.imageUrl}
                  alt="Vista previa"
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    margin: 0,
                    padding: 0
                  }}
                />
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    bgcolor: currentSlide.bgColor
                  }}
                >
                  <ImageIcon sx={{ fontSize: 60, opacity: 0.5 }} />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveSlide} 
            variant="contained" 
            color="primary"
            disabled={currentSlide.title.trim() === '' || currentSlide.content.trim() === '' || imageLoading}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notificaciones */}
      <Snackbar 
        open={success !== null} 
        autoHideDuration={4000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={error !== null && !loading} 
        autoHideDuration={4000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CarruselConfig; 
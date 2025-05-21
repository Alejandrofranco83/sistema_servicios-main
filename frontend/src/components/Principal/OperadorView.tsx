import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Slide,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  ArrowForward as ArrowForwardIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Info as InfoIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Interfaces para los datos del carrusel y panel informativo
interface CarouselSlide {
  id: number;
  title: string;
  content: string;
  bgColor: string;
  imageUrl?: string;
  orden: number;
  activo: boolean;
}

interface InfoPanel {
  id: number;
  title: string;
  content: string;
  notaImportante: string;
}

interface OperadorViewProps {
  username: string;
}

const OperadorView: React.FC<OperadorViewProps> = ({ username }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [infoPanel, setInfoPanel] = useState<InfoPanel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [slideIn, setSlideIn] = useState(true);
  const [hoverCard, setHoverCard] = useState<string | null>(null);

  // Cargar los datos desde la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Obteniendo datos del carrusel y panel informativo...');
        
        // Obtener slides activos del carrusel
        const slidesResponse = await axios.get('/api/carousel/slides/active');
        console.log('Respuesta de slides:', slidesResponse.data);
        
        if (slidesResponse.data && slidesResponse.data.length > 0) {
          setSlides(slidesResponse.data);
        } else {
          console.warn('No se encontraron slides, usando datos de respaldo');
          // Datos de respaldo solo si no hay slides en la BD
          setSlides([
            {
              id: 1,
              title: 'Promociones especiales',
              content: 'Aproveche nuestras promociones del mes',
              bgColor: '#bbdefb',
              orden: 1,
              activo: true
            }
          ]);
        }
        
        // Obtener información del panel
        const infoPanelResponse = await axios.get('/api/carousel/info-panel');
        console.log('Respuesta del panel informativo:', infoPanelResponse.data);
        
        if (infoPanelResponse.data) {
          setInfoPanel(infoPanelResponse.data);
        } else {
          console.warn('No se encontró información del panel, usando datos de respaldo');
          // Datos de respaldo solo si no hay panel en la BD
          setInfoPanel({
            id: 1,
            title: 'Información importante',
            content: 'Bienvenido al sistema de servicios de nuestra empresa.',
            notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos desde el servidor');
        setLoading(false);
        
        // Cargar datos de respaldo en caso de error
        setSlides([
          {
            id: 1,
            title: 'Promociones especiales',
            content: 'Aproveche nuestras promociones del mes',
            bgColor: '#bbdefb',
            orden: 1,
            activo: true
          }
        ]);
        
        setInfoPanel({
          id: 1,
          title: 'Información importante',
          content: 'Bienvenido al sistema de servicios de nuestra empresa.',
          notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
        });
      }
    };
    
    fetchData();
  }, []);

  const maxSteps = slides.length;

  // Efecto para el cambio automático de imágenes cada 6 segundos
  useEffect(() => {
    if (slides.length <= 1) return; // No activar el temporizador si solo hay una o ninguna diapositiva
    
    const timer = setInterval(() => {
      // Usamos siempre la dirección left para el cambio automático
      setSlideDirection('left');
      setSlideIn(false);
      
      setTimeout(() => {
        setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
        setSlideIn(true);
      }, 300);
    }, 6000); // 6 segundos = 6000 ms
    
    // Limpiar el temporizador cuando el componente se desmonte o cuando activeStep cambie
    return () => {
      clearInterval(timer);
    };
  }, [activeStep, slides.length, maxSteps]); // Dependencias: activeStep, slides.length y maxSteps

  const handleNext = () => {
    setSlideDirection('left');
    setSlideIn(false);
    
    // Esperar a que termine la animación de salida antes de cambiar la diapositiva
    setTimeout(() => {
      setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
      setSlideIn(true);
    }, 300); // Este tiempo debe ser menor que la duración de la transición
  };

  const handleBack = () => {
    setSlideDirection('right');
    setSlideIn(false);
    
    // Esperar a que termine la animación de salida antes de cambiar la diapositiva
    setTimeout(() => {
      setActiveStep((prevActiveStep) => (prevActiveStep - 1 + maxSteps) % maxSteps);
      setSlideIn(true);
    }, 300); // Este tiempo debe ser menor que la duración de la transición
  };

  // Funciones auxiliares para formatear montos
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-PY', {
      maximumFractionDigits: 0
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Cargando panel de control...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
      <Box sx={{ 
        mb: 4, 
        p: 2, 
        borderRadius: 2, 
        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        color: 'white',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Bienvenido, {username}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Panel de operaciones del sistema de servicios
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Columna izquierda: Operaciones de Caja */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 4,
              boxShadow: hoverCard === 'caja' 
                ? '0 10px 30px rgba(0, 0, 0, 0.2)' 
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              transform: hoverCard === 'caja' ? 'translateY(-8px)' : 'none',
              overflow: 'hidden',
              position: 'relative'
            }}
            onMouseEnter={() => setHoverCard('caja')}
            onMouseLeave={() => setHoverCard(null)}
          >
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '8px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            />
            <CardContent sx={{ flexGrow: 1, pt: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2,
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '50%',
                width: 70,
                height: 70,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <PointOfSaleIcon fontSize="large" color="primary" sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h5" component="div" align="center" fontWeight="bold" gutterBottom>
                Operaciones de Caja
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Registrar ingresos, egresos y movimientos
              </Typography>
              
              <Box sx={{ mt: 3, bgcolor: alpha(theme.palette.background.paper, 0.5), p: 2, borderRadius: 2 }}>
                <Typography variant="body1" fontWeight="medium" paragraph>
                  Desde aquí podrás:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                  {['Registrar ingresos de efectivo', 'Procesar pagos de servicios', 'Realizar cierres de caja', 'Consultar movimientos'].map((item, index) => (
                    <Box component="li" key={index} sx={{ 
                      mb: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        mr: 1
                      }
                    }}>
                      <Typography variant="body2">
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
            <CardActions sx={{ p: 2 }}>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/cajas')}
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  borderRadius: 8,
                  py: 1.2,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.25)',
                  },
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Acceder
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Columna central: Carrusel de imágenes simplificado */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 4,
              boxShadow: hoverCard === 'novedades' 
                ? '0 10px 30px rgba(0, 0, 0, 0.2)' 
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.3s',
              overflow: 'hidden',
              position: 'relative'
            }}
            onMouseEnter={() => setHoverCard('novedades')}
            onMouseLeave={() => setHoverCard(null)}
          >
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '8px',
                background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.info.main})`,
              }}
            />
            <CardContent sx={{ pt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <NotificationsIcon color="secondary" />
                <Typography variant="h5" component="div" align="center" fontWeight="bold" gutterBottom>
                  Resumen Financiero
                </Typography>
              </Box>
              
              {slides.length > 0 ? (
                <Box sx={{ position: 'relative', height: 375, overflow: 'hidden', borderRadius: 3 }}>
                  {/* Paper como contenedor base del carrusel */}
                  <Paper
                    elevation={0}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: alpha('#000', 0.03),
                      overflow: 'hidden',
                      padding: 0,
                      borderRadius: 3
                    }}
                  >
                    {/* Efecto de slide para la transición */}
                    <Slide direction={slideDirection} in={slideIn} timeout={500}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        {/* Contenido con Fade para suavizar la transición */}
                        <Fade in={slideIn} timeout={{ enter: 500, exit: 200 }}>
                          <Box sx={{ width: '100%', height: '100%', p: 2 }}>
                            {slides[activeStep].imageUrl ? (
                              <Box
                                component="img"
                                src={slides[activeStep].imageUrl}
                                alt={slides[activeStep].title}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  margin: 0,
                                  padding: 0,
                                  borderRadius: 3
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  height: '100%',
                                  p: 3
                                }}
                              >
                                <Box 
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">Hoy</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.dark">366.000.000</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">Martes</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="text.disabled">-</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">Miércoles</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.dark">12.000.000</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">Jueves</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.dark">150.000.000</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">Viernes</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.dark">245.000.000</Typography>
                                  </Box>
                                  <Box 
                                    sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      mt: 1,
                                      pt: 2,
                                      borderTop: `2px dotted ${alpha(theme.palette.divider, 0.5)}`
                                    }}
                                  >
                                    <Typography variant="h6" color="info.main" fontWeight="bold">Total</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="info.main">773.000.000</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Fade>
                      </Box>
                    </Slide>
                  </Paper>
                  
                  {/* Botones de navegación sobre la imagen */}
                  <IconButton 
                    onClick={handleBack} 
                    size="small"
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'white'
                      }
                    }}
                  >
                    <KeyboardArrowLeft />
                  </IconButton>
                  
                  <IconButton 
                    onClick={handleNext} 
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'white'
                      }
                    }}
                  >
                    <KeyboardArrowRight />
                  </IconButton>
                  
                  {/* Indicadores en la parte inferior */}
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
                          bgcolor: index === activeStep ? 'primary.main' : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, background-color 0.2s',
                          '&:hover': {
                            transform: 'scale(1.2)',
                            bgcolor: index === activeStep ? 'primary.main' : 'rgba(255, 255, 255, 0.9)',
                          }
                        }}
                        onClick={() => setActiveStep(index)}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" align="center">
                  No hay novedades para mostrar
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Columna derecha: Panel informativo */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 4,
              boxShadow: hoverCard === 'info' 
                ? '0 10px 30px rgba(0, 0, 0, 0.2)' 
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.3s',
              overflow: 'hidden',
              position: 'relative'
            }}
            onMouseEnter={() => setHoverCard('info')}
            onMouseLeave={() => setHoverCard(null)}
          >
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '8px',
                background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.primary.light})`,
              }}
            />
            <CardContent sx={{ pt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                <InfoIcon color="info" />
                <Typography variant="h5" component="div" align="center" fontWeight="bold">
                  {infoPanel?.title || 'Información importante'}
                </Typography>
              </Box>
              
              {/* Contenido principal aumentado en un 30% de altura */}
              <Box 
                sx={{ 
                  minHeight: '390px',
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              > 
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{
                    fontSize: '1.05rem',
                    lineHeight: 1.7
                  }}
                >
                  {infoPanel?.content || 'Bienvenido al sistema de servicios de nuestra empresa. Esta plataforma está diseñada para facilitar todas las operaciones relacionadas con el manejo de efectivo y pagos.'}
                </Typography>
                
                {/* Si no hay panel informativo específico, mostramos contenido por defecto */}
                {!infoPanel && (
                  <>
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.light, 0.1)
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                        Horario de atención:
                      </Box>
                      Lunes a Viernes: 07:00 - 17:00<br />
                      Sábados: 07:00 - 12:00
                    </Typography>

                    <Typography 
                      variant="body1" 
                      paragraph
                      sx={{ 
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.light, 0.1)
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                        Contacto de soporte:
                      </Box>
                      soporte@empresa.com<br />
                      Tel: (021) 555-123
                    </Typography>
                  </>
                )}
              </Box>

              {/* Nota importante */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: alpha(theme.palette.error.light, 0.1), 
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'error.main', 
                    fontWeight: 'medium', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1 
                  }}
                >
                  {infoPanel?.notaImportante || 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperadorView; 
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { Notificacion, notificacionService } from '../../services/notificacionService';
import { useAuth } from '../../contexts/AuthContext';

const NotificacionesPage: React.FC = () => {
  const [tabActual, setTabActual] = useState<number>(0);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Cargar las notificaciones cuando cambia la pestaña
  useEffect(() => {
    cargarNotificaciones();
  }, [tabActual]);

  // Cargar notificaciones según la pestaña seleccionada
  const cargarNotificaciones = async () => {
    setCargando(true);
    try {
      let notificacionesData: Notificacion[] = [];
      
      if (tabActual === 0) {
        // Todas las notificaciones
        notificacionesData = await notificacionService.obtenerMisNotificaciones();
      } else {
        // Solo las no leídas
        notificacionesData = await notificacionService.obtenerMisNotificacionesNoLeidas();
      }
      
      setNotificaciones(notificacionesData);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cambiar pestaña
  const cambiarTab = (_event: React.SyntheticEvent, nuevoValor: number) => {
    setTabActual(nuevoValor);
  };

  // Marcar notificación como leída
  const marcarComoLeida = async (id: number) => {
    try {
      await notificacionService.marcarComoLeida(id);
      // Actualizar la lista de notificaciones
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error(`Error al marcar notificación ${id} como leída:`, error);
    }
  };

  // Eliminar notificación
  const eliminarNotificacion = async (id: number) => {
    // Cualquier usuario puede eliminar sus propias notificaciones
    try {
      await notificacionService.eliminarNotificacion(id);
      // Actualizar la lista de notificaciones
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error(`Error al eliminar notificación ${id}:`, error);
    }
  };

  // Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionService.marcarTodasComoLeidas();
      // Recargar las notificaciones
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Obtener el icono según el tipo de notificación
  const obtenerIconoNotificacion = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningAmberOutlinedIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorOutlineOutlinedIcon sx={{ color: 'error.main' }} />;
      case 'info':
      default:
        return <InfoOutlinedIcon sx={{ color: 'info.main' }} />;
    }
  };

  // Formatear la fecha de la notificación
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch (error) {
      return '';
    }
  };

  // Abrir enlace de notificación
  const abrirEnlace = (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
    
    if (notificacion.url) {
      navigate(notificacion.url);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Notificaciones
      </Typography>
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabActual} onChange={cambiarTab}>
            <Tab label="Todas" />
            <Tab label="No leídas" />
          </Tabs>
          
          <Button 
            onClick={marcarTodasComoLeidas}
            color="primary"
            variant="text"
            size="small"
            sx={{ mr: 2 }}
          >
            Marcar todas como leídas
          </Button>
        </Box>
        
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notificaciones.length > 0 ? (
          <List>
            {notificaciones.map((notificacion, index) => (
              <React.Fragment key={notificacion.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  sx={{ 
                    py: 2,
                    borderLeft: 3, 
                    borderColor: !notificacion.leida ? 'primary.main' : 'transparent',
                    backgroundColor: !notificacion.leida ? 'action.hover' : 'inherit',
                    '&:hover': { backgroundColor: 'action.selected' },
                    cursor: notificacion.url ? 'pointer' : 'default'
                  }}
                  onClick={() => notificacion.url && abrirEnlace(notificacion)}
                >
                  <ListItemIcon>
                    {obtenerIconoNotificacion(notificacion.tipo)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ mr: 1 }}>
                          {notificacion.titulo}
                        </Typography>
                        {notificacion.modulo && (
                          <Chip 
                            label={notificacion.modulo} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mr: 1 }}
                          />
                        )}
                        {notificacion.accion && (
                          <Chip 
                            label={notificacion.accion} 
                            size="small" 
                            color="secondary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {notificacion.mensaje}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatearFecha(notificacion.fechaCreacion)}
                          {notificacion.leida && notificacion.fechaLectura && (
                            <> · Leída: {formatearFecha(notificacion.fechaLectura)}</>
                          )}
                        </Typography>
                      </>
                    }
                  />
                  
                  <Box>
                    {!notificacion.leida && (
                      <Button 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoLeida(notificacion.id);
                        }}
                      >
                        Marcar como leída
                      </Button>
                    )}
                    
                    {hasPermission('eliminar_notificaciones') && (
                      <Tooltip title="Eliminar notificación">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNotificacion(notificacion.id);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {tabActual === 0 
                ? 'No tienes notificaciones' 
                : 'No tienes notificaciones sin leer'
              }
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificacionesPage; 
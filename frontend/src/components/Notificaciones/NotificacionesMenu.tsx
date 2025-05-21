import React, { useState, useEffect, useRef } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Button,
  Box,
  CircularProgress,
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Notificacion, notificacionService } from '../../services/notificacionService';

const NotificacionesMenu: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cantidadNoLeidas, setCantidadNoLeidas] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<boolean>(false);
  const [datosInicializados, setDatosInicializados] = useState<boolean>(false);
  const abierto = Boolean(anchorEl);
  const navigate = useNavigate();
  
  // Referencia para controlar si el componente está montado
  const montado = useRef(false);

  // Cargar las notificaciones al montar el componente
  useEffect(() => {
    console.log('[MENU] useEffect: Montando NotificacionesMenu y iniciando carga inicial.');
    
    // Definir la función de limpieza PRIMERO
    const cleanup = () => {
      // LOG CLAVE: Ver cuándo se ejecuta esta limpieza
      console.log('[MENU] useEffect: Ejecutando limpieza (desmontando NotificacionesMenu)'); 
      montado.current = false;
      if (intervalo) {
         clearInterval(intervalo);
      }
    };
    
    // Establecer el flag a true DESPUÉS de definir la limpieza
    montado.current = true;

    // Cargar directamente el estado completo al inicio
    cargarNotificacionesCompleto();
    setDatosInicializados(true); // Marcar como inicializado
    
    // Configurar un intervalo para verificar nuevas notificaciones cada 20 segundos
    let intervalo: NodeJS.Timeout | null = null; // Declarar intervalo aquí
    intervalo = setInterval(() => {
      // Solo verificar si el componente sigue montado
      if (montado.current) { 
        console.log('[MENU] useEffect: Ejecutando verificación periódica de notificaciones');
        // Cargar estado completo periódicamente
        cargarNotificacionesCompleto();
      }
    }, 20000);
    
    // Devolver la función de limpieza
    return cleanup;
  }, []); // Dependencia vacía para que se ejecute solo una vez al montar

  // Función para cargar las notificaciones completamente desde cero
  const cargarNotificacionesCompleto = async () => {
    // Log inicial de la función
    console.log('[MENU] Ejecutando cargarNotificacionesCompleto...');
    
    if (!montado.current) {
      console.log('[MENU] Componente desmontado al inicio de cargarNotificacionesCompleto. Abortando.');
      return;
    }
    
    console.log('[MENU] Estableciendo cargando=true');
    setCargando(true);
    setErrorCarga(false);

    try {
      console.log('[MENU] Antes de await obtenerMisNotificacionesNoLeidas');
      // Obtener directamente las notificaciones no leídas
      const noLeidas = await notificacionService.obtenerMisNotificacionesNoLeidas();
      console.log('[MENU] Después de await. Notificaciones recibidas:', noLeidas?.length);

      // Verificar si el componente sigue montado DESPUÉS del await
      if (montado.current) {
        console.log('[MENU] Componente sigue montado después del await. Procediendo a actualizar estado.');
        
        console.log(`[MENU] Antes de setEstado - Cantidad: ${noLeidas?.length || 0}, Notificaciones: ${noLeidas?.length || 0} items`);
        
        // Actualizar AMBOS estados basándose en la lista recibida
        setNotificaciones(noLeidas || []);
        setCantidadNoLeidas(noLeidas?.length || 0);
        
        console.log(`[MENU] Después de setEstado - Cantidad: ${noLeidas?.length || 0}, Notificaciones: ${noLeidas?.length || 0} items`);
        if (noLeidas && noLeidas.length > 0) {
           console.log('[MENU] Primera notificación tras actualizar estado:', JSON.stringify(noLeidas[0]));
        }
      } else {
        console.log('[MENU] Componente desmontado DESPUÉS del await. No se actualiza el estado.');
      }
    } catch (error) {
      console.error('[MENU] Error en carga completa de notificaciones:', error);
      if (montado.current) {
        console.log('[MENU] Error capturado. Reseteando estado.');
        // Resetear en caso de error
        setNotificaciones([]);
        setCantidadNoLeidas(0);
        setErrorCarga(true);
      } else {
         console.log('[MENU] Error capturado, pero componente desmontado.');
      }
    } finally {
      // Verificar si sigue montado antes del último setCargando
      if (montado.current) {
        console.log(`[MENU] Finally block. Estado antes de setCargando(false): Cantidad=${cantidadNoLeidas}, Notificaciones=${notificaciones.length}`);
        console.log('[MENU] Estableciendo cargando=false');
        setCargando(false);
      } else {
        console.log('[MENU] Finally block. Componente desmontado. No se establece cargando=false.');
      }
    }
  };

  // Abrir el menú de notificaciones
  const abrirMenu = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Botón de notificaciones clickeado');
    
    // Abrir el menú inmediatamente
    setAnchorEl(event.currentTarget);
    
    // Iniciar la carga de notificaciones sin esperar
    cargarNotificacionesCompleto();
  };

  // Cerrar el menú de notificaciones
  const cerrarMenu = () => {
    setAnchorEl(null);
  };

  // Marcar todas las notificaciones como leídas
  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionService.marcarTodasComoLeidas();
      // Actualizar UI inmediatamente
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setCantidadNoLeidas(0);
      
      // Cerrar menú
      cerrarMenu();
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
    }
  };

  // Manejar el clic en una notificación
  const manejarClicNotificacion = async (notificacion: Notificacion) => {
    try {
      // Marcar como leída
      await notificacionService.marcarComoLeida(notificacion.id);
      
      // Actualizar la UI
      setNotificaciones(prev => 
        prev.map(n => n.id === notificacion.id ? { ...n, leida: true } : n)
      );
      setCantidadNoLeidas(prev => Math.max(0, prev - 1));
      
      // Cerrar el menú
      cerrarMenu();
      
      // Navegar a la URL si existe
      if (notificacion.url) {
        navigate(notificacion.url);
      }
    } catch (error) {
      console.error('Error al procesar clic en notificación:', error);
    }
  };

  // Ir a la página de notificaciones
  const irAHistorialNotificaciones = () => {
    // Cerrar el menú antes de navegar
    cerrarMenu();
    
    // Navegar a la página de notificaciones con un pequeño retraso
    // para evitar problemas de navegación
    setTimeout(() => {
      console.log('Navegando a /notificaciones');
      navigate('/notificaciones');
    }, 100);
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

  // Formatear la fecha para mostrarla en un formato legible
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha desconocida';
    }
  };

  // Renderizar el menú de notificaciones

  // Log final antes de renderizar
  console.log('[MENU] Renderizando NotificacionesMenu:');
  console.log(`[MENU]   - Cargando: ${cargando}`);
  console.log(`[MENU]   - Error Carga: ${errorCarga}`);
  console.log(`[MENU]   - Cantidad No Leídas (estado): ${cantidadNoLeidas}`);
  console.log(`[MENU]   - Notificaciones (estado): ${notificaciones.length} items`);
  if (notificaciones.length > 0) {
    console.log('[MENU]     Primera notificación en estado:', JSON.stringify(notificaciones[0]));
  }

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          color="inherit"
          onClick={abrirMenu}
          aria-haspopup="true"
          aria-expanded={abierto ? 'true' : undefined}
          data-testid="notificaciones-boton"
        >
          <Badge badgeContent={cantidadNoLeidas} color="error" invisible={cantidadNoLeidas === 0}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={abierto}
        onClose={cerrarMenu}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 350,
            maxWidth: 400,
            maxHeight: 'calc(100vh - 100px)',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Notificaciones
          </Typography>
          {cantidadNoLeidas > 0 && (
            <Button 
              size="small" 
              onClick={marcarTodasComoLeidas}
              sx={{ fontWeight: 'bold', ml: 2 }}
            >
              TODAS COMO LEÍDAS
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : errorCarga ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">
              Error al cargar notificaciones
            </Typography>
            <Button 
              size="small" 
              onClick={() => cargarNotificacionesCompleto()}
              sx={{ mt: 1 }}
            >
              Reintentar
            </Button>
          </Box>
        ) : notificaciones.length === 0 ? (
          <>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No tienes notificaciones nuevas
              </Typography>
              <Button 
                size="small" 
                onClick={() => cargarNotificacionesCompleto()}
                sx={{ mt: 2 }}
              >
                RECARGAR
              </Button>
            </Box>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
              <Button 
                size="small" 
                endIcon={<MoreHorizIcon />}
                onClick={irAHistorialNotificaciones}
              >
                VER HISTORIAL DE NOTIFICACIONES
              </Button>
            </Box>
          </>
        ) : (
          <>
            {notificaciones.map((notificacion) => (
              <MenuItem 
                key={notificacion.id} 
                onClick={() => manejarClicNotificacion(notificacion)}
                sx={{
                  borderLeft: 4,
                  borderColor: (theme) => {
                    switch (notificacion.tipo) {
                      case 'success': return theme.palette.success.main;
                      case 'warning': return theme.palette.warning.main;
                      case 'error': return theme.palette.error.main;
                      case 'info':
                      default: return theme.palette.info.main;
                    }
                  },
                  backgroundColor: notificacion.leida ? 'transparent' : (theme) => 
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                }}
              >
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <Box sx={{ mr: 1.5, pt: 0.5 }}>
                    {obtenerIconoNotificacion(notificacion.tipo)}
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="subtitle2" noWrap>
                      {notificacion.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {notificacion.mensaje}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatearFecha(notificacion.fechaCreacion)}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            
            <Divider />
            
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
              <Button 
                size="small" 
                endIcon={<MoreHorizIcon />}
                onClick={irAHistorialNotificaciones}
              >
                VER HISTORIAL DE NOTIFICACIONES
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificacionesMenu; 
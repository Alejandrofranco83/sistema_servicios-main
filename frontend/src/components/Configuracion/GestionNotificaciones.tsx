import React, { useState, useEffect } from 'react';
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
  SelectChangeEvent,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Dialog
} from '@mui/material';
import { 
  DeleteOutline, 
  Visibility, 
  Notifications as NotificationsIcon,
  SendOutlined,
  VisibilityOff,
  Edit
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { notificacionService, Notificacion } from '../../services/notificacionService';

// Definición de la interfaz para el estado de las pestañas
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Componente para mostrar contenido de pestañas
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ paddingTop: '20px' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

const GestionNotificaciones: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState<Array<{ id: number; nombre: string }>>([]);
  const [usuarios, setUsuarios] = useState<Array<{ id: number; username: string }>>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });
  
  // Formulario
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'info',
    url: '',
    modulo: '',
    esGlobal: false,
    accion: '',
    entidadTipo: '',
    entidadId: '',
    paraUsuario: false,
    usuarioId: 0,
    paraRol: false,
    rolId: 0
  });

  // Dentro del componente, añadir estados para edición
  const [editandoNotificacion, setEditandoNotificacion] = useState<Notificacion | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  // Cargar roles y usuarios para el formulario
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Primero verificamos si tenemos permisos para notificaciones
        try {
          const tienePermiso = await notificacionService.verificarApi();
          if (!tienePermiso) {
            console.warn('El usuario no tiene permisos para crear notificaciones');
            setMessage({ text: 'No tiene permisos para gestionar notificaciones', type: 'error' });
            setRoles([]);
            setUsuarios([]);
            return; // Detenemos la ejecución si no tiene permisos
          }
          
          // Obtener roles desde la API con manejo de errores específico
          try {
            const rolesResponse = await fetch('/api/roles', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (rolesResponse.ok) {
              const rolesData = await rolesResponse.json();
              setRoles(Array.isArray(rolesData) ? rolesData : []);
            } else {
              console.error('Error al obtener roles:', rolesResponse.status);
              setRoles([]);
            }
          } catch (rolesError) {
            console.error('Error al obtener roles:', rolesError);
            setRoles([]);
          }
          
          // Obtener usuarios desde la API con manejo de errores específico
          try {
            const usuariosResponse = await fetch('/api/usuarios', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (usuariosResponse.ok) {
              const usuariosData = await usuariosResponse.json();
              setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
            } else {
              console.error('Error al obtener usuarios:', usuariosResponse.status);
              setUsuarios([]);
            }
          } catch (usuariosError) {
            console.error('Error al obtener usuarios:', usuariosError);
            setUsuarios([]);
          }
          
          // Cargar notificaciones existentes
          await cargarNotificaciones();
        } catch (permisosError) {
          console.error('Error al verificar permisos:', permisosError);
          setMessage({ text: 'Error al verificar permisos', type: 'error' });
          setRoles([]);
          setUsuarios([]);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setMessage({ text: 'Error al cargar datos iniciales', type: 'error' });
        // En caso de error, inicializar como arrays vacíos
        setRoles([]);
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función para cargar notificaciones
  const cargarNotificaciones = async () => {
    try {
      setLoadingNotificaciones(true);
      const notificacionesData = await notificacionService.obtenerMisNotificaciones();
      console.log('Notificaciones recibidas del backend:', notificacionesData);
      
      // Verificar el formato de cada fecha
      if (notificacionesData && notificacionesData.length > 0) {
        notificacionesData.forEach((notif, index) => {
          console.log(`Notificación ${index + 1} - ID: ${notif.id}, Fecha:`, {
            fechaCreacion: notif.fechaCreacion,
            fechaCreacionISO: (notif as any).fechaCreacionISO,
            tipo: typeof notif.fechaCreacion
          });
        });
      }
      
      setNotificaciones(notificacionesData);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setMessage({ text: 'Error al cargar notificaciones', type: 'error' });
    } finally {
      setLoadingNotificaciones(false);
    }
  };

  // Cambiar pestaña
  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      cargarNotificaciones();
    }
  };

  // Manejar cambios en los campos de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en los Select
  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en los checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Si estamos marcando esGlobal, debemos desmarcar las otras opciones
    if (name === 'esGlobal' && checked) {
      setFormData({
        ...formData,
        [name]: checked,
        paraUsuario: false,
        paraRol: false
      });
    } else if ((name === 'paraUsuario' || name === 'paraRol') && checked) {
      // Si estamos marcando paraUsuario o paraRol, debemos desmarcar esGlobal
      setFormData({
        ...formData,
        [name]: checked,
        esGlobal: false
      });
    } else {
      setFormData({
        ...formData,
        [name]: checked
      });
    }
  };

  // Formatear fecha - Versión final optimizada
  const formatearFecha = (fecha: string | Date | null | undefined, fechaISO?: string) => {
    // Si tenemos un valor ISO específico, siempre usarlo primero
    if (fechaISO) {
      try {
        const fechaObj = new Date(fechaISO);
        if (!isNaN(fechaObj.getTime())) {
          return format(fechaObj, 'dd MMM yyyy, HH:mm', { locale: es });
        }
      } catch (error) {
        console.warn('Error al parsear fechaISO:', fechaISO, error);
      }
    }
    
    // Si no hay fecha
    if (!fecha) {
      return 'Fecha no disponible';
    }
    
    try {
      // Intentar parsear directamente
      const fechaObj = new Date(fecha as any);
      if (!isNaN(fechaObj.getTime())) {
        return format(fechaObj, 'dd MMM yyyy, HH:mm', { locale: es });
      }
      
      // Si llegamos aquí, no pudimos parsear la fecha
      console.warn('No se pudo formatear la fecha:', fecha);
      return 'Fecha no disponible';
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha no disponible';
    }
  };

  // Obtener color según el tipo de notificación
  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };
  
  // Eliminar notificación
  const eliminarNotificacion = async (id: number) => {
    try {
      setLoading(true);
      await notificacionService.eliminarNotificacion(id);
      setMessage({ text: 'Notificación eliminada correctamente', type: 'success' });
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      setMessage({ text: 'Error al eliminar notificación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Verificar que los campos requeridos estén completos
      if (!formData.titulo || !formData.mensaje) {
        setMessage({ text: 'El título y el mensaje son obligatorios', type: 'error' });
        setLoading(false);
        return;
      }
      
      // Preparar la notificación base con los datos comunes
      const notificacionBase = {
        titulo: formData.titulo,
        mensaje: formData.mensaje,
        tipo: formData.tipo as 'info' | 'warning' | 'error' | 'success',
        url: formData.url || undefined,
        modulo: formData.modulo || undefined,
        entidadTipo: formData.entidadTipo || undefined,
        entidadId: formData.entidadId || undefined,
        accion: formData.accion || undefined
      };
      
      // Enviar según el tipo seleccionado
      let respuesta = null;
      
      if (formData.esGlobal) {
        // Enviar notificación global
        console.log('Enviando notificación global...');
        respuesta = await notificacionService.crearNotificacion({
          ...notificacionBase,
          esGlobal: true
        });
        setMessage({ text: 'Notificación global enviada correctamente', type: 'success' });
      } else if (formData.paraUsuario && formData.usuarioId) {
        // Enviar notificación a un usuario específico
        console.log('Enviando notificación a usuario específico...');
        if (formData.usuarioId === 0) {
          setMessage({ text: 'Debe seleccionar un usuario', type: 'error' });
          setLoading(false);
          return;
        }
        respuesta = await notificacionService.crearNotificacionParaUsuario(
          notificacionBase, 
          formData.usuarioId as number
        );
        setMessage({ text: 'Notificación enviada al usuario correctamente', type: 'success' });
      } else if (formData.paraRol && formData.rolId) {
        // Enviar notificación a un rol específico
        console.log('Enviando notificación a rol específico...');
        if (formData.rolId === 0) {
          setMessage({ text: 'Debe seleccionar un rol', type: 'error' });
          setLoading(false);
          return;
        }
        respuesta = await notificacionService.crearNotificacionParaRol(
          notificacionBase, 
          formData.rolId as number
        );
        setMessage({ text: 'Notificación enviada al rol correctamente', type: 'success' });
      } else {
        setMessage({ text: 'Debe seleccionar al menos un destino para la notificación', type: 'error' });
        setLoading(false);
        return;
      }
      
      // Si llegamos aquí, la operación fue exitosa
      if (respuesta) {
        console.log('Notificación enviada exitosamente:', respuesta);
        
        // Limpiar el formulario después de enviar exitosamente
        setFormData({
          ...formData,
          titulo: '',
          mensaje: '',
          tipo: 'info',
          url: '',
          modulo: '',
          accion: '',
          entidadTipo: '',
          entidadId: '',
        });
        
        // Recargar la lista de notificaciones
        await cargarNotificaciones();
      }
    } catch (error: any) {
      console.error('Error al enviar notificación:', error);
      let mensajeError = 'Error al enviar la notificación';
      
      // Extraer mensaje más detallado si está disponible
      if (error.response) {
        console.error('Detalles del error:', error.response.status, error.response.data);
        if (error.response.data && error.response.data.error) {
          mensajeError = error.response.data.error;
        }
      }
      
      setMessage({ text: mensajeError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cerrar el mensaje de alerta
  const handleCloseAlert = () => {
    // Para errores de permisos, no cerramos el mensaje automáticamente
    if (message.text === 'No tiene permisos para gestionar notificaciones') {
      return;
    }
    setMessage({ text: '', type: 'info' });
  };

  // Añadir función para abrir modal de edición
  const abrirModalEditar = (notificacion: Notificacion) => {
    setEditandoNotificacion(notificacion);
    setModalEditarAbierto(true);
    
    // Preparar el formulario con los datos de la notificación
    setFormData({
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo,
      url: notificacion.url || '',
      modulo: notificacion.modulo || '',
      esGlobal: notificacion.esGlobal || false,
      accion: notificacion.accion || '',
      entidadTipo: notificacion.entidadTipo || '',
      entidadId: notificacion.entidadId || '',
      paraUsuario: false,
      usuarioId: 0,
      paraRol: false,
      rolId: 0
    });
  };

  // Cerrar modal de edición
  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setEditandoNotificacion(null);
    
    // Limpiar el formulario
    setFormData({
      titulo: '',
      mensaje: '',
      tipo: 'info',
      url: '',
      modulo: '',
      esGlobal: false,
      accion: '',
      entidadTipo: '',
      entidadId: '',
      paraUsuario: false,
      usuarioId: 0,
      paraRol: false,
      rolId: 0
    });
  };

  // Función para actualizar la notificación
  const actualizarNotificacion = async () => {
    if (!editandoNotificacion) return;
    
    setLoading(true);
    try {
      // Preservamos los campos que no se deben modificar
      const notificacionActualizada = {
        id: editandoNotificacion.id,
        titulo: formData.titulo,
        mensaje: formData.mensaje,
        tipo: formData.tipo as 'info' | 'warning' | 'error' | 'success',
        url: formData.url || undefined,
        modulo: formData.modulo || undefined,
        esGlobal: formData.esGlobal,
        entidadTipo: formData.entidadTipo || undefined,
        entidadId: formData.entidadId || undefined,
        accion: formData.accion || undefined,
        // Preservamos los campos originales relacionados con fechas
        fechaCreacion: editandoNotificacion.fechaCreacion,
        leida: editandoNotificacion.leida,
        fechaLectura: editandoNotificacion.fechaLectura
      };
      
      console.log('Enviando actualización de notificación:', notificacionActualizada);
      
      // Llamar al servicio para actualizar
      await notificacionService.actualizarNotificacion(notificacionActualizada);
      
      setMessage({ text: 'Notificación actualizada correctamente', type: 'success' });
      cerrarModalEditar();
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      setMessage({ text: 'Error al actualizar la notificación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            Gestión de Notificaciones
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          aria-label="tabs de gestión de notificaciones"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Crear Notificación" id="simple-tab-0" aria-controls="simple-tabpanel-0" />
          <Tab label="Historial de Notificaciones" id="simple-tab-1" aria-controls="simple-tabpanel-1" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="URL (opcional)"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="/cajas"
                  helperText="Ruta a la que dirigir al hacer clic (ej: /cajas)"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Módulo (opcional)"
                  name="modulo"
                  value={formData.modulo}
                  onChange={handleInputChange}
                  placeholder="CAJA"
                  helperText="Módulo al que pertenece esta notificación"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Acción (opcional)"
                  name="accion"
                  value={formData.accion}
                  onChange={handleInputChange}
                  placeholder="APERTURA"
                  helperText="Acción relacionada con esta notificación"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tipo de entidad (opcional)"
                  name="entidadTipo"
                  value={formData.entidadTipo}
                  onChange={handleInputChange}
                  placeholder="CAJA"
                  helperText="Tipo de entidad relacionada (ej: CAJA, USUARIO)"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID de entidad (opcional)"
                  name="entidadId"
                  value={formData.entidadId}
                  onChange={handleInputChange}
                  placeholder="123"
                  helperText="ID de la entidad relacionada"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Destinatarios
                </Typography>
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
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.paraUsuario}
                      onChange={handleCheckboxChange}
                      name="paraUsuario"
                      disabled={formData.esGlobal}
                    />
                  }
                  label="Enviar a un usuario específico"
                />
                {formData.paraUsuario && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="usuario-label">Usuario</InputLabel>
                    <Select
                      labelId="usuario-label"
                      name="usuarioId"
                      value={formData.usuarioId}
                      onChange={handleSelectChange}
                      label="Usuario"
                      disabled={formData.esGlobal}
                    >
                      <MenuItem value={0}>Seleccionar usuario</MenuItem>
                      {usuarios.map(usuario => (
                        <MenuItem key={usuario.id} value={usuario.id}>
                          {usuario.username}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.paraRol}
                      onChange={handleCheckboxChange}
                      name="paraRol"
                      disabled={formData.esGlobal}
                    />
                  }
                  label="Enviar a todos los usuarios con un rol"
                />
                {formData.paraRol && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="rol-label">Rol</InputLabel>
                    <Select
                      labelId="rol-label"
                      name="rolId"
                      value={formData.rolId}
                      onChange={handleSelectChange}
                      label="Rol"
                      disabled={formData.esGlobal}
                    >
                      <MenuItem value={0}>Seleccionar rol</MenuItem>
                      {roles.map(rol => (
                        <MenuItem key={rol.id} value={rol.id}>
                          {rol.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || !formData.titulo || !formData.mensaje}
                  startIcon={loading ? <CircularProgress size={20} /> : <SendOutlined />}
                >
                  {loading ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ position: 'relative' }}>
            {loadingNotificaciones && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {!loadingNotificaciones && notificaciones.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h6" color="text.secondary">
                  No hay notificaciones disponibles
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
                <Table aria-label="tabla de notificaciones">
                  <TableHead>
                    <TableRow>
                      <TableCell>Título</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Módulo</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notificaciones.map((notificacion) => (
                      <TableRow key={notificacion.id} hover>
                        <TableCell>{notificacion.titulo}</TableCell>
                        <TableCell>
                          <Chip 
                            label={notificacion.tipo.charAt(0).toUpperCase() + notificacion.tipo.slice(1)} 
                            color={obtenerColorTipo(notificacion.tipo) as "success" | "info" | "warning" | "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {notificacion.fechaCreacion 
                            ? formatearFecha(notificacion.fechaCreacion, (notificacion as any).fechaCreacionISO)
                            : "Fecha no disponible"}
                        </TableCell>
                        <TableCell>
                          {notificacion.leida ? (
                            <Chip 
                              icon={<VisibilityOff fontSize="small" />} 
                              label="Leída" 
                              color="default" 
                              size="small"
                            />
                          ) : (
                            <Chip 
                              icon={<Visibility fontSize="small" />} 
                              label="No leída" 
                              color="primary" 
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {notificacion.modulo ? (
                            <Chip label={notificacion.modulo} size="small" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Ver detalles">
                            <IconButton size="small" color="primary">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => abrirModalEditar(notificacion)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => eliminarNotificacion(notificacion.id)}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Modal de edición */}
      <Dialog 
        open={modalEditarAbierto} 
        onClose={cerrarModalEditar}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Editar Notificación
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" noValidate>
            <Grid container spacing={3}>
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
                  <InputLabel id="tipo-label-edit">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label-edit"
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="URL (opcional)"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="/cajas"
                  helperText="Ruta a la que dirigir al hacer clic (ej: /cajas)"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Módulo (opcional)"
                  name="modulo"
                  value={formData.modulo}
                  onChange={handleInputChange}
                  placeholder="CAJA"
                  helperText="Módulo al que pertenece esta notificación"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Acción (opcional)"
                  name="accion"
                  value={formData.accion}
                  onChange={handleInputChange}
                  placeholder="APERTURA"
                  helperText="Acción relacionada con esta notificación"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tipo de entidad (opcional)"
                  name="entidadTipo"
                  value={formData.entidadTipo}
                  onChange={handleInputChange}
                  placeholder="CAJA"
                  helperText="Tipo de entidad relacionada (ej: CAJA, USUARIO)"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID de entidad (opcional)"
                  name="entidadId"
                  value={formData.entidadId}
                  onChange={handleInputChange}
                  placeholder="123"
                  helperText="ID de la entidad relacionada"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={cerrarModalEditar}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={actualizarNotificacion}
                disabled={loading || !formData.titulo || !formData.mensaje}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>
      
      <Snackbar
        open={!!message.text}
        autoHideDuration={message.type === 'error' ? 10000 : 6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={message.type} 
          sx={{ 
            width: '100%',
            ...(message.type === 'error' && {
              bgcolor: 'error.dark',
              color: 'white',
              fontWeight: 'bold'
            })
          }}
          variant={message.type === 'error' ? 'filled' : 'standard'}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionNotificaciones; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Checkbox,
  FormControlLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import { rolService, Rol, Permiso } from '../../services/rolService';

interface RolFormData {
  nombre: string;
  descripcion: string;
  permisos: number[];
}

const initialFormData: RolFormData = {
  nombre: '',
  descripcion: '',
  permisos: [],
};

// Agrupar permisos por módulo
const agruparPermisosPorModulo = (permisos: Permiso[]) => {
  return permisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = [];
    }
    acc[permiso.modulo].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);
};

const Roles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<RolFormData>(initialFormData);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>({});
  const [openPermisoDialog, setOpenPermisoDialog] = useState(false);
  const [permisoFormData, setPermisoFormData] = useState({
    modulo: '',
    pantalla: '',
    descripcion: ''
  });
  const [pantallasDisponibles, setPantallasDisponibles] = useState<string[]>([]);
  const [moduloFilter, setModuloFilter] = useState<string>('');
  const [dialogModuloFilter, setDialogModuloFilter] = useState<string>('');
  const [permisosCount, setPermisosCount] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [showPermisosDialog, setShowPermisosDialog] = useState(false);

  // Definir módulos y pantallas predefinidos
  const modulosPredefinidos: Record<string, string[]> = {
    PRINCIPAL: ['VER'],
    PDV: ['CAJAS', 'CONTROL_CAJAS'],
    CAJA_MAYOR: ['BALANCE'],
    SALDOS_MONETARIOS: ['VER', 'EDITAR', 'AGREGAR'],
    RECURSOS_HUMANOS: ['PERSONAS'],
    CONFIGURACION: ['USUARIOS', 'ROLES', 'COTIZACIONES', 'SUCURSALES', 'MALETINES'],
    OPERACIONES: ['CAJAS']
  };

  // Asignar permisos básicos a roles que no tengan permisos
  const asignarPermisosBasicos = async () => {
    try {
      // Obtener todos los roles
      const todosLosRoles = await rolService.getRoles();
      
      // Encontrar roles sin permisos
      const rolesSinPermisos = todosLosRoles.filter(r => !r.permisos || r.permisos.length === 0);
      console.log('Roles sin permisos encontrados:', rolesSinPermisos.map(r => r.nombre));
      
      if (rolesSinPermisos.length === 0) {
        console.log('Todos los roles tienen permisos asignados');
        return;
      }
      
      // Buscar permiso PRINCIPAL/VER
      const permisoPrincipal = permisos.find(p => 
        p.modulo === 'PRINCIPAL' && p.pantalla === 'VER'
      );
      
      if (!permisoPrincipal) {
        console.error('No se encontró el permiso PRINCIPAL/VER, creándolo...');
        
        // Crear el permiso si no existe
        try {
          const nuevoPermiso = await rolService.createPermiso({
            modulo: 'PRINCIPAL',
            pantalla: 'VER',
            descripcion: 'Permiso para acceder a la pantalla principal'
          });
          
          console.log('Permiso PRINCIPAL/VER creado:', nuevoPermiso);
          
          // Actualizar la lista de permisos
          const permisosActualizados = await rolService.getPermisos();
          setPermisos(permisosActualizados);
          
          // Asignar este nuevo permiso a todos los roles sin permisos
          for (const rol of rolesSinPermisos) {
            console.log(`Asignando permiso básico al rol: ${rol.nombre}`);
            
            await rolService.updateRol(rol.id, {
              nombre: rol.nombre,
              descripcion: rol.descripcion || `Rol ${rol.nombre} con permisos básicos`,
              permisos: [nuevoPermiso]
            });
          }
          
          setSuccessMessage('Se han asignado permisos básicos a los roles sin permisos');
          await loadRoles();
        } catch (err) {
          console.error('Error al crear permiso:', err);
        }
      } else {
        console.log('Permiso PRINCIPAL/VER encontrado:', permisoPrincipal);
        
        // Asignar el permiso a todos los roles sin permisos
        for (const rol of rolesSinPermisos) {
          console.log(`Asignando permiso básico al rol: ${rol.nombre}`);
          
          await rolService.updateRol(rol.id, {
            nombre: rol.nombre,
            descripcion: rol.descripcion || `Rol ${rol.nombre} con permisos básicos`,
            permisos: [permisoPrincipal]
          });
        }
        
        setSuccessMessage('Se han asignado permisos básicos a los roles sin permisos');
        await loadRoles();
      }
    } catch (err) {
      console.error('Error al asignar permisos básicos:', err);
    }
  };

  // Carga inicial de roles y permisos
  useEffect(() => {
    const inicializarRoles = async () => {
      await loadRoles();
      await cargarPermisosPredefinidos();
      // Limpiar permisos obsoletos
      await limpiarPermisosObsoletos();
      // Buscar información del rol PRUEBA
      await buscarPrueba();
      // Asignar permisos requeridos al rol PRUEBA
      await asignarPermisosRequeridosAPrueba();
    };
    
    inicializarRoles();
  }, []);
  
  const buscarPrueba = async () => {
    // Buscar el rol PRUEBA y mostrar sus permisos
    const roles = await rolService.getRoles();
    const rolPrueba = roles.find(r => r.nombre === 'PRUEBA');
    
    if (rolPrueba) {
      console.log('%c === ROL PRUEBA ENCONTRADO ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;');
      console.log('ID:', rolPrueba.id);
      console.log('Nombre:', rolPrueba.nombre);
      console.log('Descripción:', rolPrueba.descripcion);
      
      if (rolPrueba.permisos && rolPrueba.permisos.length > 0) {
        console.log('%c === PERMISOS DEL ROL PRUEBA ===', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 2px;');
        console.table(rolPrueba.permisos.map(p => ({
          id: p.id,
          modulo: p.modulo,
          pantalla: p.pantalla,
          descripcion: p.descripcion || '-'
        })));
      } else {
        console.warn('El rol PRUEBA no tiene permisos asignados');
      }
    } else {
      console.warn('No se encontró el rol PRUEBA');
    }
  };

  // Cargar los permisos predefinidos si no existen en la base de datos
  const cargarPermisosPredefinidos = async () => {
    try {
      const permisosExistentes = await rolService.getPermisos();
      
      // Módulos válidos actuales
      const modulosValidos = Object.keys(modulosPredefinidos);
      
      // Eliminar permisos de módulos que ya no existen (como Clientes o Ventas)
      const permisosAEliminar = permisosExistentes.filter(p => !modulosValidos.includes(p.modulo));
      if (permisosAEliminar.length > 0) {
        console.log(`Eliminando ${permisosAEliminar.length} permisos de módulos obsoletos`);
        
        for (const permiso of permisosAEliminar) {
          try {
            await rolService.deletePermiso(permiso.id);
            console.log(`Permiso eliminado: ${permiso.modulo}/${permiso.pantalla}`);
          } catch (err) {
            console.error(`Error al eliminar permiso ${permiso.id}:`, err);
          }
        }
        
        // Obtener la lista actualizada de permisos
        const permisosActualizados = await rolService.getPermisos();
        setPermisos(permisosActualizados);
        return;
      }
      
      setPermisos(permisosExistentes);
      
      // Si no hay permisos, crear los predefinidos
      if (permisosExistentes.length === 0) {
        const permisosCreados = [];
        
        for (const modulo in modulosPredefinidos) {
          for (const pantalla of modulosPredefinidos[modulo]) {
            const permisoData = {
              modulo: modulo,
              pantalla: pantalla,
              descripcion: `Permiso para ${pantalla.toLowerCase()} en ${modulo.toLowerCase()}`
            };
            
            try {
              const nuevoPermiso = await rolService.createPermiso(permisoData);
              permisosCreados.push(nuevoPermiso);
            } catch (err) {
              console.error(`Error al crear el permiso ${modulo}/${pantalla}:`, err);
            }
          }
        }
        
        if (permisosCreados.length > 0) {
          setPermisos(permisosCreados);
        }
      }
    } catch (err) {
      console.error('Error al cargar permisos:', err);
    }
  };

  // Calcular conteo de permisos por módulo
  useEffect(() => {
    const conteo: Record<string, number> = {};
    
    // Inicializar conteo para todos los módulos predefinidos
    Object.keys(modulosPredefinidos).forEach(modulo => {
      conteo[modulo] = 0;
    });
    
    // Filtrar permisos para módulos predefinidos
    const permisosValidos = permisos.filter(p => 
      Object.keys(modulosPredefinidos).includes(p.modulo)
    );
    
    // Contar permisos solo para módulos predefinidos
    permisosValidos.forEach(permiso => {
      if (conteo[permiso.modulo] !== undefined) {
        conteo[permiso.modulo]++;
      }
    });
    
    setPermisosCount(conteo);
  }, [permisos, modulosPredefinidos]);

  // Actualizar pantallas disponibles cuando cambia el módulo
  useEffect(() => {
    if (permisoFormData.modulo) {
      // Obtener las pantallas existentes para el módulo seleccionado
      const pantallasExistentes = permisos
        .filter(p => p.modulo === permisoFormData.modulo)
        .map(p => p.pantalla);
      
      // Actualizar las pantallas disponibles
      setPantallasDisponibles(Array.from(new Set(pantallasExistentes)));
    } else {
      setPantallasDisponibles([]);
    }
  }, [permisoFormData.modulo, permisos]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolService.getRoles();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los roles');
      console.error('Error al cargar los roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setDialogModuloFilter('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setEditingId(null);
    setDialogModuloFilter('');
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nombre' ? value.toUpperCase() : value
    }));
  };

  const handlePermisoChange = (permisoId: number) => {
    setFormData(prev => {
      const permisos = prev.permisos.includes(permisoId)
        ? prev.permisos.filter(id => id !== permisoId)
        : [...prev.permisos, permisoId];
      return { ...prev, permisos };
    });
  };

  const toggleModulo = (modulo: string) => {
    setExpandedModulos(prev => ({
      ...prev,
      [modulo]: !prev[modulo]
    }));
  };

  // Seleccionar o deseleccionar todos los permisos de un módulo
  const handleSelectAllModulo = (modulo: string, permisosList: Permiso[]) => {
    const permisosIds = permisosList.map(p => p.id);
    
    // Verificar si todos los permisos del módulo ya están seleccionados
    const todosSeleccionados = permisosIds.every(id => formData.permisos.includes(id));
    
    setFormData(prev => {
      let nuevosPermisos;
      
      if (todosSeleccionados) {
        // Si todos están seleccionados, quitar todos los del módulo
        nuevosPermisos = prev.permisos.filter(id => !permisosIds.includes(id));
      } else {
        // Si no todos están seleccionados, añadir los que faltan
        const permisosActuales = new Set(prev.permisos);
        permisosIds.forEach(id => permisosActuales.add(id));
        nuevosPermisos = Array.from(permisosActuales);
      }
      
      return { ...prev, permisos: nuevosPermisos };
    });
  };

  // Seleccionar o deseleccionar todos los permisos
  const handleSelectAllPermisos = () => {
    // Verificar si todos los permisos están seleccionados
    const todosSeleccionados = permisos.every(p => formData.permisos.includes(p.id));
    
    if (todosSeleccionados) {
      // Si todos están seleccionados, deseleccionar todos
      setFormData(prev => ({
        ...prev,
        permisos: []
      }));
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setFormData(prev => ({
        ...prev,
        permisos: permisos.map(p => p.id)
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre) {
      setError('Por favor complete el nombre del rol');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Solo enviar los IDs de los permisos al backend
      const permisosIds = formData.permisos;
      
      console.log(`Guardando rol '${formData.nombre}' con ${permisosIds.length} permisos`);
      console.log('IDs de permisos seleccionados:', permisosIds);
      
      if (editingId) {
        await rolService.updateRol(editingId, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          permisos: permisosIds
        });
        setSuccessMessage('Rol actualizado exitosamente');
      } else {
        await rolService.createRol({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          permisos: permisosIds
        });
        setSuccessMessage('Rol agregado exitosamente');
      }
      
      await loadRoles();
      handleCloseDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el rol';
      setError(errorMessage);
      console.error('Error al guardar rol:', err);
      
      if (err.response?.data) {
        console.error('Respuesta del servidor:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rol: Rol) => {
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      permisos: rol.permisos.map(p => p.id)
    });
    setEditingId(rol.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este rol?')) {
      try {
        setLoading(true);
        await rolService.deleteRol(id);
        await loadRoles();
        setSuccessMessage('Rol eliminado exitosamente');
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Error al eliminar el rol';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredRoles = roles.filter(rol =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener la lista de módulos disponibles
  const modulos = Object.keys(modulosPredefinidos);

  // Filtrar los permisos para mostrar solo los módulos predefinidos
  const permisosFiltrados = permisos.filter(p => 
    Object.keys(modulosPredefinidos).includes(p.modulo)
  );

  const permisosPorModulo = agruparPermisosPorModulo(
    moduloFilter ? permisosFiltrados.filter(p => p.modulo === moduloFilter) : permisosFiltrados
  );

  const permisosPorModuloDialog = agruparPermisosPorModulo(
    dialogModuloFilter ? permisosFiltrados.filter(p => p.modulo === dialogModuloFilter) : permisosFiltrados
  );

  // Manejo del formulario de permisos
  const handleOpenPermisoDialog = () => {
    const primerModulo = modulos[0] || '';
    setPermisoFormData({
      modulo: primerModulo,
      pantalla: '',
      descripcion: ''
    });
    setPantallasDisponibles(primerModulo ? modulosPredefinidos[primerModulo] : []);
    setOpenPermisoDialog(true);
  };

  const handleClosePermisoDialog = () => {
    setOpenPermisoDialog(false);
    setPermisoFormData({
      modulo: '',
      pantalla: '',
      descripcion: ''
    });
  };

  const handlePermisoInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPermisoFormData(prev => ({
      ...prev,
      [name]: name === 'modulo' || name === 'pantalla' ? value.toUpperCase() : value
    }));
  };

  const handlePermisoSubmit = async () => {
    if (!permisoFormData.modulo || !permisoFormData.pantalla) {
      setError('Módulo y pantalla son requeridos');
      return;
    }

    try {
      setLoading(true);
      await rolService.createPermiso(permisoFormData);
      setSuccessMessage('Permiso creado exitosamente');
      handleClosePermisoDialog();
      
      // Actualizar la lista de permisos
      const permisosActualizados = await rolService.getPermisos();
      setPermisos(permisosActualizados);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al crear el permiso';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModulo = (modulo: string) => {
    if (selectedModulos.includes(modulo)) {
      setSelectedModulos(prev => prev.filter(m => m !== modulo));
    } else {
      setSelectedModulos(prev => [...prev, modulo]);
    }
  };

  const handleViewPermisos = (rol: Rol) => {
    setSelectedRol(rol);
    setShowPermisosDialog(true);
  };

  // Actualizar pantallas disponibles cuando cambia el módulo seleccionado
  const handlePermisoModuloChange = (moduloNombre: string) => {
    const pantallas = modulosPredefinidos[moduloNombre];
    if (pantallas) {
      setPermisoFormData(prev => ({
        ...prev,
        modulo: moduloNombre,
        pantalla: ''
      }));
      setPantallasDisponibles(pantallas);
    }
  };

  // Asignar permisos básicos a un rol específico
  const asignarPermisosBasicosARol = async (rolId: number) => {
    try {
      setLoading(true);
      
      // Obtener el rol
      const rol = roles.find(r => r.id === rolId);
      
      if (!rol) {
        setError('No se encontró el rol especificado');
        return;
      }
      
      // Buscar el permiso PRINCIPAL/VER
      const permisoPrincipal = permisos.find(p => 
        p.modulo === 'PRINCIPAL' && p.pantalla === 'VER'
      );
      
      if (!permisoPrincipal) {
        setError('No se encontró el permiso básico requerido');
        return;
      }
      
      console.log('Permiso PRINCIPAL/VER encontrado:', permisoPrincipal);
      
      // Actualizar el rol con permiso básico (solo enviando el ID)
      await rolService.updateRol(rolId, {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisos: [permisoPrincipal.id]
      });
      
      await loadRoles();
      setSuccessMessage(`Se han asignado permisos básicos al rol ${rol.nombre}`);
    } catch (err) {
      console.error('Error al asignar permisos básicos:', err);
      setError('Error al asignar permisos básicos');
    } finally {
      setLoading(false);
    }
  };

  // Asignar permisos específicos al rol PRUEBA
  const asignarPermisosRequeridosAPrueba = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los roles
      const todosLosRoles = await rolService.getRoles();
      
      // Buscar el rol PRUEBA
      const rolPrueba = todosLosRoles.find(r => r.nombre === 'PRUEBA');
      
      if (!rolPrueba) {
        setError('No se encontró el rol PRUEBA');
        return;
      }
      
      // Crear una lista de permisos requeridos a partir de los módulos predefinidos
      const permisosRequeridos: { modulo: string, pantalla: string }[] = [];
      
      // Agregar todos los permisos de los módulos predefinidos
      Object.entries(modulosPredefinidos).forEach(([modulo, pantallas]) => {
        pantallas.forEach(pantalla => {
          permisosRequeridos.push({
            modulo: modulo,
            pantalla: pantalla
          });
        });
      });
      
      console.log('Permisos requeridos:', permisosRequeridos);
      
      // Encontrar los IDs de los permisos existentes
      const permisosIDs: number[] = [];
      
      for (const permisoReq of permisosRequeridos) {
        const permisoExistente = permisos.find(p => 
          p.modulo === permisoReq.modulo && p.pantalla === permisoReq.pantalla
        );
        
        if (permisoExistente) {
          console.log(`Permiso encontrado: ${permisoExistente.modulo}/${permisoExistente.pantalla} (ID: ${permisoExistente.id})`);
          permisosIDs.push(permisoExistente.id);
        } else {
          console.warn(`Permiso no encontrado: ${permisoReq.modulo}/${permisoReq.pantalla}, creándolo...`);
          
          try {
            // Crear el permiso si no existe
            const nuevoPermiso = await rolService.createPermiso({
              modulo: permisoReq.modulo,
              pantalla: permisoReq.pantalla,
              descripcion: `Permiso para ${permisoReq.pantalla.toLowerCase()} en ${permisoReq.modulo.toLowerCase()}`
            });
            
            console.log(`Permiso creado: ${nuevoPermiso.modulo}/${nuevoPermiso.pantalla} (ID: ${nuevoPermiso.id})`);
            permisosIDs.push(nuevoPermiso.id);
            
            // Actualizar la lista de permisos
            const permisosActualizados = await rolService.getPermisos();
            setPermisos(permisosActualizados);
          } catch (err) {
            console.error(`Error al crear permiso ${permisoReq.modulo}/${permisoReq.pantalla}:`, err);
          }
        }
      }
      
      // Actualizar el rol PRUEBA con los permisos requeridos
      console.log(`Asignando ${permisosIDs.length} permisos al rol PRUEBA (ID: ${rolPrueba.id})`);
      
      await rolService.updateRol(rolPrueba.id, {
        nombre: rolPrueba.nombre,
        descripcion: rolPrueba.descripcion || 'Rol de prueba con todos los permisos requeridos',
        permisos: permisosIDs
      });
      
      setSuccessMessage('Se han asignado los permisos requeridos al rol PRUEBA');
      
      // Recargar roles
      await loadRoles();
      
      // Mostrar roles y permisos actualizados
      const rolesActualizados = await rolService.getRoles();
      const rolPruebaActualizado = rolesActualizados.find(r => r.nombre === 'PRUEBA');
      
      if (rolPruebaActualizado) {
        console.log('%c === ROL PRUEBA ACTUALIZADO ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;');
        console.log('Permisos asignados:', rolPruebaActualizado.permisos.length);
        console.table(rolPruebaActualizado.permisos.map(p => ({
          id: p.id,
          modulo: p.modulo,
          pantalla: p.pantalla
        })));
      }
    } catch (err) {
      console.error('Error al asignar permisos requeridos:', err);
      setError('Error al asignar permisos requeridos al rol PRUEBA');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar permisos que no correspondan a módulos predefinidos
  const limpiarPermisosObsoletos = async () => {
    try {
      setLoading(true);
      
      const permisosExistentes = await rolService.getPermisos();
      
      // Crear un conjunto de módulos y pantallas válidos
      const modulosPantallasValidos = new Set<string>();
      
      Object.entries(modulosPredefinidos).forEach(([modulo, pantallas]) => {
        pantallas.forEach(pantalla => {
          modulosPantallasValidos.add(`${modulo}/${pantalla}`);
        });
      });
      
      // Encontrar permisos obsoletos (que no están en los módulos predefinidos)
      const permisosObsoletos = permisosExistentes.filter(permiso => {
        const clave = `${permiso.modulo}/${permiso.pantalla}`;
        return !modulosPantallasValidos.has(clave);
      });
      
      if (permisosObsoletos.length === 0) {
        setSuccessMessage('No hay permisos obsoletos para eliminar');
        setLoading(false);
        return;
      }
      
      console.log(`Se encontraron ${permisosObsoletos.length} permisos obsoletos:`, 
        permisosObsoletos.map(p => `${p.modulo}/${p.pantalla}`)
      );
      
      // Eliminar permisos obsoletos
      for (const permiso of permisosObsoletos) {
        try {
          await rolService.deletePermiso(permiso.id);
          console.log(`Permiso obsoleto eliminado: ${permiso.modulo}/${permiso.pantalla}`);
        } catch (err) {
          console.error(`Error al eliminar permiso ${permiso.id}:`, err);
        }
      }
      
      // Actualizar la lista de permisos
      const permisosActualizados = await rolService.getPermisos();
      setPermisos(permisosActualizados);
      
      setSuccessMessage(`Se han eliminado ${permisosObsoletos.length} permisos obsoletos`);
    } catch (err) {
      console.error('Error al limpiar permisos:', err);
      setError('Error al limpiar permisos obsoletos');
    } finally {
      setLoading(false);
    }
  };

  // Asignar permisos específicos al rol OPERADOR
  const asignarPermisosOperador = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los roles
      const todosLosRoles = await rolService.getRoles();
      
      // Buscar el rol OPERADOR
      const rolOperador = todosLosRoles.find(r => r.nombre === 'OPERADOR');
      
      if (!rolOperador) {
        setError('No se encontró el rol OPERADOR');
        return;
      }
      
      // Buscar los permisos necesarios
      const permisosExistentes = await rolService.getPermisos();
      
      // Permisos requeridos para OPERADOR
      const permisosRequeridos = [
        { modulo: 'PRINCIPAL', pantalla: 'VER' },
        { modulo: 'OPERACIONES', pantalla: 'CAJAS' }
      ];
      
      // IDs de permisos a asignar
      const permisosIds: number[] = [];
      const permisosActuales = rolOperador.permisos ? rolOperador.permisos.map(p => p.id) : [];
      
      // Verificar que existan los permisos requeridos
      for (const req of permisosRequeridos) {
        const permisoExistente = permisosExistentes.find(p => 
          p.modulo === req.modulo && p.pantalla === req.pantalla
        );
        
        if (permisoExistente) {
          permisosIds.push(permisoExistente.id);
        } else {
          // Crear permiso si no existe
          try {
            const nuevoPermiso = await rolService.createPermiso({
              modulo: req.modulo,
              pantalla: req.pantalla,
              descripcion: `Permiso para ${req.pantalla} en ${req.modulo}`
            });
            permisosIds.push(nuevoPermiso.id);
          } catch (err) {
            console.error(`Error al crear permiso ${req.modulo}/${req.pantalla}:`, err);
          }
        }
      }
      
      // Combinar permisos actuales con los nuevos (sin duplicados)
      const todosLosPermisos = Array.from(new Set([...permisosActuales, ...permisosIds]));
      
      // Actualizar el rol
      await rolService.updateRol(rolOperador.id, {
        nombre: rolOperador.nombre,
        descripcion: rolOperador.descripcion || 'Rol para operadores del sistema',
        permisos: todosLosPermisos
      });
      
      setSuccessMessage('Permisos asignados al rol OPERADOR correctamente');
      await loadRoles();
    } catch (err) {
      console.error('Error al asignar permisos al OPERADOR:', err);
      setError('Error al asignar permisos al OPERADOR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Encabezado */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        py: 2,
        px: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h5" component="h1">
          Roles
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            AGREGAR ROL
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            onClick={asignarPermisosRequeridosAPrueba}
          >
            Asignar Permisos Específicos a PRUEBA
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            onClick={limpiarPermisosObsoletos}
          >
            Limpiar Permisos Obsoletos
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            onClick={asignarPermisosOperador}
            sx={{ ml: 2 }}
          >
            Asignar Permisos a OPERADOR
          </Button>
        </Box>
      </Box>

      {/* Buscador y filtros */}
      <Box sx={{ px: 2, pt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="BUSCAR ROLES..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <IconButton
          color="primary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      {/* Filtros */}
      <Collapse in={showFilters}>
        <Box sx={{ p: 2, bgcolor: 'action.hover', mx: 2, mt: 1, borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filtrar por módulo o pantalla
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.keys(modulosPredefinidos).map(modulo => (
              <Chip
                key={modulo}
                label={modulo}
                clickable
                color={selectedModulos.includes(modulo) ? 'primary' : 'default'}
                onClick={() => handleToggleModulo(modulo)}
              />
            ))}
          </Box>
        </Box>
      </Collapse>

      {/* Tabla de Roles */}
      <Box sx={{ px: 2, pt: 2 }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>NOMBRE</TableCell>
                <TableCell sx={{ color: 'white' }}>DESCRIPCIÓN</TableCell>
                <TableCell sx={{ color: 'white' }}>PERMISOS</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">Cargando...</TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No se encontraron roles</TableCell>
                </TableRow>
              ) : (
                filteredRoles.map(rol => (
                  <TableRow key={rol.id}>
                    <TableCell>{rol.nombre}</TableCell>
                    <TableCell>{rol.descripcion || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {rol.permisos.length > 0 ? (
                          <>
                            <Chip 
                              size="small" 
                              label={`${rol.permisos.length} permisos`} 
                              color="primary"
                              onClick={() => handleViewPermisos(rol)}
                            />
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Sin permisos
                            </Typography>
                            <Tooltip title="Asignar permisos básicos a este rol">
                              <Chip
                                size="small"
                                label="Asignar permisos básicos"
                                color="warning"
                                onClick={() => asignarPermisosBasicosARol(rol.id)}
                              />
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(rol)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(rol.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Diálogo para agregar/editar rol */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId ? 'EDITAR ROL' : 'AGREGAR NUEVO ROL'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              required
              fullWidth
              label="NOMBRE"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              error={!formData.nombre}
              helperText={!formData.nombre ? "ESTE CAMPO ES REQUERIDO" : ""}
              inputProps={{
                style: { textTransform: 'uppercase' }
              }}
            />
            <TextField
              fullWidth
              label="DESCRIPCIÓN"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              multiline
              rows={2}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mr: 2 }}>
                  Permisos
                </Typography>
                
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={handleSelectAllPermisos}
                  sx={{ textTransform: 'none' }}
                >
                  {permisos.every(p => formData.permisos.includes(p.id)) 
                    ? 'Deseleccionar todos' 
                    : 'Seleccionar todos'}
                </Button>
                
                <Chip 
                  label={`${formData.permisos.length}/${permisos.length} seleccionados`}
                  size="small"
                  sx={{ 
                    ml: 1,
                    bgcolor: formData.permisos.length === permisos.length ? '#4caf50' : 
                            formData.permisos.length > 0 ? '#ff9800' : '#e0e0e0',
                    color: formData.permisos.length > 0 ? 'white' : 'inherit',
                  }}
                />
              </Box>
              
              <Tooltip title="Filtrar permisos por módulo para facilitar la selección" arrow>
                <TextField
                  select
                  size="small"
                  label="FILTRAR MÓDULO"
                  value={dialogModuloFilter}
                  onChange={(e) => setDialogModuloFilter(e.target.value)}
                  sx={{ width: 220 }}
                  SelectProps={{
                    native: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  <option value="">TODOS LOS MÓDULOS</option>
                  {Object.keys(modulosPredefinidos).map(modulo => (
                    <option key={modulo} value={modulo}>
                      {modulo} ({permisosCount[modulo] || 0})
                    </option>
                  ))}
                </TextField>
              </Tooltip>
            </Box>
            
            {/* Lista de permisos agrupados por módulo */}
            {Object.entries(permisosPorModuloDialog).map(([modulo, permisosModulo]) => {
              // Verificar si todos los permisos del módulo están seleccionados
              const permisosIds = permisosModulo.map(p => p.id);
              const todosSeleccionados = permisosIds.every(id => formData.permisos.includes(id));
              const algunosSeleccionados = permisosIds.some(id => formData.permisos.includes(id)) && !todosSeleccionados;
              
              return (
                <Accordion 
                  key={modulo}
                  expanded={!!expandedModulos[modulo]}
                  onChange={() => toggleModulo(modulo)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={todosSeleccionados}
                            indeterminate={algunosSeleccionados}
                            onChange={() => handleSelectAllModulo(modulo, permisosModulo)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label={<Typography fontWeight={todosSeleccionados || algunosSeleccionados ? 'bold' : 'normal'}>{modulo}</Typography>}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ marginRight: 'auto' }}
                      />
                      <Chip 
                        label={`${permisosModulo.filter(p => formData.permisos.includes(p.id)).length}/${permisosModulo.length}`}
                        size="small"
                        sx={{ 
                          mr: 1,
                          bgcolor: todosSeleccionados ? '#4caf50' : algunosSeleccionados ? '#ff9800' : '#e0e0e0',
                          color: todosSeleccionados || algunosSeleccionados ? 'white' : 'inherit',
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {permisosModulo.map((permiso) => (
                        <Grid item xs={12} sm={6} key={permiso.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.permisos.includes(permiso.id)}
                                onChange={() => handlePermisoChange(permiso.id)}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2">{permiso.pantalla}</Typography>
                                <Typography variant="caption" color="text.secondary">{permiso.descripcion}</Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>CANCELAR</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.nombre}
          >
            GUARDAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar permiso */}
      <Dialog 
        open={openPermisoDialog} 
        onClose={handleClosePermisoDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          AGREGAR NUEVO PERMISO
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              required
              select
              fullWidth
              label="MÓDULO"
              name="modulo"
              value={permisoFormData.modulo}
              onChange={(e) => handlePermisoModuloChange(e.target.value)}
              error={!permisoFormData.modulo}
              helperText={!permisoFormData.modulo ? "ESTE CAMPO ES REQUERIDO" : ""}
              SelectProps={{
                native: true,
              }}
            >
              <option value="" disabled>Seleccione un módulo</option>
              {Object.keys(modulosPredefinidos).map(modulo => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </TextField>

            <TextField
              required
              select
              fullWidth
              label="PANTALLA"
              name="pantalla"
              value={permisoFormData.pantalla}
              onChange={handlePermisoInputChange}
              error={!permisoFormData.pantalla}
              helperText={!permisoFormData.pantalla ? "ESTE CAMPO ES REQUERIDO" : ""}
              disabled={!permisoFormData.modulo}
              SelectProps={{
                native: true,
              }}
            >
              <option value="" disabled>Seleccione una pantalla</option>
              {pantallasDisponibles.map(pantalla => (
                <option key={pantalla} value={pantalla}>
                  {pantalla}
                </option>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="DESCRIPCIÓN"
              name="descripcion"
              value={permisoFormData.descripcion}
              onChange={handlePermisoInputChange}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermisoDialog}>CANCELAR</Button>
          <Button 
            onClick={handlePermisoSubmit} 
            variant="contained" 
            color="primary"
            disabled={!permisoFormData.modulo || !permisoFormData.pantalla}
          >
            GUARDAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensajes de éxito y error */}
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
    </Box>
  );
};

export default Roles; 
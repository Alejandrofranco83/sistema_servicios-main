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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import { usuarioService, Usuario, UsuarioInput } from '../../services/usuarioService';
import { personaService, Persona } from '../../services/personaService';
import { rolService, Rol } from '../../services/rolService';
import { useTheme } from '@mui/material/styles';

interface UsuarioFormData {
  username: string;
  personaId: number;
  nombre: string;
  tipo: string;
  rolId: number | undefined;
}

const initialFormData: UsuarioFormData = {
  username: '',
  personaId: 0,
  nombre: '',
  tipo: 'Funcionario',
  rolId: undefined
};

const Usuarios: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [personaSearchTerm, setPersonaSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UsuarioFormData>(initialFormData);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null);
  const [usuarioSearchTerm, setUsuarioSearchTerm] = useState('');
  const [personasResults, setPersonasResults] = useState<Persona[]>([]);
  const theme = useTheme();

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsuarios();
    loadRoles();
  }, []);

  // Cargar personas elegibles cuando se abre el diálogo
  useEffect(() => {
    if (openDialog) {
      loadPersonasElegibles();
    }
  }, [openDialog]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getUsuarios();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error('Error al cargar los usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Error al cargar roles:', err);
      setError('Error al cargar la lista de roles');
    }
  };

  const loadPersonasElegibles = async () => {
    try {
      const data = await personaService.getPersonas();
      // Filtrar solo funcionarios y VIP
      const personasElegibles = data.filter(
        persona => persona.tipo === 'Funcionario' || persona.tipo === 'Vip'
      );
      setPersonas(personasElegibles);
    } catch (err) {
      console.error('Error al cargar personas elegibles:', err);
      setError('Error al cargar la lista de personas');
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePersonaSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPersonaSearchTerm(event.target.value.toUpperCase());
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setEditingId(null);
    setError(null);
    setPersonaSeleccionada(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? undefined : Number(value)
    }));
  };

  const handleSelectPersona = (persona: Persona) => {
    setFormData(prev => ({
      ...prev,
      personaId: persona.id,
      nombre: persona.nombreCompleto,
      tipo: 'Funcionario'
    }));
    setPersonaSeleccionada(persona);
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.username || formData.personaId === 0 || formData.rolId === undefined) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Enviando datos:', formData);
      
      let response;
      if (editingId) {
        response = await usuarioService.updateUsuario(editingId, formData);
        setSuccessMessage('Usuario actualizado exitosamente');
      } else {
        response = await usuarioService.createUsuario({
          username: formData.username.toUpperCase(),
          personaId: formData.personaId,
          nombre: formData.nombre,
          tipo: formData.tipo,
          rolId: formData.rolId
        });
        setSuccessMessage('Usuario agregado exitosamente');
      }
      
      console.log('Respuesta del servidor:', response);
      
      await loadUsuarios();
      closeDialog();
    } catch (err: any) {
      console.error('Error completo:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el usuario';
      setError(errorMessage);
      // No cerrar el diálogo si hay error
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      username: usuario.username,
      personaId: usuario.personaId,
      nombre: usuario.nombre,
      tipo: usuario.tipo,
      rolId: usuario.rol?.id
    });
    setEditingId(usuario.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este usuario?')) {
      try {
        setLoading(true);
        await usuarioService.deleteUsuario(id);
        await loadUsuarios();
        setSuccessMessage('Usuario eliminado exitosamente');
      } catch (err) {
        setError('Error al eliminar el usuario');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = (userId: number) => {
    setSelectedUserId(userId);
    setResetPasswordDialog(true);
  };

  const handleConfirmReset = async () => {
    if (!selectedUserId) return;

    try {
      setLoading(true);
      await usuarioService.resetPassword(selectedUserId);
      setSuccessMessage('Contraseña reseteada exitosamente');
    } catch (err) {
      setError('Error al resetear la contraseña');
    } finally {
      setLoading(false);
      setResetPasswordDialog(false);
      setSelectedUserId(null);
    }
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.persona.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPersonas = personas.filter(persona =>
    persona.nombreCompleto.toLowerCase().includes(personaSearchTerm.toLowerCase()) ||
    persona.documento.toLowerCase().includes(personaSearchTerm.toLowerCase())
  );

  const selectedPersona = personas.find(p => p.id === formData.personaId && formData.personaId !== 0);

  // Buscar personas
  const handleSearchPersona = async (search: string) => {
    setPersonaSearchTerm(search);
    
    if (search.length < 2) {
      setPersonasResults([]);
      return;
    }
    
    try {
      // Usar getPersonas y filtrar localmente mientras se implementa el endpoint de búsqueda
      const allPersonas = await personaService.getPersonas();
      const filtered = allPersonas.filter(p => 
        p.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
        p.documento.toLowerCase().includes(search.toLowerCase())
      );
      setPersonasResults(filtered);
    } catch (error) {
      console.error('Error al buscar personas:', error);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h4">Gestión de Usuarios</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar usuario..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ px: 2 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                <TableCell sx={{ color: 'white' }}>ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
                <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white' }}>Documento</TableCell>
                <TableCell sx={{ color: 'white' }}>Rol</TableCell>
                <TableCell sx={{ color: 'white' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Cargando...</TableCell>
                </TableRow>
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No se encontraron usuarios</TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map(usuario => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.id}</TableCell>
                    <TableCell>{usuario.username}</TableCell>
                    <TableCell>{usuario.persona.nombreCompleto}</TableCell>
                    <TableCell>{usuario.persona.documento}</TableCell>
                    <TableCell>{usuario.rol ? usuario.rol.nombre : 'Sin rol asignado'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(usuario)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(usuario.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                      <IconButton onClick={() => handleResetPassword(usuario.id)} color="warning">
                        <LockResetIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Diálogo para agregar/editar usuario */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Solo mostrar búsqueda de persona cuando se está creando un nuevo usuario */}
              {!editingId && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Buscar Persona
                  </Typography>
                  <TextField
                    fullWidth
                    label="Buscar por nombre o documento"
                    variant="outlined"
                    value={personaSearchTerm}
                    onChange={handlePersonaSearchChange}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                    <List>
                      {filteredPersonas.map(persona => (
                        <React.Fragment key={persona.id}>
                          <ListItem 
                            button 
                            onClick={() => handleSelectPersona(persona)}
                            selected={formData.personaId === persona.id}
                          >
                            <ListItemText 
                              primary={persona.nombreCompleto} 
                              secondary={`${persona.documento} - ${persona.tipo}`} 
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} md={editingId ? 12 : 6}>
                <Typography variant="subtitle1" gutterBottom>
                  Información de Usuario
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Persona Seleccionada"
                    value={selectedPersona ? selectedPersona.nombreCompleto : formData.nombre}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    name="username"
                    label="Nombre de Usuario"
                    value={formData.username}
                    onChange={handleInputChange}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                    <InputLabel id="rol-select-label">Rol</InputLabel>
                    <Select
                      labelId="rol-select-label"
                      id="rol-select"
                      name="rolId"
                      value={formData.rolId !== undefined ? formData.rolId.toString() : ''}
                      onChange={handleSelectChange}
                      label="Rol"
                    >
                      <MenuItem value="">
                        <em>Seleccione un rol</em>
                      </MenuItem>
                      {roles.map((rol) => (
                        <MenuItem key={rol.id} value={rol.id.toString()}>
                          {rol.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para confirmar reseteo de contraseña */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
        <DialogTitle>Resetear Contraseña</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea resetear la contraseña de este usuario a "123"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmReset} variant="contained" color="warning">
            Resetear Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensajes de éxito */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Usuarios; 
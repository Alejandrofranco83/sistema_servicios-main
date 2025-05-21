import React, { useState, useEffect, useRef } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Alert,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { personaService, Persona as PersonaType } from '../../services/personaService';

type TipoPersona = 'Cliente' | 'Funcionario' | 'Conveniado' | 'Vip';

interface PersonaFormData {
  nombreCompleto: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  tipo: TipoPersona;
  fechaNacimiento: Date | null;
}

const tiposPersona: TipoPersona[] = ['Cliente', 'Funcionario', 'Conveniado', 'Vip'];

const initialFormData: PersonaFormData = {
  nombreCompleto: '',
  documento: '',
  telefono: '',
  email: '',
  direccion: '',
  tipo: 'Cliente',
  fechaNacimiento: null,
};

const Personas: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<PersonaFormData>(initialFormData);
  const [personas, setPersonas] = useState<PersonaType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const guardarButtonRef = useRef<HTMLButtonElement>(null);

  // Cargar personas al montar el componente
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const data = await personaService.getPersonas();
      setPersonas(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las personas');
      console.error('Error al cargar las personas:', err);
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'email' ? value : value.toUpperCase()
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<TipoPersona>) => {
    setFormData(prev => ({
      ...prev,
      tipo: event.target.value as TipoPersona
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      fechaNacimiento: date
    }));
  };

  const handleEdit = (persona: PersonaType) => {
    setFormData({
      ...persona,
      fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento) : null
    });
    setEditingId(persona.id);
    setOpenDialog(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) { 
      event.preventDefault();

      const focusableElements = Array.from(
        (event.currentTarget as HTMLElement).querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [role="button"]:not([disabled])'
        )
      ).filter(el => {
          const style = window.getComputedStyle(el as HTMLElement);
          return (el as HTMLElement).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];

      const currentFocusedIndex = focusableElements.findIndex(el => el === document.activeElement || el.contains(document.activeElement));

      if (currentFocusedIndex !== -1 && currentFocusedIndex < focusableElements.length - 1) {
        const nextElement = focusableElements[currentFocusedIndex + 1];
        nextElement?.focus();
      } else if (currentFocusedIndex === focusableElements.length - 1) {
          const saveButton = guardarButtonRef.current;
          if (saveButton && document.activeElement !== saveButton && !saveButton.disabled) {
              saveButton.focus();
          }
      }
    }
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.nombreCompleto || !formData.documento) {
      setError('Por favor complete los campos requeridos: Nombre Completo y Documento');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Convertir los datos del formulario al formato esperado por el servicio
      const personaData = {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento?.toISOString() || null
      };
      
      let response;
      if (editingId) {
        // Actualizar persona existente
        response = await personaService.updatePersona(editingId, personaData);
        setSuccessMessage('Persona actualizada exitosamente');
      } else {
        // Crear nueva persona
        response = await personaService.createPersona(personaData);
        setSuccessMessage('Persona agregada exitosamente');
      }
      
      console.log('Respuesta del servidor:', response);
      
      // Recargar la lista de personas
      await loadPersonas();
      
      // Limpiar el formulario y cerrar el diálogo
      setFormData(initialFormData);
      setEditingId(null);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error completo:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error al guardar la persona';
      setError(errorMessage);
      // No cerrar el diálogo si hay error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar esta persona?')) {
      try {
        setLoading(true);
        await personaService.deletePersona(id);
        await loadPersonas();
        setSuccessMessage('Persona eliminada exitosamente');
      } catch (err) {
        setError('Error al eliminar la persona');
        console.error('Error al eliminar la persona:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredPersonas = personas.filter((persona) =>
    Object.values(persona)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
          Personas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          AGREGAR PERSONA
        </Button>
      </Box>

      {/* Buscador */}
      <Box sx={{ px: 2, pt: 2 }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="BUSCAR PERSONAS..."
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

      {/* Tabla de Personas */}
      <Box sx={{ px: 2, pt: 2 }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>NOMBRE COMPLETO</TableCell>
                <TableCell sx={{ color: 'white' }}>DOCUMENTO</TableCell>
                <TableCell sx={{ color: 'white' }}>TELÉFONO</TableCell>
                <TableCell sx={{ color: 'white' }}>EMAIL</TableCell>
                <TableCell sx={{ color: 'white' }}>DIRECCIÓN</TableCell>
                <TableCell sx={{ color: 'white' }}>TIPO</TableCell>
                <TableCell sx={{ color: 'white' }}>FECHA DE NACIMIENTO</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Cargando...</TableCell>
                </TableRow>
              ) : filteredPersonas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No se encontraron personas</TableCell>
                </TableRow>
              ) : (
                filteredPersonas.map(persona => (
                  <TableRow key={persona.id}>
                    <TableCell>{persona.nombreCompleto}</TableCell>
                    <TableCell>{persona.documento}</TableCell>
                    <TableCell>{persona.telefono || '-'}</TableCell>
                    <TableCell>{persona.email || '-'}</TableCell>
                    <TableCell>{persona.direccion || '-'}</TableCell>
                    <TableCell>{persona.tipo}</TableCell>
                    <TableCell>
                      {persona.fechaNacimiento
                        ? new Date(persona.fechaNacimiento).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(persona)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(persona.id)}>
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

      {/* Diálogo para agregar/editar persona */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? 'EDITAR PERSONA' : 'AGREGAR NUEVA PERSONA'}
        </DialogTitle>
        <DialogContent>
          <form 
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}
            onKeyDown={handleKeyDown} 
            noValidate
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            <TextField
              required
              fullWidth
              label="NOMBRE COMPLETO"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleInputChange}
              error={!formData.nombreCompleto}
              helperText={!formData.nombreCompleto ? "ESTE CAMPO ES REQUERIDO" : ""}
            />
            <TextField
              required
              fullWidth
              label="DOCUMENTO"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              error={!formData.documento}
              helperText={!formData.documento ? "ESTE CAMPO ES REQUERIDO" : ""}
            />
            <TextField
              fullWidth
              label="TELÉFONO"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label="DIRECCIÓN"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel>TIPO</InputLabel>
              <Select<TipoPersona>
                value={formData.tipo}
                label="TIPO"
                onChange={handleSelectChange}
                name="tipo"
              >
                {tiposPersona.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="FECHA DE NACIMIENTO"
                value={formData.fechaNacimiento}
                onChange={handleDateChange}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>CANCELAR</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.nombreCompleto || !formData.documento}
            ref={guardarButtonRef}
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

export default Personas; 
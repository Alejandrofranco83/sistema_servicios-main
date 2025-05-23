import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  // useTheme, // No parece usarse directamente, se puede omitir si no se usa
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../services/api'; // Usar instancia api global
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const Login: React.FC<LoginProps> = ({ onToggleTheme, isDarkMode }) => {
  const navigate = useNavigate();
  // const theme = useTheme(); // Si no se usa, se puede quitar
  const { login, loading: authLoading, error: authError } = useAuth();
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  
  // Para errores específicos del diálogo de cambio de contraseña o generales del componente si no vienen de authError.
  const [componentError, setComponentError] = useState(''); 
  const [changePasswordLoading, setChangePasswordLoading] = useState(false); // Loading para el diálogo

  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComponentError(''); // Limpiar errores del componente antes del submit
    
    try {
      await login(credentials.username, credentials.password);
      // Redirección manejada por AuthContext o ProtectedRoute
    } catch (err: any) {
      // authError se actualiza desde el contexto.
      // Podemos registrar el error localmente si es necesario para depuración,
      // pero la UI debería reaccionar a authError.
      console.error('Error en submit de login:', err);
      // Si authError no se muestra o queremos un mensaje genérico adicional:
      // setComponentError('Fallo el inicio de sesión. Verifique sus credenciales.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: name === 'username' ? value.toUpperCase() : value
    }));
  };

  const handlePasswordDialogInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: name === 'username' ? value.toUpperCase() : value
    }));
  };

  const handleChangePassword = async () => {
    setComponentError('');
    if (!passwordData.username || !passwordData.oldPassword || !passwordData.newPassword) {
      setComponentError('Todos los campos para cambiar la contraseña son obligatorios.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setComponentError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      await api.post('/api/auth/cambiar-password', {
        username: passwordData.username.toUpperCase(),
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      
      setResetSuccess(true);
      setPasswordData({ username: '', oldPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setShowChangePassword(false);
        setResetSuccess(false); // Resetear para la próxima vez
        setComponentError('');    // Limpiar error del diálogo
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      setComponentError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const openChangePasswordDialog = () => {
    setComponentError(''); // Limpiar errores al abrir
    setResetSuccess(false); // Asegurar que no se muestre success de intentos previos
    // Opcional: precargar username si ya está en el formulario principal
    setPasswordData(prev => ({ ...prev, username: credentials.username })); 
    setShowChangePassword(true);
  };

  const closeChangePasswordDialog = () => {
    setShowChangePassword(false);
    setComponentError(''); // Limpiar errores al cerrar
    setResetSuccess(false);
  };


  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4, display: 'flex', flexDirection: 'column',
            alignItems: 'center', width: '100%', backgroundColor: 'background.paper',
          }}
        >
          <Box // Contenedor del logo
            component="img"
            src="./logo-farmacia.png" // Tu ruta original del logo
            alt="Farmacia Franco Logo"
            sx={{
              width: '100%', maxWidth: '280px', height: 'auto',
              marginBottom: 1, objectFit: 'contain',
            }}
          />
          
          <Typography 
            variant="h6" 
            sx={{ mb: 4, color: '#808080', fontWeight: 'bold', letterSpacing: '2px' }}
          >
            SERVICIOS
          </Typography>
          
          {/* Mostrar authError (del login) o componentError (del cambio de pass u otros) */}
          {(authError || componentError) && !resetSuccess && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {authError || componentError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal" required fullWidth id="username" label="Usuario"
              name="username" autoComplete="username" autoFocus
              value={credentials.username} onChange={handleInputChange}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <TextField
              margin="normal" required fullWidth name="password" label="Contraseña"
              type={showPassword ? 'text' : 'password'} id="password"
              autoComplete="current-password" value={credentials.password}
              onChange={handleInputChange}
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()} edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Link component="button" type="button" variant="body2"
                onClick={openChangePasswordDialog} sx={{ textDecoration: 'none' }}
              >
                Cambiar Contraseña
              </Link>
              <Link component="button" type="button" variant="body2"
                onClick={onToggleTheme} sx={{ textDecoration: 'none' }}
              >
                Modo {isDarkMode ? 'Claro' : 'Oscuro'}
              </Link>
            </Box>
            <Button type="submit" fullWidth variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
              disabled={authLoading}
            >
              {authLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog open={showChangePassword} onClose={closeChangePasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Contraseña actualizada con éxito.
            </Alert>
          ) : (
            <>
              {componentError && ( // Error específico del diálogo
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {componentError}
                </Alert>
              )}
              <TextField autoFocus margin="dense" id="dialog-username" name="username"
                label="Usuario" type="text" fullWidth variant="outlined"
                value={passwordData.username} onChange={handlePasswordDialogInputChange}
              />
              <TextField margin="dense" id="oldPassword" name="oldPassword"
                label="Contraseña Actual" type="password" fullWidth variant="outlined"
                value={passwordData.oldPassword} onChange={handlePasswordDialogInputChange}
              />
              <TextField margin="dense" id="newPassword" name="newPassword"
                label="Nueva Contraseña" type="password" fullWidth variant="outlined"
                value={passwordData.newPassword} onChange={handlePasswordDialogInputChange}
              />
              <TextField margin="dense" id="confirmPassword" name="confirmPassword"
                label="Confirmar Nueva Contraseña" type="password" fullWidth variant="outlined"
                value={passwordData.confirmPassword} onChange={handlePasswordDialogInputChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeChangePasswordDialog} color="primary" disabled={changePasswordLoading}>
            Cancelar
          </Button>
          <Button onClick={handleChangePassword} color="primary" disabled={changePasswordLoading || resetSuccess}>
            {changePasswordLoading ? <CircularProgress size={24} /> : 'Cambiar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
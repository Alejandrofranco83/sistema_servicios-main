import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  Fade,
  Slide
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PhoneAndroid as PhoneIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const MobileLogin: React.FC = () => {
  const theme = useTheme();
  const { login, loading: authLoading, error: authError } = useAuth();
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  
  const [componentError, setComponentError] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
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
    setComponentError('');
    
    try {
      await login(credentials.username, credentials.password);
    } catch (err: any) {
      console.error('Error en submit de login móvil:', err);
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
        setResetSuccess(false);
        setComponentError('');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      setComponentError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const openChangePasswordDialog = () => {
    setComponentError('');
    setResetSuccess(false);
    setPasswordData(prev => ({ ...prev, username: credentials.username }));
    setShowChangePassword(true);
  };

  const closeChangePasswordDialog = () => {
    setShowChangePassword(false);
    setComponentError('');
    setResetSuccess(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      background: `linear-gradient(135deg, ${theme.palette.primary.main}22 0%, ${theme.palette.background.default} 50%, ${theme.palette.secondary.main}11 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decoración de fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          opacity: 0.1,
          animation: 'pulse 3s ease-in-out infinite'
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          bgcolor: 'secondary.main',
          opacity: 0.05,
          animation: 'pulse 4s ease-in-out infinite reverse'
        }}
      />

      {/* Contenido principal */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
        position: 'relative',
        zIndex: 1
      }}>
        <Fade in timeout={800}>
          <Card sx={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 4 }}>
              {/* Logo y header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <PhoneIcon sx={{
                  fontSize: 70,
                  color: 'primary.main',
                  mb: 2,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }} />
                
                <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  Sistema Móvil
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'normal' }}>
                  Gestión de Cajas
                </Typography>
                
                <Box sx={{
                  width: 60,
                  height: 3,
                  bgcolor: 'primary.main',
                  borderRadius: 1.5,
                  mx: 'auto',
                  mt: 2
                }} />
              </Box>

              {/* Alerts */}
              {(authError || componentError) && !resetSuccess && (
                <Slide direction="down" in timeout={300}>
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {authError || componentError}
                  </Alert>
                </Slide>
              )}

              {/* Formulario */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Usuario"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={credentials.username}
                  onChange={handleInputChange}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }
                  }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }
                  }}
                  sx={{ mb: 3 }}
                />

                {/* Cambiar contraseña */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={openChangePasswordDialog}
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    ¿Cambiar Contraseña?
                  </Link>
                </Box>

                {/* Botón de login */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={authLoading}
                  sx={{
                    py: 1.8,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                    boxShadow: `0 6px 20px ${theme.palette.primary.main}40`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${theme.palette.primary.main}50`,
                    },
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {authLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </Box>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  v1.0.0-mobile-beta
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>

      {/* Dialog para cambiar contraseña */}
      <Dialog 
        open={showChangePassword} 
        onClose={closeChangePasswordDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, m: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Cambiar Contraseña
          </Typography>
        </DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              Contraseña actualizada con éxito.
            </Alert>
          ) : (
            <>
              {componentError && (
                <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
                  {componentError}
                </Alert>
              )}
              <TextField
                autoFocus
                margin="dense"
                id="dialog-username"
                name="username"
                label="Usuario"
                type="text"
                fullWidth
                variant="outlined"
                value={passwordData.username}
                onChange={handlePasswordDialogInputChange}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="oldPassword"
                name="oldPassword"
                label="Contraseña Actual"
                type="password"
                fullWidth
                variant="outlined"
                value={passwordData.oldPassword}
                onChange={handlePasswordDialogInputChange}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="newPassword"
                name="newPassword"
                label="Nueva Contraseña"
                type="password"
                fullWidth
                variant="outlined"
                value={passwordData.newPassword}
                onChange={handlePasswordDialogInputChange}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                type="password"
                fullWidth
                variant="outlined"
                value={passwordData.confirmPassword}
                onChange={handlePasswordDialogInputChange}
                size="small"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={closeChangePasswordDialog} 
            disabled={changePasswordLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={changePasswordLoading || resetSuccess}
            sx={{ borderRadius: 2 }}
          >
            {changePasswordLoading ? <CircularProgress size={20} /> : 'Cambiar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Añadir keyframes para animaciones */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.1; }
            50% { transform: scale(1.05); opacity: 0.15; }
          }
        `}
      </style>
    </Box>
  );
};

export default MobileLogin; 
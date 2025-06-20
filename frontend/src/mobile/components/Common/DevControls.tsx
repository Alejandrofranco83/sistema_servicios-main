import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  PhoneAndroid as PhoneIcon,
  Computer as DesktopIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useAuth } from '../../../contexts/AuthContext';

// Función para toggle mobile force
export const toggleMobileForce = () => {
  const current = localStorage.getItem('force_mobile') === 'true';
  if (current) {
    localStorage.removeItem('force_mobile');
  } else {
    localStorage.setItem('force_mobile', 'true');
  }
  window.location.reload();
};

const DevControls: React.FC = () => {
  const [open, setOpen] = useState(false);
  const deviceInfo = useMobileDetection();
  const { logout, user } = useAuth();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') return null;

  const resetAll = () => {
    localStorage.removeItem('force_mobile');
    localStorage.removeItem('force_desktop');
    window.location.reload();
  };

  const testLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <>
      <Fab
        color="secondary"
        aria-label="dev-controls"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          opacity: 0.8,
          '&:hover': { opacity: 1 }
        }}
      >
        <SettingsIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          🛠️ Controles de Desarrollo
        </DialogTitle>
        <DialogContent>
          {/* Info del dispositivo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📱 Estado del Dispositivo
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={deviceInfo.isMobile ? <PhoneIcon /> : <DesktopIcon />}
                label={deviceInfo.isMobile ? 'Móvil' : 'Desktop'}
                color={deviceInfo.isMobile ? 'primary' : 'default'}
              />
              <Chip 
                label={`${deviceInfo.viewport.width}x${deviceInfo.viewport.height}`}
                variant="outlined"
              />
              <Chip 
                label={deviceInfo.breakpoint}
                color="secondary"
                variant="outlined"
              />
              {deviceInfo.isForced && (
                <Chip 
                  label="FORZADO"
                  color="warning"
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Controles de modo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔧 Controles de Modo
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={deviceInfo.isMobile}
                  onChange={toggleMobileForce}
                />
              }
              label="Forzar Modo Móvil"
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={resetAll}
              >
                Resetear Todo
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Controles de autenticación */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔐 Controles de Auth
            </Typography>
            
            {user ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Conectado como: <strong>{user.username}</strong>
                </Alert>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<LogoutIcon />}
                  onClick={testLogout}
                  fullWidth
                >
                  Hacer Logout (Test Login)
                </Button>
              </Box>
            ) : (
              <Alert severity="warning">
                No hay usuario conectado
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Info de versión */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Modo: {process.env.NODE_ENV}<br />
              Versión móvil: v1.0.0-beta<br />
              Build: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DevControls; 
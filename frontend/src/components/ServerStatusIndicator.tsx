import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import { useServerStatus } from '../contexts/ServerStatusContext';

const ServerStatusIndicator: React.FC = () => {
  const { isOnline, lastChecked, checkServerStatus } = useServerStatus();
  const theme = useTheme();

  // Formatear la hora de la última verificación
  const formattedTime = lastChecked 
    ? lastChecked.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <Tooltip 
      title={
        <>
          <Typography variant="body2">
            Estado del servidor: {isOnline ? 'Conectado' : 'Desconectado'}
          </Typography>
          <Typography variant="caption">
            Última verificación: {formattedTime}
          </Typography>
          <Typography variant="caption" display="block">
            Haga clic para verificar nuevamente
          </Typography>
        </>
      }
      arrow
    >
      <Box 
        onClick={() => checkServerStatus()}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          borderRadius: 1,
          px: 1,
          py: 0.5,
          mr: 1
        }}
      >
        {isOnline ? (
          <WifiIcon 
            fontSize="small" 
            sx={{ 
              color: theme.palette.success.main,
              mr: 0.5 
            }}
          />
        ) : (
          <WifiOffIcon 
            fontSize="small" 
            sx={{ 
              color: theme.palette.error.main,
              mr: 0.5 
            }}
          />
        )}
        <Typography 
          variant="body2" 
          component="span"
          sx={{ 
            color: isOnline 
              ? theme.palette.success.main 
              : theme.palette.error.main,
            fontWeight: 'medium',
          }}
        >
          {isOnline ? 'Servidor online' : 'Servidor offline'}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default ServerStatusIndicator; 
import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as ResetZoomIcon
} from '@mui/icons-material';
import { useElectronZoom } from '../../hooks/useElectronZoom';

interface ZoomControlsProps {
  /**
   * Si se muestra en formato compacto (solo iconos)
   */
  compact?: boolean;
  /**
   * Orientación de los controles
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Si se muestra el porcentaje de zoom actual
   */
  showPercentage?: boolean;
}

/**
 * Componente de controles de zoom para aplicaciones Electron
 * Permite al usuario controlar el nivel de zoom de forma visual
 */
const ZoomControls: React.FC<ZoomControlsProps> = ({
  compact = false,
  orientation = 'horizontal',
  showPercentage = true
}) => {
  const { 
    zoomLevel, 
    zoomPercentage, 
    isElectron, 
    zoomIn, 
    zoomOut, 
    resetZoom 
  } = useElectronZoom();

  // No mostrar controles si no estamos en Electron
  if (!isElectron) {
    return null;
  }

  const isHorizontal = orientation === 'horizontal';

  return (
    <Paper 
      elevation={1}
      sx={{ 
        p: 1,
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        gap: 1,
        width: 'fit-content'
      }}
    >
      <Tooltip title="Disminuir zoom (Ctrl + -)">
        <IconButton 
          size="small" 
          onClick={zoomOut}
          disabled={zoomLevel <= -3}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {!compact && showPercentage && (
        <>
          {isHorizontal && <Divider orientation="vertical" flexItem />}
          {!isHorizontal && <Divider orientation="horizontal" flexItem />}
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isHorizontal ? 'row' : 'column',
            alignItems: 'center',
            minWidth: isHorizontal ? 60 : 'auto',
            textAlign: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 'medium',
                lineHeight: 1
              }}
            >
              {zoomPercentage}%
            </Typography>
          </Box>
          
          {isHorizontal && <Divider orientation="vertical" flexItem />}
          {!isHorizontal && <Divider orientation="horizontal" flexItem />}
        </>
      )}

      <Tooltip title="Resetear zoom (Ctrl + 0)">
        <IconButton 
          size="small" 
          onClick={resetZoom}
          disabled={zoomLevel === 0}
        >
          <ResetZoomIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Aumentar zoom (Ctrl + +)">
        <IconButton 
          size="small" 
          onClick={zoomIn}
          disabled={zoomLevel >= 3}
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

export default ZoomControls; 
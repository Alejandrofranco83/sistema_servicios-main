import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  LinearProgress,
  Box,
  Typography,
  IconButton,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Stack
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Close as CloseIcon,
  Refresh as UpdateIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showDownloadedNotification, setShowDownloadedNotification] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar si las APIs están disponibles
    if (!window.electronAPI) {
      console.log('electronAPI no disponible');
      return;
    }

    // Escuchar eventos de actualización desde el proceso principal
    window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
      console.log('Actualización disponible:', info);
      setUpdateAvailable(info);
      setShowUpdateNotification(true);
      setDismissed(false);
    });

    window.electronAPI.onDownloadProgress((progress: DownloadProgress) => {
      setDownloadProgress(progress);
    });

    window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
      console.log('Actualización descargada:', info);
      setUpdateDownloaded(info);
      setIsDownloading(false);
      setDownloadProgress(null);
      setShowUpdateNotification(false);
      setShowDownloadedNotification(true);
    });

    // Verificar actualizaciones al iniciar (silenciosamente)
    setTimeout(() => {
      window.electronAPI.checkForUpdates();
    }, 5000); // Esperar 5 segundos antes de verificar

    return () => {
      // Cleanup si es necesario
    };
  }, []);

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI) return;
    
    setIsDownloading(true);
    setDownloadProgress({ bytesPerSecond: 0, percent: 0, transferred: 0, total: 0 });
    
    const result = await window.electronAPI.startUpdateDownload();
    if (!result?.success) {
      console.error('Error al descargar actualización:', result?.error);
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleInstallUpdate = () => {
    if (!window.electronAPI) return;
    window.electronAPI.installUpdate();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowUpdateNotification(false);
  };

  const handleCloseDownloaded = () => {
    setShowDownloadedNotification(false);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatSpeed = (bytesPerSecond: number) => {
    const mbps = bytesPerSecond / 1024 / 1024;
    return mbps > 1 ? `${mbps.toFixed(1)} MB/s` : `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
  };

  return (
    <>
      {/* Notificación de actualización disponible - Esquina superior derecha */}
      <Snackbar
        open={showUpdateNotification && !dismissed}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ 
          mt: 2, 
          mr: 2,
          maxWidth: 400,
          '& .MuiSnackbarContent-root': { 
            padding: 0,
            backgroundColor: 'transparent'
          }
        }}
      >
        <Card elevation={6} sx={{ width: '100%' }}>
          <CardContent sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <UpdateIcon color="primary" sx={{ mt: 0.5 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  🎉 Nueva actualización disponible
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Versión {updateAvailable?.version} lista para descargar
                </Typography>
                
                {/* Mostrar progreso de descarga si está descargando */}
                {isDownloading && downloadProgress && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Descargando... {downloadProgress.percent.toFixed(1)}% 
                      {downloadProgress.bytesPerSecond > 0 && (
                        <span> • {formatSpeed(downloadProgress.bytesPerSecond)}</span>
                      )}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={downloadProgress.percent} 
                      sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(downloadProgress.transferred)} / {formatFileSize(downloadProgress.total)}
                    </Typography>
                  </Box>
                )}

                {/* Detalles colapsables */}
                <Collapse in={showDetails}>
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {updateAvailable?.releaseNotes || 'Mejoras y correcciones de errores.'}
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
              
              <IconButton 
                size="small" 
                onClick={handleDismiss}
                sx={{ mt: -0.5, mr: -0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </CardContent>
          
          <CardActions sx={{ pt: 0, pb: 1.5, px: 2 }}>
            <Button
              size="small"
              startIcon={<InfoIcon />}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar' : 'Ver'} detalles
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              size="small" 
              onClick={handleDismiss}
              color="inherit"
            >
              Más tarde
            </Button>
            <Button 
              size="small"
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownloadUpdate}
              disabled={isDownloading}
            >
              {isDownloading ? 'Descargando...' : 'Actualizar'}
            </Button>
          </CardActions>
        </Card>
      </Snackbar>

      {/* Notificación de actualización descargada - Persistente hasta que se instale */}
      <Snackbar
        open={showDownloadedNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ 
          mb: 2, 
          mr: 2,
          '& .MuiAlert-root': {
            minWidth: 350
          }
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={handleCloseDownloaded}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleInstallUpdate}
              startIcon={<UpdateIcon />}
              sx={{ 
                color: 'success.contrastText',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Instalar y Reiniciar
            </Button>
          }
          sx={{ 
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              py: 0.5
            }
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
              ✅ Actualización lista
            </Typography>
            <Typography variant="body2" sx={{ color: 'success.contrastText', opacity: 0.9 }}>
              Versión {updateDownloaded?.version} descargada. Instala cuando quieras.
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateNotification; 
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  QrCodeScanner as QRIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useMobileSucursal } from '../../contexts/MobileSucursalContext';

const MobileQRScanner: React.FC = () => {
  const theme = useTheme();
  const { seleccionarSucursalPorQR, loading, error, sucursalMovil, qrEscaneado } = useMobileSucursal();
  
  // Estados del escáner
  const [escanerActivo, setEscanerActivo] = useState(false);
  const [errorCamera, setErrorCamera] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [flash, setFlash] = useState(false);
  
  // Referencias
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      detenerEscaner();
    };
  }, []);

  // Función para iniciar el escáner
  const iniciarEscaner = async () => {
    try {
      setErrorCamera(null);
      setEscanerActivo(true);

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Simular escáner QR (en producción usarías una librería como zxing-js)
      // Por ahora, permitimos entrada manual después de unos segundos
      setTimeout(() => {
        setManualInput(true);
      }, 3000);

    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setErrorCamera('No se pudo acceder a la cámara. Usa entrada manual.');
      setManualInput(true);
    }
  };

  // Función para detener el escáner
  const detenerEscaner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setEscanerActivo(false);
    setManualInput(false);
  };

  // Función para procesar QR manual
  const procesarQRManual = async () => {
    if (!codigoManual.trim()) {
      return;
    }

    const exito = await seleccionarSucursalPorQR(codigoManual.trim());
    if (exito) {
      setCodigoManual('');
      detenerEscaner();
    }
  };

  // Función para alternar flash (placeholder - no funcional por limitaciones de tipos)
  const toggleFlash = async () => {
    // Flash no disponible en esta versión por limitaciones de TypeScript
    console.log('Flash toggle no disponible');
  };

  // Códigos QR de prueba para desarrollo
  const codigosPrueba = [
    { nombre: 'Sucursal Central', codigo: 'SUC001' },
    { nombre: 'Sucursal Itaipu', codigo: 'SUC002' },
    { nombre: 'Sucursal Calle 10', codigo: 'SUC003' }
  ];

  if (qrEscaneado && sucursalMovil) {
    return (
      <Box sx={{ p: 3 }}>
        <Card sx={{ 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.success.main}22 0%, ${theme.palette.background.paper} 100%)`,
          border: `2px solid ${theme.palette.success.main}44`
        }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <QRIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            
            <Typography variant="h5" gutterBottom color="success.main" sx={{ fontWeight: 'bold' }}>
              ✅ Sucursal Seleccionada
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              {sucursalMovil.nombre}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {sucursalMovil.direccion}
            </Typography>
            
            <Chip 
              label={`Código: ${sucursalMovil.codigo}`}
              color="success"
              sx={{ mt: 2 }}
            />
            
            <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
              <strong>Acceso confirmado:</strong><br/>
              Ahora puedes gestionar las cajas de esta sucursal.<br/>
              <small>El acceso expira en 1 hora.</small>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <QRIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="primary">
              Seleccionar Sucursal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escanea el código QR de la sucursal para acceder a las cajas
            </Typography>
          </Box>

          {/* Error general */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Error de cámara */}
          {errorCamera && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {errorCamera}
            </Alert>
          )}

          {/* Botones principales */}
          {!escanerActivo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CameraIcon />}
                onClick={iniciarEscaner}
                disabled={loading}
                sx={{ py: 2, borderRadius: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Escanear QR'}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<EditIcon />}
                onClick={() => setManualInput(true)}
                sx={{ py: 2, borderRadius: 3 }}
              >
                Ingresar Código Manual
              </Button>
            </Box>
          )}

          {/* Visor de cámara */}
          {escanerActivo && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'black',
                minHeight: 250
              }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                  playsInline
                />
                
                {/* Overlay de escáner */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <Box sx={{
                    width: 200,
                    height: 200,
                    border: `3px solid ${theme.palette.primary.main}`,
                    borderRadius: 2,
                    position: 'relative',
                    '&::before, &::after': {
                      content: '""',
                      position: 'absolute',
                      width: 20,
                      height: 20,
                      border: `3px solid ${theme.palette.secondary.main}`
                    },
                    '&::before': {
                      top: -3,
                      left: -3,
                      borderRight: 'none',
                      borderBottom: 'none'
                    },
                    '&::after': {
                      bottom: -3,
                      right: -3,
                      borderLeft: 'none',
                      borderTop: 'none'
                    }
                  }} />
                </Box>

                {/* Controles de cámara */}
                <Box sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  gap: 1
                }}>
                  <IconButton
                    onClick={toggleFlash}
                    sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                  >
                    {flash ? <FlashOffIcon /> : <FlashOnIcon />}
                  </IconButton>
                  
                  <IconButton
                    onClick={detenerEscaner}
                    sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
                Enfoca el código QR dentro del recuadro
              </Typography>
            </Box>
          )}

          {/* Entrada manual */}
          <Dialog open={manualInput} onClose={() => setManualInput(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Ingresar Código Manual
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Código de Sucursal"
                fullWidth
                variant="outlined"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Ej: SUC001, SUC002, etc."
                sx={{ mb: 3 }}
              />
              
              {/* Códigos de prueba para desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    🛠️ Códigos de Prueba (Solo Desarrollo):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {codigosPrueba.map((codigo) => (
                      <Chip
                        key={codigo.codigo}
                        label={`${codigo.nombre} (${codigo.codigo})`}
                        onClick={() => setCodigoManual(codigo.codigo)}
                        clickable
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManualInput(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={procesarQRManual} 
                variant="contained"
                disabled={!codigoManual.trim() || loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Confirmar'}
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MobileQRScanner; 
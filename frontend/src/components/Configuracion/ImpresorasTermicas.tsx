import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import { Print as PrintIcon, Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import electronPrinterService from '../../services/ElectronPrinterService';

interface Printer {
  name: string;
  isDefault: boolean;
}

interface PrinterConfig {
  width: string;
  margin: string;
  printerName: string;
  preview: boolean;
  silent: boolean;
  copies: number;
  timeOutPerLine: number;
}

const ImpresorasTermicas: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [config, setConfig] = useState<PrinterConfig>({
    width: '58mm',
    margin: '0 0 0 0',
    printerName: '',
    preview: false,
    silent: true,
    copies: 1,
    timeOutPerLine: 400
  });
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [testPrintLoading, setTestPrintLoading] = useState<boolean>(false);

  // Cargar impresoras disponibles y configuración guardada
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar configuración de impresora
        const configResult = await electronPrinterService.getPrinterConfig();
        if (configResult.success && configResult.config) {
          setConfig(configResult.config);
        }
        
        // Cargar impresoras disponibles
        const printersResult = await electronPrinterService.getPrinters();
        if (printersResult.success) {
          setPrinters(printersResult.printers);
        } else if (printersResult.error) {
          setMessage({
            text: `Error al cargar impresoras: ${printersResult.error}`,
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setMessage({
          text: `Error al cargar datos: ${error instanceof Error ? error.message : 'Desconocido'}`,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Manejar cambios en la configuración
  const handleConfigChange = (field: keyof PrinterConfig, value: any) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [field]: value
    }));
  };

  // Guardar configuración
  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const result = await electronPrinterService.savePrinterConfig(config);
      
      if (result.success) {
        setMessage({
          text: 'Configuración guardada correctamente',
          type: 'success'
        });
      } else {
        setMessage({
          text: `Error al guardar configuración: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMessage({
        text: `Error al guardar configuración: ${error instanceof Error ? error.message : 'Desconocido'}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Realizar prueba de impresión
  const handleTestPrint = async () => {
    try {
      setTestPrintLoading(true);
      
      // Validar que haya una impresora seleccionada
      if (!config.printerName) {
        setMessage({
          text: 'Por favor, seleccione una impresora antes de realizar la prueba',
          type: 'error'
        });
        return;
      }
      
      // Guardar la configuración actual antes de imprimir
      await electronPrinterService.savePrinterConfig(config);
      
      // Realizar la prueba de impresión
      const printResult = await electronPrinterService.printTest();
      
      if (printResult.success) {
        setMessage({
          text: 'Prueba de impresión enviada correctamente',
          type: 'success'
        });
      } else {
        setMessage({
          text: `Error al realizar prueba de impresión: ${printResult.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al realizar prueba de impresión:', error);
      setMessage({
        text: `Error al realizar prueba de impresión: ${error instanceof Error ? error.message : 'Desconocido'}`,
        type: 'error'
      });
    } finally {
      setTestPrintLoading(false);
    }
  };

  // Recargar lista de impresoras
  const handleRefreshPrinters = async () => {
    try {
      setLoading(true);
      const result = await electronPrinterService.getPrinters();
      
      if (result.success) {
        setPrinters(result.printers);
        setMessage({
          text: 'Lista de impresoras actualizada',
          type: 'success'
        });
      } else {
        setMessage({
          text: `Error al cargar impresoras: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al cargar impresoras:', error);
      setMessage({
        text: `Error al cargar impresoras: ${error instanceof Error ? error.message : 'Desconocido'}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cerrar mensaje
  const handleCloseMessage = () => {
    setMessage(null);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Configuración de Impresoras Térmicas
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Selección de Impresora
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="printer-select-label">Impresora</InputLabel>
                  <Select
                    labelId="printer-select-label"
                    id="printer-select"
                    value={config.printerName}
                    label="Impresora"
                    onChange={(e) => handleConfigChange('printerName', e.target.value)}
                    disabled={printers.length === 0}
                  >
                    {printers.length === 0 ? (
                      <MenuItem value="">No hay impresoras disponibles</MenuItem>
                    ) : (
                      printers.map((printer) => (
                        <MenuItem key={printer.name} value={printer.name}>
                          {printer.name} {printer.isDefault ? '(Predeterminada)' : ''}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                
                <Box mt={2} display="flex" justifyContent="flex-start">
                  <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />} 
                    onClick={handleRefreshPrinters}
                  >
                    Actualizar Lista
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuración de Impresión
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Ancho de papel"
                      value={config.width}
                      onChange={(e) => handleConfigChange('width', e.target.value)}
                      fullWidth
                      margin="normal"
                      helperText="Ejemplo: 58mm, 80mm"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Margen"
                      value={config.margin}
                      onChange={(e) => handleConfigChange('margin', e.target.value)}
                      fullWidth
                      margin="normal"
                      helperText="Formato: arriba derecha abajo izquierda"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Copias"
                      type="number"
                      value={config.copies}
                      onChange={(e) => handleConfigChange('copies', parseInt(e.target.value) || 1)}
                      fullWidth
                      margin="normal"
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Tiempo por línea (ms)"
                      type="number"
                      value={config.timeOutPerLine}
                      onChange={(e) => handleConfigChange('timeOutPerLine', parseInt(e.target.value) || 400)}
                      fullWidth
                      margin="normal"
                      inputProps={{ min: 100, max: 1000 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.preview}
                          onChange={(e) => handleConfigChange('preview', e.target.checked)}
                          name="preview"
                          color="primary"
                        />
                      }
                      label="Mostrar vista previa"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.silent}
                          onChange={(e) => handleConfigChange('silent', e.target.checked)}
                          name="silent"
                          color="primary"
                        />
                      }
                      label="Modo silencioso"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />} 
                onClick={handleSaveConfig}
                disabled={loading}
              >
                Guardar Configuración
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<PrintIcon />} 
                onClick={handleTestPrint}
                disabled={testPrintLoading || !config.printerName}
              >
                {testPrintLoading ? <CircularProgress size={24} color="inherit" /> : 'Imprimir Prueba'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
      
      <Snackbar open={!!message} autoHideDuration={6000} onClose={handleCloseMessage}>
        <Alert onClose={handleCloseMessage} severity={message?.type || 'info'} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ImpresorasTermicas; 
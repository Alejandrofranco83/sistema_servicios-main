import React, { useState } from 'react';
import { 
  Button, 
  ButtonProps, 
  Tooltip, 
  CircularProgress, 
  Snackbar, 
  Alert 
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import electronPrinterService from '../../services/ElectronPrinterService';

interface TicketData {
  header?: string;
  lines: string[];
  qr?: string;
  barcode?: string;
  total?: string;
  footer?: string;
}

interface TicketButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Datos del ticket a imprimir */
  ticketData: TicketData;
  /** Función a llamar después de imprimir (opcional) */
  onPrintComplete?: (result: {success: boolean, error?: string}) => void;
  /** Texto del botón (opcional) */
  buttonText?: string;
  /** Si es true, no muestra notificaciones internas */
  hideNotifications?: boolean;
}

/**
 * Botón para imprimir tickets térmicos
 */
const TicketButton: React.FC<TicketButtonProps> = ({ 
  ticketData, 
  onPrintComplete, 
  buttonText = 'Imprimir',
  hideNotifications = false,
  ...buttonProps 
}) => {
  const isElectron = !!(window as any).printerAPI;
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const handlePrint = async () => {
    if (!isElectron) {
      const result = {
        success: false,
        error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio'
      };
      setError(result.error);
      onPrintComplete?.(result);
      return;
    }
    
    setPrinting(true);
    setError(null);
    
    try {
      // Verificar configuración de impresora
      const configResult = await electronPrinterService.getPrinterConfig();
      
      if (!configResult.success || !configResult.config || !configResult.config.printerName) {
        const result = {
          success: false,
          error: 'No ha configurado ninguna impresora. Por favor, configure una impresora en Configuración > Impresoras.'
        };
        setError(result.error);
        onPrintComplete?.(result);
        setPrinting(false);
        return;
      }
      
      // Imprimir ticket
      const result = await electronPrinterService.printTicket(ticketData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Error desconocido al imprimir');
      }
      
      onPrintComplete?.(result);
    } catch (error) {
      console.error('Error al imprimir ticket:', error);
      const errorResult = {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
      setError(errorResult.error);
      onPrintComplete?.(errorResult);
    } finally {
      setPrinting(false);
    }
  };
  
  return (
    <>
      <Tooltip 
        title={!isElectron ? "Impresión disponible solo en aplicación de escritorio" : ""}
        arrow
      >
        <span>
          <Button
            variant="contained"
            color="primary"
            startIcon={printing ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
            onClick={handlePrint}
            disabled={!isElectron || printing}
            {...buttonProps}
          >
            {printing ? 'Imprimiendo...' : buttonText}
          </Button>
        </span>
      </Tooltip>
      
      {/* Snackbar para mostrar errores */}
      {!hideNotifications && (
        <>
          <Snackbar 
            open={!!error} 
            autoHideDuration={4000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setError(null)} 
              severity="error" 
              sx={{ width: '100%' }}
              variant="filled"
            >
              {error}
            </Alert>
          </Snackbar>
          
          <Snackbar 
            open={success} 
            autoHideDuration={2000} 
            onClose={() => setSuccess(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSuccess(false)} 
              severity="success" 
              sx={{ width: '100%' }}
              variant="filled"
            >
              Impresión enviada correctamente
            </Alert>
          </Snackbar>
        </>
      )}
    </>
  );
};

export default TicketButton; 
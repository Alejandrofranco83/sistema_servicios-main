import { contextBridge, ipcRenderer } from 'electron';

// Exponer API segura para la impresión
contextBridge.exposeInMainWorld('printerAPI', {
  /**
   * Imprime un ticket de venta
   * @param ticket Contenido del ticket a imprimir
   */
  printReceipt: (ticket: any) => ipcRenderer.invoke('print-receipt', ticket),
  
  /**
   * Obtiene la lista de impresoras disponibles
   */
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  
  /**
   * Obtiene la configuración de impresora guardada
   */
  getPrinterConfig: () => ipcRenderer.invoke('get-printer-config'),
  
  /**
   * Guarda la configuración de impresora
   * @param config Configuración de impresora a guardar
   */
  savePrinterConfig: (config: any) => ipcRenderer.invoke('save-printer-config', config)
}); 
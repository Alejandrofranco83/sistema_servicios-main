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

// Exponer API segura para el manejo de zoom
contextBridge.exposeInMainWorld('zoomAPI', {
  /**
   * Obtiene el nivel de zoom actual
   */
  getZoomLevel: () => ipcRenderer.invoke('get-zoom-level'),
  
  /**
   * Establece un nivel de zoom específico
   * @param zoomLevel Nivel de zoom (-3 a 3, donde 0 es 100%)
   */
  setZoomLevel: (zoomLevel: number) => ipcRenderer.invoke('set-zoom-level', zoomLevel),
  
  /**
   * Aumenta el zoom
   */
  zoomIn: () => ipcRenderer.invoke('zoom-in'),
  
  /**
   * Disminuye el zoom
   */
  zoomOut: () => ipcRenderer.invoke('zoom-out'),
  
  /**
   * Resetea el zoom al 100%
   */
  resetZoom: () => ipcRenderer.invoke('reset-zoom')
}); 
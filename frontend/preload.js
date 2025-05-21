// Archivo preload.js
// Este archivo se ejecuta en el proceso de renderizado antes de que se cargue la página web
// y tiene acceso al contexto de Node.js
const { contextBridge } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const remote = require('@electron/remote');

// Función para obtener la ruta del archivo de configuración
const getConfigPath = () => {
  const userDataPath = path.join(os.homedir(), 'SistemaServiciosData');
  
  // Crear directorio si no existe
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  return path.join(userDataPath, 'printer-config.json');
};

// Exponer API segura para el renderer process
contextBridge.exposeInMainWorld('printerAPI', {
  getPrinters: async () => {
    try {
      const { getPrinters } = require('pdf-to-printer');
      const printers = await getPrinters();
      return {
        success: true,
        printers: printers.map(p => ({ 
          name: p.name, 
          isDefault: p.isDefault || false 
        }))
      };
    } catch (error) {
      console.error('Error al obtener impresoras:', error);
      return {
        success: false,
        printers: [],
        error: error.message
      };
    }
  },
  
  getPrinterConfig: async () => {
    try {
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: true, config: null };
      }
      
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      return { success: true, config };
    } catch (error) {
      console.error('Error al leer configuración de impresora:', error);
      return { success: false, error: error.message };
    }
  },
  
  savePrinterConfig: async (config) => {
    try {
      const configPath = getConfigPath();
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error al guardar configuración de impresora:', error);
      return { success: false, error: error.message };
    }
  },

  printTest: async () => {
    try {
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'No hay configuración de impresora guardada.' };
      }
      const configData = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configData);

      if (!fileConfig.printerName) {
        return { success: false, error: 'No hay impresora seleccionada en la configuración.' };
      }

      const PosPrinter = remote.require('electron-pos-printer').PosPrinter;

      // Contenido de prueba simple y único
      const testHtmlContent = [
        { type: 'text', value: 'PRUEBA DE IMPRESIÓN', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '20px', marginBottom: '5px' } },
        { type: 'text', value: 'Sistema de Servicios', style: { textAlign: 'center', fontSize: '16px', marginBottom: '10px' } },
        { type: 'text', value: '--------------------------', style: { textAlign: 'center', fontSize: '16px', marginBottom: '10px' } },
        { type: 'text', value: `Impresora: ${fileConfig.printerName}` , style: { fontSize: '12px'} },
        { type: 'text', value: `Ancho Configurado: ${fileConfig.width || 'N/A'}` , style: { fontSize: '12px'} },
        { type: 'text', value: `Márgenes: ${fileConfig.margin || 'N/A'}` , style: { fontSize: '12px'} },
        { type: 'text', value: `Copias: ${fileConfig.copies || 1}` , style: { fontSize: '12px'} },
        { type: 'text', value: `Silencioso: ${fileConfig.silent !== undefined ? fileConfig.silent : true}` , style: { fontSize: '12px'} },
        { type: 'text', value: '--------------------------', style: { textAlign: 'center', fontSize: '16px', marginTop: '10px', marginBottom: '10px' } },
        { type: 'text', value: 'electron-pos-printer', style: { textAlign: 'center', fontSize: '12px', marginBottom: '5px'  } },
        { type: 'text', value: new Date().toLocaleString(), style: { textAlign: 'center', fontSize: '10px' } },
      ];
      
      const options = {
        printerName: fileConfig.printerName,
        silent: fileConfig.silent !== undefined ? fileConfig.silent : true,
        preview: fileConfig.preview !== undefined ? fileConfig.preview : false,
        copies: parseInt(fileConfig.copies) || 1, // Asegurar que copias sea un número
        timeOutPerLine: fileConfig.timeOutPerLine || 400,
      };
            
      delete options.width;
      delete options.height;
      delete options.pageSize;

      let paperWidthMm = 58; 
      if (typeof fileConfig.width === 'string' && fileConfig.width.endsWith('mm')) {
        const parsedWidth = parseInt(fileConfig.width.replace('mm', ''), 10);
        if (!isNaN(parsedWidth) && parsedWidth > 0) {
          paperWidthMm = parsedWidth;
        }
      } else if (typeof fileConfig.width === 'number' && fileConfig.width > 0) {
        paperWidthMm = fileConfig.width;
      }

      const paperWidthMicrons = Math.round(paperWidthMm * 1000);
      const paperHeightMicrons = Math.round(297 * 1000); 

      if (paperWidthMicrons <= 352 || paperHeightMicrons <= 352) {
        return { success: false, error: `Error: Ancho (${paperWidthMicrons}µm) o alto (${paperHeightMicrons}µm) es demasiado pequeño (mínimo 352µm).` };
      }
      
      options.pageSize = {
        width: paperWidthMicrons,
        height: paperHeightMicrons
      };

      if (fileConfig.margin) {
        options.margin = fileConfig.margin;
      }

      await PosPrinter.print(testHtmlContent, options);
      return { success: true, message: 'Prueba de impresión enviada.' };

    } catch (error) {
      console.error('Error en printTest:', error);
      return { success: false, error: error.message };
    }
  },
  
  printReceipt: async (ticket) => {
    try {
      // Obtener la configuración de la impresora guardada en el archivo
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'No hay configuración de impresora guardada' };
      }
      const configData = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configData);
      
      if (!fileConfig.printerName && !(ticket.options && ticket.options.printerName)) {
        // Si no hay printerName en fileConfig Y tampoco en ticket.options, entonces error.
        // Si ticket.options.printerName existe, se usará más adelante.
        return { success: false, error: 'No hay impresora seleccionada en el archivo de configuración y no se especificó en las opciones del ticket.' };
      }
      
      // Usar remote.require para acceder a electron-pos-printer
      const PosPrinter = remote.require('electron-pos-printer').PosPrinter;
      
      // Preparar el contenido HTML para la impresión (esto se mantiene igual)
      const htmlContent = [];
      if (ticket.htmlContent && Array.isArray(ticket.htmlContent)) {
        // Si se proporciona htmlContent, se usa directamente
        // (Aquí asumimos que ya está formateado como lo espera PosPrinter)
        ticket.htmlContent.forEach(item => htmlContent.push(item));
      } else {
        // Lógica anterior para construir htmlContent a partir de header, lines, footer, etc.
        // Esta parte es para compatibilidad si no se pasa htmlContent
        if (ticket.header) {
          htmlContent.push({
            type: 'text',
            value: ticket.header,
            style: { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }
          });
        }
        for (const line of ticket.lines) {
          htmlContent.push({
            type: 'text',
            value: line,
            style: { fontSize: '14px', marginTop: '5px' }
          });
        }
        if (ticket.barcode) {
          htmlContent.push({
            type: 'barCode',
            value: ticket.barcode,
            height: 40,
            width: 2,
            displayValue: true,
            position: 'center'
          });
        }
        if (ticket.qr) {
          htmlContent.push({
            type: 'qrCode',
            value: ticket.qr,
            height: 80,
            width: 80,
            position: 'center'
          });
        }
        if (ticket.total) {
          htmlContent.push({
            type: 'text',
            value: `TOTAL: ${ticket.total}`,
            style: { fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }
          });
        }
        if (ticket.footer) {
          htmlContent.push({
            type: 'text',
            value: ticket.footer,
            style: { fontSize: '14px', fontWeight: 'normal', textAlign: 'center', marginTop: '10px' }
          });
        }
      }
      
      // Combinar opciones: las del ticket tienen prioridad sobre las del archivo de configuración
      const baseOptions = { ...(fileConfig || {}) };
      const ticketOptions = { ...(ticket.options || {}) };
      
      const combinedOptions = {
        ...baseOptions,
        ...ticketOptions,
        printerName: ticketOptions.printerName || baseOptions.printerName,
        silent: ticketOptions.silent !== undefined ? ticketOptions.silent : (baseOptions.silent !== undefined ? baseOptions.silent : true),
        preview: ticketOptions.preview !== undefined ? ticketOptions.preview : (baseOptions.preview !== undefined ? baseOptions.preview : false),
      };

      // Eliminar width, height y pageSize de las opciones combinadas inicialmente
      // para evitar conflictos, ya que los reconstruiremos.
      // También eliminamos margin por ahora, ya que pageSize como objeto lo manejará o se usará CSS.
      delete combinedOptions.width;
      delete combinedOptions.height;
      delete combinedOptions.pageSize;
      // delete combinedOptions.margin; // Descomentar si es necesario y electron-pos-printer lo usa con pageSize objeto

      // Prioridad para pageSize si está definido explícitamente en ticket.options o fileConfig y es un objeto válido
      if (typeof ticketOptions.pageSize === 'object' && ticketOptions.pageSize !== null && ticketOptions.pageSize.width && ticketOptions.pageSize.height && typeof ticketOptions.pageSize.width === 'number' && typeof ticketOptions.pageSize.height === 'number') {
        combinedOptions.pageSize = ticketOptions.pageSize; 
      } else if (typeof baseOptions.pageSize === 'object' && baseOptions.pageSize !== null && baseOptions.pageSize.width && baseOptions.pageSize.height && typeof baseOptions.pageSize.width === 'number' && typeof baseOptions.pageSize.height === 'number') {
        combinedOptions.pageSize = baseOptions.pageSize;
      } else {
        // Si no, construimos pageSize a partir de fileConfig.width (o un default)
        let paperWidthMm = 58; // Default a 58mm
        const configWidthSetting = baseOptions.width || ticketOptions.width;

        if (typeof configWidthSetting === 'string' && configWidthSetting.endsWith('mm')) {
          const parsedWidth = parseInt(configWidthSetting.replace('mm', ''), 10);
          if (!isNaN(parsedWidth) && parsedWidth > 0) {
            paperWidthMm = parsedWidth;
          }
        } else if (typeof configWidthSetting === 'number' && configWidthSetting > 0) { 
             paperWidthMm = configWidthSetting;
        }

        const paperWidthMicrons = Math.round(paperWidthMm * 1000);
        // Para impresoras de tickets, la altura es variable. Electron requiere un valor.
        // Usaremos 297mm (A4 height) como un valor grande y común, adaptable si es necesario.
        // 352 micrones es el mínimo.
        const paperHeightMicrons = Math.round(297 * 1000); // ej: 297000 micrones (altura A4)

        if (paperWidthMicrons <= 352 || paperHeightMicrons <= 352) {
            console.error('Error: El ancho o alto calculado en micrones es demasiado pequeño.', { paperWidthMicrons, paperHeightMicrons });
            return { success: false, error: `Error: El ancho (${paperWidthMicrons}µm) o alto (${paperHeightMicrons}μm) calculado es demasiado pequeño (mínimo 352µm). Verifique la configuración de ancho de papel.` };
        }
        
        combinedOptions.pageSize = {
          width: paperWidthMicrons,
          height: paperHeightMicrons 
        };
        
        // Si se quiere usar la opción margin de electron-pos-printer y es compatible
        // con pageSize como objeto, se puede añadir aquí:
        if (baseOptions.margin || ticketOptions.margin) {
           combinedOptions.margin = ticketOptions.margin || baseOptions.margin;
        }
      }
      
      if (!combinedOptions.printerName) {
        return { success: false, error: 'Nombre de impresora no definido después de combinar opciones.' };
      }
      
      // Para depuración, mostrar las opciones finales
      // console.log('Opciones de impresión finales para PosPrinter:', JSON.stringify(combinedOptions, null, 2));


      // Enviar a imprimir
      await PosPrinter.print(htmlContent, combinedOptions);
      return { success: true };
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: error.message };
    }
  }
});

// Para información de versiones de Electron
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
}) 
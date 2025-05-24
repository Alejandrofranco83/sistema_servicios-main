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

// Función para detectar el sistema operativo
const isWindows = () => os.platform() === 'win32';
const isLinux = () => os.platform() === 'linux';

// Función auxiliar para imprimir en Linux
async function printToLinuxPrinter(printerName, content) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const tmpPath = path.join(os.tmpdir(), `ticket_${Date.now()}.txt`);
    
    // Escribir contenido a archivo temporal
    fs.writeFileSync(tmpPath, content, 'utf8');
    
    let command;
    
    if (printerName && printerName !== 'Por Defecto') {
      // Imprimir a impresora específica
      command = `lpr -P "${printerName}" "${tmpPath}"`;
    } else {
      // Imprimir a impresora por defecto
      command = `lpr "${tmpPath}"`;
    }
    
    console.log(`Ejecutando comando de impresión: ${command}`);
    
    try {
      await execAsync(command);
      
      // Limpiar archivo temporal
      setTimeout(() => {
        try {
          fs.unlinkSync(tmpPath);
        } catch (e) {
          console.warn('No se pudo eliminar archivo temporal:', e.message);
        }
      }, 3000);
      
      return { 
        success: true, 
        message: 'Documento enviado a la impresora silenciosamente' 
      };
      
    } catch (printError) {
      // Si falla con impresora específica, intentar con impresora por defecto
      if (printerName && printerName !== 'Por Defecto') {
        console.warn(`Fallo con impresora ${printerName}, intentando con impresora por defecto...`);
        try {
          await execAsync(`lpr "${tmpPath}"`);
          
          setTimeout(() => {
            try {
              fs.unlinkSync(tmpPath);
            } catch (e) {
              console.warn('No se pudo eliminar archivo temporal:', e.message);
            }
          }, 3000);
          
          return { 
            success: true, 
            message: 'Documento enviado a la impresora por defecto silenciosamente' 
          };
        } catch (defaultError) {
          return { 
            success: false, 
            error: `Error al imprimir: ${defaultError.message}. Verifique que hay impresoras configuradas.` 
          };
        }
      } else {
        return { 
          success: false, 
          error: `Error al imprimir: ${printError.message}. Verifique que hay impresoras configuradas.` 
        };
      }
    }
    
  } catch (error) {
    console.error('Error en impresión Linux:', error);
    return { 
      success: false, 
      error: `Error de impresión en Linux: ${error.message}` 
    };
  }
}

// Exponer API segura para el renderer process
contextBridge.exposeInMainWorld('printerAPI', {
  getPrinters: async () => {
    try {
      if (isWindows()) {
        // Usar pdf-to-printer solo en Windows (funcionalidad original)
        const { getPrinters } = require('pdf-to-printer');
        const printers = await getPrinters();
        return {
          success: true,
          printers: printers.map(p => ({ 
            name: p.name, 
            isDefault: p.isDefault || false 
          }))
        };
      } else if (isLinux()) {
        // En Linux, obtener impresoras reales del sistema
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          // Obtener impresoras usando lpstat
          const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || true');
          const printers = [];
          
          if (stdout) {
            const lines = stdout.split('\n');
            let defaultPrinter = '';
            
            // Buscar impresora por defecto
            const defaultMatch = stdout.match(/system default destination: (.+)/);
            if (defaultMatch) {
              defaultPrinter = defaultMatch[1].trim();
            }
            
            // Extraer impresoras
            lines.forEach(line => {
              const match = line.match(/printer (.+) is/);
              if (match) {
                const printerName = match[1].trim();
                printers.push({
                  name: printerName,
                  isDefault: printerName === defaultPrinter
                });
              }
            });
          }
          
          // Si no hay impresoras específicas, agregar opción genérica
          if (printers.length === 0) {
            printers.push({
              name: 'Por Defecto',
              isDefault: true
            });
          }
          
          return {
            success: true,
            printers: printers
          };
        } catch (linuxError) {
          console.warn('No se pudieron obtener impresoras de Linux:', linuxError.message);
          // Retornar impresora por defecto
          return {
            success: true,
            printers: [
              { name: 'Por Defecto', isDefault: true }
            ]
          };
        }
      } else {
        return {
          success: false,
          printers: [],
          error: 'Sistema operativo no soportado para impresión'
        };
      }
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

      if (isWindows()) {
        // Usar electron-pos-printer en Windows (funcionalidad original completa)
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
          copies: parseInt(fileConfig.copies) || 1,
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

      } else if (isLinux()) {
        // Implementación para Linux usando impresión básica
        const testContent = [
          'PRUEBA DE IMPRESIÓN',
          'Sistema de Servicios',
          '--------------------------',
          `Impresora: ${fileConfig.printerName}`,
          `Ancho Configurado: ${fileConfig.width || 'N/A'}`,
          `Márgenes: ${fileConfig.margin || 'N/A'}`,
          `Copias: ${fileConfig.copies || 1}`,
          `Silencioso: ${fileConfig.silent !== undefined ? fileConfig.silent : true}`,
          '--------------------------',
          'Sistema Linux - Impresión básica',
          new Date().toLocaleString(),
          '',
          '',
          ''
        ].join('\n');

        return await printToLinuxPrinter(fileConfig.printerName, testContent);
      } else {
        return { success: false, error: 'Sistema operativo no soportado para impresión' };
      }

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
        return { success: false, error: 'No hay impresora seleccionada.' };
      }

      if (isWindows()) {
        // Usar electron-pos-printer en Windows (funcionalidad original completa)
        const PosPrinter = remote.require('electron-pos-printer').PosPrinter;
        
        // Preparar el contenido HTML para la impresión (esto se mantiene igual)
        const htmlContent = [];
        if (ticket.htmlContent && Array.isArray(ticket.htmlContent)) {
          // Si se proporciona htmlContent, se usa directamente
          ticket.htmlContent.forEach(item => htmlContent.push(item));
        } else {
          // Lógica anterior para construir htmlContent a partir de header, lines, footer, etc.
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

        delete combinedOptions.width;
        delete combinedOptions.height;
        delete combinedOptions.pageSize;

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
          const paperHeightMicrons = Math.round(297 * 1000);

          if (paperWidthMicrons <= 352 || paperHeightMicrons <= 352) {
              console.error('Error: El ancho o alto calculado en micrones es demasiado pequeño.', { paperWidthMicrons, paperHeightMicrons });
              return { success: false, error: `Error: El ancho (${paperWidthMicrons}µm) o alto (${paperHeightMicrons}μm) calculado es demasiado pequeño (mínimo 352µm). Verifique la configuración de ancho de papel.` };
          }
          
          combinedOptions.pageSize = {
            width: paperWidthMicrons,
            height: paperHeightMicrons 
          };
          
          if (baseOptions.margin || ticketOptions.margin) {
             combinedOptions.margin = ticketOptions.margin || baseOptions.margin;
          }
        }
        
        if (!combinedOptions.printerName) {
          return { success: false, error: 'Nombre de impresora no definido después de combinar opciones.' };
        }

        // Enviar a imprimir
        await PosPrinter.print(htmlContent, combinedOptions);
        return { success: true };
        
      } else if (isLinux()) {
        // Implementación para Linux
        const printerName = ticket.options?.printerName || fileConfig.printerName;
        
        let content = '';
        if (ticket.header) {
          content += ticket.header + '\n';
        }
        
        if (ticket.lines && Array.isArray(ticket.lines)) {
          content += ticket.lines.join('\n') + '\n';
        }
        
        if (ticket.total) {
          content += `\nTOTAL: ${ticket.total}\n`;
        }
        
        if (ticket.footer) {
          content += ticket.footer + '\n';
        }
        
        content += '\n\n\n'; // Espacios para corte de papel
        
        return await printToLinuxPrinter(printerName, content);
      } else {
        return { success: false, error: 'Sistema operativo no soportado para impresión' };
      }

    } catch (error) {
      console.error('Error al imprimir ticket:', error);
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
// Archivo preload.js
// Este archivo se ejecuta en el proceso de renderizado antes de que se cargue la página web
// y tiene acceso al contexto de Node.js
const { contextBridge, ipcRenderer } = require('electron');
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

// Función auxiliar para imprimir en Linux usando CUPS
async function printToLinuxPrinter(printerName, content) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const tmpPath = path.join(os.tmpdir(), `ticket_${Date.now()}.txt`);
    
    console.log(`=== FUNCIÓN PRINT LINUX - INICIANDO ===`);
    console.log(`Impresora: ${printerName}`);
    console.log(`Tipo de contenido recibido:`, typeof content);
    console.log(`Contenido recibido:`, content);
    
    let textoParaImprimir = '';
    
    // Si es un string, usarlo directamente
    if (typeof content === 'string') {
      textoParaImprimir = content;
    } else {
      // Si no es string, intentar convertir a string
      textoParaImprimir = String(content);
    }
    
    console.log(`Texto final para imprimir (longitud: ${textoParaImprimir.length}):`);
    console.log(`"${textoParaImprimir}"`);
    
    // Escribir contenido a archivo temporal
    fs.writeFileSync(tmpPath, textoParaImprimir, 'utf8');
    console.log(`Archivo temporal creado: ${tmpPath}`);
    
    // Verificar que el archivo se creó correctamente
    const fileExists = fs.existsSync(tmpPath);
    const fileSize = fileExists ? fs.statSync(tmpPath).size : 0;
    console.log(`Archivo existe: ${fileExists}, Tamaño: ${fileSize} bytes`);
    
    let command;
    
    if (printerName && printerName !== 'Por Defecto') {
      // Imprimir a impresora específica usando lp (CUPS)
      command = `lp -d "${printerName}" "${tmpPath}"`;
    } else {
      // Imprimir a impresora por defecto
      command = `lp "${tmpPath}"`;
    }
    
    console.log(`Ejecutando comando CUPS: ${command}`);
    
    try {
      const result = await execAsync(command);
      console.log('Resultado CUPS stdout:', result.stdout);
      console.log('Resultado CUPS stderr:', result.stderr);
      
      // Limpiar archivo temporal después de un delay
      setTimeout(() => {
        try {
          if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
            console.log('Archivo temporal eliminado exitosamente');
          }
        } catch (e) {
          console.warn('No se pudo eliminar archivo temporal:', e.message);
        }
      }, 5000); // Aumentado a 5 segundos
      
      return { 
        success: true, 
        message: 'Documento enviado a la impresora CUPS silenciosamente' 
      };
      
    } catch (printError) {
      console.error('Error en comando CUPS:', printError.message);
      console.error('CUPS stderr:', printError.stderr);
      
      // Intentar con impresora por defecto si falla
      if (printerName && printerName !== 'Por Defecto') {
        console.log('Intentando con impresora por defecto...');
        try {
          const defaultCommand = `lp "${tmpPath}"`;
          console.log(`Comando por defecto: ${defaultCommand}`);
          const defaultResult = await execAsync(defaultCommand);
          console.log('Resultado impresora por defecto:', defaultResult.stdout);
          
          setTimeout(() => {
            try {
              if (fs.existsSync(tmpPath)) {
                fs.unlinkSync(tmpPath);
                console.log('Archivo temporal eliminado exitosamente (fallback)');
              }
            } catch (e) {
              console.warn('No se pudo eliminar archivo temporal (fallback):', e.message);
            }
          }, 5000);
          
          return { 
            success: true, 
            message: 'Documento enviado a la impresora por defecto CUPS' 
          };
        } catch (defaultError) {
          console.error('Error con impresora por defecto:', defaultError.message);
          return { 
            success: false, 
            error: `Error CUPS: ${defaultError.message}. Verifique la configuración de CUPS.` 
          };
        }
      } else {
        return { 
          success: false, 
          error: `Error CUPS: ${printError.message}. Verifique la configuración de impresoras.` 
        };
      }
    }
    
  } catch (error) {
    console.error('Error general en impresión CUPS:', error);
    return { 
      success: false, 
      error: `Error de impresión: ${error.message}` 
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
        // En Linux, obtener impresoras usando CUPS con soporte multiidioma
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          console.log('Detectando impresoras CUPS...');
          
          // Usar lpstat -a para impresoras que aceptan trabajos
          const { stdout: activeStdout } = await execAsync('lpstat -a 2>/dev/null || true');
          console.log('lpstat -a output:', activeStdout);
          
          // También obtener información detallada
          const { stdout: detailStdout } = await execAsync('lpstat -p 2>/dev/null || true');
          console.log('lpstat -p output:', detailStdout);
          
          // Obtener impresora por defecto
          const { stdout: defaultStdout } = await execAsync('lpstat -d 2>/dev/null || true');
          console.log('lpstat -d output:', defaultStdout);
          
          const printers = [];
          let defaultPrinter = '';
          
          // Buscar impresora por defecto (múltiples idiomas)
          const defaultPatterns = [
            /system default destination: (.+)/,           // Inglés
            /destino padrão do sistema: (.+)/,           // Portugués
            /destination par défaut du système: (.+)/,    // Francés
            /destino predeterminado del sistema: (.+)/    // Español
          ];
          
          for (const pattern of defaultPatterns) {
            const match = defaultStdout.match(pattern);
            if (match) {
              defaultPrinter = match[1].trim();
              console.log('Impresora por defecto encontrada:', defaultPrinter);
              break;
            }
          }
          
          // Procesar impresoras activas (lpstat -a)
          if (activeStdout) {
            const lines = activeStdout.split('\n');
            lines.forEach(line => {
              // Patrones para diferentes idiomas
              const patterns = [
                /^(\S+)\s+accepting/,                    // Inglés: "printer accepting"
                /^(\S+)\s+está aceitando/,              // Portugués: "printer está aceitando"
                /^(\S+)\s+acepta/,                      // Español: "printer acepta"
                /^(\S+)\s+accepte/                      // Francés: "printer accepte"
              ];
              
              for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                  const printerName = match[1].trim();
                  console.log('Impresora activa encontrada:', printerName);
                  printers.push({
                    name: printerName,
                    isDefault: printerName === defaultPrinter
                  });
                  break;
                }
              }
            });
          }
          
          // Si lpstat -a no funcionó, usar lpstat -p como respaldo
          if (printers.length === 0 && detailStdout) {
            const lines = detailStdout.split('\n');
            lines.forEach(line => {
              // Patrones para diferentes idiomas en lpstat -p
              const patterns = [
                /printer (.+) is/,                      // Inglés: "printer X is"
                /impressora (.+) está/,                 // Portugués: "impressora X está"
                /impresora (.+) está/,                  // Español: "impresora X está"
                /imprimante (.+) est/                   // Francés: "imprimante X est"
              ];
              
              for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                  const printerName = match[1].trim();
                  if (!printers.find(p => p.name === printerName)) {
                    console.log('Impresora configurada encontrada:', printerName);
                    printers.push({
                      name: printerName,
                      isDefault: printerName === defaultPrinter
                    });
                  }
                  break;
                }
              }
            });
          }
          
          console.log('Total de impresoras encontradas:', printers.length);
          console.log('Impresoras:', printers);
          
          // Si no se encontraron impresoras, agregar opción genérica
          if (printers.length === 0) {
            console.log('No se encontraron impresoras, agregando opción por defecto');
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
          console.error('Error obteniendo impresoras CUPS:', linuxError);
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
  
  printReceipt: async (ticketContent) => {
    try {
      // Obtener la configuración de la impresora guardada en el archivo
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'No hay configuración de impresora guardada' };
      }
      const configData = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configData);
      
      if (!fileConfig.printerName && !(ticketContent.options && ticketContent.options.printerName)) {
        return { success: false, error: 'No hay impresora seleccionada.' };
      }

      if (isWindows()) {
        // Usar electron-pos-printer en Windows (funcionalidad original completa)
        const PosPrinter = remote.require('electron-pos-printer').PosPrinter;
        
        // Preparar el contenido HTML para la impresión (esto se mantiene igual)
        const htmlContent = [];
        if (ticketContent.htmlContent && Array.isArray(ticketContent.htmlContent)) {
          // Si se proporciona htmlContent, se usa directamente
          ticketContent.htmlContent.forEach(item => htmlContent.push(item));
        } else {
          // Lógica anterior para construir htmlContent a partir de header, lines, footer, etc.
          if (ticketContent.header) {
            htmlContent.push({
              type: 'text',
              value: ticketContent.header,
              style: { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }
            });
          }
          for (const line of ticketContent.lines) {
            htmlContent.push({
              type: 'text',
              value: line,
              style: { fontSize: '14px', marginTop: '5px' }
            });
          }
          if (ticketContent.barcode) {
            htmlContent.push({
              type: 'barCode',
              value: ticketContent.barcode,
              height: 40,
              width: 2,
              displayValue: true,
              position: 'center'
            });
          }
          if (ticketContent.qr) {
            htmlContent.push({
              type: 'qrCode',
              value: ticketContent.qr,
              height: 80,
              width: 80,
              position: 'center'
            });
          }
          if (ticketContent.total) {
            htmlContent.push({
              type: 'text',
              value: `TOTAL: ${ticketContent.total}`,
              style: { fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }
            });
          }
          if (ticketContent.footer) {
            htmlContent.push({
              type: 'text',
              value: ticketContent.footer,
              style: { fontSize: '14px', fontWeight: 'normal', textAlign: 'center', marginTop: '10px' }
            });
          }
        }
        
        // Combinar opciones: las del ticket tienen prioridad sobre las del archivo de configuración
        const baseOptions = { ...(fileConfig || {}) };
        const ticketOptions = { ...(ticketContent.options || {}) };
        
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
        // LINUX: Usar CUPS para impresión directa
        console.log('=== IMPRESIÓN LINUX - PROCESANDO CONTENIDO ===');
        console.log('Ticket content recibido:', ticketContent);
        
        // Función para convertir htmlContent a texto plano
        function convertirHtmlContentATexto(htmlContent) {
          if (!htmlContent || !Array.isArray(htmlContent)) {
            console.log('htmlContent no es array válido, usando contenido por defecto');
            return "Error: Contenido de ticket no válido";
          }
          
          console.log(`Procesando ${htmlContent.length} elementos de htmlContent`);
          
          let textoCompleto = [];
          let lineaActual = '';
          let esperandoInlineBlock = false;
          
          htmlContent.forEach((item, index) => {
            console.log(`Procesando item ${index}:`, item);
            
            if (item.type === 'text') {
              let texto = item.value || '';
              
              // Verificar si es un elemento inline-block
              const esInlineBlock = item.style && item.style.display === 'inline-block';
              
              if (esInlineBlock) {
                if (esperandoInlineBlock) {
                  // Si ya tenemos una línea iniciada, agregar a la derecha
                  const espaciosNecesarios = Math.max(1, 32 - lineaActual.length - texto.length);
                  lineaActual += ' '.repeat(espaciosNecesarios) + texto;
                  // Terminar la línea
                  textoCompleto.push(lineaActual);
                  lineaActual = '';
                  esperandoInlineBlock = false;
                } else {
                  // Iniciar nueva línea con el elemento izquierdo
                  lineaActual = texto;
                  esperandoInlineBlock = true;
                }
              } else {
                // Si tenemos una línea pendiente, terminarla primero
                if (esperandoInlineBlock) {
                  textoCompleto.push(lineaActual);
                  lineaActual = '';
                  esperandoInlineBlock = false;
                }
                
                // Aplicar alineación si está especificada para elementos block
                if (item.style && item.style.textAlign === 'center') {
                  // Centrar texto (aproximadamente 32 caracteres por línea)
                  const lineWidth = 32;
                  const padding = Math.max(0, Math.floor((lineWidth - texto.length) / 2));
                  texto = ' '.repeat(padding) + texto;
                }
                
                textoCompleto.push(texto);
              }
              
            } else if (item.type === 'qrCode') {
              // Si tenemos una línea pendiente, terminarla primero
              if (esperandoInlineBlock) {
                textoCompleto.push(lineaActual);
                lineaActual = '';
                esperandoInlineBlock = false;
              }
              
              // Para QR, agregar un placeholder
              textoCompleto.push('');
              textoCompleto.push('        [CÓDIGO QR]');
              textoCompleto.push('');
              
            } else {
              console.warn(`Tipo de item no reconocido: ${item.type}`);
            }
          });
          
          // Si quedó una línea pendiente al final, agregarla
          if (esperandoInlineBlock && lineaActual) {
            textoCompleto.push(lineaActual);
          }
          
          const resultado = textoCompleto.join('\n');
          console.log('Texto final convertido (primeros 500 chars):', resultado.substring(0, 500));
          console.log('Longitud total del texto:', resultado.length);
          
          return resultado;
        }
        
        let contenidoParaImprimir;
        
        // Verificar si tiene htmlContent (formato del ticket de cierre)
        if (ticketContent.htmlContent && Array.isArray(ticketContent.htmlContent)) {
          console.log('Detectado ticket con htmlContent, convirtiendo...');
          contenidoParaImprimir = convertirHtmlContentATexto(ticketContent.htmlContent);
        } 
        // Verificar si tiene lines (formato tradicional)
        else if (ticketContent.lines && Array.isArray(ticketContent.lines)) {
          console.log('Detectado ticket con lines tradicional');
          contenidoParaImprimir = ticketContent.lines.join('\n');
        } 
        // Si es un string directo
        else if (typeof ticketContent === 'string') {
          console.log('Detectado contenido string directo');
          contenidoParaImprimir = ticketContent;
        } 
        // Fallback: convertir a string
        else {
          console.warn('Formato de ticket no reconocido, usando fallback');
          contenidoParaImprimir = JSON.stringify(ticketContent, null, 2);
        }
        
        console.log('Contenido final preparado para impresión (longitud):', contenidoParaImprimir.length);
        
        // Llamar a la función de impresión CUPS
        return await printToLinuxPrinter(ticketContent.options?.printerName || fileConfig.printerName, contenidoParaImprimir);
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

// APIs de actualización automática
contextBridge.exposeInMainWorld('electronAPI', {
  // APIs de actualización
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Listeners para eventos de actualización
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  }
}); 
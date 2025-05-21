import { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class CotizacionExternaController {
  // Obtener cotizaciones de Cambios Alberdi
  static getCambiosAlberdi = async (req: Request, res: Response) => {
    try {
      // Realizar la solicitud a la página de Cambios Alberdi
      const response = await axios.get('https://www.cambiosalberdi.com/langes/index.php?suc=saltodelguaira#sectionCotizacion');
      
      if (response.status !== 200) {
        throw new Error(`Error al obtener la página: ${response.status}`);
      }
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Buscar la tabla de cotizaciones
      const cotizaciones = {
        dolar: {
          compra: 0,
          venta: 0
        },
        real: {
          compra: 0,
          venta: 0
        },
        lastUpdate: ''
      };
      
      console.log('Buscando tabla de cotizaciones...');
      
      // Obtener todas las tablas
      const tables = $('table');
      console.log(`Encontradas ${tables.length} tablas en la página`);
      
      let cotizacionesEncontradas = false;

      // Intentar con varias estrategias para encontrar la tabla correcta
      tables.each((tableIndex, tableElement) => {
        const tableHtml = $(tableElement).html();
        console.log(`Analizando tabla #${tableIndex + 1}`);
        
        // Comprobar si esta tabla contiene datos de cotizaciones
        const rows = $(tableElement).find('tr');
        rows.each((rowIndex, rowElement) => {
          const cells = $(rowElement).find('td');
          if (cells.length >= 3) {
            const rowText = $(rowElement).text().trim();
            console.log(`Fila #${rowIndex + 1}: ${rowText}`);
            
            // Buscar diferentes posibilidades para "Dólar"
            if (rowText.includes('Dólar Americano') || rowText.includes('Dolar Americano')) {
              // Ignorar si tiene "x" (es para conversión, no cotización)
              if (!rowText.includes('x')) {
                try {
                  const compraText = $(cells[1]).text().trim();
                  const ventaText = $(cells[2]).text().trim();
                  console.log(`Encontrado Dólar: Compra=${compraText}, Venta=${ventaText}`);
                  
                  // Limpiar y convertir a número
                  cotizaciones.dolar.compra = parseFloat(compraText.replace(/\./g, '').replace(',', '.'));
                  cotizaciones.dolar.venta = parseFloat(ventaText.replace(/\./g, '').replace(',', '.'));
                  cotizacionesEncontradas = true;
                } catch (err) {
                  console.error('Error al procesar valor del Dólar:', err);
                }
              }
            }
            
            // Buscar diferentes posibilidades para "Real"
            if ((rowText.includes('Real Brasileño') || rowText.includes('Real Brasileno') || 
                rowText.includes('Real Brasil') || rowText.toLowerCase().includes('real')) && 
                !rowText.includes('x') && !rowText.includes('X')) {
              try {
                const compraText = $(cells[1]).text().trim();
                const ventaText = $(cells[2]).text().trim();
                console.log(`Encontrado Real: Compra=${compraText}, Venta=${ventaText}`);
                
                // Limpiar y convertir a número
                cotizaciones.real.compra = parseFloat(compraText.replace(/\./g, '').replace(',', '.'));
                cotizaciones.real.venta = parseFloat(ventaText.replace(/\./g, '').replace(',', '.'));
                cotizacionesEncontradas = true;
              } catch (err) {
                console.error('Error al procesar valor del Real:', err);
              }
            }
          }
        });
      });
      
      // Verificar si se encontraron valores válidos
      if (!cotizacionesEncontradas || cotizaciones.dolar.compra <= 0 || cotizaciones.real.compra <= 0) {
        console.log('No se encontraron cotizaciones válidas, intentando con método alternativo...');
        
        // Intentar extraer por texto completo de la página
        const pageText = $('body').text();
        
        // Buscar patrones para dólar
        const dolarMatch = pageText.match(/Dólar[^\d]*(\d[\d.,]+)[^\d]*(\d[\d.,]+)/i);
        if (dolarMatch && dolarMatch.length >= 3) {
          console.log(`Encontrado Dólar (método alternativo): ${dolarMatch[1]} / ${dolarMatch[2]}`);
          cotizaciones.dolar.compra = parseFloat(dolarMatch[1].replace(/\./g, '').replace(',', '.'));
          cotizaciones.dolar.venta = parseFloat(dolarMatch[2].replace(/\./g, '').replace(',', '.'));
        }
        
        // Buscar patrones para real - asegurarse de que no sea la relación Dólar/Real
        const realMatch = pageText.match(/Real Brasileño[^\dx]*(\d[\d.,]+)[^\d]*(\d[\d.,]+)/i);
        if (realMatch && realMatch.length >= 3) {
          console.log(`Encontrado Real (método alternativo): ${realMatch[1]} / ${realMatch[2]}`);
          cotizaciones.real.compra = parseFloat(realMatch[1].replace(/\./g, '').replace(',', '.'));
          cotizaciones.real.venta = parseFloat(realMatch[2].replace(/\./g, '').replace(',', '.'));
        }
      }
      
      // Verificar que los valores estén en los rangos esperados
      // Rango esperado para Real entre 800 y 2000 guaraníes
      // Rango esperado para Dólar entre 6000 y 10000 guaraníes
      const realEnRango = cotizaciones.real.compra >= 800 && cotizaciones.real.compra <= 2000;
      const dolarEnRango = cotizaciones.dolar.compra >= 6000 && cotizaciones.dolar.compra <= 10000;
      
      if (!realEnRango) {
        console.log(`Valor del Real fuera de rango esperado: Compra=${cotizaciones.real.compra}, Venta=${cotizaciones.real.venta}`);
        
        // Último intento específico para Real
        // Buscar en toda la página cualquier fila que tenga Real Brasileño pero NO contenga "x"
        // y extraer los dos números siguientes
        $('*').each((i, el) => {
          const text = $(el).text().trim();
          if (text.includes('Real Brasileño') && !text.includes('x') && !text.includes('X')) {
            const matches = text.match(/Real Brasileño[^\d]*(\d[\d.,]+)[^\d]*(\d[\d.,]+)/i);
            if (matches && matches.length >= 3) {
              const compra = parseFloat(matches[1].replace(/\./g, '').replace(',', '.'));
              const venta = parseFloat(matches[2].replace(/\./g, '').replace(',', '.'));
              
              // Verificar que sean valores plausibles para Real (800-2000 Gs)
              if (compra >= 800 && compra <= 2000) {
                console.log(`Encontrado valor de Real válido: Compra=${compra}, Venta=${venta}`);
                cotizaciones.real.compra = compra;
                cotizaciones.real.venta = venta;
              }
            }
          }
        });
      }
      
      // Si después de todos los intentos los valores siguen fuera de rango, indicarlo en la respuesta
      if (cotizaciones.real.compra < 800 || cotizaciones.real.compra > 2000) {
        return res.json({
          success: true,
          cotizaciones,
          source: 'Cambios Alberdi',
          warning: 'Los valores del Real pueden ser incorrectos'
        });
      }
      
      // Extraer la fecha de actualización
      const updateText = $('table').next('p').text().trim() || 
                         $('table').nextAll().find('p:contains("actualización")').text().trim() ||
                         $('table').parent().find('p:contains("actualización")').text().trim();
      
      if (updateText) {
        const match = updateText.match(/(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/);
        if (match) {
          cotizaciones.lastUpdate = match[0];
        }
      }
      
      // Si no encontramos la fecha en p, buscar directamente después de la tabla
      if (!cotizaciones.lastUpdate) {
        const afterTableText = $('table').next().text().trim();
        const match = afterTableText.match(/(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/);
        if (match) {
          cotizaciones.lastUpdate = match[0];
        }
      }
      
      // Buscar la actualización como texto simple después de la tabla
      if (!cotizaciones.lastUpdate) {
        $('table').parent().contents().each((i, el) => {
          if (el.type === 'text') {
            const text = $(el).text().trim();
            const match = text.match(/(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/);
            if (match) {
              cotizaciones.lastUpdate = match[0];
            }
          }
        });
      }
      
      // Si después de todo no encontramos la fecha, buscar en toda la página
      if (!cotizaciones.lastUpdate) {
        const bodyText = $('body').text();
        const match = bodyText.match(/actualización\s*(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/i);
        if (match) {
          cotizaciones.lastUpdate = match[1];
        }
      }
      
      return res.json({
        success: true,
        cotizaciones,
        source: 'Cambios Alberdi'
      });
      
    } catch (error) {
      console.error('Error al obtener cotizaciones externas:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener las cotizaciones externas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
} 
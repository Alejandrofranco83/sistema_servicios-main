import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CotizacionModel } from '../models/cotizacion.model';

const prisma = new PrismaClient();

class ResumenActivoPasivoController {
  /**
   * Obtiene el efectivo total en cajas, calculado a partir de las cajas abiertas y cerradas
   */
  async getEfectivoEnCajas(req: Request, res: Response): Promise<void> {
    try {
      // 1. Obtener la cotización vigente para hacer conversiones
      const cotizacion = await CotizacionModel.findVigente();
      if (!cotizacion) {
        res.status(400).json({ 
          error: 'No hay cotización vigente disponible para realizar los cálculos' 
        });
        return;
      }

      // Valores de conversión
      const valorDolar = parseFloat(cotizacion.valorDolar.toString());
      const valorReal = parseFloat(cotizacion.valorReal.toString());

      // Mapa para almacenar el último estado de cada maletín - La clave es el maletinId
      const estadoMaletines = new Map();

      // 2. Obtener todas las cajas cerradas
      const cajasCerradas = await prisma.caja.findMany({
        where: { estado: 'cerrada' },
        select: {
          id: true,
          cajaEnteroId: true,
          maletinId: true,
          fechaCierre: true,
          saldoFinalPYG: true,
          saldoFinalUSD: true,
          saldoFinalBRL: true,
          detallesDenominacionFinal: true
        },
        orderBy: { fechaCierre: 'desc' }
      });

      // Procesar cajas cerradas
      for (const caja of cajasCerradas) {
        if (caja.fechaCierre) {
          const maletinId = caja.maletinId;
          
          // Parsear los detalles de denominación
          let detalles = null;
          try {
            if (caja.detallesDenominacionFinal) {
              detalles = JSON.parse(caja.detallesDenominacionFinal.toString());
            }
          } catch (e) {
            console.error('Error al parsear detallesDenominacionFinal:', e);
          }
          
          // Si no hay detalles, usamos los valores individuales
          const totalPYG = caja.saldoFinalPYG?.toNumber() || 0;
          const totalUSD = caja.saldoFinalUSD?.toNumber() || 0;
          const totalBRL = caja.saldoFinalBRL?.toNumber() || 0;
          
          // Si el maletín no está registrado o esta caja es más reciente, actualizamos
          if (!estadoMaletines.has(maletinId) || 
              (estadoMaletines.get(maletinId).tipo === 'cierre' && 
               new Date(caja.fechaCierre) > new Date(estadoMaletines.get(maletinId).fecha))) {
            
            estadoMaletines.set(maletinId, {
              tipo: 'cierre',
              cajaId: caja.cajaEnteroId,
              fecha: caja.fechaCierre,
              PYG: detalles?.total?.PYG || totalPYG,
              USD: detalles?.total?.USD || totalUSD,
              BRL: detalles?.total?.BRL || totalBRL
            });
          }
        }
      }

      // 3. Obtener cajas abiertas (estas tienen prioridad)
      const cajasAbiertas = await prisma.caja.findMany({
        where: { estado: 'abierta' },
        select: {
          id: true,
          cajaEnteroId: true,
          maletinId: true,
          fechaApertura: true,
          saldoInicialPYG: true,
          saldoInicialUSD: true,
          saldoInicialBRL: true,
          detallesDenominacion: true
        },
        orderBy: { fechaApertura: 'desc' }
      });

      // Procesar cajas abiertas
      for (const caja of cajasAbiertas) {
        const maletinId = caja.maletinId;
        
        // Parsear los detalles de denominación
        let detalles = null;
        try {
          if (caja.detallesDenominacion) {
            detalles = JSON.parse(caja.detallesDenominacion.toString());
          }
        } catch (e) {
          console.error('Error al parsear detallesDenominacion:', e);
        }
        
        // Si no hay detalles, usamos los valores individuales
        const totalPYG = caja.saldoInicialPYG?.toNumber() || 0;
        const totalUSD = caja.saldoInicialUSD?.toNumber() || 0;
        const totalBRL = caja.saldoInicialBRL?.toNumber() || 0;
        
        // Si el maletín no está registrado o no tiene una apertura o esta caja es más reciente
        if (!estadoMaletines.has(maletinId) || 
            estadoMaletines.get(maletinId).tipo === 'cierre' ||
            (estadoMaletines.get(maletinId).tipo === 'apertura' && 
             new Date(caja.fechaApertura) > new Date(estadoMaletines.get(maletinId).fecha))) {
          
          estadoMaletines.set(maletinId, {
            tipo: 'apertura',
            cajaId: caja.cajaEnteroId,
            fecha: caja.fechaApertura,
            PYG: detalles?.total?.PYG || totalPYG,
            USD: detalles?.total?.USD || totalUSD,
            BRL: detalles?.total?.BRL || totalBRL
          });
        }
      }

      // 4. Calcular el total en guaraníes
      let totalEnGs = 0;
      const detalles = [];

      // Calcular para cada maletín
      for (const [maletinId, maletin] of estadoMaletines.entries()) {
        let subtotal = 0;
        
        // Sumar guaraníes directamente
        subtotal += maletin.PYG || 0;
        
        // Convertir USD a guaraníes
        const usdEnGs = (maletin.USD || 0) * valorDolar;
        subtotal += usdEnGs;
        
        // Convertir BRL a guaraníes
        const brlEnGs = (maletin.BRL || 0) * valorReal;
        subtotal += brlEnGs;
        
        totalEnGs += subtotal;
        
        // Guardar detalles para el cliente
        detalles.push({
          maletinId,
          tipo: maletin.tipo,
          cajaId: maletin.cajaId,
          fecha: maletin.fecha,
          PYG: maletin.PYG || 0,
          USD: maletin.USD || 0,
          BRL: maletin.BRL || 0,
          usdEnGs,
          brlEnGs,
          subtotal
        });
      }

      // 5. Enviar respuesta
      res.json({
        totalEfectivoEnCajas: totalEnGs,
        cantidadMaletines: estadoMaletines.size,
        cotizacion: {
          valorDolar,
          valorReal,
          fecha: cotizacion.fecha
        },
        detalles
      });

    } catch (error) {
      console.error('Error al obtener efectivo en cajas:', error);
      res.status(500).json({ 
        error: 'Error al calcular el efectivo en cajas' 
      });
    }
  }

  /**
   * Obtiene los saldos de servicios de todas las sucursales
   */
  async getSaldosServicios(req: Request, res: Response): Promise<void> {
    try {
      // Este mapa almacenará un único registro por sucursal
      // La clave es el sucursalId, y el valor contiene la información del saldo
      const saldosPorSucursal = new Map();

      // También mantendremos un registro de qué sucursales tienen cajas abiertas
      // para evitar procesar cajas cerradas de esas sucursales
      const sucursalesConCajaAbierta = new Set();

      // 1. PRIMERO: Obtener y procesar las cajas ABIERTAS (tienen prioridad)
      console.log('Obteniendo saldos de servicios de cajas abiertas...');
      const cajasAbiertas = await prisma.caja.findMany({
        where: { estado: 'abierta' },
        select: {
          id: true,
          cajaEnteroId: true,
          sucursalId: true,
          fechaApertura: true,
          detallesDenominacion: true,
          servicios: true,
          serviciosFinal: true,
        },
        orderBy: { fechaApertura: 'desc' }
      });

      console.log(`Encontradas ${cajasAbiertas.length} cajas abiertas para verificar saldos de servicios`);

      // Procesar cajas abiertas (solo procesamos la primera que encontremos por sucursal)
      for (const caja of cajasAbiertas) {
        if (caja.fechaApertura && caja.sucursalId) {
          // Si ya procesamos una caja abierta para esta sucursal, saltamos esta
          if (sucursalesConCajaAbierta.has(caja.sucursalId)) {
            console.log(`⏩ Ignorando caja abierta ${caja.cajaEnteroId} de sucursal ${caja.sucursalId} porque ya procesamos otra más reciente`);
            continue;
          }
          
          // Marcar esta sucursal como procesada
          sucursalesConCajaAbierta.add(caja.sucursalId);
          
          // Parsear y extraer el saldo de servicios
          let detalles = null;
          let saldoServicios = 0;

          console.log(`DEPURACIÓN CAJA ABIERTA ${caja.cajaEnteroId} (Sucursal ${caja.sucursalId}):`);
          console.log(`- ID: ${caja.id}`);
          console.log(`- Fecha apertura: ${caja.fechaApertura}`);
          
          try {
            // MÉTODO 1: Primero intentamos obtener de serviciosFinal (actuales)
            if (caja.serviciosFinal) {
              let saldosServiciosArray = null;
              
              if (typeof caja.serviciosFinal === 'string') {
                saldosServiciosArray = JSON.parse(caja.serviciosFinal);
              } else if (Array.isArray(caja.serviciosFinal)) {
                saldosServiciosArray = caja.serviciosFinal;
              }

              if (Array.isArray(saldosServiciosArray) && saldosServiciosArray.length > 0) {
                saldoServicios = saldosServiciosArray.reduce((sum, item) => {
                  const monto = typeof item.monto === 'number' ? item.monto : 
                                parseFloat(item.monto || '0');
                  return sum + monto;
                }, 0);
                console.log(`Encontrado saldo de servicios en serviciosFinal (array): ${saldoServicios}`);
              }
            }
            
            // MÉTODO 2: Si no hay en serviciosFinal, buscamos en servicios (apertura)
            if (saldoServicios === 0 && caja.servicios) {
              let saldosServiciosArray = null;
              
              if (typeof caja.servicios === 'string') {
                saldosServiciosArray = JSON.parse(caja.servicios);
              } else if (Array.isArray(caja.servicios)) {
                saldosServiciosArray = caja.servicios;
              }

              if (Array.isArray(saldosServiciosArray) && saldosServiciosArray.length > 0) {
                saldoServicios = saldosServiciosArray.reduce((sum, item) => {
                  const monto = typeof item.monto === 'number' ? item.monto : 
                                parseFloat(item.monto || '0');
                  return sum + monto;
                }, 0);
                console.log(`Encontrado saldo de servicios en servicios (array): ${saldoServicios}`);
              }
            }
            
            // MÉTODO 3: Si aún no hay, buscamos en detallesDenominacion
            if (saldoServicios === 0 && caja.detallesDenominacion) {
              detalles = JSON.parse(caja.detallesDenominacion.toString());
              
              // Buscar servicios en varios posibles campos
              if (detalles && typeof detalles.servicios === 'number') {
                saldoServicios = detalles.servicios;
              } else if (detalles && detalles.saldoServicios && typeof detalles.saldoServicios === 'number') {
                saldoServicios = detalles.saldoServicios;
              } else if (detalles && detalles.saldosServicios && typeof detalles.saldosServicios === 'number') {
                saldoServicios = detalles.saldosServicios;
              } else if (detalles && detalles.serviciosTotal && typeof detalles.serviciosTotal === 'number') {
                saldoServicios = detalles.serviciosTotal;
              } else if (detalles && detalles.totalServicios && typeof detalles.totalServicios === 'number') {
                saldoServicios = detalles.totalServicios;
              }
            }
          } catch (e) {
            console.error('Error al parsear datos de servicios:', e);
          }

          console.log(`Sucursal ${caja.sucursalId} - Caja abierta ${caja.cajaEnteroId}: Saldo Servicios=${saldoServicios}, Fecha=${new Date(caja.fechaApertura).toISOString()}`);

          // Guardar el saldo de esta caja abierta para la sucursal
          // IMPORTANTE: Reemplazamos cualquier valor existente, NO sumamos
          saldosPorSucursal.set(caja.sucursalId, {
            tipo: 'apertura',
            cajaId: caja.cajaEnteroId,
            fecha: caja.fechaApertura,
            saldoServicios
          });
          console.log(`✅ Sucursal ${caja.sucursalId} registrada con saldo de servicios de caja abierta ${caja.cajaEnteroId}: ${saldoServicios}`);
        }
      }

      // 2. SEGUNDO: Obtener y procesar las cajas CERRADAS (solo para sucursales sin caja abierta)
      console.log('Obteniendo saldos de servicios de cajas cerradas...');
      const cajasCerradas = await prisma.caja.findMany({
        where: { estado: 'cerrada' },
        select: {
          id: true,
          cajaEnteroId: true,
          sucursalId: true,
          fechaCierre: true,
          detallesDenominacionFinal: true,
          serviciosFinal: true
        },
        orderBy: { fechaCierre: 'desc' }
      });

      console.log(`Encontradas ${cajasCerradas.length} cajas cerradas para verificar saldos de servicios`);

      // Procesar cajas cerradas (solo para sucursales sin caja abierta)
      for (const caja of cajasCerradas) {
        if (caja.fechaCierre && caja.sucursalId) {
          // IMPORTANTE: Si esta sucursal ya tiene una caja abierta, ignoramos la caja cerrada
          if (sucursalesConCajaAbierta.has(caja.sucursalId)) {
            console.log(`⏩ Ignorando caja cerrada ${caja.cajaEnteroId} de sucursal ${caja.sucursalId} porque ya tiene caja abierta`);
            continue;
          }
          
          // Si ya procesamos una caja cerrada más reciente para esta sucursal, ignoramos esta
          if (saldosPorSucursal.has(caja.sucursalId)) {
            console.log(`⏩ Ignorando caja cerrada ${caja.cajaEnteroId} de sucursal ${caja.sucursalId} porque ya procesamos una más reciente`);
            continue;
          }
          
          // Parseamos y extraemos el saldo de servicios
          let detalles = null;
          let saldoServicios = 0;

          try {
            // MÉTODO 1: Primero intentamos obtener de serviciosFinal
            if (caja.serviciosFinal) {
              let saldosServiciosArray = null;
              
              if (typeof caja.serviciosFinal === 'string') {
                saldosServiciosArray = JSON.parse(caja.serviciosFinal);
              } else if (Array.isArray(caja.serviciosFinal)) {
                saldosServiciosArray = caja.serviciosFinal;
              }

              if (Array.isArray(saldosServiciosArray) && saldosServiciosArray.length > 0) {
                saldoServicios = saldosServiciosArray.reduce((sum, item) => {
                  const monto = typeof item.monto === 'number' ? item.monto : 
                                parseFloat(item.monto || '0');
                  return sum + monto;
                }, 0);
                console.log(`Encontrado saldo de servicios en serviciosFinal (array): ${saldoServicios}`);
              }
            }
            
            // MÉTODO 2: Si aún no hay, buscamos en detallesDenominacionFinal
            if (saldoServicios === 0 && caja.detallesDenominacionFinal) {
              detalles = JSON.parse(caja.detallesDenominacionFinal.toString());
              
              // Buscar servicios en varios posibles campos
              if (detalles && typeof detalles.servicios === 'number') {
                saldoServicios = detalles.servicios;
              } else if (detalles && detalles.saldoServicios && typeof detalles.saldoServicios === 'number') {
                saldoServicios = detalles.saldoServicios;
              } else if (detalles && detalles.saldosServicios && typeof detalles.saldosServicios === 'number') {
                saldoServicios = detalles.saldosServicios;
              } else if (detalles && detalles.serviciosTotal && typeof detalles.serviciosTotal === 'number') {
                saldoServicios = detalles.serviciosTotal;
              } else if (detalles && detalles.totalServicios && typeof detalles.totalServicios === 'number') {
                saldoServicios = detalles.totalServicios;
              }
            }
          } catch (e) {
            console.error('Error al parsear datos de servicios:', e);
          }

          console.log(`Sucursal ${caja.sucursalId} - Caja cerrada ${caja.cajaEnteroId}: Saldo Servicios=${saldoServicios}, Fecha=${new Date(caja.fechaCierre).toISOString()}`);

          // Guardar el saldo de esta caja cerrada para la sucursal
          saldosPorSucursal.set(caja.sucursalId, {
            tipo: 'cierre',
            cajaId: caja.cajaEnteroId,
            fecha: caja.fechaCierre,
            saldoServicios
          });
          console.log(`✅ Sucursal ${caja.sucursalId} registrada con saldo de servicios de caja cerrada ${caja.cajaEnteroId}: ${saldoServicios}`);
        }
      }

      // 3. Calcular el total sumando todos los saldos
      console.log("----- RESUMEN FINAL DE SALDOS EN SERVICIOS POR SUCURSAL -----");
      let totalSaldosServicios = 0;
      const detalles = [];
      
      // Recorrer el mapa y calcular el total
      for (const [sucursalId, datos] of saldosPorSucursal.entries()) {
        console.log(`Sucursal ${sucursalId}: ${datos.saldoServicios} (${datos.tipo})`);
        
        // Sumar el saldo de servicios
        totalSaldosServicios += datos.saldoServicios || 0;
        
        // Guardar detalles para la respuesta
        detalles.push({
          sucursalId,
          tipo: datos.tipo,
          cajaId: datos.cajaId,
          fecha: datos.fecha,
          saldoServicios: datos.saldoServicios || 0
        });
      }

      console.log(`----- TOTAL SALDOS SERVICIOS: ${totalSaldosServicios} -----`);
      console.log(`Total saldos en servicios: ${totalSaldosServicios} Gs (${saldosPorSucursal.size} sucursales)`);

      // 4. Enviar respuesta
      res.json({
        totalSaldosServicios,
        cantidadSucursales: saldosPorSucursal.size,
        detalles
      });

    } catch (error) {
      console.error('Error al obtener saldos de servicios:', error);
      res.status(500).json({ 
        error: 'Error al calcular los saldos de servicios' 
      });
    }
  }

  /**
   * Obtiene un resumen completo para el componente ActivoPasivo
   */
  async getResumenCompleto(req: Request, res: Response): Promise<void> {
    try {
      // Aquí podemos implementar posteriormente la funcionalidad para obtener
      // todos los datos necesarios para el componente ActivoPasivo en una sola llamada
      
      res.status(501).json({ 
        message: 'Funcionalidad aún no implementada' 
      });
    } catch (error) {
      console.error('Error al obtener resumen completo:', error);
      res.status(500).json({ 
        error: 'Error al obtener el resumen completo' 
      });
    }
  }
}

export default new ResumenActivoPasivoController(); 
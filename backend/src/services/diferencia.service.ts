import { PrismaClient, Caja, Prisma } from '@prisma/client'; // Importar Prisma para Decimal
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// --- Interfaces (Duplicadas temporalmente - Ideal: Paquete compartido) ---
interface SaldoMoneda {
  PYG: number;
  USD: number;
  BRL: number;
}

interface SaldoDetalle {
  total: SaldoMoneda;
  // Podría tener más detalles como denominaciones si fuera necesario
}

interface CajaInfoComparacion {
  id: string; // uuid
  cajaEnteroId: number;
  maletinId: number | null;
  fechaApertura?: string; // ISO date string
  fechaCierre?: string;   // ISO date string
  saldoInicial?: SaldoDetalle;
  saldoFinal?: SaldoDetalle;
  usuarioId?: number | null; // Usar ID en lugar de nombre
}

interface ComparacionMaletin {
  cajaAnterior: CajaInfoComparacion;
  cajaSiguiente: CajaInfoComparacion;
  diferencias: SaldoMoneda;
  tieneDiferencia: boolean;
}

// --- Nuevas Interfaces para Saldos de Servicios ---
interface SaldoServicio {
  servicio: string;
  monto: number;
}

interface CajaInfoServicios {
  id: string;
  cajaEnteroId: number;
  sucursalId: number;
  sucursalNombre?: string; // Añadir nombre de sucursal
  fechaCierre?: string; // ISO string
  fechaApertura?: string; // ISO string
  saldosServicios: SaldoServicio[]; // Array de servicios con sus montos
}

interface ComparacionSaldosServicios {
  cajaAnterior: CajaInfoServicios;
  cajaSiguiente: CajaInfoServicios;
  diferenciaTotalPYG: number; // Diferencia total de servicios en PYG
  tieneDiferencia: boolean;
}
// --- Fin Interfaces Duplicadas ---

// --- Nuevas Interfaces para Diferencias En Caja ---

interface SaldosComparados {
  declarado: number;
  sistema: number;
  diferencia: number;
}

interface ComparacionDetalladaCaja {
  PYG: SaldosComparados;
  USD: SaldosComparados;
  BRL: SaldosComparados;
  ServiciosPYG: SaldosComparados;
}

/**
 * Representa la comparación interna de saldos para una caja cerrada.
 */
export interface ComparacionEnCaja {
  id: string;
  cajaEnteroId: number;
  sucursalId: number;
  sucursalNombre?: string;
  maletinId: number | null;
  fechaApertura?: string; 
  fechaCierre?: string;
  estadoCaja: string;
  comparacion: ComparacionDetalladaCaja;
  tieneDiferencia: boolean;
}

// Función auxiliar para convertir Decimal a number
function decimalToNumber(decimal: Decimal | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  return decimal.toNumber();
}

/**
 * Calcula la diferencia entre dos objetos SaldoMoneda.
 */
const calcularDiferenciaSaldos = (saldoInicial: SaldoMoneda, saldoFinal: SaldoMoneda): SaldoMoneda => ({
  PYG: saldoInicial.PYG - saldoFinal.PYG,
  USD: saldoInicial.USD - saldoFinal.USD,
  BRL: saldoInicial.BRL - saldoFinal.BRL,
});

/**
 * Determina si hay alguna diferencia (!= 0) en un objeto SaldoMoneda.
 */
const tieneDif = (diferencias: SaldoMoneda): boolean => {
  return diferencias.PYG !== 0 || diferencias.USD !== 0 || diferencias.BRL !== 0;
};

// Tipo auxiliar para la caja seleccionada con usuario
type CajaConUsuario = Prisma.CajaGetPayload<{
  select: {
      id: true,
      cajaEnteroId: true,
      maletinId: true,
      fechaApertura: true,
      fechaCierre: true,
      saldoInicialPYG: true,
      saldoInicialUSD: true,
      saldoInicialBRL: true,
      saldoFinalPYG: true,
      saldoFinalUSD: true,
      saldoFinalBRL: true,
      usuarioId: true
  }
}>;

/**
 * Obtiene y calcula las comparaciones de saldo entre cajas consecutivas del mismo maletín.
 */
export const calcularComparacionesMaletines = async (): Promise<ComparacionMaletin[]> => {
  console.log("Calculando comparaciones de maletines...");

  const selectFields = {
    id: true,
    cajaEnteroId: true,
    maletinId: true,
    fechaApertura: true,
    fechaCierre: true,
    saldoInicialPYG: true,
    saldoInicialUSD: true,
    saldoInicialBRL: true,
    saldoFinalPYG: true,
    saldoFinalUSD: true,
    saldoFinalBRL: true,
    usuarioId: true
  };

  const cajas = await prisma.caja.findMany({
    select: selectFields, 
    orderBy: [
      { maletinId: 'asc' },
      { fechaApertura: 'asc' },
    ],
  });
  
  type CajaSeleccionada = typeof cajas[number];

  console.log(`Se encontraron ${cajas.length} cajas para análisis de maletines.`);

  const comparaciones: ComparacionMaletin[] = [];
  let cajaAnteriorDelMaletin: CajaSeleccionada | null = null; 

  for (const cajaActual of cajas) {
    if (!cajaActual.maletinId) continue;
    
    if (!cajaAnteriorDelMaletin || cajaAnteriorDelMaletin.maletinId !== cajaActual.maletinId) {
      cajaAnteriorDelMaletin = cajaActual;
      continue;
    }
    
    const saldoInicialActual: SaldoMoneda = {
      PYG: decimalToNumber(cajaActual.saldoInicialPYG),
      USD: decimalToNumber(cajaActual.saldoInicialUSD),
      BRL: decimalToNumber(cajaActual.saldoInicialBRL)
    };
    const saldoFinalAnterior: SaldoMoneda | undefined = cajaAnteriorDelMaletin ? {
      PYG: decimalToNumber(cajaAnteriorDelMaletin.saldoFinalPYG),
      USD: decimalToNumber(cajaAnteriorDelMaletin.saldoFinalUSD),
      BRL: decimalToNumber(cajaAnteriorDelMaletin.saldoFinalBRL)
    } : undefined;

    if (cajaAnteriorDelMaletin.fechaCierre && saldoFinalAnterior && cajaActual.fechaApertura) {
        const diferencias = calcularDiferenciaSaldos(saldoInicialActual, saldoFinalAnterior);
        const hayDiferencia = tieneDif(diferencias);

        const infoAnterior: CajaInfoComparacion = {
          id: cajaAnteriorDelMaletin.id,
          cajaEnteroId: cajaAnteriorDelMaletin.cajaEnteroId ?? 0,
          maletinId: cajaAnteriorDelMaletin.maletinId,
          fechaCierre: cajaAnteriorDelMaletin.fechaCierre.toISOString(),
          saldoFinal: { total: saldoFinalAnterior },
          usuarioId: cajaAnteriorDelMaletin.usuarioId
        };
        
        const infoSiguiente: CajaInfoComparacion = {
            id: cajaActual.id,
            cajaEnteroId: cajaActual.cajaEnteroId ?? 0,
            maletinId: cajaActual.maletinId,
            fechaApertura: cajaActual.fechaApertura.toISOString(),
            saldoInicial: { total: saldoInicialActual },
            usuarioId: cajaActual.usuarioId
        };

        comparaciones.push({
          cajaAnterior: infoAnterior,
          cajaSiguiente: infoSiguiente,
          diferencias: diferencias,
          tieneDiferencia: hayDiferencia,
        });
    } else {
        console.warn(`Saltando comparación por falta de datos entre caja ${cajaAnteriorDelMaletin.cajaEnteroId} y ${cajaActual.cajaEnteroId}`);
    }
    
    cajaAnteriorDelMaletin = cajaActual;
  }

   comparaciones.sort((a, b) => {
    const dateA = a.cajaAnterior.fechaCierre ? new Date(a.cajaAnterior.fechaCierre).getTime() : 0;
    const dateB = b.cajaAnterior.fechaCierre ? new Date(b.cajaAnterior.fechaCierre).getTime() : 0;
    return dateB - dateA;
  });

  console.log(`Se calcularon ${comparaciones.length} comparaciones de maletines.`);
  return comparaciones;
};

/**
 * Obtiene y calcula las comparaciones de saldos de servicios entre cajas cerradas consecutivas por sucursal.
 */
export const calcularComparacionesSaldosServicios = async (): Promise<ComparacionSaldosServicios[]> => {
  console.log("Calculando comparaciones de saldos de servicios por sucursal...");

  const cajas = await prisma.caja.findMany({
    select: {
      id: true,
      cajaEnteroId: true,
      sucursalId: true,
      sucursal: { // Incluir datos de la sucursal
        select: {
          id: true,
          nombre: true,
        }
      },
      fechaApertura: true,
      fechaCierre: true,
      servicios: true,       // JSON inicial
      serviciosFinal: true,  // JSON final
      estado: true
    },
    orderBy: [
      { sucursalId: 'asc' },
      { fechaApertura: 'asc' }, // Ordenar por fecha de apertura para secuencia correcta
    ],
  });

  console.log(`Se encontraron ${cajas.length} cajas para análisis de servicios.`);

  const comparaciones: ComparacionSaldosServicios[] = [];
  let cajaAnteriorDeSucursal: typeof cajas[number] | null = null;

  for (const cajaActual of cajas) {
    if (!cajaAnteriorDeSucursal || cajaAnteriorDeSucursal.sucursalId !== cajaActual.sucursalId) {
      cajaAnteriorDeSucursal = cajaActual;
      continue; 
    }

    if (cajaAnteriorDeSucursal.estado !== 'cerrada') {
      console.log(`Saltando comparación: Caja anterior ${cajaAnteriorDeSucursal.cajaEnteroId} no está cerrada.`);
      cajaAnteriorDeSucursal = cajaActual;
      continue;
    }
    
    const saldosFinalesAnterior: SaldoServicio[] = parseJSONSafely(cajaAnteriorDeSucursal.serviciosFinal);
    const saldosInicialesActual: SaldoServicio[] = parseJSONSafely(cajaActual.servicios);
    
    const totalFinalAnterior = calcularTotalServicios(saldosFinalesAnterior);
    const totalInicialActual = calcularTotalServicios(saldosInicialesActual);
    
    const diferenciaTotal = totalInicialActual - totalFinalAnterior;
    const hayDiferencia = diferenciaTotal !== 0;
    
    const infoAnterior: CajaInfoServicios = {
      id: cajaAnteriorDeSucursal.id,
      cajaEnteroId: cajaAnteriorDeSucursal.cajaEnteroId ?? 0,
      sucursalId: cajaAnteriorDeSucursal.sucursalId,
      sucursalNombre: cajaAnteriorDeSucursal.sucursal?.nombre, // Añadir nombre
      fechaCierre: cajaAnteriorDeSucursal.fechaCierre?.toISOString(),
      saldosServicios: saldosFinalesAnterior,
    };
    
    const infoSiguiente: CajaInfoServicios = {
      id: cajaActual.id,
      cajaEnteroId: cajaActual.cajaEnteroId ?? 0,
      sucursalId: cajaActual.sucursalId,
      sucursalNombre: cajaActual.sucursal?.nombre, // Añadir nombre
      fechaApertura: cajaActual.fechaApertura?.toISOString(), 
      saldosServicios: saldosInicialesActual,
    };

    comparaciones.push({
      cajaAnterior: infoAnterior,
      cajaSiguiente: infoSiguiente,
      diferenciaTotalPYG: diferenciaTotal,
      tieneDiferencia: hayDiferencia,
    });

    cajaAnteriorDeSucursal = cajaActual;
  }

  comparaciones.sort((a, b) => {
    const dateA = a.cajaAnterior.fechaCierre ? new Date(a.cajaAnterior.fechaCierre).getTime() : 0;
    const dateB = b.cajaAnterior.fechaCierre ? new Date(b.cajaAnterior.fechaCierre).getTime() : 0;
    if (dateA === 0 && dateB !== 0) return 1;
    if (dateB === 0 && dateA !== 0) return -1;
    return dateB - dateA; 
  });

  console.log(`Se calcularon ${comparaciones.length} comparaciones de saldos de servicios.`);
  return comparaciones;
};

// Función auxiliar para parsear JSON de forma segura
const parseJSONSafely = (jsonString: Prisma.JsonValue | null | undefined): any => {
  if (!jsonString || typeof jsonString !== 'string') {
    // Si no es string (podría ser null o ya un objeto si Prisma lo manejó), devolverlo o un array vacío
    return Array.isArray(jsonString) ? jsonString : []; 
  }
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : []; // Asegurar que sea un array
  } catch (e) {
    console.error("Error al parsear JSON de servicios:", e);
    return []; // Devolver array vacío en caso de error
  }
};

// Función auxiliar para calcular el total de saldos de servicios
const calcularTotalServicios = (saldos: SaldoServicio[]): number => {
  if (!Array.isArray(saldos)) return 0;
  return saldos.reduce((total, servicio) => total + (Number(servicio.monto) || 0), 0);
};

/**
 * Obtiene y calcula las diferencias entre saldos declarados y calculados al cierre de cada caja.
 */
export const calcularDiferenciasEnCajas = async (): Promise<ComparacionEnCaja[]> => {
  console.log("Calculando diferencias internas en cajas...");

  const cajasCerradas = await prisma.caja.findMany({
    where: {
      estado: 'cerrada', 
      fechaCierre: { not: null }, // Asegurar que tenga fecha de cierre
      // Asegurar que tenga saldos finales declarados? Depende de la lógica de negocio
      // detallesDenominacionFinal: { not: Prisma.JsonNull }, 
      // serviciosFinal: { not: Prisma.JsonNull },
    },
    select: {
      id: true,
      cajaEnteroId: true,
      sucursalId: true,
      sucursal: { select: { nombre: true } },
      maletinId: true,
      fechaApertura: true,
      fechaCierre: true,
      estado: true,
      // Saldos calculados por el sistema (directos del modelo)
      saldoFinalPYG: true,
      saldoFinalUSD: true,
      saldoFinalBRL: true,
      // Saldos declarados (JSON)
      detallesDenominacionFinal: true,
      serviciosFinal: true,
      // Movimientos para calcular total servicios sistema
      // Asumiendo que MovimientoCaja contiene los servicios
      movimientos: { 
        select: {
          monto: true,
          // Podríamos necesitar moneda si los movimientos de servicio no son solo PYG
        }
      }
    },
    orderBy: {
      fechaCierre: 'desc', // Mostrar las más recientes primero
    },
  });

  console.log(`Se encontraron ${cajasCerradas.length} cajas cerradas para análisis interno.`);

  const comparaciones: ComparacionEnCaja[] = [];

  for (const caja of cajasCerradas) {
    // 1. Saldos Declarados
    const denomFinalDeclarado = parseJSONSafely(caja.detallesDenominacionFinal);
    const servFinalDeclarado: SaldoServicio[] = parseJSONSafely(caja.serviciosFinal);

    const declaradoPYG = denomFinalDeclarado?.total?.PYG ?? 0;
    const declaradoUSD = denomFinalDeclarado?.total?.USD ?? 0;
    const declaradoBRL = denomFinalDeclarado?.total?.BRL ?? 0;
    const declaradoServiciosPYG = calcularTotalServicios(servFinalDeclarado);

    // 2. Saldos Sistema
    const sistemaPYG = decimalToNumber(caja.saldoFinalPYG);
    const sistemaUSD = decimalToNumber(caja.saldoFinalUSD);
    const sistemaBRL = decimalToNumber(caja.saldoFinalBRL);
    
    // Calcular total servicios sistema (Asumiendo que movimientos son solo PYG)
    // ¡¡¡ IMPORTANTE: Ajustar esta lógica si es necesario !!!
    const sistemaServiciosPYG = caja.movimientos.reduce((sum, mov) => sum + decimalToNumber(mov.monto), 0);

    // 3. Calcular Diferencias
    const diffPYG = declaradoPYG - sistemaPYG;
    const diffUSD = declaradoUSD - sistemaUSD;
    const diffBRL = declaradoBRL - sistemaBRL;
    const diffServicios = declaradoServiciosPYG - sistemaServiciosPYG;

    const tieneDif = diffPYG !== 0 || diffUSD !== 0 || diffBRL !== 0 || diffServicios !== 0;

    const comparacionDetallada: ComparacionDetalladaCaja = {
      PYG: { declarado: declaradoPYG, sistema: sistemaPYG, diferencia: diffPYG },
      USD: { declarado: declaradoUSD, sistema: sistemaUSD, diferencia: diffUSD },
      BRL: { declarado: declaradoBRL, sistema: sistemaBRL, diferencia: diffBRL },
      ServiciosPYG: { declarado: declaradoServiciosPYG, sistema: sistemaServiciosPYG, diferencia: diffServicios },
    };

    comparaciones.push({
      id: caja.id,
      cajaEnteroId: caja.cajaEnteroId ?? 0,
      sucursalId: caja.sucursalId,
      sucursalNombre: caja.sucursal?.nombre,
      maletinId: caja.maletinId,
      fechaApertura: caja.fechaApertura?.toISOString(),
      fechaCierre: caja.fechaCierre?.toISOString(), // Sabemos que no es null por el where
      estadoCaja: caja.estado,
      comparacion: comparacionDetallada,
      tieneDiferencia: tieneDif,
    });
  }

  console.log(`Se calcularon ${comparaciones.length} comparaciones internas de caja.`);
  return comparaciones;
}; 
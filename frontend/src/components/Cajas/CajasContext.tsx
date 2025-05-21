import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSucursal } from '../../contexts/SucursalContext';
import { Caja, Maletin, FormularioApertura, Retiro, OperacionBancaria, Persona, FormRetiro, Pago, FormPago } from './interfaces';
import { cajaInicial, denominacionesGuaranies, denominacionesReales, denominacionesDolares, serviciosIniciales } from './constants';
import operacionBancariaService from '../../services/operacionBancariaService';

// Definir la interfaz del contexto
interface CajasContextType {
  // Estados
  cajas: Caja[];
  maletines: Maletin[];
  maletinesEnUso: string[];
  loading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  tabIndex: number;
  cajaSeleccionada: Caja | null;
  dialogAperturaOpen: boolean;
  dialogCierreOpen: boolean;
  dialogDetalleOpen: boolean;
  dialogVerAperturaOpen: boolean;
  dialogVerMovimientosOpen: boolean;
  dialogPagosOpen: boolean;
  
  // Retiros
  retiros: Retiro[];
  formRetiro: FormRetiro;
  retirosDialogOpen: boolean;
  listaRetirosDialogOpen: boolean;
  confirmarEliminarRetiroId: string | null;
  personasBusqueda: {id: string; nombre: string; tipo: 'funcionario' | 'vip'}[];
  busquedaPersona: string;
  buscandoPersonas: boolean;
  personasDisponibles: Persona[];
  
  // Operaciones bancarias
  operacionesBancarias: OperacionBancaria[];
  operacionesBancariasDialogOpen: boolean;
  formOperacionDialogOpen: boolean;
  formOperacion: OperacionBancaria;
  confirmarEliminarOperacionId: string | null;
  
  // Formularios
  formApertura: FormularioApertura;
  
  // Pagos
  pagos: Pago[];
  formPago: FormPago;
  pagosDialogOpen: boolean;
  listaPagosDialogOpen: boolean;
  confirmarEliminarPagoId: string | null;
  
  // Métodos
  setErrorMessage: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  setTabIndex: (index: number) => void;
  setCajaSeleccionada: (caja: Caja | null) => void;
  setFormApertura: React.Dispatch<React.SetStateAction<FormularioApertura>>;
  setDialogAperturaOpen: (open: boolean) => void;
  setDialogCierreOpen: (open: boolean) => void;
  setDialogDetalleOpen: (open: boolean) => void;
  setDialogVerAperturaOpen: (open: boolean) => void;
  setDialogVerMovimientosOpen: (open: boolean) => void;
  setDialogPagosOpen: (open: boolean) => void;
  
  // Métodos para retiros
  setRetiros: React.Dispatch<React.SetStateAction<Retiro[]>>;
  setFormRetiro: React.Dispatch<React.SetStateAction<FormRetiro>>;
  setRetirosDialogOpen: (open: boolean) => void;
  setListaRetirosDialogOpen: (open: boolean) => void;
  setConfirmarEliminarRetiroId: (id: string | null) => void;
  setBusquedaPersona: (busqueda: string) => void;
  
  // Métodos para operaciones bancarias
  setOperacionesBancarias: React.Dispatch<React.SetStateAction<OperacionBancaria[]>>;
  setOperacionesBancariasDialogOpen: (open: boolean) => void;
  setFormOperacionDialogOpen: (open: boolean) => void;
  setFormOperacion: React.Dispatch<React.SetStateAction<OperacionBancaria>>;
  setConfirmarEliminarOperacionId: (id: string | null) => void;
  
  // Métodos para pagos
  setPagos: React.Dispatch<React.SetStateAction<Pago[]>>;
  setFormPago: React.Dispatch<React.SetStateAction<FormPago>>;
  setPagosDialogOpen: (open: boolean) => void;
  setListaPagosDialogOpen: (open: boolean) => void;
  setConfirmarEliminarPagoId: (id: string | null) => void;
  
  // Funciones
  loadCajas: (sucursalId: string) => Promise<void>;
  loadMaletines: (sucursalId: string) => Promise<void>;
  loadPersonasElegibles: () => Promise<void>;
  handleRetiros: (caja: Caja) => void;
  handleVerOperacionesBancarias: (caja: Caja) => void;
  handleNuevoRetiro: () => void;
  handleGuardarRetiro: () => Promise<void>;
  
  // Funciones que faltan (agregadas)
  handleVerDetalle: (caja: Caja) => void;
  handleCerrarCaja: (caja: Caja) => void;
  handleNuevaCaja: () => void;
  confirmarEliminacionRetiro: () => void;
  cancelarEliminacionRetiro: () => void;
  handleEliminarRetiro: (retiroId: string) => void;
  handleNuevaOperacion: () => void;
  handleEditarOperacion: (operacion: OperacionBancaria) => void;
  handleEliminarOperacion: (operacionId: string) => void;
  handleVerApertura: (caja: Caja) => void;
  handleVerMovimientos: (caja: Caja) => void;
  handlePagos: (caja: Caja) => void;
  
  // Funciones para pagos
  handleNuevoPago: () => void;
  handleGuardarPago: () => Promise<void>;
  handleEliminarPago: (pagoId: string) => void;
  confirmarEliminacionPago: () => void;
  cancelarEliminacionPago: () => void;
  
  // Función para impresión
  handleImprimirResumen: (caja: Caja) => void;
  
  // Funciones para operaciones bancarias
  cargarOperacionesBancarias: (cajaId: string) => Promise<OperacionBancaria[]>;
  
  // Agregar el nuevo método para cerrar caja
  cerrarCajaActual: (datosCierre: any) => Promise<void>;
}

// Crear el contexto
const CajasContext = createContext<CajasContextType | undefined>(undefined);

// Proveedor del contexto
export const CajasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estados
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [maletines, setMaletines] = useState<Maletin[]>([]);
  const [maletinesEnUso, setMaletinesEnUso] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<Caja | null>(null);
  const [dialogAperturaOpen, setDialogAperturaOpen] = useState(false);
  const [dialogCierreOpen, setDialogCierreOpen] = useState(false);
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false);
  const [dialogVerAperturaOpen, setDialogVerAperturaOpen] = useState(false);
  const [dialogVerMovimientosOpen, setDialogVerMovimientosOpen] = useState(false);
  const [dialogPagosOpen, setDialogPagosOpen] = useState(false);
  
  // Estados para retiros
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [retirosDialogOpen, setRetirosDialogOpen] = useState(false);
  const [listaRetirosDialogOpen, setListaRetirosDialogOpen] = useState(false);
  const [formRetiro, setFormRetiro] = useState<FormRetiro>({
    montoPYG: '',
    montoBRL: '',
    montoUSD: '',
    personaId: '',
    personaNombre: '',
    observacion: ''
  });
  const [confirmarEliminarRetiroId, setConfirmarEliminarRetiroId] = useState<string | null>(null);
  const [personasBusqueda, setPersonasBusqueda] = useState<{id: string; nombre: string; tipo: 'funcionario' | 'vip'}[]>([]);
  const [busquedaPersona, setBusquedaPersona] = useState('');
  const [buscandoPersonas, setBuscandoPersonas] = useState(false);
  const [personasDisponibles, setPersonasDisponibles] = useState<Persona[]>([]);
  
  // Estados para operaciones bancarias
  const [operacionesBancarias, setOperacionesBancarias] = useState<OperacionBancaria[]>([]);
  const [operacionesBancariasDialogOpen, setOperacionesBancariasDialogOpen] = useState(false);
  const [formOperacionDialogOpen, setFormOperacionDialogOpen] = useState(false);
  const [formOperacion, setFormOperacion] = useState<OperacionBancaria>({
    tipo: 'pos',
    monto: 0,
    tipoServicio: ''
  });
  const [confirmarEliminarOperacionId, setConfirmarEliminarOperacionId] = useState<string | null>(null);
  
  // Formularios
  const [formApertura, setFormApertura] = useState<FormularioApertura>(cajaInicial);
  
  // Estados para pagos
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosDialogOpen, setPagosDialogOpen] = useState(false);
  const [listaPagosDialogOpen, setListaPagosDialogOpen] = useState(false);
  const [formPago, setFormPago] = useState<FormPago>({
    operadora: '',
    servicio: '',
    monto: '',
    moneda: 'PYG'
  });
  const [confirmarEliminarPagoId, setConfirmarEliminarPagoId] = useState<string | null>(null);
  
  // Importar contextos
  const { sucursalActual } = useSucursal();
  const { user, hasPermission } = useAuth();
  const isOperador = user && user.rol && user.rol.nombre.toUpperCase() === 'OPERADOR';
  
  // Actualizar maletines en uso cuando cambien las cajas
  useEffect(() => {
    // Filtrar cajas abiertas y extraer sus IDs de maletín
    const maletinesUsados = cajas
      .filter(caja => caja.estado === 'abierta')
      .map(caja => caja.maletinId);
    
    setMaletinesEnUso(maletinesUsados);
  }, [cajas]);
  
  // Cargar cajas cuando cambie la sucursal
  useEffect(() => {
    if (sucursalActual) {
      loadCajas(sucursalActual.id);
      loadMaletines(sucursalActual.id);
    }
  }, [sucursalActual]);
  
  // Efecto para filtrar personas según el texto de búsqueda
  useEffect(() => {
    if (busquedaPersona.trim() !== '') {
      const busquedaUpper = busquedaPersona.toUpperCase();
      const personasFiltradas = personasDisponibles
        .filter(p => 
          p.nombreCompleto.toUpperCase().includes(busquedaUpper) || 
          (p.documento && p.documento.toUpperCase().includes(busquedaUpper))
        )
        .map(p => ({
          id: p.id.toString(),
          nombre: p.nombreCompleto,
          tipo: p.tipo.toLowerCase() as 'funcionario' | 'vip'
        }));
      
      setPersonasBusqueda(personasFiltradas);
    } else if (busquedaPersona.trim() === '' && !formRetiro.personaId) {
      // Si el campo está vacío y no hay persona seleccionada, mostrar todas
      setPersonasBusqueda(personasDisponibles.map(p => ({
        id: p.id.toString(),
        nombre: p.nombreCompleto,
        tipo: p.tipo.toLowerCase() as 'funcionario' | 'vip'
      })));
    }
  }, [busquedaPersona, personasDisponibles, formRetiro.personaId]);
  
  // Función para cargar cajas
  const loadCajas = async (sucursalId: string) => {
    try {
      setLoading(true);
      
      // Si el usuario es administrador, cargar todas las cajas
      if (user && user.rol && user.rol.nombre.toUpperCase() === 'ADMINISTRADOR') {
        // Usar la API que devuelve todas las cajas
        const response = await axios.get('/api/cajas');
        
        // Ordenar cajas por fecha de apertura, de más reciente a menos reciente
        const cajasOrdenadas = [...response.data].sort((a, b) => {
          return new Date(b.fechaApertura).getTime() - new Date(a.fechaApertura).getTime();
        });
        
        setCajas(cajasOrdenadas);
      } else {
        // Convertir el ID de sucursal de 'SUC001' a '1'
        let backendSucursalId = sucursalId;
        if (sucursalId.startsWith('SUC')) {
          // Extraer el número y convertirlo a string (SUC001 -> 1)
          const numericId = parseInt(sucursalId.replace('SUC', ''), 10);
          backendSucursalId = numericId.toString();
        }
        
        const response = await axios.get(`/api/cajas/sucursal/${backendSucursalId}`);
        
        // Ordenar cajas por fecha de apertura, de más reciente a menos reciente
        const cajasOrdenadas = [...response.data].sort((a, b) => {
          return new Date(b.fechaApertura).getTime() - new Date(a.fechaApertura).getTime();
        });
        
        setCajas(cajasOrdenadas);
      }
    } catch (error) {
      console.error('Error al cargar cajas:', error);
      setErrorMessage('Error al cargar las cajas de la sucursal');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar maletines
  const loadMaletines = async (sucursalId: string) => {
    try {
      // Convertir el ID de sucursal de 'SUC001' a '1'
      let backendSucursalId = sucursalId;
      if (sucursalId.startsWith('SUC')) {
        const numericId = parseInt(sucursalId.replace('SUC', ''), 10);
        backendSucursalId = numericId.toString();
      }
      
      const response = await axios.get(`/api/maletines/sucursal/${backendSucursalId}`);
      setMaletines(response.data);
    } catch (error) {
      console.error('Error al cargar maletines:', error);
      setMaletines([]);
    }
  };
  
  // Función para cargar personas elegibles
  const loadPersonasElegibles = async () => {
    try {
      setBuscandoPersonas(true);
      // Aquí deberíamos usar personaService pero para no complicar, usamos axios directamente
      const response = await axios.get('/api/personas');
      const data = response.data;
      
      // Filtrar solo funcionarios y VIP
      const personasElegibles = data.filter(
        (persona: Persona) => persona.tipo === 'Funcionario' || persona.tipo === 'Vip'
      );
      
      setPersonasDisponibles(personasElegibles);
      setPersonasBusqueda(personasElegibles.map((p: Persona) => ({
        id: p.id.toString(),
        nombre: p.nombreCompleto,
        tipo: p.tipo.toLowerCase() as 'funcionario' | 'vip'
      })));
      
      setBuscandoPersonas(false);
    } catch (error) {
      console.error('Error al cargar personas elegibles:', error);
      setBuscandoPersonas(false);
    }
  };
  
  // Función para manejar retiros
  const handleRetiros = (caja: Caja) => {
    setCajaSeleccionada(caja);
    setLoading(true);
    
    // Cargar retiros desde la API
    axios.get(`/api/cajas/${caja.id}/retiros`)
      .then(response => {
        setRetiros(response.data);
        setListaRetirosDialogOpen(true);
      })
      .catch(error => {
        console.error('Error al cargar retiros:', error);
        setErrorMessage('Error al cargar los retiros de la caja');
        
        // En caso de error, podemos mostrar un arreglo vacío
        setRetiros([]);
        setListaRetirosDialogOpen(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Función para manejar operaciones bancarias
  const handleVerOperacionesBancarias = (caja: Caja) => {
    setCajaSeleccionada(caja);
    setLoading(true);
    
    // Cargar operaciones bancarias desde la API
    axios.get(`/api/cajas/${caja.id}/operaciones-bancarias`)
      .then(response => {
        setOperacionesBancarias(response.data);
        setOperacionesBancariasDialogOpen(true);
      })
      .catch(error => {
        console.error('Error al cargar operaciones bancarias:', error);
        setErrorMessage('Error al cargar las operaciones bancarias de la caja');
        
        // En caso de error, podemos mostrar un arreglo vacío
        setOperacionesBancarias([]);
        setOperacionesBancariasDialogOpen(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Función para abrir el formulario de nuevo retiro
  const handleNuevoRetiro = () => {
    // Reiniciar el formulario de retiro
    setFormRetiro({
      montoPYG: '',
      montoBRL: '',
      montoUSD: '',
      personaId: '',
      personaNombre: '',
      observacion: ''
    });
    // Cargar personas elegibles
    loadPersonasElegibles();
    setRetirosDialogOpen(true);
    setListaRetirosDialogOpen(false);
  };
  
  // Función para guardar un retiro
  const handleGuardarRetiro = async () => {
    if (!cajaSeleccionada) return;
    
    // Convertir los valores formateados a números
    // Para guaraníes: quitar los puntos de separación de miles
    const montoPYG = formRetiro.montoPYG ? parseFloat(formRetiro.montoPYG.replace(/\./g, '')) : 0;
    
    // Para reales (BRL): formato brasileño (punto para miles, coma para decimales)
    // Reemplazar los puntos y convertir la coma a punto
    const montoBRL = formRetiro.montoBRL ? parseFloat(formRetiro.montoBRL.replace(/\./g, '').replace(',', '.')) : 0;
    
    // Para dólares (USD): formato estadounidense (coma para miles, punto para decimales)
    // Solo quitar las comas de separación de miles
    const montoUSD = formRetiro.montoUSD ? parseFloat(formRetiro.montoUSD.replace(/,/g, '')) : 0;
    
    // Verificar que al menos un monto sea mayor que cero
    if (montoPYG <= 0 && montoBRL <= 0 && montoUSD <= 0) {
      setErrorMessage('Debe ingresar al menos un monto en alguna moneda para realizar el retiro');
      return;
    }
    
    if (!formRetiro.personaId) {
      setErrorMessage('Debe seleccionar una persona para registrar el retiro');
      return;
    }

    try {
      setLoading(true);
      
      // Crear la data para el retiro
      const retiroData = {
        montoPYG: montoPYG.toString(),
        montoBRL: montoBRL.toString(),
        montoUSD: montoUSD.toString(),
        personaId: formRetiro.personaId,
        personaNombre: formRetiro.personaNombre,
        observacion: formRetiro.observacion
      };
      
      // Llamada a la API para guardar el retiro
      const response = await axios.post(`/api/cajas/${cajaSeleccionada.id}/retiros`, retiroData);
      
      const nuevoRetiro = response.data;
      
      setSuccessMessage('Retiro registrado correctamente');
      setRetirosDialogOpen(false);
      
      // Actualizar la lista de retiros
      setRetiros([...retiros, nuevoRetiro]);
      setListaRetirosDialogOpen(true);
      
      // Recargar los datos de la caja para reflejar el retiro
      if (sucursalActual) {
        loadCajas(sucursalActual.id);
      }
      
      // Limpiar el formulario
      setFormRetiro({
        montoPYG: '',
        montoBRL: '',
        montoUSD: '',
        personaId: '',
        personaNombre: '',
        observacion: ''
      });
      
    } catch (error) {
      console.error('Error al registrar retiro:', error);
      setErrorMessage('Error al registrar el retiro. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para manejar el detalle de una caja
  const handleVerDetalle = (caja: Caja) => {
    // Verificar si la caja está cerrada pero no tiene saldos finales
    if (caja.estado === 'cerrada' && (!caja.saldoFinal || !caja.saldoFinal.total)) {
      console.log('Caja cerrada sin saldos finales. Cargando datos desde el backend...');
      axios.get(`/api/cajas/${caja.id}/datos-cierre`)
        .then(response => {
          console.log('Datos de cierre cargados:', response.data);
          // Crear una copia de la caja con los datos de cierre completados
          const cajaCompleta = {
            ...caja,
            saldoFinal: response.data.saldoFinal || { 
              denominaciones: [],
              total: { PYG: 0, BRL: 0, USD: 0 }
            },
            saldosServiciosFinal: response.data.saldosServiciosFinal || []
          };
          setCajaSeleccionada(cajaCompleta);
          setDialogDetalleOpen(true);
        })
        .catch(error => {
          console.error('Error al cargar datos de cierre:', error);
          // Aún con error, mostrar la caja con valores por defecto
          const cajaConValoresDefault = {
            ...caja,
            // Inicializar saldosServiciosInicial como array vacío si no existe o no es un array
            saldosServiciosInicial: Array.isArray(caja.saldosServiciosInicial) 
              ? caja.saldosServiciosInicial 
              : [],
            // Inicializar saldoFinal con valores por defecto
            saldoFinal: caja.saldoFinal || { 
              denominaciones: [],
              total: { PYG: 0, BRL: 0, USD: 0 }
            },
            // Inicializar saldosServiciosFinal como array vacío si no existe o no es un array
            saldosServiciosFinal: Array.isArray(caja.saldosServiciosFinal) 
              ? caja.saldosServiciosFinal 
              : []
          };
          setCajaSeleccionada(cajaConValoresDefault);
          setDialogDetalleOpen(true);
        });
    } else {
      // Caso normal cuando los datos ya están completos o la caja está abierta
      // Asegurarse de que la caja tenga todos los campos necesarios inicializados
      const cajaConValoresDefault = {
        ...caja,
        // Inicializar saldosServiciosInicial como array vacío si no existe o no es un array
        saldosServiciosInicial: Array.isArray(caja.saldosServiciosInicial) 
          ? caja.saldosServiciosInicial 
          : [],
        // Inicializar saldoFinal con valores por defecto en caso de que la caja esté cerrada
        saldoFinal: caja.estado === 'cerrada' && !caja.saldoFinal 
          ? { denominaciones: [], total: { PYG: 0, BRL: 0, USD: 0 } } 
          : caja.saldoFinal,
        // Inicializar saldosServiciosFinal como array vacío si no existe o no es un array
        saldosServiciosFinal: Array.isArray(caja.saldosServiciosFinal) 
          ? caja.saldosServiciosFinal 
          : []
      };
      
      setCajaSeleccionada(cajaConValoresDefault);
      setDialogDetalleOpen(true);
    }
  };
  
  // Función para ver los datos de apertura de una caja
  const handleVerApertura = (caja: Caja) => {
    // Asegurarse de que la caja tenga servicios iniciales
    if (caja) {
      // Si la caja no tiene servicios iniciales o no es un array, inicializarlos
      if (!caja.saldosServiciosInicial || !Array.isArray(caja.saldosServiciosInicial) || caja.saldosServiciosInicial.length === 0) {
        console.log('Inicializando servicios iniciales para la caja', caja.id);
        caja.saldosServiciosInicial = serviciosIniciales.map(s => ({...s, monto: 0}));
      }
      
      setCajaSeleccionada(caja);
      setDialogVerAperturaOpen(true);
    }
  };
  
  // Función para ver los movimientos de una caja
  const handleVerMovimientos = (caja: Caja) => {
    setCajaSeleccionada(caja);
    setDialogVerMovimientosOpen(true);
  };
  
  // Función para cerrar una caja
  const handleCerrarCaja = (caja: Caja) => {
    // Verificar si la caja ya está cerrada
    if (caja.estado === 'cerrada') {
      // Cargar los datos de cierre desde el backend para edición
      setLoading(true);
      axios.get(`/api/cajas/${caja.id}/datos-cierre`)
        .then(response => {
          // Almacenar los datos de cierre en el contexto para su edición
          console.log('Datos de cierre cargados:', response.data);
          
          // Crear una copia de la caja con los datos de cierre
          const cajaConDatosCierre = {
            ...caja,
            saldoFinal: response.data.saldoFinal || null,
            saldosServiciosFinal: response.data.saldosServiciosFinal || []
          };
          
          // Actualizar la caja seleccionada con los datos de cierre
          setCajaSeleccionada(cajaConDatosCierre);
          
          // Abrir el diálogo de cierre
          setDialogCierreOpen(true);
        })
        .catch(error => {
          console.error('Error al cargar datos de cierre:', error);
          setErrorMessage('Error al cargar los datos de cierre. Por favor, inténtelo de nuevo.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Para cajas abiertas, simplemente abrir el diálogo de cierre
      setCajaSeleccionada(caja);
      setDialogCierreOpen(true);
    }
  };
  
  // Función para crear una nueva caja
  const handleNuevaCaja = () => {
    // Crear una copia profunda de las denominaciones y servicios iniciales
    const denominacionesReseteadas = [
      ...denominacionesGuaranies.map(d => ({...d, cantidad: 0})),
      ...denominacionesReales.map(d => ({...d, cantidad: 0})),
      ...denominacionesDolares.map(d => ({...d, cantidad: 0}))
    ];
    
    const serviciosReseteados = serviciosIniciales.map(s => ({...s, monto: 0}));
    
    // Resetear el formulario completo con valores iniciales
    setFormApertura({
      sucursalId: sucursalActual?.id || '',
      usuarioId: user?.id?.toString() || '1',
      usuario: user?.username || 'Usuario Actual',
      maletinId: '',
      saldoInicial: {
        denominaciones: denominacionesReseteadas,
        total: {
          PYG: 0,
          BRL: 0,
          USD: 0
        }
      },
      saldosServiciosInicial: serviciosReseteados
    });
    
    // Abrir el diálogo de apertura
    setDialogAperturaOpen(true);
  };
  
  // Función para confirmar la eliminación de un retiro
  const confirmarEliminacionRetiro = async () => {
    if (confirmarEliminarRetiroId) {
      try {
        setLoading(true);
        
        // Encontrar el retiro por ID para obtener todos sus IDs
        const retiroAEliminar = retiros.find(r => r.id === confirmarEliminarRetiroId);
        
        if (!retiroAEliminar) {
          setErrorMessage('Error al eliminar el retiro: No se encontró el retiro seleccionado.');
          return;
        }
        
        // Usar el array de IDs si existe, sino usar el ID principal
        const idsAEliminar = retiroAEliminar.ids || [retiroAEliminar.id];
        
        // Llamada a la API para eliminar el retiro enviando todos los IDs
        await axios.delete(`/api/cajas/retiros/${confirmarEliminarRetiroId}`, {
          data: { ids: idsAEliminar }
        });
        
        // Actualizar la lista de retiros
        setRetiros(prevRetiros => prevRetiros.filter(r => r.id !== confirmarEliminarRetiroId));
        
        setConfirmarEliminarRetiroId(null);
        setSuccessMessage('Retiro eliminado correctamente');
        
        // Recargar los datos de la caja para reflejar la eliminación
        if (sucursalActual && cajaSeleccionada) {
          loadCajas(sucursalActual.id);
        }
      } catch (error) {
        console.error('Error al eliminar retiro:', error);
        setErrorMessage('Error al eliminar el retiro. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Función para cancelar la eliminación de un retiro
  const cancelarEliminacionRetiro = () => {
    setConfirmarEliminarRetiroId(null);
  };
  
  // Función para manejar la eliminación de un retiro
  const handleEliminarRetiro = (retiroId: string) => {
    setConfirmarEliminarRetiroId(retiroId);
  };
  
  // Función para crear una nueva operación bancaria
  const handleNuevaOperacion = () => {
    // Reiniciar el formulario de operación
    setFormOperacion({
      tipo: 'pos',
      monto: 0,
      tipoServicio: ''
    });
    setFormOperacionDialogOpen(true);
    setOperacionesBancariasDialogOpen(false);
  };
  
  // Función para editar una operación bancaria
  const handleEditarOperacion = (operacion: OperacionBancaria) => {
    setFormOperacion(operacion);
    setFormOperacionDialogOpen(true);
    setOperacionesBancariasDialogOpen(false);
  };
  
  // Función para eliminar una operación bancaria
  const handleEliminarOperacion = async (operacionId: string) => {
    if (!operacionId) return;
    
    try {
      await operacionBancariaService.deleteOperacionBancaria(operacionId);
      
      // Actualizar la lista de operaciones
      if (cajaSeleccionada) {
        await cargarOperacionesBancarias(cajaSeleccionada.id);
      }
    } catch (error) {
      console.error('Error al eliminar operación bancaria:', error);
    }
  };
  
  // Función para gestionar pagos
  const handlePagos = (caja: Caja) => {
    setCajaSeleccionada(caja);
    
    setLoading(true);
    
    // Cargar los pagos desde el backend
    axios.get(`/api/cajas/${caja.id}/pagos`)
      .then(response => {
        setPagos(response.data);
        setListaPagosDialogOpen(true);
      })
      .catch(error => {
        console.error('Error al cargar los pagos:', error);
        setErrorMessage('Error al cargar los pagos. Por favor, inténtelo de nuevo.');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Función para iniciar un nuevo pago
  const handleNuevoPago = () => {
    setFormPago({
      operadora: '',
      servicio: '',
      monto: '',
      moneda: 'PYG',
      observacion: ''
    });
    setPagosDialogOpen(true);
  };
  
  // Función para guardar un pago
  const handleGuardarPago = async () => {
    try {
      setLoading(true);
      
      if (!cajaSeleccionada) {
        setErrorMessage('No hay una caja seleccionada');
        return;
      }

      // Validar campos requeridos
      if (!formPago.operadora || !formPago.servicio || !formPago.monto) {
        setErrorMessage('Faltan datos requeridos para el pago');
        return;
      }
      
      // Verificar que formPago.monto sea un string válido
      if (typeof formPago.monto !== 'string') {
        setErrorMessage('El formato del monto es inválido');
        return;
      }
      
      // Eliminar cualquier formato (puntos de miles)
      const montoSinFormato = formPago.monto.replace(/\./g, '');
      
      // Convertir a número entero (guaraníes no tienen decimales)
      const montoNumerico = parseInt(montoSinFormato, 10);
      
      // Validar que sea un número válido y mayor a cero
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        setErrorMessage('El monto debe ser mayor a cero');
        return;
      }
      
      // Crear un FormData para enviar al backend
      const formData = new FormData();
      formData.append('operadora', formPago.operadora);
      formData.append('servicio', formPago.servicio);
      formData.append('monto', montoNumerico.toString());
      formData.append('moneda', formPago.moneda);
      
      if (formPago.observacion) {
        formData.append('observacion', formPago.observacion);
      }
      
      // Si hay un comprobante, añadirlo al FormData
      if (formPago.comprobante) {
        formData.append('comprobante', formPago.comprobante);
      }
      
      // Enviar la petición al backend
      const response = await axios.post(
        `/api/cajas/${cajaSeleccionada.id}/pagos`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Añadir el nuevo pago a la lista
      setPagos(prevPagos => [...prevPagos, response.data]);
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Pago registrado correctamente');
      
      // Cerrar el diálogo
      setPagosDialogOpen(false);
      
      // Reiniciar el formulario
      setFormPago({
        operadora: '',
        servicio: '',
        monto: '',
        moneda: 'PYG'
      });
    } catch (error) {
      console.error('Error al guardar el pago:', error);
      setErrorMessage('Error al registrar el pago. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para eliminar un pago
  const handleEliminarPago = (pagoId: string) => {
    setConfirmarEliminarPagoId(pagoId);
  };
  
  // Función para confirmar la eliminación de un pago
  const confirmarEliminacionPago = async () => {
    try {
      setLoading(true);
      
      if (!confirmarEliminarPagoId) {
        return;
      }
      
      // Enviar la petición al backend
      await axios.delete(`/api/cajas/pagos/${confirmarEliminarPagoId}`);
      
      // Eliminar el pago de la lista
      setPagos(prevPagos => prevPagos.filter(pago => pago.id !== confirmarEliminarPagoId));
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Pago eliminado correctamente');
      
      // Cerrar el diálogo
      setConfirmarEliminarPagoId(null);
    } catch (error) {
      console.error('Error al eliminar el pago:', error);
      setErrorMessage('Error al eliminar el pago. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cancelar la eliminación de un pago
  const cancelarEliminacionPago = () => {
    setConfirmarEliminarPagoId(null);
  };
  
  // Función para manejar la impresión del resumen
  const handleImprimirResumen = (caja: Caja) => {
    setCajaSeleccionada(caja);
    
    // Usamos setTimeout para permitir que la caja seleccionada se establezca correctamente
    setTimeout(() => {
      // Crear un estilo para la impresión
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .MuiDialog-root * {
            visibility: hidden;
          }
          #resumen-para-imprimir, #resumen-para-imprimir * {
            visibility: visible;
          }
          #resumen-para-imprimir {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          #boton-cerrar-dialogo {
            display: none;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Ejecutar la impresión
      window.print();
      
      // Eliminar el estilo después de imprimir
      setTimeout(() => {
        document.head.removeChild(style);
      }, 1000);
    }, 300);
  };
  
  // Función para cargar operaciones bancarias desde el backend
  const cargarOperacionesBancarias = async (cajaId: string): Promise<OperacionBancaria[]> => {
    console.log('Cargando operaciones bancarias para caja:', cajaId);
    try {
      const operaciones = await operacionBancariaService.getOperacionesBancariasByCajaId(cajaId);
      console.log('Operaciones bancarias cargadas:', operaciones);
      setOperacionesBancarias(operaciones);
      return operaciones;
    } catch (error) {
      console.error('Error al cargar operaciones bancarias:', error);
      setErrorMessage('Error al cargar operaciones bancarias');
      return [];
    }
  };
  
  // Función para cerrar la caja actual
  const cerrarCajaActual = async (datosCierre: any) => {
    if (!cajaSeleccionada) {
      setErrorMessage('No hay una caja seleccionada para cerrar');
      return;
    }
    
    try {
      setLoading(true);
      
      // Realizar la petición de cierre
      await axios.put(
        `${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/cerrar`,
        datosCierre
      );
      
      // Actualizar la lista de cajas
      if (sucursalActual) {
        await loadCajas(sucursalActual.id);
      }
      
      setSuccessMessage('Caja cerrada correctamente');
      setDialogCierreOpen(false);
    } catch (error: any) {
      console.error('Error al cerrar la caja:', error);
      setErrorMessage(`Error al cerrar la caja: ${error.response?.data?.error || 'Error en la conexión'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    // Estados
    cajas,
    maletines,
    maletinesEnUso,
    loading,
    errorMessage,
    successMessage,
    tabIndex,
    cajaSeleccionada,
    dialogAperturaOpen,
    dialogCierreOpen,
    dialogDetalleOpen,
    dialogVerAperturaOpen,
    dialogVerMovimientosOpen,
    dialogPagosOpen,
    
    // Retiros
    retiros,
    formRetiro,
    retirosDialogOpen,
    listaRetirosDialogOpen,
    confirmarEliminarRetiroId,
    personasBusqueda,
    busquedaPersona,
    buscandoPersonas,
    personasDisponibles,
    
    // Operaciones bancarias
    operacionesBancarias,
    operacionesBancariasDialogOpen,
    formOperacionDialogOpen,
    formOperacion,
    confirmarEliminarOperacionId,
    
    // Formularios
    formApertura,
    
    // Estados de pagos
    pagos,
    formPago,
    pagosDialogOpen,
    listaPagosDialogOpen,
    confirmarEliminarPagoId,
    
    // Setters
    setErrorMessage,
    setSuccessMessage,
    setLoading,
    setTabIndex,
    setCajaSeleccionada,
    setFormApertura,
    setDialogAperturaOpen,
    setDialogCierreOpen,
    setDialogDetalleOpen,
    setDialogVerAperturaOpen,
    setDialogVerMovimientosOpen,
    setDialogPagosOpen,
    
    // Setters para retiros
    setRetiros,
    setFormRetiro,
    setRetirosDialogOpen,
    setListaRetirosDialogOpen,
    setConfirmarEliminarRetiroId,
    setBusquedaPersona,
    
    // Setters para operaciones bancarias
    setOperacionesBancarias,
    setOperacionesBancariasDialogOpen,
    setFormOperacionDialogOpen,
    setFormOperacion,
    setConfirmarEliminarOperacionId,
    
    // Métodos para pagos
    setPagos,
    setFormPago,
    setPagosDialogOpen,
    setListaPagosDialogOpen,
    setConfirmarEliminarPagoId,
    
    // Funciones
    loadCajas,
    loadMaletines,
    loadPersonasElegibles,
    handleRetiros,
    handleVerOperacionesBancarias,
    handleNuevoRetiro,
    handleGuardarRetiro,
    handleEliminarRetiro,
    confirmarEliminacionRetiro,
    cancelarEliminacionRetiro,
    
    // Funciones para operaciones bancarias
    handleNuevaOperacion,
    handleEditarOperacion,
    handleEliminarOperacion,
    
    // Funciones para pagos
    handleNuevoPago,
    handleGuardarPago,
    handleEliminarPago,
    confirmarEliminacionPago,
    cancelarEliminacionPago,
    
    // Otras funciones
    handleVerDetalle,
    handleCerrarCaja,
    handleNuevaCaja,
    handleVerApertura,
    handleVerMovimientos,
    handlePagos,
    
    // Función para impresión
    handleImprimirResumen,
    
    // Funciones para operaciones bancarias
    cargarOperacionesBancarias,
    
    // Agregar el nuevo método para cerrar caja
    cerrarCajaActual
  };
  
  return <CajasContext.Provider value={value}>{children}</CajasContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useCajas = (): CajasContextType => {
  const context = useContext(CajasContext);
  if (context === undefined) {
    throw new Error('useCajas debe ser usado dentro de un CajasProvider');
  }
  return context;
}; 
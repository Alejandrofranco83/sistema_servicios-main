import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja } from '../helpers';
import { handleInputClick } from '../../../utils/inputUtils';
import axios from 'axios';

interface MovimientosData {
  tigo: {
    miniCarga: number;
    girosEnviados: number;
    retiros: number;
    cargaBilleteras: number;
  };
  personal: {
    maxiCarga: number;
    girosEnviados: number;
    retiros: number;
    cargaBilleteras: number;
  };
  claro: {
    recargaClaro: number;
    girosEnviados: number;
    retiros: number;
    cargaBilleteras: number;
  };
  aquiPago: {
    pagos: number;
    retiros: number;
  };
  wepaGuaranies: {
    pagos: number;
    retiros: number;
  };
  wepaDolares: {
    pagos: string;
    retiros: string;
  };
}

interface Comprobantes {
  [key: string]: File | null;
}

interface VerMovimientosDialogProps {
  open: boolean;
  onClose: () => void;
}

const VerMovimientosDialog: React.FC<VerMovimientosDialogProps> = ({ open, onClose }) => {
  const { cajaSeleccionada, setSuccessMessage, setErrorMessage, setLoading } = useCajas();

  // Estado para los datos de movimientos
  const [movimientosData, setMovimientosData] = useState<MovimientosData>({
    tigo: {
      miniCarga: 0,
      girosEnviados: 0,
      retiros: 0,
      cargaBilleteras: 0
    },
    personal: {
      maxiCarga: 0,
      girosEnviados: 0,
      retiros: 0,
      cargaBilleteras: 0
    },
    claro: {
      recargaClaro: 0,
      girosEnviados: 0,
      retiros: 0,
      cargaBilleteras: 0
    },
    aquiPago: {
      pagos: 0,
      retiros: 0
    },
    wepaGuaranies: {
      pagos: 0,
      retiros: 0
    },
    wepaDolares: {
      pagos: "0",
      retiros: "0"
    }
  });

  // Estado para los comprobantes
  const [comprobantes, setComprobantes] = useState<Record<string, File | null>>({
    tigo_miniCarga: null,
    tigo_girosEnviados: null,
    tigo_retiros: null,
    tigo_cargaBilleteras: null,
    personal_maxiCarga: null,
    personal_girosEnviados: null,
    personal_retiros: null,
    personal_cargaBilleteras: null,
    claro_recargaClaro: null,
    claro_girosEnviados: null,
    claro_retiros: null,
    claro_cargaBilleteras: null,
    aquiPago: null,
    wepaGuaranies: null,
    wepaDolares: null
  });

  // Cargar movimientos existentes cuando se abre el diálogo
  useEffect(() => {
    if (open && cajaSeleccionada && cajaSeleccionada.id) {
      setLoading(true);
      
      // Llamada a la API para obtener los movimientos existentes
      axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/movimiento`)
        .then(response => {
          console.log('Movimientos cargados:', response.data);
          
          // Si hay datos, actualizar el estado
          if (response.data && response.data.data) {
            const movimientosGuardados = response.data.data;
            
            // Actualizar el estado con los datos de la base de datos
            setMovimientosData(prevData => {
              // Crear una copia profunda del estado actual
              const newData = JSON.parse(JSON.stringify(prevData));
              
              // Actualizar cada operadora/servicio si existe en los datos cargados
              Object.keys(newData).forEach(operadora => {
                if (movimientosGuardados[operadora]) {
                  Object.keys(newData[operadora]).forEach(servicio => {
                    // Es importante incluir valores de 0 explícitamente, por eso no verificamos con !==undefined
                    if (operadora in movimientosGuardados && 
                        servicio in movimientosGuardados[operadora]) {
                      newData[operadora][servicio] = movimientosGuardados[operadora][servicio];
                    }
                  });
                }
              });
              
              return newData;
            });
            
            // Obtener los comprobantes del campo servicios de la respuesta de la API
            if (response.data && response.data.serviciosData) {
              const servicios = response.data.serviciosData;
              try {
                console.log('Servicios Data recibida de la API:', servicios);

                // Crear un nuevo objeto de estado para los comprobantes
                const nuevosComprobantes = {...comprobantes};
                
                // Mapeo de tipos backend a IDs frontend
                const tipoToId: Record<string, string> = {
                  'minicargas': 'tigo_miniCarga',
                  'maxicargas': 'personal_maxiCarga',
                  'recargaClaro': 'claro_recargaClaro',
                  'retirosTigoMoney': 'tigo_retiros',
                  'retirosBilleteraPersonal': 'personal_retiros',
                  'retirosBilleteraClaro': 'claro_retiros',
                  'cargasBilleteraTigo': 'tigo_cargaBilleteras',
                  'cargasBilleteraPersonal': 'personal_cargaBilleteras',
                  'cargasBilleteraClaro': 'claro_cargaBilleteras',
                  'girosEnviadosTigo': 'tigo_girosEnviados',
                  'girosEnviadosPersonal': 'personal_girosEnviados',
                  'girosEnviadosClaro': 'claro_girosEnviados',
                  'aquiPago': 'aquiPago',
                  'wepaGuaranies': 'wepaGuaranies',
                  'wepaDolares': 'wepaDolares',
                  'retirosAquiPago': 'aquiPago_retiros',
                  'retirosWepaGuaranies': 'wepaGuaranies_retiros',
                  'retirosWepaDolares': 'wepaDolares_retiros'
                };
                
                // Buscar comprobantes en el objeto servicios recibido
                Object.keys(tipoToId).forEach(tipo => {
                  if (servicios[tipo] && typeof servicios[tipo] === 'string') {
                    // Si el tipo existe en servicios, crear un archivo simulado
                    const dummyFile = new File([""], `comprobante_${tipo}.jpg`, {
                      type: "image/jpeg",
                    });
                    
                    // Agregar el ID del comprobante como metadato
                    Object.defineProperty(dummyFile, 'comprobanteId', {
                      value: tipo, // El ID es el mismo tipo backend (ej: 'girosEnviadosTigo')
                      writable: false
                    });
                    
                    // Guardar en el estado usando el ID frontend correspondiente
                    const frontendId = tipoToId[tipo];
                    if (frontendId) {
                      nuevosComprobantes[frontendId] = dummyFile;
                      console.log(`Comprobante encontrado para ${tipo}, guardado en estado como ${frontendId}`);
                    }
                  }
                });
                
                // Actualizar el estado de comprobantes
                setComprobantes(nuevosComprobantes);
              } catch (error) {
                console.error('Error al procesar comprobantes desde serviciosData:', error);
              }
            }
          }
        })
        .catch(error => {
          console.error('Error al cargar movimientos:', error);
          // Evitar mostrar el error 404 al usuario, ya que sabemos que puede ocurrir
          if (error.response && error.response.status !== 404) {
            setErrorMessage('Error al cargar los movimientos existentes: ' + 
                           (error.response?.data?.error || error.message));
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, cajaSeleccionada, setLoading, setErrorMessage]);

  if (!cajaSeleccionada) {
    return null;
  }

  // Función para formatear valores en guaraníes
  const formatGuaranies = (value: number) => {
    // Asegurarse de que value sea un número
    const numeroSeguro = isNaN(value) ? 0 : value;
    return new Intl.NumberFormat('es-PY').format(numeroSeguro);
  };

  // Función para manejar cambios en los campos de movimientos
  const handleMovimientoChange = (operadora: string, servicio: string, valor: string) => {
    const numericValue = valor === '' ? 0 : parseInt(valor.replace(/\D/g, ''), 10);
    
    setMovimientosData(prev => ({
      ...prev,
      [operadora]: {
        ...prev[operadora as keyof typeof prev],
        [servicio]: numericValue
      }
    }));
  };

  // Función para manejar el evento de focus en un input numérico (para seleccionar todo el texto)
  const handleNumericInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    try {
      // Marcar que este elemento recibió focus
      const input = e.target;
      
      // Usar setTimeout para asegurar que la selección ocurra después de que el navegador procese el evento de focus
      setTimeout(() => {
        // Verificar que el elemento aún existe y tiene el método select
        if (input && document.activeElement === input && 'select' in input) {
          input.select();
          
          // Para dispositivos móviles, también usamos setSelectionRange
          if ('setSelectionRange' in input) {
            const length = input.value.length;
            input.setSelectionRange(0, length);
          }
        }
      }, 10);
    } catch (error) {
      console.error('Error al seleccionar texto:', error);
    }
  };

  // Función para guardar los movimientos
  const handleGuardarMovimientos = () => {
    // Mostrar indicador de carga
    setLoading(true);
    
    // Preparar los datos para asegurarnos de que todos los servicios se actualicen
    // incluso aquellos que se cambiaron a valor cero
    const datosAEnviar = {
      ...movimientosData,
      // Agregamos una propiedad para indicar al backend que debe actualizar todos los campos
      actualizarTodos: true
    };
    
    // Llamada a la API para guardar los movimientos
    axios.post(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/movimiento`, datosAEnviar)
      .then(response => {
        console.log('Movimientos guardados:', response.data);
        
        // Filtrar los comprobantes que son archivos reales (no referencias a comprobantes existentes)
        const nuevosComprobantesEntries = Object.entries(comprobantes)
          .filter(([_, file]) => file !== null && !(file as any).comprobanteId);
        
        // Si no hay comprobantes nuevos, cerrar el diálogo inmediatamente
        if (nuevosComprobantesEntries.length === 0) {
          setSuccessMessage('Movimientos guardados correctamente (sin nuevos comprobantes)');
          onClose();
          setLoading(false);
          return;
        }

        console.log(`Preparando ${nuevosComprobantesEntries.length} nuevos comprobantes para subida en lote.`);

        // --- Lógica de subida en lote --- 
        const formData = new FormData();
        const tiposArchivos: string[] = []; // Array para guardar los tipos en orden

        nuevosComprobantesEntries.forEach(([id, file]) => {
          const fileReal = file as File;
          formData.append('comprobantes', fileReal, fileReal.name); // Clave 'comprobantes' para upload.array()
          
          // Mapear ID frontend a tipo backend (lógica existente)
          let tipoBackend = "";
          if (id === 'tigo_miniCarga') { tipoBackend = 'minicargas'; }
          else if (id === 'personal_maxiCarga') { tipoBackend = 'maxicargas'; }
          else if (id === 'claro_recargaClaro') { tipoBackend = 'recargaClaro'; }
          else if (id === 'tigo_retiros') { tipoBackend = 'retirosTigoMoney'; }
          else if (id === 'personal_retiros') { tipoBackend = 'retirosBilleteraPersonal'; }
          else if (id === 'claro_retiros') { tipoBackend = 'retirosBilleteraClaro'; }
          else if (id === 'tigo_cargaBilleteras') { tipoBackend = 'cargasBilleteraTigo'; }
          else if (id === 'personal_cargaBilleteras') { tipoBackend = 'cargasBilleteraPersonal'; }
          else if (id === 'claro_cargaBilleteras') { tipoBackend = 'cargasBilleteraClaro'; }
          else if (id === 'tigo_girosEnviados') { tipoBackend = 'girosEnviadosTigo'; }
          else if (id === 'personal_girosEnviados') { tipoBackend = 'girosEnviadosPersonal'; }
          else if (id === 'claro_girosEnviados') { tipoBackend = 'girosEnviadosClaro'; }
          else if (id === 'aquiPago_pagos') { tipoBackend = 'aquiPago'; } // Asumimos que el general es pagos?
          else if (id === 'aquiPago_retiros') { tipoBackend = 'retirosAquiPago'; }
          else if (id === 'wepaGuaranies_pagos') { tipoBackend = 'wepaGuaranies'; } // Asumimos que el general es pagos?
          else if (id === 'wepaGuaranies_retiros') { tipoBackend = 'retirosWepaGuaranies'; }
          else if (id === 'wepaDolares_pagos') { tipoBackend = 'wepaDolares'; } // Asumimos que el general es pagos?
          else if (id === 'wepaDolares_retiros') { tipoBackend = 'retirosWepaDolares'; }
          else if (id === 'aquiPago') { tipoBackend = 'aquiPago'; }
          else if (id === 'wepaGuaranies') { tipoBackend = 'wepaGuaranies'; }
          else if (id === 'wepaDolares') { tipoBackend = 'wepaDolares'; }
          else { 
            console.warn(`Tipo de comprobante no mapeado para lote: ${id}`);
            tipoBackend = 'desconocido'; // O manejar error
          }
          tiposArchivos.push(tipoBackend); // Guardar el tipo en el mismo orden que el archivo
        });

        // Añadir el array de tipos como un campo JSON stringificado
        formData.append('tipos', JSON.stringify(tiposArchivos));

        console.log('Enviando lote de comprobantes con tipos:', tiposArchivos);

        // Realizar la única llamada POST al nuevo endpoint batch
        axios.post(
          `${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/comprobantes/batch`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
        .then(response => {
           // Asumimos que el backend devuelve éxito si todo va bien
           console.log('Respuesta de subida en lote:', response.data);
           setSuccessMessage('Movimientos y comprobantes guardados correctamente.');
           onClose(); // Cerrar si la subida en lote fue exitosa
        })
        .catch(error => {
           // Manejar error de la subida en lote
           console.error('Error en la subida en lote de comprobantes:', error);
           const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
           setErrorMessage(`Se guardaron los movimientos, pero falló la subida de comprobantes en lote: ${errorMsg}. Revise e intente de nuevo.`);
           // No cerrar el diálogo
        })
        .finally(() => {
           setLoading(false);
        });

        // --- Fin Lógica de subida en lote --- 
      })
      .catch(error => { // Catch del POST de movimientos inicial
        console.error('Error al guardar movimientos:', error);
        setErrorMessage('Error al guardar los movimientos: ' + (error.response?.data?.error || error.message));
        setLoading(false);
      });
  };

  // Función para manejar la subida de archivos
  const handleFileUpload = (operadora: string, servicio: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let fileId: string;
      
      // Si no hay servicio, es un comprobante a nivel de operadora
      if (!servicio) {
        fileId = operadora;
      } else {
        fileId = `${operadora}_${servicio}`;
      }
      
      // Verificar si ya existe un comprobante (para reemplazarlo)
      const comprobanteExistente = comprobantes[fileId];
      const esReemplazo = comprobanteExistente !== null;
      
      // Actualizar el estado de comprobantes con el nuevo archivo
      setComprobantes(prev => ({
        ...prev,
        [fileId]: file
      }));
      
      // enviarlo directamente al servidor aquí
      if (esReemplazo && (comprobanteExistente as any)?.comprobanteId) {
        const comprobanteId = (comprobanteExistente as any).comprobanteId;
        
        // --- ELIMINAR LA SUBIDA INMEDIATA --- 
        console.log(`Reemplazando comprobante existente con ID: ${comprobanteId}. Se guardará al confirmar.`);
        
        /* // Comentamos toda la llamada PUT
        setLoading(true);
        
        const formData = new FormData();
        formData.append('comprobante', file);
        
        let tipoBackend = "";
        // ... (lógica de mapeo fileId a tipoBackend) ...
        if (fileId === 'tigo_miniCarga') { tipoBackend = 'minicargas'; } 
        // ... (resto de los else if) ...
        else if (fileId === 'wepaDolares') { tipoBackend = 'wepaDolares'; } 
        else { 
            console.warn(`Tipo de comprobante no mapeado en reemplazo: ${fileId}`);
            tipoBackend = 'minicargas'; 
        }
        formData.append('tipo', tipoBackend);

        console.log(`Enviando reemplazo de comprobante con tipo: ${tipoBackend} para archivo: ${file.name}`);

        axios.put(
          `${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/comprobante/${comprobanteId}`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
        .then(() => {
          setSuccessMessage(`Comprobante de ${servicio ? `${servicio} en ${operadora}` : operadora} actualizado correctamente`);
        })
        .catch(error => {
          console.error('Error al actualizar comprobante:', error);
          setErrorMessage('Error al actualizar el comprobante: ' + 
                        (error.response?.data?.error || error.message));
        })
        .finally(() => {
          setLoading(false);
        });
        */
        // --- FIN ELIMINAR SUBIDA INMEDIATA ---

        // Mantenemos el mensaje indicando que se guardará al confirmar
        const mensaje = servicio 
          ? `Comprobante para ${servicio} en ${operadora} reemplazado. Se guardará al confirmar.`
          : `Comprobante para ${operadora} reemplazado. Se guardará al confirmar.`;
        setSuccessMessage(mensaje);

      } else {
        // Mensaje para comprobantes nuevos
        const mensaje = esReemplazo
          ? (servicio 
              ? `Comprobante para ${servicio} en ${operadora} reemplazado. Se guardará al confirmar.`
              : `Comprobante para ${operadora} reemplazado. Se guardará al confirmar.`)
          : (servicio 
              ? `Comprobante para ${servicio} en ${operadora} seleccionado. Se guardará al confirmar.`
              : `Comprobante para ${operadora} seleccionado. Se guardará al confirmar.`);
        
        setSuccessMessage(mensaje);
      }
    }
  };

  // Función para ver el comprobante
  const handleVerComprobante = (operadora: string, servicio: string) => {
    const fileId = servicio ? `${operadora}_${servicio}` : operadora;
    const file = comprobantes[fileId];
    
    if (file) {
      // Para archivos recién subidos, mostrarlos directamente
      if (!(file as any).comprobanteId) {
        window.open(URL.createObjectURL(file), '_blank');
      } else {
        // Es un comprobante almacenado en el servidor, solicitar la URL para visualizarlo
        const comprobanteId = (file as any).comprobanteId;
        
        // Mapeo de IDs frontend a tipos backend (inverso del usado en useEffect)
        const idToTipo: Record<string, string> = {
          'tigo_miniCarga': 'minicargas',
          'personal_maxiCarga': 'maxicargas',
          'claro_recargaClaro': 'recargaClaro',
          'tigo_retiros': 'retirosTigoMoney',
          'personal_retiros': 'retirosBilleteraPersonal',
          'claro_retiros': 'retirosBilleteraClaro',
          'tigo_cargaBilleteras': 'cargasBilleteraTigo',
          'personal_cargaBilleteras': 'cargasBilleteraPersonal',
          'claro_cargaBilleteras': 'cargasBilleteraClaro',
          'tigo_girosEnviados': 'girosEnviadosTigo',
          'personal_girosEnviados': 'girosEnviadosPersonal',
          'claro_girosEnviados': 'girosEnviadosClaro',
          'aquiPago': 'aquiPago',
          'wepaGuaranies': 'wepaGuaranies',
          'wepaDolares': 'wepaDolares',
          'aquiPago_retiros': 'retirosAquiPago',
          'wepaGuaranies_retiros': 'retirosWepaGuaranies',
          'wepaDolares_retiros': 'retirosWepaDolares'
        };
        
        // Si comprobanteId ya es un tipo backend, lo usamos directamente
        // Si no, intentamos convertirlo usando el mapeo
        const tipoBackend = Object.keys(idToTipo).includes(fileId) ? idToTipo[fileId] : comprobanteId;
        
        console.log(`Solicitando comprobante con ID: ${tipoBackend}`);
        
        // Mostrar indicador de carga
        setLoading(true);
        
        // Llamada a la API para obtener la URL del comprobante
        axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/comprobante/${tipoBackend}`)
          .then(response => {
            if (response.data && response.data.url) {
              // Abrir en una nueva ventana
              window.open(response.data.url, '_blank');
            } else {
              setErrorMessage('No se pudo obtener la URL del comprobante');
            }
          })
          .catch(error => {
            console.error('Error al obtener URL del comprobante:', error);
            setErrorMessage('Error al obtener el comprobante: ' + 
                          (error.response?.data?.error || error.message));
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      const mensaje = servicio 
        ? `No hay comprobante disponible para ${servicio} en ${operadora}`
        : `No hay comprobante disponible para ${operadora}`;
      
      setErrorMessage(mensaje);
    }
  };

  // Generar IDs secuenciales para campos de movimientos
  const getMovimientoFieldId = (operadora: string, servicio: string): string => 
    `movimiento-${operadora}-${servicio.replace(/\s+/g, '-').toLowerCase()}`;

  // Función para navegar al siguiente campo con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId) as HTMLInputElement;
      if (nextField) {
        nextField.focus();
        nextField.select();
      }
    }
  };

  // Obtiene el ID del siguiente campo para el movimiento
  const getNextMovimientoFieldId = (operador: string, campo: string): string => {
    const fields = [
      // TIGO
      { op: 'tigo', campo: 'miniCarga' },
      { op: 'tigo', campo: 'girosEnviados' },
      { op: 'tigo', campo: 'retiros' },
      { op: 'tigo', campo: 'cargaBilleteras' },
      // PERSONAL
      { op: 'personal', campo: 'maxiCarga' },
      { op: 'personal', campo: 'girosEnviados' },
      { op: 'personal', campo: 'retiros' },
      { op: 'personal', campo: 'cargaBilleteras' },
      // CLARO
      { op: 'claro', campo: 'recargaClaro' },
      { op: 'claro', campo: 'girosEnviados' },
      { op: 'claro', campo: 'retiros' },
      { op: 'claro', campo: 'cargaBilleteras' },
      // AQUÍ PAGO
      { op: 'aquiPago', campo: 'pagos' },
      { op: 'aquiPago', campo: 'retiros' },
      // WEPA GUARANÍES
      { op: 'wepaGuaranies', campo: 'pagos' },
      { op: 'wepaGuaranies', campo: 'retiros' },
      // WEPA DÓLARES
      { op: 'wepaDolares', campo: 'pagos' },
      { op: 'wepaDolares', campo: 'retiros' },
    ];

    const currentIndex = fields.findIndex(f => f.op === operador && f.campo === campo);
    if (currentIndex === -1 || currentIndex === fields.length - 1) {
      // Si no se encuentra o es el último, devolver el primero
      return getMovimientoFieldId(fields[0].op, fields[0].campo);
    }
    
    return getMovimientoFieldId(fields[currentIndex + 1].op, fields[currentIndex + 1].campo);
  };

  // Registro de campos para navegación con Enter
  const inputRefs: { [key: string]: HTMLInputElement | null } = {};
  const registerInputRef = (id: string, ref: HTMLInputElement | null) => {
    inputRefs[id] = ref;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Movimientos por Operadora - {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId})
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Columna TIGO */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '1px solid', pb: 1 }}>
                TIGO
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Mini Carga</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.tigo.miniCarga)}
                          onChange={(e) => handleMovimientoChange('tigo', 'miniCarga', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('tigo', 'miniCarga'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('tigo', 'miniCarga'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('tigo', 'miniCarga'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('tigo', 'miniCarga', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('tigo', 'miniCarga')}
                            disabled={!comprobantes.tigo_miniCarga}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Giros Enviados</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.tigo.girosEnviados)}
                          onChange={(e) => handleMovimientoChange('tigo', 'girosEnviados', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('tigo', 'girosEnviados'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('tigo', 'girosEnviados'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('tigo', 'girosEnviados'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('tigo', 'girosEnviados', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('tigo', 'girosEnviados')}
                            disabled={!comprobantes.tigo_girosEnviados}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Retiros</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.tigo.retiros)}
                          onChange={(e) => handleMovimientoChange('tigo', 'retiros', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('tigo', 'retiros'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('tigo', 'retiros'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('tigo', 'retiros'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('tigo', 'retiros', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('tigo', 'retiros')}
                            disabled={!comprobantes.tigo_retiros}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carga de Billeteras</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.tigo.cargaBilleteras)}
                          onChange={(e) => handleMovimientoChange('tigo', 'cargaBilleteras', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('tigo', 'cargaBilleteras'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('tigo', 'cargaBilleteras'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('tigo', 'cargaBilleteras'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('tigo', 'cargaBilleteras', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('tigo', 'cargaBilleteras')}
                            disabled={!comprobantes.tigo_cargaBilleteras}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Columna PERSONAL */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', borderBottom: '1px solid', pb: 1 }}>
                PERSONAL
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Maxi Carga</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.personal.maxiCarga)}
                          onChange={(e) => handleMovimientoChange('personal', 'maxiCarga', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('personal', 'maxiCarga'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('personal', 'maxiCarga'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('personal', 'maxiCarga'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('personal', 'maxiCarga', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('personal', 'maxiCarga')}
                            disabled={!comprobantes.personal_maxiCarga}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Giros Enviados</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.personal.girosEnviados)}
                          onChange={(e) => handleMovimientoChange('personal', 'girosEnviados', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('personal', 'girosEnviados'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('personal', 'girosEnviados'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('personal', 'girosEnviados'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('personal', 'girosEnviados', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('personal', 'girosEnviados')}
                            disabled={!comprobantes.personal_girosEnviados}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Retiros</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.personal.retiros)}
                          onChange={(e) => handleMovimientoChange('personal', 'retiros', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('personal', 'retiros'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('personal', 'retiros'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('personal', 'retiros'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('personal', 'retiros', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('personal', 'retiros')}
                            disabled={!comprobantes.personal_retiros}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carga de Billeteras</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.personal.cargaBilleteras)}
                          onChange={(e) => handleMovimientoChange('personal', 'cargaBilleteras', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('personal', 'cargaBilleteras'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('personal', 'cargaBilleteras'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('personal', 'cargaBilleteras'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('personal', 'cargaBilleteras', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('personal', 'cargaBilleteras')}
                            disabled={!comprobantes.personal_cargaBilleteras}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Columna CLARO */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'error.main', borderBottom: '1px solid', pb: 1 }}>
                CLARO
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Recarga Claro</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.claro.recargaClaro)}
                          onChange={(e) => handleMovimientoChange('claro', 'recargaClaro', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('claro', 'recargaClaro'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('claro', 'recargaClaro'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('claro', 'recargaClaro'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('claro', 'recargaClaro', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('claro', 'recargaClaro')}
                            disabled={!comprobantes.claro_recargaClaro}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Giros Enviados</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.claro.girosEnviados)}
                          onChange={(e) => handleMovimientoChange('claro', 'girosEnviados', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('claro', 'girosEnviados'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('claro', 'girosEnviados'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('claro', 'girosEnviados'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('claro', 'girosEnviados', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('claro', 'girosEnviados')}
                            disabled={!comprobantes.claro_girosEnviados}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Retiros</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.claro.retiros)}
                          onChange={(e) => handleMovimientoChange('claro', 'retiros', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('claro', 'retiros'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('claro', 'retiros'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('claro', 'retiros'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('claro', 'retiros', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('claro', 'retiros')}
                            disabled={!comprobantes.claro_retiros}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carga de Billeteras</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.claro.cargaBilleteras)}
                          onChange={(e) => handleMovimientoChange('claro', 'cargaBilleteras', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('claro', 'cargaBilleteras'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '135%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('claro', 'cargaBilleteras'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('claro', 'cargaBilleteras'), ref)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            component="label" 
                            color="primary"
                            title="Subir comprobante"
                          >
                            <AttachFileIcon fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleFileUpload('claro', 'cargaBilleteras', e)}
                            />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerComprobante('claro', 'cargaBilleteras')}
                            disabled={!comprobantes.claro_cargaBilleteras}
                            title="Ver comprobante"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* AQUÍ PAGO */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', pb: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main', mb: 0 }}>
                  AQUÍ PAGO
                </Typography>
                <Box>
                  <IconButton 
                    size="small" 
                    component="label" 
                    color="primary"
                    title="Subir comprobante"
                  >
                    <AttachFileIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('aquiPago', '', e)}
                    />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="info"
                    onClick={() => handleVerComprobante('aquiPago', '')}
                    disabled={!comprobantes.aquiPago}
                    title="Ver comprobante"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pagos</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.aquiPago.pagos)}
                          onChange={(e) => handleMovimientoChange('aquiPago', 'pagos', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('aquiPago', 'pagos'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '95%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('aquiPago', 'pagos'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('aquiPago', 'pagos'), ref)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Retiros</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.aquiPago.retiros)}
                          onChange={(e) => handleMovimientoChange('aquiPago', 'retiros', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('aquiPago', 'retiros'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '95%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('aquiPago', 'retiros'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('aquiPago', 'retiros'), ref)}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          {/* WEPA GUARANÍES */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', pb: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'info.main', mb: 0 }}>
                  WEPA GUARANÍES
                </Typography>
                <Box>
                  <IconButton 
                    size="small" 
                    component="label" 
                    color="primary"
                    title="Subir comprobante"
                  >
                    <AttachFileIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('wepaGuaranies', '', e)}
                    />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="info"
                    onClick={() => handleVerComprobante('wepaGuaranies', '')}
                    disabled={!comprobantes.wepaGuaranies}
                    title="Ver comprobante"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pagos</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.wepaGuaranies.pagos)}
                          onChange={(e) => handleMovimientoChange('wepaGuaranies', 'pagos', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('wepaGuaranies', 'pagos'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '95%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('wepaGuaranies', 'pagos'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('wepaGuaranies', 'pagos'), ref)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Retiros</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={formatGuaranies(movimientosData.wepaGuaranies.retiros)}
                          onChange={(e) => handleMovimientoChange('wepaGuaranies', 'retiros', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">₲</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('wepaGuaranies', 'retiros'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '95%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('wepaGuaranies', 'retiros'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('wepaGuaranies', 'retiros'), ref)}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          {/* WEPA DÓLARES */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', pb: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', mb: 0 }}>
                  WEPA DÓLARES
                </Typography>
                <Box>
                  <IconButton 
                    size="small" 
                    component="label" 
                    color="primary"
                    title="Subir comprobante"
                  >
                    <AttachFileIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('wepaDolares', '', e)}
                    />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="info"
                    onClick={() => handleVerComprobante('wepaDolares', '')}
                    disabled={!comprobantes.wepaDolares}
                    title="Ver comprobante"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pagos</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={movimientosData.wepaDolares.pagos}
                          onChange={(e) => handleMovimientoChange('wepaDolares', 'pagos', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">$</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('wepaDolares', 'pagos'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '95%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('wepaDolares', 'pagos'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('wepaDolares', 'pagos'), ref)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Retiros</TableCell>
                      <TableCell align="right">
                        <TextField
                          variant="outlined"
                          size="small"
                          value={movimientosData.wepaDolares.retiros}
                          onChange={(e) => handleMovimientoChange('wepaDolares', 'retiros', e.target.value)}
                          autoComplete="off"
                          InputProps={{ 
                            endAdornment: <Typography variant="caption">$</Typography>,
                            inputProps: { 
                              style: { textAlign: 'right' },
                              id: getMovimientoFieldId('wepaDolares', 'retiros'),
                              onFocus: handleNumericInputFocus
                            }
                          }}
                          sx={{ width: '95%' }}
                          onKeyDown={(e) => handleKeyDown(e, getNextMovimientoFieldId('wepaDolares', 'retiros'))}
                          inputRef={(ref) => registerInputRef(getMovimientoFieldId('wepaDolares', 'retiros'), ref)}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleGuardarMovimientos}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerMovimientosDialog; 
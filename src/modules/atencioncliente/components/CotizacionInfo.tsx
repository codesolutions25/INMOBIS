"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useAlert } from '@/contexts/AlertContext';
import { getProyectosPorAtencion } from '@/services/apiAtencionProyecto';
import { getPropiedadesPorAtencion } from '@/services/apiAtencionPropiedad';
import { getProyecto } from '@/services/apiProyecto';
import { getPropiedades } from '@/services/apiPropiedades';
import { Proyecto } from '@/types/proyectos';
import { Propiedad } from '@/types/propiedades';
import { crearObtenerPropiedadesPorProyecto } from './propiedadConfig';
import { getDepartamentos } from '@/services/apiDepartamentos';
import { getProvincias } from '@/services/apiProvincias';
import { getDistritos } from '@/services/apiDistritos';
import { Departamento } from '@/types/departamentos';
import { Provincia } from '@/types/provincias';
import { Distrito } from '@/types/distritos';
import { formatDate } from '@/utils/dateUtils';
import styles from '@/modules/atencioncliente/components/styles/CotizacionInfo.module.css';
import "./styles/GaleriaModal.module.css";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import VisualizadorGenerico from './Proyect&PropiSelect';
import PlanPagoSelect from './PlanPagoSelect';
import { PlanPago, ListaPlanesConfigurados, obtenerPlanesPago, eliminarPlanPago } from './planPagoConfig';
import CronogramaModal from './CronogramaModal';
import ReservaModal from './ReservaModal';
import { verificarCotizacionPorPlan, getCotizaciones, anularCotizacion, getEstadoCotizacionesOptimizado } from '@/services/apiCotizaciones';
import { getReservasPorCotizacion, crearReservaPropiedad, getAllReservas, getReservasPorPropiedad, actualizarEstadoReserva } from '@/services/apiReservasPropiedad';
import { eliminarCuotasPorUsuarioYPropiedad } from '@/services/apiCuotas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ColumnaConfig {
  header: string;
  accessorKey: string;
  cell?: (props: { row: any }) => React.ReactNode;
}

interface FiltroConfig {
  nombre: string;
  opciones: { value: string | number; label: string }[];
  valorInicial?: string | number;
}

interface ProyectoConfig {
  columnas: ColumnaConfig[];
  filtros: FiltroConfig[];
  obtenerDatos: (filtros: Record<string, any>, busqueda: string) => Promise<any[]>;
  renderizarInformacion: (proyecto: any) => React.ReactNode;
  renderizarGaleria?: (proyecto: any) => React.ReactNode;
}

interface PropiedadConfig {
  columnas: ColumnaConfig[];
  filtros: FiltroConfig[];
  obtenerDatos: (filtros: Record<string, any>, busqueda: string) => Promise<any[]>;
  renderizarInformacion: (propiedad: any) => React.ReactNode;
  renderizarGaleria?: (propiedad: any) => React.ReactNode;
}

interface CotizacionInfoProps {
  id: number;
  realId?: number;
  observacion: string;
  fecha: string;
  estado: string;
  proyectoConfig: ProyectoConfig;
  propiedadConfig: PropiedadConfig;
  idAtencion?: number;
  clienteNombre?: string;
  clienteId?: number;
  onDelete?: (id: number) => void;
  onCancel?: (id: number) => void;
}

const CotizacionInfo: React.FC<CotizacionInfoProps> = ({
  id,
  realId,
  observacion,
  fecha,
  estado,
  proyectoConfig,
  propiedadConfig,
  idAtencion,
  clienteNombre,
  clienteId,
  onDelete,
  onCancel
}) => {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  // Usar realId como respaldo si idAtencion es nulo
  const idAtencionFinal = idAtencion ?? realId;
  
  
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<Propiedad | null>(null);
  const [showProyectoModal, setShowProyectoModal] = useState(false);
  const [showPropiedadModal, setShowPropiedadModal] = useState(false);
  const [showVisualizacionModal, setShowVisualizacionModal] = useState(false);
  const [tipoVisualizacion, setTipoVisualizacion] = useState<'proyecto' | 'propiedad' | null>(null);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  const [ubicacionCompleta, setUbicacionCompleta] = useState('');
  const [showPlanPagoModal, setShowPlanPagoModal] = useState(false);
  const [planPagoSeleccionado, setPlanPagoSeleccionado] = useState<PlanPago | null>(null);
  const [planesConfigurados, setPlanesConfigurados] = useState<PlanPago[]>([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);
  const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
  const [planAAnular, setPlanAAnular] = useState<PlanPago | null>(null);
  const [showCronogramaModal, setShowCronogramaModal] = useState(false);
  const [planCronograma, setPlanCronograma] = useState<PlanPago | null>(null);
  const [planesGenerados, setPlanesGenerados] = useState<Set<number>>(new Set());
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [planParaReserva, setPlanParaReserva] = useState<PlanPago | null>(null);
  const [planesReservados, setPlanesReservados] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`planesReservados_${id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  const [fechasReserva, setFechasReserva] = useState<Map<number, Date>>(() => {
    try {
      const saved = localStorage.getItem(`fechasReserva_${id}`);
      if (saved) {
        const entries = JSON.parse(saved);
        return new Map(entries.map(([key, value]: [number, string]) => [key, new Date(value)]));
      }
      return new Map();
    } catch {
      return new Map();
    }
  });
  
  const [reservasReales, setReservasReales] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`reservasReales_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [planesAnulados, setPlanesAnulados] = useState<Set<number>>(new Set());
  const [planesAprobados, setPlanesAprobados] = useState<Set<number>>(new Set());
  const [cotizacionCreada, setCotizacionCreada] = useState<any>(null);
  const [estadosReserva, setEstadosReserva] = useState<Map<number, string>>(new Map());
  const [nombresReservantes, setNombresReservantes] = useState<Map<number, string>>(new Map());
  const [propiedadReservada, setPropiedadReservada] = useState(false);
  useEffect(() => {
    if (realId) {
      setCotizacionCreada({ idCotizaciones: realId });
    }
  }, [realId]);

  useEffect(() => {
    const cargarProyectosAsociados = async () => {
      if (!idAtencionFinal) {
        return;
      }
      
      try {
        setCargandoProyectos(true);
        const proyectosAsociados = await getProyectosPorAtencion(idAtencionFinal);
        
        if (proyectosAsociados && proyectosAsociados.length > 0) {
          const primerProyecto = proyectosAsociados[0];
          
          let idProyectoInmobiliario;
          
          if (typeof primerProyecto.id_proyecto_inmobiliario !== 'undefined') {
            idProyectoInmobiliario = primerProyecto.id_proyecto_inmobiliario;
          } else if (typeof primerProyecto.idProyectoInmobiliario !== 'undefined') {
            idProyectoInmobiliario = primerProyecto.idProyectoInmobiliario;
          } else {
            const propiedades = Object.keys(primerProyecto);
            const propiedadProyecto = propiedades.find(prop => 
              prop.toLowerCase().includes('proyecto') && prop.toLowerCase().includes('id'));
            
            if (propiedadProyecto) {
              idProyectoInmobiliario = primerProyecto[propiedadProyecto];
            } else {
              for (const key in primerProyecto) {
                if (typeof primerProyecto[key] === 'number' && key.toLowerCase().includes('id')) {
                  idProyectoInmobiliario = primerProyecto[key];
                  break;
                }
              }
            }
          }
          
          if (!idProyectoInmobiliario) {
            return;
          }
          
          try {
            const detallesProyecto = await getProyecto(idProyectoInmobiliario);
            
            if (detallesProyecto && detallesProyecto.idDistrito) {
              const [distritosData, provinciasData, departamentosData] = await Promise.all([
                getDistritos(),
                getProvincias(),
                getDepartamentos(),
              ]);

              const distritoObj = distritosData.find((d: Distrito) => d.idDistrito === detallesProyecto.idDistrito);
              if (distritoObj) {
                const provinciaObj = provinciasData.find((p: Provincia) => p.idProvincia === distritoObj.idProvincia);
                if (provinciaObj) {
                  const departamentoObj = departamentosData.find((d: Departamento) => d.idDepartamento === provinciaObj.idDepartamento);
                  if (departamentoObj) {
                    const ubicacionStr = `${distritoObj.nombre} / ${provinciaObj.nombre} / ${departamentoObj.nombre}`;
                    setUbicacionCompleta(ubicacionStr);
                  }
                }
              }
            }
            
            setProyectoSeleccionado(detallesProyecto);
          } catch (error) {
            
            setProyectoSeleccionado(null);
          }
        } else {
        }
      } catch (error) {
      } finally {
        setCargandoProyectos(false);
      }
    };
    
    cargarProyectosAsociados();
    cargarPlanesConfigurados();
  }, [idAtencionFinal]);

  
  // Cargar propiedades asociadas a la atención al iniciar el componente
  useEffect(() => {
    const cargarPropiedadesAsociadas = async () => {
      if (!idAtencionFinal) {
        return;
      }
      
      try {
        const propiedadesAsociadas = await getPropiedadesPorAtencion(idAtencionFinal);
        
        if (propiedadesAsociadas && propiedadesAsociadas.length > 0) {
          // Tomamos la primera propiedad asociada
          const primeraPropiedad = propiedadesAsociadas[0];
          
          // Extraemos el ID de la propiedad con manejo flexible de propiedades
          let idPropiedad;
          
          if (typeof primeraPropiedad.id_propiedad !== 'undefined') {
            idPropiedad = primeraPropiedad.id_propiedad;
          } else if (typeof primeraPropiedad.idPropiedad !== 'undefined') {
            idPropiedad = primeraPropiedad.idPropiedad;
          } else {
            // Buscamos cualquier propiedad que contenga 'propiedad' e 'id' en su nombre
            const propiedades = Object.keys(primeraPropiedad);
            const propiedadId = propiedades.find(prop => 
              prop.toLowerCase().includes('propiedad') && prop.toLowerCase().includes('id'));
            
            if (propiedadId) {
              idPropiedad = primeraPropiedad[propiedadId];
            } else {
              // Último recurso: buscamos cualquier propiedad numérica que pueda ser un ID
              for (const key in primeraPropiedad) {
                if (typeof primeraPropiedad[key] === 'number' && key.toLowerCase().includes('id')) {
                  idPropiedad = primeraPropiedad[key];
                  break;
                }
              }
            }
          }
          
          if (!idPropiedad) {
            return;
          }
          
          try {
            const response = await getPropiedades(1, 1000); // Obtener propiedades con paginación
            const propiedades = response.data || [];
            const detallesPropiedad = propiedades.find((p: any) => p.idPropiedad === idPropiedad);
            if (detallesPropiedad) {
              setPropiedadSeleccionada(detallesPropiedad);
            } else {
            }
          } catch (error) {
            setPropiedadSeleccionada(null);
          }
        } else {
        }
      } catch (error) {
      }
    };
    
    cargarPropiedadesAsociadas();
  }, [idAtencionFinal]);
  
  const flujoIniciado = proyectoSeleccionado !== null;
  const flujoCompletado = proyectoSeleccionado !== null && propiedadSeleccionada !== null;
  
  const estaCancelada = estado.toLowerCase().includes('cancelad');
  
  const verificarPropiedadesReservadas = async (propiedades: any[]) => {
    try {
      const reservasResponse = await getAllReservas();
      if (!reservasResponse || reservasResponse.length === 0) {
        return propiedades.map(prop => ({ ...prop, reservadaPorOtro: false }));
      }
      
      const propiedadesReservadas = new Set<number>();
      
      reservasResponse.forEach((reserva: any) => {
        const estadoReserva = reserva.estado_reserva || reserva.estadoReserva || '';
        const clienteReserva = reserva.id_cliente_inmobiliario || reserva.idClienteInmobiliario || reserva.id_cliente || reserva.idCliente || reserva.cliente_id;        
        
        const esPendienteDeOtro = (estadoReserva === 'Pendiente' || estadoReserva === 'pendiente') && 
                                  clienteReserva && (!clienteId || clienteReserva.toString() !== clienteId?.toString());
        const estaPagada = estadoReserva === 'Pagado' || estadoReserva === 'pagado';
        
        if (esPendienteDeOtro || estaPagada) {
          const idPropiedadReservada = reserva.id_propiedad || reserva.idPropiedad || reserva.propiedad_id;
          if (idPropiedadReservada) {
            propiedadesReservadas.add(parseInt(idPropiedadReservada));
          
          }
        }
      });
      
      const propiedadesConReserva = propiedades.map(prop => ({
        ...prop,
        reservadaPorOtro: propiedadesReservadas.has(prop.idPropiedad)
      }));
      
      return propiedadesConReserva;
      
    } catch (error) {
      return propiedades.map(prop => ({ ...prop, reservadaPorOtro: false }));
    }
  };

  // Crear función para obtener propiedades filtradas por el proyecto seleccionado
  const obtenerPropiedadesFiltradas = proyectoSeleccionado?.idProyectoInmobiliario 
    ? async (filtros: Record<string, any>, busqueda: string) => {
        const propiedadesBase = await crearObtenerPropiedadesPorProyecto(proyectoSeleccionado.idProyectoInmobiliario)(filtros, busqueda);
        return await verificarPropiedadesReservadas(propiedadesBase);
      }
    : async () => {
        return [];
      };
  
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return fechaStr;
    }
  };
  
  const handleSeleccionarProyecto = () => {
    if (flujoCompletado || estaCancelada) return;
    setShowProyectoModal(true);
  };
  
  const handleSeleccionarPropiedad = () => {
    if (!proyectoSeleccionado || flujoCompletado || estaCancelada) return;
    setShowPropiedadModal(true);
  };
  
  const handleConfirmarProyecto = (proyecto: Proyecto, observaciones?: string) => {
    setProyectoSeleccionado(proyecto);
    setShowProyectoModal(false);
    
    // Mostrar una única alerta que incluya las observaciones si existen
    const mensajeObservaciones = observaciones ? `\n\nObservaciones: ${observaciones}` : '';
    showAlert('success', 'Proyecto asociado correctamente', `El proyecto ${proyecto.nombre} fue seleccionado correctamente.`);
  };
  
  const handleConfirmarPropiedad = (propiedad: Propiedad, observaciones?: string) => {
    setPropiedadSeleccionada(propiedad);
    setShowPropiedadModal(false);
    showAlert('success', 'Propiedad seleccionada', `La propiedad ${propiedad.nombre} fue seleccionada correctamente.`);
  };
  
  const handleRegistrarPlanPagos = () => {
    if (!proyectoSeleccionado || !propiedadSeleccionada || estaCancelada) {
      showAlert('warning', 'Selección Incompleta', 'Debe seleccionar un proyecto y una propiedad antes de configurar planes de pago');
      return;
    }
    setShowPlanPagoModal(true);
  };

  const handlePlanPagoSeleccionado = (plan: PlanPago) => {
    setPlanPagoSeleccionado(plan);
    setShowPlanPagoModal(false);
    showAlert('success', 'Plan Seleccionado', `Plan "${plan.planPago}" seleccionado correctamente`);
  };

  // Función para cargar reservas existentes desde la API
  const cargarReservasExistentes = useCallback(async () => {
    if (!cotizacionCreada?.idCotizaciones) {
      return;
    }
    
    try {
      const reservasResponse = await getReservasPorCotizacion(cotizacionCreada.idCotizaciones);
      
      if (reservasResponse && Array.isArray(reservasResponse)) {
        console.log('Reservas obtenidas:', reservasResponse.length);
        setReservasReales(reservasResponse);
        
        // Procesar reservas para actualizar estados locales
        const nuevosReservados = new Set<number>();
        const nuevasFechas = new Map<number, Date>();
        let hayReservaPagada = false;
        
        reservasResponse.forEach((reserva: any) => {
          // Buscar el plan correspondiente a esta reserva
          const planCorrespondiente = planesConfigurados.find(plan => {
            // Comparar por precio total ya que no tenemos relación directa
            const montoReserva = reserva.monto_reserva || reserva.montoReserva || 0;
            return Math.abs((plan.nuevoCosto || 0) - montoReserva) < 0.01;
          });
          
          if (planCorrespondiente?.idPlanPagoPropiedad) {
            const estadoReserva = reserva.estado_reserva || reserva.estadoReserva || '';
            const nombreReservante = reserva.nombre_cliente || reserva.nombreCliente || clienteNombre || 'Cliente no especificado';
            
            // Guardar estado y nombre del reservante
            setEstadosReserva(prev => new Map(prev).set(planCorrespondiente.idPlanPagoPropiedad!, estadoReserva));
            setNombresReservantes(prev => new Map(prev).set(planCorrespondiente.idPlanPagoPropiedad!, nombreReservante));
            
            // Si hay una reserva pagada, marcar toda la propiedad como reservada
            if (estadoReserva === 'Pagado') {
              hayReservaPagada = true;
            }
            
            if (estadoReserva === 'Pendiente') {
              nuevosReservados.add(planCorrespondiente.idPlanPagoPropiedad);
              
              // Calcular fecha de expiración (30 días desde fecha de reserva)
              const fechaReserva = new Date(reserva.fecha_reserva || reserva.fechaReserva);
              const fechaExpiracion = new Date(fechaReserva);
              fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);
              
              nuevasFechas.set(planCorrespondiente.idPlanPagoPropiedad, fechaExpiracion);
            }
          } else {
          }
        });
        
        // Actualizar el estado de propiedad reservada basado en los datos de la API
        setPropiedadReservada(hayReservaPagada);
        
        // Solo actualizar si encontramos reservas, o si no hay reservas locales
        // Esto evita sobrescribir reservas recién creadas que aún no están en la BD
        setPlanesReservados(prev => {
          // Si tenemos reservas locales pero no encontramos ninguna en BD, mantener las locales
          if (prev.size > 0 && nuevosReservados.size === 0) {
            return prev;
          }
          
          // Si encontramos reservas en BD, usar esas
          if (nuevosReservados.size > 0) {
            return nuevosReservados;
          }
          
          // Si no hay reservas locales ni en BD, limpiar
          return nuevosReservados;
        });
        
        setFechasReserva(prev => {
          // Aplicar la misma lógica para las fechas
          if (planesReservados.size > 0 && nuevasFechas.size === 0) {
            return prev;
          }
          return nuevasFechas;
        });
        
        
      }
    } catch (error) {
    }
  }, [cotizacionCreada?.idCotizaciones]);

  // Función para cargar los planes configurados
  const cargarPlanesConfigurados = async () => {
    if (!propiedadSeleccionada?.idPropiedad) {
      setPlanesConfigurados([]);
      return;
    }

    try {
      
      const planes = await obtenerPlanesPago(
        {}, // filtros vacíos
        "", // búsqueda vacía
        realId || id, // idCotizacion
        propiedadSeleccionada.idPropiedad, // idPropiedad específica
        propiedadSeleccionada.precio // precio de la propiedad
      );
      
      setPlanesConfigurados(planes);
      
      // Cargar estados de cotizaciones inmediatamente después de cargar planes
      await cargarCotizacionesExistentes(planes);
      
      // Cargar reservas después de obtener los planes
      if (planes.length > 0) {
        cargarReservasExistentes();
      }
    } catch (error) {
      setPlanesConfigurados([]);
    }
  };

  // Cargar reservas cuando cambie cotizacionCreada - OPTIMIZADO
  useEffect(() => {
    if (cotizacionCreada?.idCotizaciones && planesConfigurados.length > 0) {
      cargarReservasExistentes();
    }
  }, [cotizacionCreada?.idCotizaciones, planesConfigurados.length]);

  // Persistir cambios en localStorage
  useEffect(() => {
    localStorage.setItem(`planesReservados_${id}`, JSON.stringify(Array.from(planesReservados)));
  }, [planesReservados, id]);

  useEffect(() => {
    const entries = Array.from(fechasReserva.entries()).map(([key, value]) => [key, value.toISOString()]);
    localStorage.setItem(`fechasReserva_${id}`, JSON.stringify(entries));
  }, [fechasReserva, id]);

  useEffect(() => {
    localStorage.setItem(`reservasReales_${id}`, JSON.stringify(reservasReales));
  }, [reservasReales, id]);

  // Debug: Monitorear cambios en el estado de reservas
  useEffect(() => {
  }, [planesReservados, fechasReserva, planesConfigurados]);

  // Cargar cotizaciones existentes y su estado (activas/anuladas) de forma optimizada
  const cargarCotizacionesExistentes = useCallback(async (planesParaComparar?: any[]) => {
    if (!propiedadSeleccionada?.idPropiedad) {
      setPlanesGenerados(new Set());
      setPlanesAnulados(new Set());
      setPlanesAprobados(new Set());
      return;
    }

    try {      
      // Usar los planes pasados como parámetro o los del estado
      const planesAUsar = planesParaComparar || planesConfigurados;
      
      if (planesAUsar.length === 0) {
        return;
      }
      
      // Obtener el estado de todas las cotizaciones en una sola consulta optimizada
      const { cotizacionesAnuladas, cotizacionesAprobadas, cotizacionesActivas } = await getEstadoCotizacionesOptimizado();
      
      // Obtener todas las cotizaciones y filtrar por propiedad
      const todasLasCotizaciones = await getCotizaciones(1, 100);
      
      if (todasLasCotizaciones.data && Array.isArray(todasLasCotizaciones.data)) {
        // Procesar cada cotización de la propiedad
        const cotizacionesDePropiedad = todasLasCotizaciones.data.filter((cotizacion: any) => {
          const propiedadId = cotizacion.idPropiedad || cotizacion.id_propiedad;
          return propiedadId === propiedadSeleccionada.idPropiedad;
        });
        
        const nuevosGenerados = new Set<number>();
        const nuevosAnulados = new Set<number>();
        const nuevosAprobados = new Set<number>();
        
        cotizacionesDePropiedad.forEach((cotizacion: any) => {
          const idCotizacion = cotizacion.idCotizaciones;
          const precioFinal = cotizacion.precioFinal || cotizacion.precio_final || 0;
          // Verificar si la cotización está anulada o aprobada
          if (cotizacionesAnuladas.has(idCotizacion)) {

            // Buscar el plan correspondiente por precio
            const planCorrespondiente = planesAUsar.find(plan => {
              const precioCoincide = Math.abs((plan.nuevoCosto || 0) - precioFinal) < 0.01;
              return precioCoincide;
            });
            
            if (planCorrespondiente?.idPlanPagoPropiedad) {
              nuevosAnulados.add(planCorrespondiente.idPlanPagoPropiedad);
            }
          } else if (cotizacionesAprobadas.has(idCotizacion)) {
            
            // Buscar el plan correspondiente por precio
            const planCorrespondiente = planesAUsar.find(plan => {
              const precioCoincide = Math.abs((plan.nuevoCosto || 0) - precioFinal) < 0.01;
              return precioCoincide;
            });
            
            if (planCorrespondiente?.idPlanPagoPropiedad) {
              nuevosAprobados.add(planCorrespondiente.idPlanPagoPropiedad);
            }
          } else {
            // Si no está anulada ni aprobada, marcar como generada
            const planCorrespondiente = planesAUsar.find(plan => {
              const precioCoincide = Math.abs((plan.nuevoCosto || 0) - precioFinal) < 0.01;
              return precioCoincide;
            });
            
            if (planCorrespondiente?.idPlanPagoPropiedad) {
              nuevosGenerados.add(planCorrespondiente.idPlanPagoPropiedad);
            }
          }
        });
        
        setPlanesGenerados(nuevosGenerados);
        setPlanesAnulados(nuevosAnulados);
        setPlanesAprobados(nuevosAprobados);
        
      } else {
        setPlanesGenerados(new Set());
        setPlanesAnulados(new Set());
        setPlanesAprobados(new Set());
      }
    } catch (error) {
      setPlanesGenerados(new Set());
      setPlanesAnulados(new Set());
      setPlanesAprobados(new Set());
    }
  }, [propiedadSeleccionada]);

  // Cargar planes cuando se selecciona una propiedad
  useEffect(() => {
    if (propiedadSeleccionada) {
      cargarPlanesConfigurados();
    }
  }, [propiedadSeleccionada]);

  // Funciones para manejar las acciones de los planes
  const handleGestionarPlanes = () => {
    setShowPlanPagoModal(true);
  };

  const handleGenerarCronograma = async (plan: PlanPago) => {
    if (!plan.idPlanPagoPropiedad) {
      showAlert('error', 'Error', 'ID del plan no válido');
      return;
    }

    // Verificar si ya existe una cotización para este plan
    const yaExisteCotizacion = planesGenerados.has(plan.idPlanPagoPropiedad);
    
    if (yaExisteCotizacion) {
      // Si ya existe cotización, solo mostrar el cronograma (modo "Ver")
      setPlanCronograma(plan);
      setShowCronogramaModal(true);
    } else {
      // Verificar nuevamente con la API para asegurar que no existe
      try {
        const existeCotizacion = await verificarCotizacionPorPlan(plan.idPlanPagoPropiedad);
        
        if (existeCotizacion) {
          showAlert('warning', 'Cotización Existente', 'Ya existe una cotización para este plan de pago');
          // Actualizar el estado local
          setPlanesGenerados(prev => new Set(prev).add(plan.idPlanPagoPropiedad!));
          return;
        }
        
        // Si no existe, proceder a generar nueva cotización
        setPlanCronograma(plan);
        setShowCronogramaModal(true);
      } catch (error) {
        showAlert('error', 'Error', 'Error al verificar cotización existente');
      }
    }
  };

  const handleReservar = (plan: PlanPago) => {
    setPlanParaReserva(plan);
    setShowReservaModal(true);
  };

  const handleAnular = (plan: PlanPago) => {
    if (!plan.idPlanPagoPropiedad) {
      showAlert('error', 'Error', 'No se puede anular: ID del plan no válido');
      return;
    }
    
    // Abrir modal de confirmación
    setPlanAAnular(plan);
    setIsAnularDialogOpen(true);
  };

  const handleConfirmAnularPlan = async () => {
    if (!planAAnular?.idPlanPagoPropiedad) return;

    try {
      // Buscar la cotización asociada al plan
      const cotizacionesResponse = await getCotizaciones(1, 100);
      
      const cotizacionAsociada = cotizacionesResponse.data.find(cotizacion => {
        const precioCoincide = Math.abs((cotizacion.precioFinal || 0) - (planAAnular.nuevoCosto || 0)) < 0.01;
        return precioCoincide;
      });

      if (cotizacionAsociada?.idCotizaciones) {
        // Anular la cotización asociada
        await anularCotizacion(cotizacionAsociada.idCotizaciones);
        
        // Marcar el plan como anulado localmente
        setPlanesAnulados(prev => new Set(prev).add(planAAnular.idPlanPagoPropiedad!));
        
        showAlert('success', 'Plan Anulado', 'El plan de pago y su cotización han sido anulados exitosamente');
      } else {
        // Si no hay cotización asociada, eliminar el plan directamente
        await eliminarPlanPago(planAAnular.idPlanPagoPropiedad);
        showAlert('success', 'Plan Eliminado', 'El plan de pago ha sido eliminado exitosamente');
      }

      // Recargar los planes para reflejar los cambios
      await cargarPlanesConfigurados();
      
    } catch (error) {
      showAlert('error', 'Error', 'No se pudo anular el plan de pago');
    } finally {
      setIsAnularDialogOpen(false);
      setPlanAAnular(null);
    }
  };

  // Handler para mantener una reserva (marcarla como pagada)
  const handleMantenerReserva = async (plan: PlanPago) => {
    if (!plan.idPlanPagoPropiedad || !propiedadSeleccionada?.idPropiedad) return;

    // Verificar si la reserva está vencida
    const fechaLimite = fechasReserva.get(plan.idPlanPagoPropiedad);
    const estaVencida = fechaLimite && new Date() > fechaLimite;

    if (estaVencida) {
      const confirmar = window.confirm(
        `⚠️ RESERVA VENCIDA\n\nEsta reserva venció el ${fechaLimite.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.\n\n¿Está seguro de que desea confirmar el pago de esta reserva vencida?`
      );
      
      if (!confirmar) return;
    }

    try {      
      
      // Buscar la reserva asociada a este plan
      const reservas = await getReservasPorPropiedad(propiedadSeleccionada.idPropiedad);
      const reservaActiva = reservas.find((reserva: any) => 
        reserva.estado_reserva === 'pendiente' || reserva.estado_reserva === 'Pendiente'
      );

      if (reservaActiva?.id_reservas_propiedad) {
        // Actualizar el estado de la reserva a "Pagado"
        await actualizarEstadoReserva(reservaActiva.id_reservas_propiedad, 'Pagado');
        
        // Actualizar estados locales
        setEstadosReserva(prev => new Map(prev).set(plan.idPlanPagoPropiedad!, 'Pagado'));
        setPropiedadReservada(true); // Marcar toda la propiedad como reservada
        setPlanesReservados(prev => {
          const newSet = new Set(prev);
          newSet.delete(plan.idPlanPagoPropiedad!);
          return newSet;
        });

        // Actualizar cotización a estado "Aprobada"
        try {          
          // Buscar la cotización asociada al plan (igual que en anulación)
          const cotizacionesResponse = await getCotizaciones(1, 100);
          const cotizacionAsociada = cotizacionesResponse.data.find(cotizacion => {
            const precioCoincide = Math.abs((cotizacion.precioFinal || 0) - (plan.nuevoCosto || 0)) < 0.01;
            return precioCoincide && cotizacion.idPropiedad === propiedadSeleccionada.idPropiedad;
          });

          if (cotizacionAsociada?.idCotizaciones) {
            // Obtener el ID del estado "Aprobada" y actualizar la cotización
            const { getEstadoCotizacionAprobadaId, updateCotizacion } = await import('@/services/apiCotizaciones');
            const idEstadoAprobada = await getEstadoCotizacionAprobadaId();
            
            await updateCotizacion(cotizacionAsociada.idCotizaciones, {
              idEstadoCotizacion: idEstadoAprobada
            });
            
          } 
        } catch (error) {
          showAlert('error', 'Error', 'No se pudo confirmar el pago de la reserva');
          // No mostrar error al usuario, la reserva ya se confirmó exitosamente
        }

        showAlert('success', 'Reserva Confirmada', 'La reserva ha sido marcada como pagada exitosamente');
        
        // Recargar reservas
        await cargarReservasExistentes();
      } else {
        showAlert('error', 'Error', 'No se encontró la reserva asociada a este plan');
      }
    } catch (error) {      
      showAlert('error', 'Error', 'No se pudo confirmar el pago de la reserva');
    }
  };

  // Handler para anular una reserva
  const handleAnularReserva = async (plan: PlanPago) => {
    if (!plan.idPlanPagoPropiedad || !propiedadSeleccionada?.idPropiedad) return;

    // Verificar si la reserva está vencida
    const fechaLimite = fechasReserva.get(plan.idPlanPagoPropiedad);
    const estaVencida = fechaLimite && new Date() > fechaLimite;

    if (estaVencida) {
      const confirmar = window.confirm(
        `⚠️ RESERVA VENCIDA\n\nEsta reserva venció el ${fechaLimite.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric', 
          hour: '2-digit',
          minute: '2-digit'
        })}.\n\n¿Está seguro de que desea cancelar esta reserva vencida?`
      );
      
      if (!confirmar) return;
    }

    try {
      
      // Buscar la reserva asociada a este plan
      const reservas = await getReservasPorPropiedad(propiedadSeleccionada.idPropiedad);
      
      // Buscar reserva activa con diferentes variaciones de estado
      const reservaActiva = reservas.find((reserva: any) => {
        const estado = reserva.estado_reserva?.toLowerCase();
        return estado === 'pendiente' || estado === 'activa' || estado === 'en proceso' || estado === 'reservada';
      });


      if (reservaActiva?.id_reservas_propiedad) {
        // Actualizar el estado de la reserva a "Cancelada"
        await actualizarEstadoReserva(reservaActiva.id_reservas_propiedad, 'Cancelada');
        
        // Actualizar estados locales
        setEstadosReserva(prev => new Map(prev).set(plan.idPlanPagoPropiedad!, 'Cancelada'));
        
        // Eliminar todas las cuotas asociadas a esta reserva
        if (clienteId && propiedadSeleccionada?.idPropiedad) {
          try {
            const cuotasEliminadas = await eliminarCuotasPorUsuarioYPropiedad(clienteId, propiedadSeleccionada.idPropiedad);
          } catch (errorCuotas) {            
            showAlert('error', 'Error', 'No se pudo eliminar las cuotas');
          }
        }
        
        // Buscar y anular la cotización asociada
        const cotizacionesResponse = await getCotizaciones(1, 100);
        const cotizacionAsociada = cotizacionesResponse.data.find(cotizacion => {
          const precioCoincide = Math.abs((cotizacion.precioFinal || 0) - (plan.nuevoCosto || 0)) < 0.01;
          return precioCoincide && cotizacion.idPropiedad === propiedadSeleccionada.idPropiedad;
        });

        if (cotizacionAsociada?.idCotizaciones) {
          await anularCotizacion(cotizacionAsociada.idCotizaciones);
        }

        // Actualizar estados locales
        setPlanesReservados(prev => {
          const newSet = new Set(prev);
          newSet.delete(plan.idPlanPagoPropiedad!);
          return newSet;
        });

        setPlanesAnulados(prev => new Set(prev).add(plan.idPlanPagoPropiedad!));

        showAlert('success', 'Reserva Cancelada', 'La reserva ha sido cancelada y la propiedad está disponible nuevamente');
        
        // Recargar reservas y planes
        await cargarReservasExistentes();
        await cargarPlanesConfigurados();
      } else {
        showAlert('error', 'Error', `No se encontró una reserva activa para esta propiedad. Estados encontrados: ${reservas.map(r => r.estado_reserva).join(', ')}`);
      }
    } catch (error) {
      showAlert('error', 'Error', 'No se pudo cancelar la reserva');
    }
  };
  
  const handleEliminar = () => {
    if (onDelete) {
      onDelete(realId || id);
    }
  };
  
  const handleCancelar = () => {
    if (onCancel) {
      onCancel(realId || id);
    }
  };
  
  // Función para abrir el modal de visualización del proyecto
  const handleVerProyecto = () => {
    setTipoVisualizacion('proyecto');
    setShowVisualizacionModal(true);
  };
  
  // Función para abrir el modal de visualización de la propiedad
  const handleVerPropiedad = () => {
    setTipoVisualizacion('propiedad');
    setShowVisualizacionModal(true);
  };
  
  const getEstadoClass = () => {
    switch (estado.toLowerCase()) {
      case 'en curso':
        return styles.estadoEnCurso;
      case 'cancelado':
        return styles.estadoCancelado;
      case 'vendido':
        return styles.estadoVendido;
      default:
        return '';
    }
  };

  return (
    <div className={styles.cotizacionContainer}>
      <div className={styles.cotizacionHeader}>
        <span className={styles.cotizacionId}>#{id}</span>
        <span className={styles.cotizacionObservacion}>{observacion}</span>
        <span className={styles.cotizacionFecha}>{formatearFecha(fecha)}</span>
        <span className={`${styles.cotizacionEstado} ${estado === 'En curso' ? styles.estadoEnCurso : estado === 'Cancelado' ? styles.estadoCancelado : styles.estadoVendido}`}>{estado}</span>
      </div>
      
      <div className={styles.cotizacionContent}>
        {cargandoProyectos ? (
          <div className={styles.cargandoContainer}>
            <p>Cargando proyectos asociados...</p>
          </div>
        ) : !flujoIniciado ? (
          <div className={styles.cotizacionPlaceholder}>
            <p>Para generar la cotización seleccione un proyecto</p>
            <Button 
              className={styles.seleccionarButton} 
              onClick={handleSeleccionarProyecto}
            >
              Seleccionar Proyecto
            </Button>
          </div>
        ) : !propiedadSeleccionada ? (
          <>
            <div className={styles.proyectoSeleccionado}>
              <span>Proyecto de Interés: {proyectoSeleccionado.nombre}</span>
              <Button 
                variant="outline" 
                className={styles.verButton}
                onClick={handleVerProyecto}
                disabled={estaCancelada}
              >
                Ver
              </Button>
            </div>
            <div className={styles.cotizacionPlaceholder}>
              {estaCancelada ? (
                <p className="text-gray-500 text-center">Cotización cancelada - No se pueden realizar más acciones</p>
              ) : (
                <Button 
                  className={styles.seleccionarButton} 
                  onClick={handleSeleccionarPropiedad}
                >
                  Seleccionar Propiedad
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.proyectoSeleccionado}>
              <span>Proyecto de Interés: {proyectoSeleccionado.nombre}</span>
              <Button 
                variant="outline" 
                className={styles.verButton}
                onClick={handleVerProyecto}
                disabled={estaCancelada}
              >
                Ver
              </Button>
            </div>
            <div className={styles.propiedadSeleccionada}>
              <span>Propiedad de Interés: {propiedadSeleccionada.nombre}</span>
              <Button 
                variant="outline" 
                className={styles.verButton}
                onClick={handleVerPropiedad}
                disabled={estaCancelada}
              >
                Ver
              </Button>
            </div>
            <div className={styles.cotizacionPlaceholder}>
              {estaCancelada ? (
                <p className="text-gray-500 text-center">Cotización cancelada - No se pueden realizar más acciones</p>
              ) : planPagoSeleccionado ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800 flex items-center">
                      💰 Plan de Pago Seleccionado
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRegistrarPlanPagos}
                      className="text-xs"
                    >
                      Cambiar Plan
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-700">Tipo:</span>
                      <p className="text-green-900">{planPagoSeleccionado.planPago}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Cuotas:</span>
                      <p className="text-green-900">{planPagoSeleccionado.numeroCuota}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Costo por Cuota:</span>
                      <p className="text-green-900 font-semibold">
                        S/ {planPagoSeleccionado.nuevoCosto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Frecuencia:</span>
                      <p className="text-green-900">{planPagoSeleccionado.frecuencia}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-700">Total a Pagar:</span>
                      <span className="font-bold text-green-800 text-lg">
                        S/ {((planPagoSeleccionado.nuevoCosto || 0) * (planPagoSeleccionado.numeroCuota || 1)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : propiedadReservada ? (
                // Mostrar mensaje cuando la propiedad está reservada
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl">🏠</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        Reserva Realizada
                      </h3>
                      <p className="text-green-700">
                        Esta propiedad ya ha sido reservada y confirmada.
                      </p>
                      <p className="text-green-600 text-sm mt-2">
                        No se pueden realizar más acciones en los planes de pago.
                      </p>
                    </div>
                  </div>
                </div>
              ) : planesConfigurados.length > 0 ? (
                <ListaPlanesConfigurados
                  planes={planesConfigurados}
                  precioBase={propiedadSeleccionada?.precio || 0}
                  onGestionar={handleGestionarPlanes}
                  onGenerarCronograma={handleGenerarCronograma}
                  onReservar={handleReservar}
                  onAnular={handleAnular}
                  onMantenerReserva={handleMantenerReserva}
                  onAnularReserva={handleAnularReserva}
                  planesReservados={planesReservados}
                  planesAnulados={planesAnulados}
                  planesAprobados={planesAprobados}
                  planesGenerados={planesGenerados}
                />
              ) : (
                <Button 
                  className={styles.registrarButton} 
                  onClick={handleRegistrarPlanPagos}
                >
                  Registrar Plan de pagos
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Botones de acción */}
      <div className={styles.cotizacionActions}>
        {estaCancelada ? (
          <div className="text-center text-gray-500">
            <p>Esta cotización ha sido cancelada</p>
          </div>
        ) : !flujoIniciado ? (
          <Button 
            variant="destructive" 
            className={styles.eliminarButton} 
            onClick={handleEliminar}
          >
            Eliminar
          </Button>
        ) : (
          <Button 
            variant="destructive" 
            className={styles.cancelarButton} 
            onClick={handleCancelar}
          >
            Cancelar
          </Button>
        )}
      </div>
      
      {/* Modal para seleccionar proyecto */}
      <Dialog open={showProyectoModal} onOpenChange={setShowProyectoModal}>
        <DialogContent className="max-w-none sm:max-w-none md:max-w-none lg:max-w-none w-[100vw] h-[100vh] max-h-[100vh] p-0 m-0 gap-0 overflow-y-auto rounded-none">
          <VisualizadorGenerico
            titulo="Seleccionar Proyecto"
            columnas={proyectoConfig.columnas}
            filtros={proyectoConfig.filtros}
            obtenerDatos={proyectoConfig.obtenerDatos}
            renderizarInformacion={proyectoConfig.renderizarInformacion}
            renderizarGaleria={proyectoConfig.renderizarGaleria || (() => <div>Sin galería</div>)}
            onConfirmar={handleConfirmarProyecto}
            idAtencion={idAtencionFinal}
            className="w-full h-full"
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal para seleccionar propiedad */}
      <Dialog open={showPropiedadModal} onOpenChange={setShowPropiedadModal}>
        <DialogContent className="max-w-none sm:max-w-none md:max-w-none lg:max-w-none w-[100vw] h-[100vh] max-h-[100vh] p-0 m-0 gap-0 overflow-hidden rounded-none">
          <VisualizadorGenerico
            titulo="Seleccionar Propiedad"
            columnas={propiedadConfig.columnas}
            filtros={propiedadConfig.filtros}
            obtenerDatos={obtenerPropiedadesFiltradas}
            renderizarInformacion={propiedadConfig.renderizarInformacion}
            renderizarGaleria={propiedadConfig.renderizarGaleria || (() => <div>Sin galería</div>)}
            onConfirmar={handleConfirmarPropiedad}
            idAtencion={idAtencionFinal} // Usar realId si está disponible, de lo contrario usar idAtencion
            className="w-full h-full"
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal para visualizar proyecto o propiedad con detalles completos y galería */}
      <Dialog open={showVisualizacionModal} onOpenChange={setShowVisualizacionModal}>
        <DialogContent className="max-w-none sm:max-w-none md:max-w-none lg:max-w-none w-[100vw] md:h-[100vh] sm:h-auto p-0 m-0 gap-0 md:overflow-hidden sm:overflow-y-auto rounded-none">
          <div className="flex flex-col h-full">
            {/* Encabezado */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-400 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {tipoVisualizacion === 'propiedad' && propiedadSeleccionada ? 
                  `Propiedad: ${propiedadSeleccionada.nombre}` : 
                  tipoVisualizacion === 'proyecto' && proyectoSeleccionado ?
                  `Proyecto: ${proyectoSeleccionado.nombre}` :
                  'Detalles'
                }
              </h2>
            </div>
            
            {/* Contenido principal - Diseño de dos columnas */}
            <div className="md:flex md:flex-grow md:overflow-hidden sm:overflow-auto">
              {/* Columna izquierda - Detalles */}
              <div className="md:w-2/5 sm:w-full overflow-y-auto border-r p-6">
                {tipoVisualizacion === 'propiedad' && propiedadSeleccionada ? (
                  /* Detalles de la propiedad */
                  <div className="space-y-6">
                    {propiedadConfig.renderizarInformacion(propiedadSeleccionada)}
                  </div>
                ) : tipoVisualizacion === 'proyecto' && proyectoSeleccionado ? (
                  /* Detalles del proyecto */
                  <div className="space-y-8">
                    {/* Ubicación */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">Ubicación</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Dirección</span>
                            <p className="text-base font-medium">{proyectoSeleccionado.ubicacion || 'No especificado'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Distrito / Provincia / Departamento</span>
                            <p className="text-base font-medium">
                              {ubicacionCompleta || 'Cargando ubicación...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cronograma */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">Cronograma</h3>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Fecha Inicio</span>
                            <p className="text-base font-medium">{formatDate(proyectoSeleccionado.fechaInicio)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Fecha Fin</span>
                            <p className="text-base font-medium">{formatDate(proyectoSeleccionado.fechaFin)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información de contacto */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">Información de Contacto</h3>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Teléfono</span>
                            <p className="text-base font-medium">{proyectoSeleccionado.telefonoContacto || 'No especificado'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Email</span>
                            <p className="text-base font-medium">{proyectoSeleccionado.emailContacto || 'No especificado'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Descripción */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">Descripción</h3>
                      <p className="text-base text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-md">
                        {proyectoSeleccionado?.descripcion || 'No hay descripción disponible para este proyecto.'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              
              {/* Columna derecha - Galería */}
              <div className="md:w-3/5 sm:w-full h-full bg-gray-50 flex flex-col">
                {/* Encabezado de la galería */}
                <div className="p-4 border-b bg-gray-100">
                  <h3 className="text-lg font-semibold text-blue-800">Galería de Imágenes</h3>
                </div>
                
                {/* Área principal de la galería */}
                <div className="flex-grow overflow-hidden flex items-center justify-center">
                  {tipoVisualizacion === 'propiedad' && propiedadSeleccionada ? (
                    /* Galería de la propiedad */
                    <div className="w-full h-full flex items-center justify-center">
                      {propiedadConfig.renderizarGaleria ? (
                        <div className="w-full max-w-2xl mx-auto">
                          {propiedadConfig.renderizarGaleria(propiedadSeleccionada)}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center p-4">
                            <div className="text-gray-400 mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-lg text-gray-600">No hay imágenes disponibles para esta propiedad</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : tipoVisualizacion === 'proyecto' && proyectoSeleccionado ? (
                    /* Galería del proyecto */
                    <div className="w-full h-full flex items-center justify-center">
                      {proyectoConfig.renderizarGaleria ? (
                        <div className="w-full max-w-2xl mx-auto">
                          {proyectoConfig.renderizarGaleria(proyectoSeleccionado)}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center p-4">
                            <div className="text-gray-400 mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-lg text-gray-600">No hay imágenes disponibles para este proyecto</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Planes de Pago */}
      <Dialog open={showPlanPagoModal} onOpenChange={setShowPlanPagoModal}>
        <DialogContent className="max-w-none sm:max-w-none md:max-w-none lg:max-w-none w-[100vw] h-[100vh] max-h-[100vh] p-0 m-0 gap-0 overflow-y-auto rounded-none">
          <PlanPagoSelect
            proyecto={proyectoSeleccionado}
            propiedad={propiedadSeleccionada}
            idCotizacion={id}
            idEmpresa={24}
            idUsuario={1}
            onPlanSeleccionado={handlePlanPagoSeleccionado}
            onClose={() => setShowPlanPagoModal(false)}
            onPlanCreated={cargarPlanesConfigurados}
            planesAnulados={planesAnulados}
            planesAprobados={planesAprobados}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para anular plan de pago */}
      <AlertDialog open={isAnularDialogOpen} onOpenChange={setIsAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de anular este plan de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El plan "{planAAnular?.planPago}" será anulado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAnularPlan}>Anular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Cronograma */}
      {showCronogramaModal && planCronograma && (
        <CronogramaModal
          isOpen={showCronogramaModal}
          onClose={() => {
            setShowCronogramaModal(false);
            setPlanCronograma(null);
          }}
          planPago={planCronograma}
          clienteNombre={clienteNombre || 'Cliente no especificado'}
          clienteId={clienteId}
          proyecto={proyectoSeleccionado}
          propiedad={propiedadSeleccionada}
          precioBase={propiedadSeleccionada?.precio || 0}
          observacion={observacion}
          soloVer={planesGenerados.has(planCronograma.idPlanPagoPropiedad!)}
          onCotizacionCreada={(planId) => {
            setPlanesGenerados(prev => new Set(prev).add(planId));
          }}
        />
      )}

      {/* Modal de Reserva */}
      {showReservaModal && planParaReserva && (
        <ReservaModal
          isOpen={showReservaModal}
          onClose={() => {
            setShowReservaModal(false);
            setPlanParaReserva(null);
          }}
          planPago={planParaReserva}
          clienteNombre={clienteNombre || 'Cliente no especificado'}
          clienteId={clienteId}
          proyecto={proyectoSeleccionado}
          propiedad={propiedadSeleccionada}
          idCotizacion={realId || id}
          onReservaCreada={(reservaCreada: any) => {
            
            setShowReservaModal(false);
            setPlanParaReserva(null);
            
            // Marcar el plan como reservado y guardar fecha
            if (planParaReserva?.idPlanPagoPropiedad) {
              setPlanesReservados(prev => {
                const newSet = new Set(prev).add(planParaReserva.idPlanPagoPropiedad!);
                return newSet;
              });
              
              // Calcular fecha límite (720 horas = 30 días desde hoy)
              const fechaLimite = new Date();
              fechaLimite.setHours(fechaLimite.getHours() + 720);
              
              setFechasReserva(prev => {
                const newMap = new Map(prev).set(planParaReserva.idPlanPagoPropiedad!, fechaLimite);
                return newMap;
              });
              
              // Actualizar las reservas reales con la nueva reserva
              if (reservaCreada) {
                setReservasReales(prev => [...prev, reservaCreada]);
              }
            }
           
            setTimeout(() => {
              cargarReservasExistentes();
            }, 500);
          }}
        />
      )}
    </div>
  );
};

export default CotizacionInfo;

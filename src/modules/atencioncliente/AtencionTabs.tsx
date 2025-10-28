"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './styles/AtencionTabs.module.css';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash } from 'lucide-react';
import AtencionForm from './AtencionForm';
import { getAtencionesByPersona, deleteAtencion, updateAtencion } from '@/services/apiAtencion';
import { useAlert } from '@/contexts/AlertContext';
import { useCompany } from '@/contexts/CompanyContext';
import { formatDate } from '@/utils/dateUtils';
import CotizacionInfo from './components/CotizacionInfo';
import {
  proyectoColumnas,
  proyectoFiltros,
  getProyectoFiltros,
  obtenerProyectos,
  renderizarInformacionProyecto,
  renderizarGaleriaProyecto
} from './components/proyectoConfig';
import {
  propiedadColumnas,
  propiedadFiltros,
  getPropiedadFiltros,
  obtenerPropiedades,
  renderizarInformacionPropiedad,
  renderizarGaleriaPropiedad
} from './components/propiedadConfig';
import {
  Dialog,
  DialogContent,
  DialogOverlay
} from '@/components/ui/dialog';
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

interface AtencionTabsProps {
  idPersona?: number;
  idEmpresa?: number;
  clienteNombre?: string;
}

interface Atencion {
  id_atencion?: number;
  idAtencion?: number;
  fechaAtencion?: string;
  fecha_atencion?: string;
  idCanal?: number;
  id_canal?: number;
  idEstadoAtencion?: number;
  id_estado_atencion?: number;
  observaciones?: string;
  [key: string]: any;
}

const AtencionTabs = ({ idPersona, idEmpresa, clienteNombre }: AtencionTabsProps) => {
  const { showAlert } = useAlert();
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState('cotizacion');
  const [showModal, setShowModal] = useState(false);
  const [tipoAtencion, setTipoAtencion] = useState<'cotizacion' | 'consulta' | 'reclamo'>('consulta');
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tiposAtencionIds, setTiposAtencionIds] = useState({
    cotizacion: 1,
    consulta: 2,
    reclamo: 3
  });
  const [estadosAtencion, setEstadosAtencion] = useState<Record<number, string>>({});
  const [canales, setCanales] = useState<Record<number, string>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [atencionAEliminarId, setAtencionAEliminarId] = useState<number | null>(null);
  const [atencionAEditar, setAtencionAEditar] = useState<Atencion | null>(null);

  // Estado para almacenar los filtros dinámicos de propiedades
  const [filtrosPropiedades, setFiltrosPropiedades] = useState(propiedadFiltros);

  // Estado para almacenar los filtros dinámicos de proyectos
  const [filtrosProyectos, setFiltrosProyectos] = useState(proyectoFiltros);

  // Efecto para cargar los filtros dinámicos de proyectos y propiedades
  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        // Cargar filtros de proyectos
        const filtrosDinamicosProyectos = await getProyectoFiltros();
        setFiltrosProyectos(filtrosDinamicosProyectos);

        // Cargar filtros de propiedades
        const filtrosDinamicosPropiedades = await getPropiedadFiltros();
        setFiltrosPropiedades(filtrosDinamicosPropiedades);
      } catch (error) {
        console.error('Error al cargar filtros dinámicos:', error);
      }
    };

    cargarFiltros();
  }, []);

  // Configuración para el visualizador de proyectos usando la configuración importada
  const proyectoConfigLocal = {
    columnas: proyectoColumnas,
    filtros: filtrosProyectos,
    obtenerDatos: (filtros: any, busqueda: string) => {
      // Usar la empresa del contexto si está disponible, de lo contrario usar la prop
      const empresaId = selectedCompany?.idEmpresa || idEmpresa;
      return obtenerProyectos(filtros, busqueda, empresaId);
    },
    renderizarInformacion: renderizarInformacionProyecto,
    renderizarGaleria: renderizarGaleriaProyecto
  };

  // Configuración para el visualizador de propiedades usando la configuración importada
  const propiedadConfigLocal = {
    columnas: propiedadColumnas,
    filtros: filtrosPropiedades,
    obtenerDatos: obtenerPropiedades,
    renderizarInformacion: renderizarInformacionPropiedad,
    renderizarGaleria: renderizarGaleriaPropiedad
  };

  // Manejadores para las acciones de cotización
  const handleDeleteCotizacion = (realId: number) => {
    // Usar el mismo sistema de confirmación que Consulta y Reclamo
    setAtencionAEliminarId(realId);
    setIsDeleteDialogOpen(true);
  };

  const handleCancelCotizacion = async (realId: number) => {
    try {
   

      // Obtener el ID del estado "Cancelada"
      const response = await axios.get('/api/proxy?service=estado_atencion_cancelada_url');
      const data = response.data?.data || response.data?.items || response.data?.results || response.data || [];

      let idEstadoCancelada = null;

      if (Array.isArray(data) && data.length > 0) {
        // Buscar el estado con nombre "Cancelada"
        const estadoCancelada = data.find((estado: any) =>
          (estado.nombre || '').toLowerCase() === 'cancelada'
        );

        if (estadoCancelada) {
          idEstadoCancelada = estadoCancelada.id_estado_atencion || estadoCancelada.idEstadoAtencion || estadoCancelada.id;
        }
      }

      if (!idEstadoCancelada) {
        showAlert('error', 'Error', 'No se pudo encontrar el estado "Cancelada"');
        return;
      }

      // Actualizar el estado de la atención a "Cancelada"
      await updateAtencion(realId, {
        id_estado_atencion: idEstadoCancelada
      });

      showAlert('success', 'Cotización Cancelada', 'La cotización ha sido cancelada correctamente y ya no se puede modificar.');

      // Recargar las atenciones para actualizar la lista
      if (idPersona) {
        fetchAtenciones(idPersona);
      }
    } catch (error) {
      console.error('Error al cancelar la cotización:', error);
      showAlert('error', 'Error', 'No se pudo cancelar la cotización.');
    }
  };

  const handleOpenModal = (tipo: 'cotizacion' | 'consulta' | 'reclamo') => {
    setTipoAtencion(tipo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAtencionAEditar(null);
  };

  const handleSuccess = () => {
    const action = atencionAEditar ? 'actualizado' : 'registrado';
    const entity = tipoAtencion === 'consulta' ? 'Consulta' : 'Reclamo';
    handleCloseModal();
    showAlert('success', 'Éxito', `${entity} ${action} correctamente`);
    if (idPersona) {
      fetchAtenciones(idPersona);
    }
  };

  const handleEdit = (atencion: Atencion) => {
    setAtencionAEditar(atencion);
    let tipo: 'cotizacion' | 'consulta' | 'reclamo' = 'consulta';

    if (atencion.idTipoAtencion === tiposAtencionIds.cotizacion || atencion.id_tipo_atencion === tiposAtencionIds.cotizacion) {
      tipo = 'cotizacion';
    } else if (atencion.idTipoAtencion === tiposAtencionIds.consulta || atencion.id_tipo_atencion === tiposAtencionIds.consulta) {
      tipo = 'consulta';
    } else {
      tipo = 'reclamo';
    }

    setTipoAtencion(tipo);
    setShowModal(true);
  };

  const handleDelete = (idAtencion: number) => {
    setAtencionAEliminarId(idAtencion);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!atencionAEliminarId) return;

    try {
      await deleteAtencion(atencionAEliminarId);
      showAlert('success', 'Atención Eliminada', 'El registro de la atención ha sido eliminado.');
      if (idPersona) {
        fetchAtenciones(idPersona);
      }
    } catch (error) {
      console.error('Error al eliminar la atención:', error);
      showAlert('error', 'Error', 'No se pudo eliminar la atención.');
    } finally {
      setIsDeleteDialogOpen(false);
      setAtencionAEliminarId(null);
    }
  };

  const fetchAtenciones = async (personaId: number) => {
    setIsLoading(true);
    try {
      const data = await getAtencionesByPersona(personaId);
      setAtenciones(data);
    } catch (error) {
      console.error('Error al cargar atenciones:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las atenciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idPersona) {
      fetchAtenciones(idPersona);
    }
  }, [idPersona]);


  const getIdFromSearchUrl = async (searchUrl: string): Promise<number | null> => {
    try {
      const url = new URL(searchUrl);
      const searchTerm = url.searchParams.get('search');

      if (!searchTerm) {
        console.error('No se encontró parámetro de búsqueda en la URL:', searchUrl);
        return null;
      }

      const response = await axios.get(searchUrl);
      const data = response.data?.data || response.data?.items || response.data?.results || response.data || [];

      const exactMatch = data.find((item: any) =>
        (item.nombre || '').toLowerCase() === searchTerm.toLowerCase()
      );

      return exactMatch?.id || exactMatch?.idTipoAtencion || exactMatch?.id_tipo_atencion ||
        (data[0]?.id || data[0]?.idTipoAtencion || data[0]?.id_tipo_atencion || null);
    } catch (error) {
      console.error('Error al obtener ID desde URL de búsqueda:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [cotizacionId, consultaId, reclamoId] = await Promise.all([
          process.env.TIPO_ATENCION_COTIZACION_URL
            ? getIdFromSearchUrl(process.env.TIPO_ATENCION_COTIZACION_URL)
            : Promise.resolve(null),
          process.env.TIPO_ATENCION_CONSULTA_URL
            ? getIdFromSearchUrl(process.env.TIPO_ATENCION_CONSULTA_URL)
            : Promise.resolve(null),
          process.env.TIPO_ATENCION_RECLAMO_URL
            ? getIdFromSearchUrl(process.env.TIPO_ATENCION_RECLAMO_URL)
            : Promise.resolve(null),
        ]);

        setTiposAtencionIds({
          cotizacion: cotizacionId || 1,
          consulta: consultaId || 2,
          reclamo: reclamoId || 3
        });


        const estadosUrl = `/api/proxy?service=atencion&path=estado-atencion`;
        const estadosResponse = await axios.get(estadosUrl);
        const estadosData = estadosResponse.data?.data || estadosResponse.data?.items || estadosResponse.data?.results || estadosResponse.data || [];
        if (Array.isArray(estadosData) && estadosData.length > 0) {
          const estadosMap = estadosData.reduce((acc, estado) => {
            const id = estado.id_estado_atencion || estado.idEstadoAtencion || estado.id_estado || estado.idEstado || estado.id;
            const nombre = estado.nombre || estado.descripcion || estado.name;
            if (id && nombre) {
              acc[id] = nombre;
            }
            return acc;
          }, {} as Record<number, string>);
          setEstadosAtencion(estadosMap);
        }


        try {
      
            const canalesUrl = `/api/proxy?service=atencion&path=canales-comunicacion`;
            const canalesResponse = await axios.get(canalesUrl);
            const canalesData = canalesResponse.data?.data || canalesResponse.data?.items || canalesResponse.data?.results || canalesResponse.data || [];

            if (Array.isArray(canalesData) && canalesData.length > 0) {
              const canalesMap = canalesData.reduce((acc, canal) => {
                const id = canal.id_canal_comunicacion || canal.idCanalComunicacion || canal.id_canal || canal.idCanal || canal.id;
                const nombre = canal.nombre || canal.descripcion || canal.name;
                if (id && nombre) {
                  acc[id] = nombre;
                }
                return acc;
              }, {} as Record<number, string>);
              setCanales(canalesMap);
            } else {
              console.warn('No se encontraron datos de canales o el formato no es un array.');
            }
        } catch (error) {
          console.error('Error específico al cargar canales:', error);
          showAlert('error', 'Error de Canales', 'No se pudieron cargar los canales.');
        }

      } catch (error) {
        console.error('Error al cargar la configuración general:', error);
        showAlert('error', 'Error de Configuración', 'No se pudo cargar la configuración de atenciones.');
      }
    };

    loadConfig();
  }, []);

  const atencionesFiltradas = atenciones.filter(atencion => {
    const tipo = atencion.idTipoAtencion || atencion.id_tipo_atencion;
    if (activeTab === 'consulta') {
      return tipo === tiposAtencionIds.consulta;
    }
    if (activeTab === 'reclamo') {
      return tipo === tiposAtencionIds.reclamo;
    }
    return false;
  });

  const getEstadoNombre = (estadoId: number) => {
    const nombre = estadosAtencion[estadoId] || `Estado ${estadoId}`;
    const esFinalizado = estadoId === 7;

    return {
      nombre: nombre || (esFinalizado ? 'Finalizado' : `Estado ${estadoId}`),
      clase: esFinalizado
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800'
    };
  };

  const renderTable = () => {
    if (isLoading) {
      return <p className="text-center py-4">Cargando atenciones...</p>;
    }

    const atencionesFiltradas = atenciones.filter(atencion => {
      const tipo = atencion.idTipoAtencion || atencion.id_tipo_atencion;
      if (activeTab === 'cotizacion') {
        return tipo === tiposAtencionIds.cotizacion;
      }
      if (activeTab === 'consulta') {
        return tipo === tiposAtencionIds.consulta;
      }
      if (activeTab === 'reclamo') {
        return tipo === tiposAtencionIds.reclamo;
      }
      return false;
    });

    if (atencionesFiltradas.length === 0) {
      return (
        <div className={styles.tabPlaceholder}>
          {activeTab === 'cotizacion' ? (
            <>
              <div className={styles.placeholderIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className={styles.placeholderTitle}>No hay cotizaciones registradas</h3>
              <p className={styles.placeholderDescription}>
                Registre una nueva cotización usando el botón "Nueva Cotización" en la parte superior.
              </p>
            </>
          ) : activeTab === 'consulta' ? (
            <>
              <div className={styles.placeholderIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className={styles.placeholderTitle}>No hay consultas registradas</h3>
              <p className={styles.placeholderDescription}>
                Registre una nueva consulta usando el botón "Nueva Consulta" en la parte superior.
              </p>
            </>
          ) : (
            <>
              <div className={styles.placeholderIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 className={styles.placeholderTitle}>No hay reclamos registrados</h3>
              <p className={styles.placeholderDescription}>
                Registre un nuevo reclamo usando el botón "Nuevo Reclamo" en la parte superior.
              </p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">N°</th>
              <th scope="col" className="px-6 py-3">Fecha</th>
              <th scope="col" className="px-6 py-3">Canal Atención</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Observaciones</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {atencionesFiltradas.map((atencion, index) => {
              const idAtencion = atencion.id_atencion || atencion.idAtencion || index;
              const fecha = atencion.fechaAtencion || atencion.fecha_atencion;
              const idCanal = atencion.idCanal || atencion.id_canal || 0;
              const idEstado = atencion.idEstadoAtencion || atencion.id_estado_atencion || 0;
              const observaciones = atencion.observaciones || 'Sin observaciones';

              const estado = getEstadoNombre(idEstado);
              const nombreCanal = canales[idCanal] || `Canal ${idCanal}`;

              return (
                <tr
                  key={idAtencion}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">
                    {(index + 1).toString().padStart(1, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fecha ? formatDate(new Date(fecha)) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">{nombreCanal}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${estado.clase}`}>
                      {estado.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={observaciones}>
                    {observaciones}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(atencion)}
                      className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
                      title="Editar Atención"
                    >
                      <Pencil size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(idAtencion)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                      title="Eliminar Atención"
                    >
                      <Trash size={18} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'cotizacion':
        const cotizaciones = atenciones.filter(atencion => {
          const tipoId = atencion.idTipoAtencion || atencion.id_tipo_atencion;
          return tipoId === tiposAtencionIds.cotizacion;
        });

        return (
          <div className={styles.tabContent}>
            <div className={styles.tabBody}>
              <div className="space-y-4">
                {cotizaciones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <h3 className={styles.placeholderTitle}>No hay cotizaciones registradas</h3>
                    <p className={styles.placeholderDescription}>Registre una nueva cotización usando el botón "Nueva Cotización" en la parte superior.</p>
                  </div>
                ) : (
                  [...cotizaciones].sort((a, b) => {
                    const idA = a.idAtencion || a.id_atencion || 0;
                    const idB = b.idAtencion || b.id_atencion || 0;
                    return idB - idA; // Sort in descending order
                  }).map((cotizacion, index) => {
                    const realId = cotizacion.idAtencion || cotizacion.id_atencion || 0;
                    const numeroSecuencial = cotizaciones.length - index; // Numeración secuencial en orden descendente
                    const fecha = cotizacion.fechaAtencion || cotizacion.fecha_atencion || '';
                    const observaciones = cotizacion.observaciones || 'Sin observaciones';
                    const estadoId = cotizacion.idEstadoAtencion || cotizacion.id_estado_atencion || 1;
                    const estadoNombre = estadosAtencion[estadoId] || (estadoId === 7 ? 'Finalizado' : 'En curso');

                    return (
                      <CotizacionInfo
                        key={realId}
                        id={numeroSecuencial}
                        realId={realId}
                        observacion={observaciones}
                        fecha={fecha}
                        estado={estadoNombre}
                        proyectoConfig={proyectoConfigLocal}
                        propiedadConfig={propiedadConfigLocal}
                        clienteNombre={clienteNombre}
                        clienteId={idPersona}
                        onDelete={handleDeleteCotizacion}
                        onCancel={handleCancelCotizacion}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      case 'consulta':
      case 'reclamo':
        return (
          <div className={styles.tabContent}>
            <div className={styles.tabBody}>
              {renderTable()}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsHeader}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full gap-2">
          <div className="flex w-full md:w-auto overflow-x-auto">
            <button
              className={`${styles.tabButton} ${styles.cotizacion} ${activeTab === 'cotizacion' ? styles.active : ''}`}
              onClick={() => setActiveTab('cotizacion')}
            >
              Cotización
            </button>
            <button
              className={`${styles.tabButton} ${styles.consulta} ${activeTab === 'consulta' ? styles.active : ''}`}
              onClick={() => setActiveTab('consulta')}
            >
              Consulta
            </button>
            <button
              className={`${styles.tabButton} ${styles.reclamo} ${activeTab === 'reclamo' ? styles.active : ''}`}
              onClick={() => setActiveTab('reclamo')}
            >
              Reclamo
            </button>
          </div>
          <div className="flex justify-start md:justify-end w-full md:w-auto">
            {activeTab === 'cotizacion' && (
              <Button
                className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 rounded-md gap-1.5 px-3 w-full md:w-auto"
                onClick={() => handleOpenModal('cotizacion')}
              >
                <Plus className="h-4 w-4 mr-1" /> Nueva Cotización
              </Button>
            )}
            {activeTab === 'consulta' && (
              <Button
                className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 rounded-md gap-1.5 px-3 w-full md:w-auto"
                onClick={() => handleOpenModal('consulta')}
              >
                <Plus className="h-4 w-4 mr-1" /> Nueva Consulta
              </Button>
            )}
            {activeTab === 'reclamo' && (
              <Button
                className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 rounded-md gap-1.5 px-3 w-full md:w-auto"
                onClick={() => handleOpenModal('reclamo')}
              >
                <Plus className="h-4 w-4 mr-1" /> Nuevo Reclamo
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className={styles.tabsContentContainer}>
        {renderContent()}
      </div>

      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) handleCloseModal();
      }}>
        <DialogOverlay />
        <DialogContent className="max-w-2xl">
          <AtencionForm
            personaId={idPersona || 0}
            tipoAtencion={tipoAtencion}
            onSuccess={handleSuccess}
            onCancel={handleCloseModal}
            initialData={atencionAEditar}
            key={atencionAEditar ? `edit-${atencionAEditar.idAtencion || atencionAEditar.id_atencion}` : 'new-atencion'}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta atención?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AtencionTabs;

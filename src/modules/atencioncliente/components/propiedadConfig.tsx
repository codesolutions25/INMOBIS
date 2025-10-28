import React, { useState, Suspense, useEffect } from "react";
import { Propiedad } from "@/types/propiedades";
import { getPropiedades } from "@/services/apiPropiedades";
import { getTiposPropiedadSimple } from "@/services/apiTiposPropiedad";
import { getEstadosPropiedadSimple } from "@/services/apiEstadosPropiedad";
import { getProyectosSimple } from "@/services/apiProyecto";
import { getDistritos } from "@/services/apiDistritos";
import { BarChart3, Ruler, Building2, Bed, Bath, Car, DollarSign, Tag, FileText, Star, Diamond, Info, FileImage } from "lucide-react";
import GaleriaSimplificada from "./GaleriaSimplificada";

// Columnas para la tabla de propiedades
export const propiedadColumnas = [
  {
    header: "N°",
    accessorKey: "idPropiedad",
    cell: ({ row }: any) => (
      <span className="font-medium text-gray-900 text-left">
        {row.index + 1}
      </span>
    ),
    size: 60, // Tamaño fijo en píxeles
  },

  {
    header: "Nombre",
    accessorKey: "nombre",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.nombre}
      </span>
    ),
    size: 200, // Tamaño fijo en píxeles
  },
  {
    header: "Tipo",
    accessorKey: "tipoNombre",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.tipoNombre || "No especificado"}
      </span>
    ),
    size: 120, // Tamaño fijo en píxeles
  },
  {
    header: "Precio",
    accessorKey: "precio",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left font-medium">
        {row.original.precio ? `S/ ${row.original.precio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "No especificado"}
      </span>
    ),
    size: 120, // Tamaño fijo en píxeles
  },
  {
    header: "Área m²",
    accessorKey: "areaM2",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.areaM2 ? `${row.original.areaM2} m²` : "No especificado"}
      </span>
    ),
    size: 100, // Tamaño fijo en píxeles
  },
  {
    header: "Piso",
    accessorKey: "piso",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.piso || "No especificado"}
      </span>
    ),
    size: 80, // Tamaño fijo en píxeles
  },
  {
    header: "Distrito",
    accessorKey: "distritoNombre",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.distritoNombre || "No especificado"}
      </span>
    ),
    size: 120, // Tamaño fijo en píxeles
  },
  {
    header: 'Estado',
    accessorKey: 'estadoNombre',
    cell: ({ row }: { row: any }) => {
      const estado = row.original.estadoNombre;
      const reservadaPorOtro = row.original.reservadaPorOtro;
      
      if (reservadaPorOtro) {
        return (
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-semibold">Reservada</span>
          </div>
        );
      }
      
      const colorClass = estado === 'Disponible' ? 'text-green-600' : 'text-red-600';
      return <span className={colorClass}>{estado}</span>;
    },
    size: 120, // Tamaño fijo en píxeles
  },
];

// Función para obtener filtros dinámicamente (tipos y estados de propiedad)
export const getPropiedadFiltros = async () => {
  try {
    // Obtener datos para los filtros
    const [tiposPropiedad, estadosPropiedad] = await Promise.all([
      getTiposPropiedadSimple(),
      getEstadosPropiedadSimple()
    ]);
    
    // Crear filtro de tipos de propiedad
    const tiposFiltro = {
      nombre: "Tipo",
      opciones: [
        { value: "", label: "Todos los tipos" },
        ...tiposPropiedad.map(tipo => ({
          value: tipo.idTiposPropiedad?.toString() || "",
          label: tipo.nombre || "Sin nombre"
        }))
      ]
    };
    
    // Crear filtro de estados
    const estadosFiltro = {
      nombre: "Estado",
      opciones: [
        { value: "", label: "Todos los estados" },
        ...estadosPropiedad.map(estado => ({
          value: estado.idEstadoPropiedad?.toString() || "",
          label: estado.nombre || "Sin nombre"
        }))
      ]
    };
    
    return [tiposFiltro, estadosFiltro];
  } catch (error) {
    console.error('Error al obtener filtros de propiedades:', error);
    // Devolver filtros por defecto en caso de error
    return propiedadFiltros;
  }
};

// Filtros estáticos para propiedades (fallback)
export const propiedadFiltros = [
  {
    nombre: "Tipo",
    opciones: [
      { value: "", label: "Todos los tipos" },
      { value: "1", label: "Departamento" },
      { value: "2", label: "Casa" },
      { value: "3", label: "Local Comercial" },
      { value: "4", label: "Oficina" }
    ]
  },
  {
    nombre: "Estado",
    opciones: [
      { value: "", label: "Todos los estados" },
      { value: "1", label: "Disponible" },
      { value: "2", label: "Reservado" },
      { value: "3", label: "Vendido" }
    ]
  }
];

// Función para obtener datos de propiedades con información de tipos y estados
export const obtenerPropiedades = async (filtros: Record<string, any>, busqueda: string, idProyecto?: number): Promise<any[]> => {
  try {
    console.log('Obteniendo propiedades con filtros:', filtros, 'búsqueda:', busqueda, 'y proyecto:', idProyecto);
    
    // Obtener propiedades con paginación y filtros
    const response = await getPropiedades(1, 1000, busqueda); // Obtener hasta 50 propiedades
    let propiedades = response.data || [];
    console.log('Propiedades api obtenidas:', propiedades);
    // Obtener información adicional para enriquecer los datos
    const [tiposPropiedad, estadosPropiedad, proyectos, distritos] = await Promise.all([
      getTiposPropiedadSimple().catch(() => []),
      getEstadosPropiedadSimple().catch(() => []),
      getProyectosSimple().catch(() => []),
      getDistritos().catch(() => [])
    ]);
    
    // Crear mapas para búsqueda rápida
    const tiposMap = new Map(tiposPropiedad.map(tipo => [tipo.idTiposPropiedad, tipo.nombre]));
    const estadosMap = new Map(estadosPropiedad.map(estado => [estado.idEstadoPropiedad, estado.nombre]));
    const proyectosMap = new Map(proyectos.map(proyecto => [proyecto.idProyectoInmobiliario, proyecto]));
    const distritosMap = new Map(distritos.map(distrito => [distrito.idDistrito, distrito.nombre]));
    
    // Filtrar por proyecto si se especifica un ID de proyecto
    if (idProyecto) {
      propiedades = propiedades.filter((propiedad: any) => 
        propiedad.idProyectoInmobiliario === idProyecto
      );
      
    }
    
    // Enriquecer propiedades con información de tipos, estados y distrito
    propiedades = propiedades.map((propiedad: any) => {
      const proyecto = proyectosMap.get(propiedad.idProyectoInmobiliario);
      const distritoNombre = proyecto ? distritosMap.get(proyecto.idDistrito) || 'No especificado' : 'No especificado';
      
      return {
        ...propiedad,
        tipoNombre: tiposMap.get(propiedad.idTiposPropiedad) || 'No especificado',
        estadoNombre: estadosMap.get(propiedad.idEstadoPropiedad) || 'No especificado',
        distritoNombre: distritoNombre
      };
    });
    
    // Aplicar filtros
    if (filtros.Tipo && filtros.Tipo !== "") {
      propiedades = propiedades.filter((propiedad: any) => 
        propiedad.idTiposPropiedad?.toString() === filtros.Tipo
      );
    }
    
    if (filtros.Estado && filtros.Estado !== "") {
      propiedades = propiedades.filter((propiedad: any) => 
        propiedad.idEstadoPropiedad?.toString() === filtros.Estado
      );
    }
    
    console.log(`Propiedades obtenidas y filtradas: ${propiedades.length}`);
    return propiedades;
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return [];
  }
};

// Función factory para crear una función obtenerPropiedades filtrada por proyecto
export const crearObtenerPropiedadesPorProyecto = (idProyecto: number) => {
  return async (filtros: Record<string, any>, busqueda: string): Promise<any[]> => {
    return await obtenerPropiedades(filtros, busqueda, idProyecto);
  };
};

// Tipo extendido para propiedades con información de tipos y estados
export interface PropiedadConInfo extends Propiedad {
  tipoNombre?: string;
  estadoNombre?: string;
  distritoNombre?: string;
  codigo?: string; // Alias para codigoPropiedad
  area?: number; // Alias para areaM2
  habitaciones?: number; // Alias para numeroHabitaciones
  banos?: number; // Alias para numeroBanos
  reservadaPorOtro?: boolean; // Indica si está reservada por otro cliente
}

// Componente para renderizar información de la propiedad
const InformacionPropiedad: React.FC<{ propiedad: PropiedadConInfo }> = ({ propiedad }) => {
  const [caracteristicasPropiedad, setCaracteristicasPropiedad] = useState<any[]>([]);
  const [isLoadingCaracteristicas, setIsLoadingCaracteristicas] = useState<boolean>(false);
  
  // Determinar si la propiedad está reservada por otro cliente
  const estiloReservada = propiedad.reservadaPorOtro ? {
    backgroundColor: '#fee2e2',
    border: '2px solid #ef4444',
    opacity: 0.7
  } : {};
  
  // Función para formatear precio
  const formatPrecio = (precio: number | undefined): string => {
    if (!precio) return 'No especificado';
    return `S/ ${precio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Función para cargar las características de la propiedad
  const fetchCaracteristicas = async () => {
    if (!propiedad.idPropiedad) return;
    
    try {
      setIsLoadingCaracteristicas(true);
      const { getCaracteristicasPropiedad, getCatalogoCaracteristicas } = await import('@/services/apiCaracteristicas');
      
      const catalogoCompleto = await getCatalogoCaracteristicas(1, 1000); 
      const mapaCatalogo = new Map();
      
      if (catalogoCompleto && Array.isArray(catalogoCompleto.data)) {
        catalogoCompleto.data.forEach((item: any) => {
          mapaCatalogo.set(item.idCatalogoCaracteristicas, item.nombre);
        });
        
        if (catalogoCompleto.meta && catalogoCompleto.meta.lastPage > 1) {
          const promises = [];
          for (let page = 2; page <= catalogoCompleto.meta.lastPage; page++) {
            promises.push(
              getCatalogoCaracteristicas(page, 1000)
              .then(data => {
                if (data && Array.isArray(data.data)) {
                  data.data.forEach((item: any) => {
                    mapaCatalogo.set(item.idCatalogoCaracteristicas, item.nombre);
                  });
                }
              })
            );
          }
          await Promise.all(promises);
        }
      } else if (Array.isArray(catalogoCompleto)) {
        catalogoCompleto.forEach((item: any) => {
          mapaCatalogo.set(item.idCatalogoCaracteristicas, item.nombre);
        });
      }
      
      const caracteristicasResponse = await getCaracteristicasPropiedad(propiedad.idPropiedad);
      
      let caracteristicasProcesadas = [];
      if (caracteristicasResponse && typeof caracteristicasResponse === 'object' && 'data' in caracteristicasResponse && Array.isArray(caracteristicasResponse.data)) {
        caracteristicasProcesadas = caracteristicasResponse.data.map((item: any) => ({
          ...item,
          nombre: mapaCatalogo.get(item.idCatalogoCaracteristicas) || 'Característica'
        }));
      } else if (Array.isArray(caracteristicasResponse)) {
        caracteristicasProcesadas = caracteristicasResponse.map((item: any) => ({
          ...item,
          nombre: mapaCatalogo.get(item.idCatalogoCaracteristicas) || 'Característica'
        }));
      }
      
      setCaracteristicasPropiedad(caracteristicasProcesadas);
    } catch (error) {
      console.error("Error al cargar características:", error);
    } finally {
      setIsLoadingCaracteristicas(false);
    }
  };
  
  // Cargar características al montar el componente
  useEffect(() => {
    fetchCaracteristicas();
  }, [propiedad.idPropiedad]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-h-[80vh] overflow-y-auto" style={estiloReservada}>
      {/* Indicador de reserva */}
      {propiedad.reservadaPorOtro && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-lg">🚫</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Esta propiedad ya está reservada por otro cliente
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Información básica */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {propiedad.nombre || 'Propiedad sin nombre'}
          {propiedad.reservadaPorOtro && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              No disponible
            </span>
          )}
        </h3>
        {propiedad.codigoPropiedad && (
          <p className="text-sm text-gray-600 font-mono">
            <strong>Código:</strong> {propiedad.codigoPropiedad}
          </p>
        )}
      </div>
      
      {/* Características principales */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
          Características
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Ruler className="mr-3 h-4 w-4 text-blue-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Área:</span>
              <span className="ml-2 text-sm text-gray-900">{propiedad.areaM2 || 'No especificado'} m²</span>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Building2 className="mr-3 h-4 w-4 text-blue-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Piso:</span>
              <span className="ml-2 text-sm text-gray-900">{propiedad.piso || 'No especificado'}</span>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Bed className="mr-3 h-4 w-4 text-blue-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Habitaciones:</span>
              <span className="ml-2 text-sm text-gray-900">{propiedad.numeroHabitaciones || 'No especificado'}</span>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Bath className="mr-3 h-4 w-4 text-blue-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Baños:</span>
              <span className="ml-2 text-sm text-gray-900">{propiedad.numeroBanos || 'No especificado'}</span>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Car className="mr-3 h-4 w-4 text-blue-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Estacionamiento:</span>
              <span className="ml-2 text-sm text-gray-900">
                {propiedad.estacionamiento ? "Sí" : "No"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <DollarSign className="mr-3 h-4 w-4 text-green-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Precio:</span>
              <span className="ml-2 text-sm font-semibold text-green-600">{formatPrecio(propiedad.precio)}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Tag className="mr-3 h-4 w-4 text-purple-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Tipo:</span>
              <span className="ml-2 text-sm text-gray-900">{propiedad.tipoNombre || 'No especificado'}</span>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <FileText className="mr-3 h-4 w-4 text-orange-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              <span className="ml-2 text-sm text-gray-900">{propiedad.estadoNombre || 'No especificado'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Características adicionales */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="mr-2 h-5 w-5 text-yellow-500" />
          Características Adicionales
        </h4>
        
        {isLoadingCaracteristicas ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando características...</span>
          </div>
        ) : (
          <>
            {caracteristicasPropiedad.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {caracteristicasPropiedad.map((caracteristica, index) => (
                  <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Diamond className="mr-3 h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-blue-900">{caracteristica.nombre}:</span>
                      <p className="text-sm text-gray-700 mt-1">
                        {caracteristica.valor || 'Sin valor especificado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay características adicionales asignadas a esta propiedad.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Descripción */}
      {propiedad.descripcion && (
        <div className="p-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-gray-600" />
            Descripción
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">{propiedad.descripcion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Función para renderizar información de la propiedad
export const renderizarInformacionPropiedad = (propiedad: PropiedadConInfo): React.ReactNode => {
  return <InformacionPropiedad propiedad={propiedad} />;
};

// Componente wrapper para la galería de propiedades
const GaleriaPropiedadWrapper: React.FC<{ idPropiedad: number, propiedad?: Propiedad }> = ({ idPropiedad, propiedad }) => {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="p-4 bg-gray-100 rounded-md text-center">
        <p className="text-gray-600">Error al cargar las imágenes</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4 bg-gray-100 rounded-md text-center">
        <p className="text-gray-600">Error al cargar la galería</p>
      </div>
    }>
      <Suspense fallback={
        <div className="p-4 bg-gray-100 rounded-md text-center">
          <p className="text-gray-600">Cargando galería...</p>
        </div>
      }>
        <GaleriaSimplificada 
          idPropiedad={idPropiedad}
          tipo="propiedad"
        />
      </Suspense>
    </ErrorBoundary>
  );
};

// Componente de error boundary
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode, children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en galería de propiedad:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Función para renderizar galería de la propiedad
export const renderizarGaleriaPropiedad = (propiedad: PropiedadConInfo): React.ReactNode => {
  if (!propiedad.idPropiedad) {
    return (
      <div className="p-4 bg-gray-100 rounded-md text-center">
        <p className="text-gray-600">No se puede cargar la galería</p>
        <p className="text-xs text-gray-500">ID de propiedad no disponible</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GaleriaPropiedadWrapper 
        idPropiedad={propiedad.idPropiedad} 
        propiedad={propiedad}
      />
    </div>
  );
};

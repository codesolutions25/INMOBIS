// ============================================
// IMPORTS
// ============================================
import React, { useState, Suspense } from "react";

// Servicios
import { Proyecto, Departamento, Provincia, Distrito, EstadoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
import { PaginatedRequest } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { getProyectos } from "@/services/apiProyecto";

// Componentes
import GaleriaSimplificada from "./GaleriaSimplificada";
import { getEmpresas } from "@/services/apiEmpresa";
import { Empresa } from "@/types/empresas";
import { useCompany } from "@/contexts/CompanyContext";

// ============================================
// TIPOS Y INTERFACES
// ============================================
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    currentPage: number;
    lastPage: number;
    perPage: number;
  };
}

interface ProyectoConUbicacion extends Omit<Proyecto, 'idEstadoPropiedad' | 'idDistrito'> {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  estadoNombre?: string;
  idEstadoPropiedad: number; // Required from Proyecto
  idDistrito: number; // Required from Proyecto
  idProvincia: number;
  idDepartamento: number;
}

interface ProvinciaConDepartamento extends Provincia {
  departamentoNombre?: string;
}

interface DistritoConUbicacion extends Distrito {
  provinciaNombre?: string;
  departamentoNombre?: string;
}

// ============================================
// COMPONENTES
// ============================================
class ErrorBoundary extends React.Component<{ 
  fallback: React.ReactNode; 
  children: React.ReactNode 
}, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en Galería de Proyecto:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ============================================
// CONFIGURACIONES
// ============================================

/**
 * Configuración de columnas para la tabla de proyectos
 */
export const proyectoColumnas = [
  {
    header: "N°",
    accessorKey: "idProyectoInmobiliario",
    cell: ({ row }: any) => (
      <span className="font-medium text-gray-900 text-left">
        {row.index + 1}
      </span>
    ),
    size: 60,
  },
  {
    header: "Nombre",
    accessorKey: "nombre",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.nombre}
      </span>
    ),
    size: 200,
  },
  {
    header: "Departamento",
    accessorKey: "departamento",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.departamento || "No especificado"}
      </span>
    ),
    size: 150,
  },
  {
    header: "Provincia",
    accessorKey: "provincia",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.provincia || "No especificado"}
      </span>
    ),
    size: 150,
  },
  {
    header: "Distrito",
    accessorKey: "distrito",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.distrito || "No especificado"}
      </span>
    ),
    size: 150,
  },
  {
    header: "Estado",
    accessorKey: "estadoNombre",
    cell: ({ row }: any) => (
      <div className="text-left w-[120px]">
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          {row.original.estadoNombre || 'No especificado'}
        </span>
      </div>
    ),
    size: 120,
  },
];

export const getProyectoFiltros = async () => {
  try {
    const [empresasResponse, departamentosResponse, provinciasResponse, distritosResponse] = await Promise.all([
      getEmpresas(),
      InmobiliariaApi.ubicacionController.getDepartamentoList({ page: 1, perPage: 100 }),
      InmobiliariaApi.ubicacionController.getProvinciaList(undefined, { page: 1, perPage: 1000 }),
      InmobiliariaApi.ubicacionController.getDistritoList(undefined, { page: 1, perPage: 5000 })
    ]);
    
    const empresas = empresasResponse?.data || [];
    const departamentos = departamentosResponse?.data || [];
    const provincias = provinciasResponse?.data || [];
    const distritos = distritosResponse?.data || [];
    
    // Handle case where any of the responses are null
    if (!departamentos || !provincias || !distritos) {
      throw new Error('Error al cargar los datos de ubicación');
    }
  
    
    const departamentosFiltro = {
      nombre: "Departamento",
      opciones: [
        { value: "", label: "Todos los departamentos" },
        ...(departamentos || []).map((dep: Departamento) => ({
          value: dep.idDepartamento.toString(),
          label: dep.nombre
        }))
      ],
      valorInicial: ""
    };
    
    const provinciasFiltro = {
      nombre: "Provincia",
      opciones: [
        { value: "", label: "Todas las provincias" },
        ...(provincias || []).map((prov: Provincia) => ({
          value: prov.idProvincia.toString(),
          label: prov.nombre
        }))
      ],
      valorInicial: ""
    };
    
    const distritosFiltro = {
      nombre: "Distrito",
      opciones: [
        { value: "", label: "Todos los distritos" },
        ...(distritos || []).map((dist: Distrito) => ({
          value: dist.idDistrito.toString(),
          label: dist.nombre
        }))
      ],
      valorInicial: ""
    };
    
    return [ departamentosFiltro, provinciasFiltro, distritosFiltro];
  } catch (error) {
    console.error('Error al obtener filtros dinámicos:', error);
    return [

      {
        nombre: "Departamento",
        opciones: [
          { value: "", label: "Todos los departamentos" },
        ],
        valorInicial: ""
      },
      {
        nombre: "Provincia",
        opciones: [
          { value: "", label: "Todas las provincias" },
        ],
        valorInicial: ""
      },
      {
        nombre: "Distrito",
        opciones: [
          { value: "", label: "Todos los distritos" },
        ],
        valorInicial: ""
      },
    ];
  }
};

export const getProvinciasPorDepartamento = async (idDepartamento: string) => {
  if (!idDepartamento) {
    return {
      nombre: "Provincia",
      opciones: [
        { value: "", label: "Todas las provincias" },
      ],
      valorInicial: ""
    };
  }
  
  try {
    const response = await InmobiliariaApi.ubicacionController.getProvinciaList(parseInt(idDepartamento), { page: 1, perPage: 1000 });
    const provincias = response?.data || [];
    const provinciasFiltradas = provincias.filter((p: Provincia) => p.idDepartamento === Number(idDepartamento));
    
    return {
      nombre: "Provincia",
      opciones: [
        { value: "", label: "Todas las provincias" },
        ...provinciasFiltradas.map((prov: Provincia) => ({
          value: prov.idProvincia.toString(),
          label: prov.nombre
        }))
      ],
      valorInicial: ""
    };
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    return {
      nombre: "Provincia",
      opciones: [{ value: "", label: "Error al cargar provincias" }],
      valorInicial: ""
    };
  }
};

export const getDistritosPorProvincia = async (idProvincia: string) => {
  if (!idProvincia) {
    return {
      nombre: "Distrito",
      opciones: [
        { value: "", label: "Todos los distritos" },
      ],
      valorInicial: ""
    };
  }
  
  try {
    const response = await InmobiliariaApi.ubicacionController.getDistritoList(parseInt(idProvincia), { page: 1, perPage: 5000 });
    const distritos = response?.data || [];
    const distritosFiltrados = distritos.filter((d: Distrito) => d.idProvincia === Number(idProvincia));
    
    return {
      nombre: "Distrito",
      opciones: [
        { value: "", label: "Todos los distritos" },
        ...distritosFiltrados.map((dist: Distrito) => ({
          value: dist.idDistrito.toString(),
          label: dist.nombre
        }))
      ],
      valorInicial: ""
    };
  } catch (error) {
    console.error('Error al obtener distritos:', error);
    return {
      nombre: "Distrito",
      opciones: [{ value: "", label: "Error al cargar distritos" }],
      valorInicial: ""
    };
  }
};

export const obtenerProyectosPorEmpresa = async (idEmpresa: string) => {
  if (!idEmpresa) {
    return {
      nombre: "Empresa",
      opciones: [
        { value: "", label: "Todas las empresas" },
      ],
      valorInicial: ""
    };
  }
  
  try {
    const response = await InmobiliariaApi.proyectoController.getProyectoList({ page: 1, perPage: 8000 });
    const proyectos = response?.data || [];
    const proyectosFiltrados = proyectos.filter((p: Proyecto) => p.idEmpresa === Number(idEmpresa));
    
    return {
      nombre: "Empresa",
      opciones: [
        { value: "", label: "Todas las empresas" },
        ...proyectosFiltrados.map((proj: Proyecto) => ({
          value: proj.idProyectoInmobiliario.toString(),
          label: proj.nombre
        }))
      ],
      valorInicial: ""
    };
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return {
      nombre: "Empresa",
      opciones: [{ value: "", label: "Error al cargar proyectos" }],
      valorInicial: ""
    };
  }
};

/**
 * Configuración inicial de filtros para proyectos
 */
export const proyectoFiltros = [

  {
    nombre: "Departamento",
    opciones: [{ value: "", label: "Todos los departamentos" }],
    valorInicial: ""
  },
  {
    nombre: "Provincia",
    opciones: [{ value: "", label: "Todas las provincias" }],
    valorInicial: ""
  },
  {
    nombre: "Distrito",
    opciones: [{ value: "", label: "Todos los distritos" }],
    valorInicial: ""
  },
];

export const obtenerProyectos = async (filtros: Record<string, any>, busqueda: string, idEmpresa?: number): Promise<ProyectoConUbicacion[]> => {
  try {
    // Asegurarse de que el filtro de empresa tenga prioridad sobre el idEmpresa
    const empresaFiltro = filtros.idEmpresa || idEmpresa;
    
    console.log('Filtrando proyectos por empresa:', { 
      empresaFiltro, 
      tieneFiltroEmpresa: !!filtros.idEmpresa, 
      idEmpresa,
      filtros 
    });
    
    // Pasar el filtro de empresa directamente a la API
    const resultado = await getProyectos(1, 100, busqueda, empresaFiltro);
    let proyectos = resultado?.data || [];
    
    // Filtro adicional por si acaso (segunda capa de seguridad)
    if (empresaFiltro) {
      proyectos = proyectos.filter((proyecto: any) => 
        proyecto.idEmpresa === Number(empresaFiltro)
      );
    }

    const [departamentosRes, provinciasRes, distritosRes, estadosRes] = await Promise.all([
      InmobiliariaApi.ubicacionController.getDepartamentoList({ page: 1, perPage: 100 }),
      InmobiliariaApi.ubicacionController.getProvinciaList(undefined, { page: 1, perPage: 1000 }),
      InmobiliariaApi.ubicacionController.getDistritoList(undefined, { page: 1, perPage: 5000 }),
      InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList({ page: 1, perPage: 100 })
    ]);
    
    const departamentos = departamentosRes?.data || [];
    const provincias = provinciasRes?.data || [];
    const distritos = distritosRes?.data || [];
    const estados = estadosRes?.data || [];

    const estadosMap = new Map<number, EstadoPropiedad>();
    estados.forEach(estado => estadosMap.set(estado.idEstadoPropiedad, estado));
    
    const departamentosMap = new Map<number, Departamento>();
    departamentos.forEach(dep => departamentosMap.set(dep.idDepartamento, dep));

    const provinciasMap = new Map<number, Provincia & { departamentoNombre?: string }>(); 
    provincias.forEach(prov => {
      provinciasMap.set(prov.idProvincia, {
        ...prov,
        departamentoNombre: departamentosMap.get(prov.idDepartamento)?.nombre || 'Desconocido'
      });
    });

    const distritosMap = new Map<number, Distrito & { provinciaNombre?: string, departamentoNombre?: string }>();
    distritos.forEach(dist => {
      const provincia = provinciasMap.get(dist.idProvincia);
      distritosMap.set(dist.idDistrito, {
        ...dist,
        provinciaNombre: provincia?.nombre || 'Desconocido',
        departamentoNombre: provincia?.departamentoNombre || 'Desconocido'
      });
    });

    const proyectosConUbicacion = proyectos.map((proyecto: Proyecto) => {
      const distrito = distritosMap.get(proyecto.idDistrito);
      const estado = estadosMap.get(proyecto.idEstadoPropiedad);
      const provincia = distrito ? provinciasMap.get(distrito.idProvincia) : undefined;
      const departamento = provincia ? departamentosMap.get(provincia.idDepartamento) : undefined;
      
      return {
        ...proyecto,
        distrito: distrito?.nombre || 'Desconocido',
        provincia: provincia?.nombre || 'Desconocido',
        departamento: departamento?.nombre || 'Desconocido',
        estadoNombre: estado?.nombre || 'Desconocido',
        idProvincia: provincia?.idProvincia || 0,
        idDepartamento: departamento?.idDepartamento || 0
      } as ProyectoConUbicacion;
    });

    let proyectosFiltrados = [...proyectosConUbicacion];

    if (filtros.departamento) {
      const idDepartamento = Number(filtros.departamento);
      proyectosFiltrados = proyectosFiltrados.filter(proyecto => {
        const distrito = distritosMap.get(proyecto.idDistrito);
        return distrito?.departamentoNombre === departamentosMap.get(idDepartamento)?.nombre;
      });
    }
    
    if (filtros.provincia) {
      const idProvincia = Number(filtros.provincia);
      proyectosFiltrados = proyectosFiltrados.filter(proyecto => {
        const distrito = distritosMap.get(proyecto.idDistrito);
        return distrito?.idProvincia === idProvincia;
      });
    }
    
    if (filtros.distrito) {
      const idDistrito = Number(filtros.distrito);
      proyectosFiltrados = proyectosFiltrados.filter(proyecto => 
        proyecto.idDistrito === idDistrito
      );
    }

    if (filtros.estado) {
      const idEstado = Number(filtros.estado);
      proyectosFiltrados = proyectosFiltrados.filter(proyecto => 
        proyecto.idEstadoPropiedad === idEstado
      );
    }

    return proyectosFiltrados;
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return [];
  }
};


export const renderizarInformacionProyecto = (proyecto: ProyectoConUbicacion): React.ReactNode => {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-md">
        <h3 className="text-lg font-semibold truncate">{proyecto.nombre}</h3>
      </div>
      
      <div className="p-4 flex-grow overflow-y-auto">
        {/* Información principal - Ubicación y Estado */}
        <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block">Ubicación</label>
              <p className="text-sm font-medium text-gray-900">
                {proyecto.departamento || 'No especificado'} / {proyecto.provincia || 'No especificado'} / {proyecto.distrito || 'No especificado'}
              </p>
            </div>
            <div className="text-right">
              <label className="text-xs font-medium text-gray-500 block">Estado</label>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                {proyecto.estadoNombre || 'No especificado'}
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 block">Dirección</label>
            <p className="text-sm text-gray-900">{proyecto.ubicacion || 'No especificada'}</p>
          </div>
        </div>
        
        {/* Fechas */}
        <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Cronograma</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-medium text-gray-500 block">Fecha Inicio</label>
              <p className="text-gray-900 font-medium">{new Date(proyecto.fechaInicio).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block">Fecha Fin</label>
              <p className="text-gray-900 font-medium">{new Date(proyecto.fechaFin).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {/* Información de contacto */}
        <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Información de contacto</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-medium text-gray-500 block">Teléfono</label>
              <p className="text-gray-900">{proyecto.telefonoContacto || 'No disponible'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block">Email</label>
              <p className="text-gray-900">{proyecto.emailContacto || 'No disponible'}</p>
            </div>
          </div>
        </div>
        
        {/* Descripción - Última sección */}
        {proyecto.descripcion && (
          <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Descripción</h4>
            <p className="text-sm text-gray-700">{proyecto.descripcion}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GaleriaProyectoWrapper = ({ idProyecto, proyecto }: { idProyecto: number, proyecto?: Proyecto }) => {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="h-full flex flex-col" style={{ minHeight: '350px', width: '100%' }}>
        <div className="bg-blue-50 p-2 rounded-t-md border-b border-blue-100">
          <h3 className="text-blue-700 font-medium">Galería de Imágenes</h3>
        </div>
        <div className="flex-grow bg-white flex items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ minHeight: '350px', width: '100%' }}>
      <div className="bg-blue-50 p-2 rounded-t-md border-b border-blue-100">
        <h3 className="text-blue-700 font-medium">Galería de Imágenes</h3>
      </div>
      <div className="flex-grow bg-white" style={{ minHeight: '300px' }}>
        <ErrorBoundary fallback={<div className="p-4 text-red-500">Error al cargar la galería</div>}>
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }>
            <GaleriaSimplificada idProyecto={idProyecto} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export const renderizarGaleriaProyecto = (proyecto: ProyectoConUbicacion): React.ReactNode => {
  const idProyecto = typeof proyecto.idProyectoInmobiliario === 'string' 
    ? parseInt(proyecto.idProyectoInmobiliario, 10) 
    : proyecto.idProyectoInmobiliario;

  if (!idProyecto || isNaN(idProyecto)) {
    return (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6b7280' }}>
        <div>
          <div className="text-red-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">Error: ID de proyecto no válido</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        flexGrow: 1, 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', height: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          <GaleriaSimplificada idProyecto={idProyecto} tipo="proyecto" />
        </div>
      </div>
    </div>
  );
};

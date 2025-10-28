import {
  Proyecto,
  Propiedad,
  TipoPropiedad,
  EstadoPropiedad,
  CatalogoCaracteristica,
  CaracteristicaPropiedad,
  Provincia,
  Distrito,
  Departamento,  
  PaginatedResponse,
  PaginatedRequest
} from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { toCamelCase } from "@/utils/caseUtils";

// URL base centralizada
const configServiceUrl = '/api/proxy?service=config&path=';
const inmobiliariaBaseUrl = '/api/proxy?service=inmobiliaria&path=';

// Función auxiliar para construir URLs correctamente
const buildUrl = (endpoint: string, baseUrl?: string): string => {
  const base = baseUrl || inmobiliariaBaseUrl;
  
  // Si el endpoint ya es una URL completa, devolvemos el endpoint directamente
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Eliminar barras iniciales del endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Si el endpoint ya tiene el prefijo de proxy, devolverlo directamente
  if (cleanEndpoint.startsWith('api/proxy')) {
    return `/${cleanEndpoint}`;
  }
  
  // Extraer solo la ruta del endpoint sin parámetros
  const [path, queryParams] = cleanEndpoint.split('?');
  
  // Construir la URL base con la ruta
  let url = base.endsWith('=') ? base + path : base + (path ? `/${path}` : '');
  
  // Si hay parámetros en el endpoint, agregarlos a la URL
  if (queryParams) {
    // Si la base ya tiene parámetros, usar &, de lo contrario usar ?
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}${queryParams}`;
  }
  
  return url;
};

/**
 * Helper para realizar peticiones a la API con manejo de errores centralizado
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  optionsInternal: { 
    silent404?: boolean, 
    useConfigService?: boolean,
    useFilesService?: boolean 
  } = {}
): Promise<T | null> {
  // Si el endpoint ya comienza con /api, lo eliminamos para evitar duplicados
  const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(5) : endpoint;
  
  // Determinar qué base URL usar
  let baseUrl: string;
  if (optionsInternal.useConfigService) {
    baseUrl = configServiceUrl;
  } else if (optionsInternal.useFilesService) {
    baseUrl = '/api/proxy?service=files&path=';
  } else {
    baseUrl = inmobiliariaBaseUrl;
  }
  
  // Construir la URL final
  let url: string;
  if (optionsInternal.useFilesService) {
    // Para el servicio de archivos, asegurarse de que el path se añada correctamente
    const [path, queryParams] = cleanEndpoint.split('?');
    url = `${baseUrl}${path}`;
    if (queryParams) {
      url += `&${queryParams}`;
    }
  } else {
    // Para otros servicios, usar la función buildUrl normal
    url = buildUrl(cleanEndpoint, baseUrl);
  }
  const method = options.method || 'GET';
  const { silent404 = false } = optionsInternal;
  
  try {
    // Obtener el empresaId del localStorage
    let empresaId = '';
    let companyName = '';
    
    try {
      const storedCompany = localStorage.getItem('selectedCompany');
      if (storedCompany) {
        const company = JSON.parse(storedCompany);
        if (company && company.idEmpresa) {
          empresaId = company.idEmpresa.toString();
          companyName = company.razonSocial || `Empresa ${empresaId}`;
        }
      }
    } catch (error) {
      console.error('Error al obtener el empresaId del localStorage:', error);
    }

    // Lista de endpoints que no requieren empresaId
    const noEmpresaIdRequired = [
      'auth',
      'empresas',
      'usuario',
      'permisos',
      'persona'
    ];

    // Verificar si el endpoint requiere empresaId
    const requiresEmpresaId = !noEmpresaIdRequired.some(endpoint => 
      url.includes(endpoint)
    );

    if (requiresEmpresaId && !empresaId) {
      
      
      // Mostrar un error más descriptivo en la consola del navegador
      if (typeof window !== 'undefined') {
        console.group('Error de Empresa ID');
        console.error('No se ha seleccionado una empresa o no se pudo cargar la información.');
        console.error('Por favor, seleccione una empresa antes de continuar.');
        console.groupEnd();
      }
      
      return Promise.reject(new Error('No se ha seleccionado una empresa. Por favor, seleccione una empresa antes de continuar.'));
    }

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(empresaId && { 'X-Empresa-Id': empresaId }),
      ...(options.headers as Record<string, string> || {}),
    });
    
    const response = await fetch(url, {
      method,
      headers,
      ...(method !== 'GET' && method !== 'HEAD' && options.body ? { body: options.body } : {}),
      ...options,
    });
    
    // Si es un 404 y está configurado como silencioso, retornar null
    if (response.status === 404 && silent404) {
      console.log(`[API] 404 silencioso para ${url}`);
      return null;
    }

    // Get the response text first
    const responseText = await response.text();
    // console.log('[API Response Text]', responseText);
    
    // Handle empty responses (like 204 No Content)
    if (response.status === 204 || !responseText.trim()) {
      return null;
    }
    
    let data: any = null;
    
    // Try to parse the response as JSON
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('[API Error] Error parsing JSON response:', {
        error: jsonError,
        responseText,
        status: response.status,
        url,
        method
      });
      
      // Si la respuesta no es exitosa, lanzar un error con el texto de la respuesta
      if (!response.ok) {
        throw new Error(
          `Server responded with status ${response.status}: ${response.statusText}\n${responseText}`
        );
      }
      
      // Si es un 200 pero el JSON no es válido, lanzar un error más específico
      throw new Error('La respuesta del servidor no es un JSON válido');
    }

    // Manejar respuestas de error (códigos de estado que no son 2xx)
    if (!response.ok) {
      console.error('[API Error] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        data,
        url,
        method
      });
      
      const error = new Error(
        data?.message || data?.error || response.statusText || 'Error desconocido'
      );
      // @ts-ignore
      error.status = response.status;
      // @ts-ignore
      error.data = data;
      throw error;
    }

    return data as T;
  } catch (error) {
    console.error(`[API Error] ${method} ${url} failed:`, error);
    
    // Si es un 404 y está configurado como silencioso, retornar null
    if (silent404 && error instanceof Error && error.message.includes('404')) {
      return null;
    }
    // Re-lanzar el error para que lo maneje el llamador
    throw error;
  }
}

// Función para convertir de camelCase a snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const value = obj[key];
    
    acc[snakeKey] = toSnakeCase(value);
    return acc;
  }, {} as any);
};

const InmobiliariaApi = {
  // Controlador de Proyectos
  proyectoController: {
    getProyectoList: async (params: PaginatedRequest = { page: 1, perPage: 100 }): Promise<PaginatedResponse<Proyecto> | null> => {
      // Definir la interfaz para el objeto meta
      interface MetaData {
        total?: number;
        page?: number;
        limit?: number;
        pages?: number;
        currentPage?: number;
        lastPage?: number;
        [key: string]: any; // Para propiedades adicionales
      }
      try {
        const { page = 1, perPage = 100, search = '' } = params;
        
        // Construir la URL con los parámetros de consulta
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', perPage.toString());
        
        if (search) {
          queryParams.append('search', search);
        }
        
        // Incluir id_empresa si está presente
        if ('id_empresa' in params && params.id_empresa) {
          queryParams.append('id_empresa', params.id_empresa.toString());
        }
        
        const url = `proyectos-inmobiliarios&${queryParams.toString()}`;
        
        
        const response = await apiRequest<{ 
          data: any[]; 
          total?: number; 
          page?: number; 
          limit?: number; 
          pages?: number;
          meta?: any;
        }>(url);
        
        
        if (!response) {
          console.error('No se recibió respuesta de la API');
          return { data: [], meta: { total: 0, page, limit: perPage, pages: 1 } };
        }
        
        // Manejar diferentes formatos de respuesta
        let responseData: any[] = [];
        let meta: MetaData = {
          total: 0,
          page: 1,
          limit: perPage,
          pages: 1
        };
        
        if (Array.isArray(response)) {
          // Si la respuesta es un array directo
          responseData = response;
          meta = {
            total: response.length,
            page: 1,
            limit: response.length,
            pages: 1
          };
        } else if (response.data !== undefined) {
          // Si la respuesta tiene un campo 'data'
          responseData = Array.isArray(response.data) ? response.data : [];
          
          // Manejar diferentes formatos de metadatos
          if (response.meta) {
            meta = response.meta;
          } else {
            meta = {
              total: response.total || responseData.length,
              page: response.page || page,
              limit: response.limit || perPage,
              pages: response.pages || 1
            };
          }
        } else {
          // Si la respuesta es un objeto con propiedades de paginación
          responseData = [];
          meta = {
            total: response.total || 0,
            page: response.page || page,
            limit: response.limit || perPage,
            pages: response.pages || 1
          };
        }
        
        // Asegurarse de que los datos sean un array
        const proyectos = Array.isArray(responseData) ? responseData : [];
        
                
        return {
          data: proyectos.map((item: any) => toCamelCase(item)),
          meta: {
            total: meta.total ?? proyectos.length,
            page: meta.page ?? page,
            limit: meta.limit ?? perPage,
            pages: meta.pages ?? 1,
            ...(meta.currentPage !== undefined && { currentPage: meta.currentPage }),
            ...(meta.lastPage !== undefined && { lastPage: meta.lastPage })
          }
        };
      } catch (error) {
        console.error('Error en getProyectoList:', error);
        return null;
      }
    },

    getProyectoById: async (id: number): Promise<Proyecto | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/${id}`);
      return response ? toCamelCase(response) : null;
    },

    createProyecto: async (data: Omit<Proyecto, 'idProyectoInmobiliario'>): Promise<Proyecto | null> => {
      const snakeCaseData = toSnakeCase({
        ...data,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin
      });
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios`, {
        method: 'POST',
        body: JSON.stringify(snakeCaseData)
      });
      return response ? toCamelCase(response) : null;
    },

    updateProyecto: async (id: number, data: Partial<Proyecto>): Promise<Proyecto | null> => {
      const snakeCaseData = toSnakeCase({
        ...data,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin
      });
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(snakeCaseData)
      });
      return response ? toCamelCase(response) : null;
    },

    deleteProyecto: async (id: number): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // Si la respuesta es exitosa (código 2xx)
        if (response.ok) {
          return { success: true };
        }
        // Manejar el mensaje de error
        const errorMessage = 'No se puede eliminar el proyecto porque tiene imágenes asociadas. Por favor, elimine primero las imágenes asociadas.';
        // Devolver el mensaje de error
        return { 
          success: false,
          message: errorMessage
        };
      } catch (error) {
        return { 
          success: false,
          message: 'Error al eliminar el proyecto'
        };
      }
    }
  },
  // Controlador de Propiedades
  propiedadController: {
    
    getPropiedadList: async (params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<Propiedad> | null> => {
      const { page = 1, perPage = 10, search = '' } = params;
      const url = `propiedades&page=${page}&limit=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      return apiRequest<PaginatedResponse<Propiedad>>(url);
    },

    getPropiedadById: async (id: number): Promise<Propiedad | null> => {
      try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${id}`);
        return response ? toCamelCase(response) : null;
      } catch (error) {
        console.error('Error al obtener la propiedad:', error);
        return null;
      }
    },

    createPropiedad: async (data: Omit<Propiedad, 'idPropiedad'>): Promise<Propiedad | null> => {
      const transformedData = {
        id_proyecto_inmobiliario: Number(data.idProyectoInmobiliario),
        id_tipos_propiedad: Number(data.idTiposPropiedad),
        id_estado_propiedad: Number(data.idEstadoPropiedad),
        codigo_propiedad: data.codigoPropiedad,
        area_m2: Number(data.areaM2),
        numero_habitaciones: Number(data.numeroHabitaciones),
        numero_banos: Number(data.numeroBanos),
        direccion: data.direccion,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: Number(data.precio),
        piso: Number(data.piso),
        estacionamiento: data.estacionamiento
      };
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      return response ? toCamelCase(response) : null;
    },

    updatePropiedad: async (id: number, data: Partial<Propiedad>): Promise<Propiedad | null> => {
      // Transformar los datos al formato que espera la API
      const transformedData: any = {};
      
      // Solo incluir los campos que vienen en data
      if (data.idProyectoInmobiliario !== undefined) 
        transformedData.id_proyecto_inmobiliario = Number(data.idProyectoInmobiliario);
      if (data.idTiposPropiedad !== undefined) 
        transformedData.id_tipos_propiedad = Number(data.idTiposPropiedad);
      if (data.idEstadoPropiedad !== undefined) 
        transformedData.id_estado_propiedad = Number(data.idEstadoPropiedad);
      if (data.codigoPropiedad !== undefined) 
        transformedData.codigo_propiedad = data.codigoPropiedad;
      if (data.areaM2 !== undefined) 
        transformedData.area_m2 = Number(data.areaM2);
      if (data.numeroHabitaciones !== undefined) 
        transformedData.numero_habitaciones = Number(data.numeroHabitaciones);
      if (data.numeroBanos !== undefined) 
        transformedData.numero_banos = Number(data.numeroBanos);
      
      // Resto de campos opcionales
      if (data.direccion !== undefined) transformedData.direccion = data.direccion;
      if (data.nombre !== undefined) transformedData.nombre = data.nombre;
      if (data.descripcion !== undefined) transformedData.descripcion = data.descripcion;
      if (data.precio !== undefined) transformedData.precio = Number(data.precio);
      if (data.piso !== undefined) transformedData.piso = Number(data.piso);
      if (data.estacionamiento !== undefined) transformedData.estacionamiento = data.estacionamiento;
      
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData)
      });
      return response ? toCamelCase(response) : null;
    },

    deletePropiedad: async (id: number): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const errorMessage = 'No se puede eliminar la propiedad porque tiene características o imágenes asociadas. Por favor, elimine primero las características o imágenes asociadas.';
        // Si la respuesta es exitosa (código 2xx)
        if (response.ok) {
          return { success: true };
        }
        // Para otros errores, devolver el mensaje de error
        return { 
          success: false,
          message: errorMessage
        };
      } catch (error) {
        console.error('Error en deletePropiedad:', error);
        return { 
          success: false,
          message: 'Error al eliminar la propiedad'
        };
      }
    },

    // Características de la propiedad
    getCaracteristicasByPropiedadId: async (propiedadId: number): Promise<CaracteristicaPropiedad[]> => {
      try {
        // Usar el controlador de características de propiedad que ya tiene la lógica correcta
        return await InmobiliariaApi.caracteristicasPropiedadController.getByPropiedadId(propiedadId);
      } catch (error) {
        console.error('Error al obtener características de la propiedad:', error);
        return [];
      }
    },

    agregarCaracteristica: async (
      propiedadId: number, 
      data: { idCatalogoCaracteristicas: number; valor: string }
    ): Promise<CaracteristicaPropiedad | null> => {
      const requestData = {
        idPropiedad: propiedadId,
        idCatalogoCaracteristicas: data.idCatalogoCaracteristicas,
        valor: data.valor
      };
      
      return InmobiliariaApi.caracteristicasPropiedadController.create(toSnakeCase(requestData));
    },

    actualizarCaracteristica: async (propiedadId: number, idCatalogo: number, valor: string): Promise<CaracteristicaPropiedad | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${propiedadId}/caracteristicas/${idCatalogo}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ valor }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response ? toCamelCase(response) : null;
    },

    eliminarCaracteristica: async (
      propiedadId: number, 
      idCatalogo: number
    ): Promise<{ success: boolean; message?: string }> => {
      await fetch(
        `/api/proxy?service=inmobiliaria&path=propiedades/${propiedadId}/caracteristicas/${idCatalogo}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      const errorMessage = 'No se puede eliminar la característica porque tiene imágenes asociadas. Por favor, elimine primero las imágenes asociadas.';
      // Devolver el mensaje de error
      return { 
        success: false,
        message: errorMessage
      };
    },
  },
  // Controlador de Catálogo de Características
  catalogoCaracteristicaController: {
    getCatalogoCaracteristicaList: async (
      params: PaginatedRequest & { activo?: boolean } = { page: 1, perPage: 10 }
    ): Promise<PaginatedResponse<CatalogoCaracteristica> | null> => {
      const { page = 1, perPage = 10, search = '', activo } = params;
      let url = `catalogo-caracteristicas&page=${page}&limit=${perPage}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (activo !== undefined) url += `&activo=${activo}`;
      
      return apiRequest<PaginatedResponse<CatalogoCaracteristica>>(url);
    },

    getCatalogoCaracteristicaById: async (id: number): Promise<CatalogoCaracteristica | null> => {
      try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas/${id}`);
        return response ? toCamelCase(response) : null;
      } catch (error) {
        console.error('Error al obtener la característica del catálogo:', error);
        return null;
      }
    },

    createCatalogoCaracteristica: async (
      data: Omit<CatalogoCaracteristica, 'idCatalogoCaracteristicas' | 'creadoEn'>
    ): Promise<CatalogoCaracteristica | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response ? toCamelCase(response) : null;
    },

    updateCatalogoCaracteristica: async (
      id: number, 
      data: Partial<CatalogoCaracteristica>
    ): Promise<CatalogoCaracteristica | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response ? toCamelCase(response) : null;
    },

    deleteCatalogoCaracteristica: async (id: number): Promise<{ success: boolean }> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas/${id}`, { 
        method: 'DELETE' 
      });
      return { success: true };
    },

    toggleEstado: async (id: number, activo: boolean): Promise<CatalogoCaracteristica | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
      });
      return response ? toCamelCase(response) : null;
    },
  },

  // Controlador de Tipos de Propiedad
  tipoPropiedadController: {
    getTipoPropiedadList: async (params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<TipoPropiedad>> => {
      try {
        const { page = 1, perPage = 10, search = '' } = params;
        const queryParams = new URLSearchParams();
        
        // Always include pagination parameters
        queryParams.append('page', page.toString());
        queryParams.append('limit', perPage.toString());
        
        if (search) {
          queryParams.append('search', search);
        }
        
        const queryString = queryParams.toString();
        const url = `tipos-propiedad${queryString ? `?${queryString}` : ''}`;
        
        console.log('Fetching property types from URL:', url);
        const response = await apiRequest<{ data: any[], meta: any }>(url);
        console.log('Raw API Response:', JSON.stringify(response, null, 2));
        
        if (!response) {
          console.error('No se pudo obtener la lista de tipos de propiedad - Response is null');
          throw new Error('No se pudo obtener la lista de tipos de propiedad');
        }

        // Asegurarse de que response.data es un array
        const responseData = Array.isArray(response) ? response : (response.data || []);
        
        console.log('Response data to process:', responseData);

        // Mapear los datos de la API al formato esperado por el frontend
        const mappedData = responseData.map((item: any) => ({
          idTiposPropiedad: item.idTiposPropiedad,
          nombre: item.nombre,
          descripcion: item.descripcion,
          activo: true, // Asumimos que todos los tipos están activos si no se especifica lo contrario
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }));

        const result = {
          data: mappedData,
          meta: {
            total: response.meta?.total || mappedData.length || 0,
            page: response.meta?.page || page,
            pages: response.meta?.pages || 1,
            limit: response.meta?.limit || perPage
          }
        };
        
        console.log('Processed result:', JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error('Error en getTipoPropiedadList:', error);
        return {
          data: [],
          meta: {
            total: 0,
            page: params.page || 1,
            pages: 1,
            limit: params.perPage || 10
          }
        };
      }
    },

    getTipoPropiedadById: async (id: number): Promise<TipoPropiedad | null> => {
      try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}`);
        const data = await response.json();
        return data ? toCamelCase(data) : null;
      } catch (error) {
        console.error('Error al obtener el tipo de propiedad:', error);
        return null;
      }
    },

    createTipoPropiedad: async (data: Omit<TipoPropiedad, 'idTipoPropiedad'>): Promise<TipoPropiedad> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json();
      
      if (!response.ok || !responseData) {
        throw new Error('No se pudo crear el tipo de propiedad');
      }
      
      return toCamelCase(responseData);
    },

    updateTipoPropiedad: async (id: number, data: Partial<TipoPropiedad>): Promise<TipoPropiedad> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json();
      
      if (!response.ok || !responseData) {
        throw new Error('No se pudo actualizar el tipo de propiedad');
      }
      
      return toCamelCase(responseData);
    },

    checkTipoPropiedadInUse: async (id: number): Promise<{ inUse: boolean; count?: number }> => {
      try {
        // Usamos el controlador de propiedades existente con un filtro por tipo
        const propiedades = await InmobiliariaApi.propiedadController.getPropiedadList({
          page: 1,
          perPage: 1, // Solo necesitamos 1 para saber si existe al menos una
          search: `idTiposPropiedad:${id}` // Filtramos por el tipo de propiedad
        });
        
        // Si hay propiedades, obtenemos el total del meta
        if (propiedades?.meta) {
          return { 
            inUse: propiedades.meta.total > 0,
            count: propiedades.meta.total
          };
        }
        
        return { inUse: false, count: 0 };
      } catch (error) {
        console.error('Error al verificar si el tipo de propiedad está en uso:', error);
        // En caso de error, asumimos que está en uso por seguridad
        return { inUse: true, count: 1 };
      }
    },

    deleteTipoPropiedad: async (id: number): Promise<{ success: boolean; message?: string }> => {
      try {
        // Primero verificamos si está en uso
        const checkInUse = await InmobiliariaApi.tipoPropiedadController.checkTipoPropiedadInUse(id);
        
        if (checkInUse.inUse) {
          return { 
            success: false, 
            message: `No se puede eliminar el tipo de propiedad porque está siendo utilizado en ${checkInUse.count || 1} propiedad(es).` 
          };
        }
        
        // Si no está en uso, proceder con la eliminación
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}`, { 
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Si el error es de restricción de clave foránea
          if (response.status === 400 || response.status === 409 || 
              errorData.message?.includes('Foreign key constraint') || 
              errorData.message?.includes('restricción de clave foránea')) {
            // Hacer una última verificación de propiedades usando este tipo
            const allPropiedades = await InmobiliariaApi.propiedadController.getPropiedadList({ page: 1, perPage: 1000 });
            const count = allPropiedades?.data?.filter(p => p.idTiposPropiedad === id).length || 0;
            
            return { 
              success: false,
              message: `No se puede eliminar el tipo de propiedad porque está siendo utilizado en ${count} propiedad(es).`
            };
          }
          
          throw new Error(errorData.message || 'Error al eliminar el tipo de propiedad');
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error al eliminar el tipo de propiedad:', error);
        
        // Mensajes de error más específicos
        let errorMessage = 'Error al eliminar el tipo de propiedad';
        
        if (error instanceof Error) {
          if (error.message.includes('No se pudo completar la eliminación')) {
            errorMessage = error.message;
          } else if (error.message.includes('No se pudo verificar')) {
            errorMessage = 'No se pudo verificar si el tipo de propiedad está en uso. Por favor, intente nuevamente.';
          } else if (error.message.includes('No se puede eliminar')) {
            // Este es el mensaje de que está en uso, lo mantenemos
            errorMessage = error.message;
          }
        }
        
        return { 
          success: false, 
          message: errorMessage
        };
      }
    },
  },

  // Controlador de Estados de Propiedad
  estadoPropiedadController: {
    getEstadoPropiedadList: async (params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<EstadoPropiedad> | null> => {
      const { page = 1, perPage = 10, search = '' } = params;
      const url = `estado_propiedad&page=${page}&limit=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      return apiRequest<PaginatedResponse<EstadoPropiedad>>(url);
    },

    getEstadoPropiedadById: async (id: number): Promise<EstadoPropiedad | null> => {
      try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad/${id}`);
        return response ? toCamelCase(response) : null;
      } catch (error) {
        console.error('Error al obtener el estado de propiedad:', error);
        return null;
      }
    },

    createEstadoPropiedad: async (data: Omit<EstadoPropiedad, 'idEstadoPropiedad'>): Promise<EstadoPropiedad | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response ? toCamelCase(response) : null;
    },

    updateEstadoPropiedad: async (id: number, data: Partial<EstadoPropiedad>): Promise<EstadoPropiedad | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response ? toCamelCase(response) : null;
    },

    deleteEstadoPropiedad: async (id: number): Promise<{ success: boolean }> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad/${id}`, { method: 'DELETE' });
      return { success: true };
    }
  },
  ubicacionController: {
    // Departamentos
    getDepartamentoList: async (params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<Departamento> | null> => {
      const { page = 1, perPage = 10, search = '' } = params;
      let url = `departamentos?page=${page}&limit=${perPage}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return apiRequest<PaginatedResponse<Departamento>>(url, {}, { useConfigService: true });
    },

    getDepartamentoById: async (id: number): Promise<Departamento | null> => {
      const response = await fetch(`/api/proxy?service=config&path=departamentos/${id}`);
      return response ? toCamelCase(response) : null;
    },

    // Provincias
    getProvinciaList: async (departamentoId?: number, params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<Provincia> | null> => {
      const { page = 1, perPage = 10, search = '' } = params;
      let url = `provincias?page=${page}&limit=${perPage}`;
      if (departamentoId) url += `&departamentoId=${departamentoId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return apiRequest<PaginatedResponse<Provincia>>(url, {}, { useConfigService: true });
    },

    getProvinciaById: async (id: number): Promise<Provincia | null> => {
      const response =  fetch(`/api/proxy?service=config&path=provincias/${id}`);
      return response ? toCamelCase(response) : null;
    },

    // Distritos
    getDistritoList: async (provinciaId?: number, params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<Distrito> | null> => {
      const { page = 1, perPage = 10, search = '' } = params;
      let url = `distritos?page=${page}&limit=${perPage}`;
      if (provinciaId) url += `&provinciaId=${provinciaId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return apiRequest<PaginatedResponse<Distrito>>(url, {}, { useConfigService: true });
    },

    getDistritoById: async (id: number): Promise<Distrito | null> => {
      const response = await fetch(`/api/proxy?service=config&path=distritos/${id}`);
      return response ? toCamelCase(response) : null;
    },
  },

  // Controlador de Características de Propiedad
  caracteristicasPropiedadController: {
    // Obtener características por ID de propiedad
    getByPropiedadId: async (idPropiedad: number): Promise<CaracteristicaPropiedad[]> => {
      try {
        const response = await fetch(`api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/propiedad/${idPropiedad}`);
        if(!response.ok){
          if(response.status === 404){
            return [];
          }
          throw new Error(`Error al obtener características de la propiedad: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error al obtener características de la propiedad:', error);
        return [];
      }
    },

    // Crear una nueva característica de propiedad
    create: async (data: any): Promise<CaracteristicaPropiedad | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return response ? toCamelCase(response) : null;
    },

    // Actualizar una característica existente
    update: async (
      idCatalogo: number,
      idPropiedad: number,
      valor: string
    ): Promise<CaracteristicaPropiedad | null> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/catalogo/${idCatalogo}/propiedad/${idPropiedad}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ valor }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response ? toCamelCase(response) : null;
    },

    // Eliminar una característica
    delete: async (idCatalogo: number, idPropiedad: number): Promise<{ success: boolean }> => {
      const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/catalogo/${idCatalogo}/propiedad/${idPropiedad}`,
        {
          method: 'DELETE'
        }
      );
      return { success: true };
    }
  },

  // Controlador de Catálogo de Características
  catalogoCaracteristicasController: {
    // Obtener todas las características del catálogo
    getAll: async (params: PaginatedRequest = { page: 1, perPage: 1000 }): Promise<CatalogoCaracteristica[]> => {
      try {
        const { page = 1, perPage = 1000 } = params;
        const response = await apiRequest<PaginatedResponse<CatalogoCaracteristica>>(
          `catalogo-caracteristicas?page=${page}&limit=${perPage}`
        );
        return response?.data || [];
      } catch (error) {
        console.error('Error al obtener el catálogo de características:', error);
        return [];
      }
    },

    // Obtener una característica por ID
    getById: async (id: number): Promise<CatalogoCaracteristica | null> => {
      try {
        return await apiRequest<CatalogoCaracteristica>(`catalogo-caracteristicas/${id}`);
      } catch (error) {
        console.error(`Error al obtener la característica con ID ${id}:`, error);
        return null;
      }
    }
  },

  // Utilidad para obtener ubicaciones jerárquicas
  ubicacion: {
    getUbicacionCompleta: async (idDistrito: number) => {
      const distrito = await fetch(`/api/proxy?service=config&path=distritos/${idDistrito}?include=provincia.departamento`);
      const data = await distrito.json();
      return {
        distrito,
        provincia: data?.provincia,
        departamento: data?.provincia?.departamento
      };
    }
  }
};

export default InmobiliariaApi;

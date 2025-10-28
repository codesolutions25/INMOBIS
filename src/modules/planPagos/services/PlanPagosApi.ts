import {
    PaginatedResponse,
    PaginatedRequest,
    FeriadosGlobales,
    ConfigInteresMora,
} from "@/modules/planPagos/models/planPagosModels";
import { toCamelCase } from "@/utils/caseUtils";

const planPagosBaseUrl = '/api/proxy?service=planes&path=';
console.log('URL base de la API:', planPagosBaseUrl);

const buildUrl = (endpoint: string, useConfigService: boolean = false): string => {
    const base = useConfigService ? planPagosBaseUrl : planPagosBaseUrl;
    console.log('Construyendo URL con base:', base, 'y endpoint:', endpoint);
    
    // Si el endpoint ya es una URL completa, devolvemos el endpoint directamente
    if (endpoint.startsWith('http')) {
        return endpoint;
    }
    
    // Normalizar base URL - eliminar barra final si existe
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    
    // Normalizar endpoint - eliminar barra inicial si existe
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Construir URL final asegurando una sola barra entre base y endpoint
    const fullUrl = normalizedEndpoint ? 
        `${normalizedBase}${normalizedEndpoint}` : 
        normalizedBase;
    
    console.log('URL final construida:', fullUrl);
    return fullUrl;
};

async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const fullUrl = buildUrl(url);
    console.log('Realizando petición a:', fullUrl);
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            },
            credentials: 'include' as RequestCredentials,
            body: options.body ? options.body : undefined,
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Si la respuesta está vacía (como en DELETE), devolvemos null
        if (response.status === 204) {
            return null as unknown as T;
        }

        return response.json() as Promise<T>;
    } catch (error) {
        console.error(`API Request Error [${options.method || 'GET'} ${url}]:`, error);
        throw error;
    }
}

const PlanPagosApi = {
    feriadosGlobalesController: {
        getFeriadosGlobalesList: async (params: PaginatedRequest = { page: 1, perPage: 10 }): Promise<PaginatedResponse<FeriadosGlobales> | null> => {
            const { page = 1, perPage = 10, search = '' } = params;
            const url = `feriados-globales&page=${page}&limit=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
            return apiRequest<PaginatedResponse<FeriadosGlobales>>(url);
        },

        getFeriadosGlobalesById: async (id: number): Promise<FeriadosGlobales | null> => {
            try {
                const response = await fetch(`${planPagosBaseUrl}feriados-globales/${id}`);
                return response ? toCamelCase(response) : null;
            } catch (error) {
                console.error('Error al obtener el feriado global:', error);
                return null;
            }
        },

        createFeriadosGlobales: async (data: Omit<FeriadosGlobales, 'idFeriado'>): Promise<FeriadosGlobales | null> => {
            const transformedData = {
                fecha: data.fecha,
                descripcion: data.descripcion
            };
            const response = await fetch(`${planPagosBaseUrl}feriados-globales`, {
                method: 'POST',
                body: JSON.stringify(transformedData),
            });
            return response ? toCamelCase(response) : null;
        },

        updateFeriadosGlobales: async (id: number, data: Partial<FeriadosGlobales>): Promise<FeriadosGlobales | null> => {
            const transformedData = {
                fecha: data.fecha,
                descripcion: data.descripcion
            };
            const response = await fetch(`${planPagosBaseUrl}feriados-globales/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(transformedData),
            });
            return response ? toCamelCase(response) : null;
        },

        deleteFeriadosGlobales: async (id: number): Promise<any> => {
            const response  = await fetch(`${planPagosBaseUrl}feriados-globales/${id}`, { 
                method: 'DELETE'
            });
            return response ? toCamelCase(response) : null;
        },
    },

    configInteresMoraController: {
        getConfigInteresMoraList: async (params: PaginatedRequest = { page: 1, perPage: 10 }, empresaId?: number): Promise<PaginatedResponse<ConfigInteresMora>> => {
            const { page = 1, perPage = 10, search = '' } = params;
            let url = `config-interes-mora&page=${page}&limit=${perPage}`;
            
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }
            
            if (empresaId) {
                url += `&empresaId=${empresaId}`;
            }
            
            const response = await apiRequest<{
                data: ConfigInteresMora[];
                meta: {
                    total: number;
                    page: number;
                    limit: number;
                    pages: number;
                }
            }>(url);
            console.log(response.data);
            return {
                data: response.data,
                meta: {
                    total: response.meta.total,
                    currentPage: response.meta.page,
                    lastPage: response.meta.pages,
                    perPage: response.meta.limit
                }
            };
        },

        getConfigInteresMoraById: async (id: number): Promise<ConfigInteresMora | null> => {
            try {
                const response = await fetch(`${planPagosBaseUrl}config-interes-mora/${id}`);
                return response ? toCamelCase(response) : null;
            } catch (error) {
                console.error('Error al obtener la configuración de interés/mora:', error);
                return null;
            }
        },

        // Para la creación
        createConfigInteresMora: async (data: Omit<ConfigInteresMora, 'idConfigInteresMora'>): Promise<ConfigInteresMora | null> => {
            // Transformar los datos al formato que espera el backend
            const requestData = {
                id_empresa: data.idEmpresa,
                id_tipo_config_financiera: data.idTipoConfigFinanciera,
                monto_fijo: data.montoFijo,
                aplica_desde_dia: data.aplicaDesdeDia,
                aplica_hasta_dia: data.aplicaHastaDia
            };

            const response = await fetch(`${planPagosBaseUrl}config-interes-mora`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response ? toCamelCase(response) : null;
        },

        // Para la actualización
        updateConfigInteresMora: async (id: number, data: Partial<ConfigInteresMora>): Promise<ConfigInteresMora | null> => {
            // Transformar los datos al formato que espera el backend
            const requestData: any = {};
            
            if (data.idEmpresa !== undefined) requestData.id_empresa = data.idEmpresa;
            if (data.idTipoConfigFinanciera !== undefined) requestData.id_tipo_config_financiera = data.idTipoConfigFinanciera;
            if (data.montoFijo !== undefined) requestData.monto_fijo = data.montoFijo;
            if (data.aplicaDesdeDia !== undefined) requestData.aplica_desde_dia = data.aplicaDesdeDia;
            if (data.aplicaHastaDia !== undefined) requestData.aplica_hasta_dia = data.aplicaHastaDia;

            const response = await fetch(`${planPagosBaseUrl}config-interes-mora/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response ? toCamelCase(response) : null;
        },

        deleteConfigInteresMora: async (id: number): Promise<{ success: boolean }> => {
            await fetch(`${planPagosBaseUrl}config-interes-mora/${id}`, { 
                method: 'DELETE'
            });
            return { success: true };
        },

        getTiposConfiguracion: async (): Promise<Array<{ id: number; nombre: string }>> => {
            const response = await fetch(`${planPagosBaseUrl}tipo-config-financiera`);
            
            return response ? toCamelCase(response) : [];
        },
    },
    
};

export default PlanPagosApi;

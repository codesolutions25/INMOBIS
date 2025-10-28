import { EstadoCotizacion } from "@/types/estadoCotizacion"

const inmobiliariaBaseUrl = process.env.INMOBILIARIA_SERVICE_URL

const handleApiResponse = async (response: Response) => {
    const responseText = await response.text();
    
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error('La respuesta no es un JSON válido');
        throw new Error(`La respuesta del servidor no es un JSON válido: ${responseText}`);
    }
    
    if (!response.ok) {
        let errorMessage = 'Error desconocido';
        if (data?.message) {
            errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else if (data?.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    return data;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        currentPage: number;
        lastPage: number;
        perPage: number;
    };
}

export async function getEstadoCotizacionesSimple(): Promise<EstadoCotizacion[]> {
    const response = await fetch(`${inmobiliariaBaseUrl}/estado-cotizacion`)
    const json = await response.json()
    return await json.data
}

export async function getEstadoCotizaciones(
    page: number = 1, // Se mantiene por compatibilidad, pero se ignora
    perPage: number = 1000, // Usar un límite alto para eficiencia
    search?: string
): Promise<PaginatedResponse<EstadoCotizacion>> {
    try {
        const firstPageUrl = `${inmobiliariaBaseUrl}/estado-cotizacion?page=${page}&limit=${perPage}` + (search ? `&search=${encodeURIComponent(search)}` : '');
        const firstPageResponse = await fetch(firstPageUrl, { credentials: 'include' });

        if (!firstPageResponse.ok) {
            throw new Error(`Error al obtener estados de cotización: ${firstPageResponse.status}`);
        }

        const firstPageData = await firstPageResponse.json();
        let allEstados: EstadoCotizacion[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
                const pageUrl = `${inmobiliariaBaseUrl}/estado-cotizacion?page=${pageNum}&limit=${perPage}` + (search ? `&search=${encodeURIComponent(search)}` : '');
                pagePromises.push(fetch(pageUrl, { credentials: 'include' }));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allEstados.push(...pageData.data);
                    }
                } else {
                    console.warn(`Error al obtener una página de estados de cotización: ${response.statusText}`);
                }
            }
        }

        return {
            data: allEstados,
            meta: {
                total: allEstados.length,
                currentPage: 1,
                lastPage: totalPages,
                perPage: allEstados.length
            }
        };
    } catch (error) {
        console.error('Error en getEstadoCotizaciones:', error);
        return {
            data: [],
            meta: {
                total: 0,
                currentPage: 1,
                lastPage: 1,
                perPage: perPage
            }
        };
    }
}

export async function createEstadoCotizacion(estadoCotizacionData: Partial<EstadoCotizacion>): Promise<void>{
    if(!inmobiliariaBaseUrl){
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    const transformedData = {
        nombre: estadoCotizacionData.nombre,
        descripcion: estadoCotizacionData.descripcion,
        activo: estadoCotizacionData.activo,
    };

    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/estado-cotizacion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        })

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function updateEstadoCotizacion(id: number, estadoCotizacionData: Partial<EstadoCotizacion>): Promise<void>{
    if(!inmobiliariaBaseUrl){
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    const transformedData = {
        nombre: estadoCotizacionData.nombre,
        descripcion: estadoCotizacionData.descripcion,
        activo: estadoCotizacionData.activo,
    };

    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/estado-cotizacion/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        })

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function getEstadoCotizacion(id: number): Promise<EstadoCotizacion>{
    if(!inmobiliariaBaseUrl){
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/estado-cotizacion/${id}`, {
            credentials: 'include',
        })

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al obtener estado de cotizacion:', error);
        throw error;
    }
}

export async function deleteEstadoCotizacion(id: number): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/estado-cotizacion/${id}`, {
            method: "DELETE",
            credentials: 'include',
        })

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}


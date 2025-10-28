import { ClienteInmobiliario } from "@/types/clienteInmobiliario"

const inmobiliariaBaseUrl = process.env.INMOBILIARIA_SERVICE_URL

const handleApiResponse = async (response: Response) => {
    const responseText = await response.text();
    console.log('Respuesta del servidor:', responseText);
    
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

export async function getClientesInmobiliariosSimple(
    page: number = 1,
    perPage: number = 10000,
    searchQuery: string = ''
): Promise<ClienteInmobiliario[]> {
    try {
        const url = new URL(`${inmobiliariaBaseUrl}/clientes-inmobiliarios`);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('perPage', perPage.toString());
        
        // Agregar parámetros de búsqueda si existen
        if (searchQuery) {
            const params = new URLSearchParams(searchQuery);
            params.forEach((value, key) => {
                url.searchParams.append(key, value);
            });
        }
        
        const response = await fetch(url.toString());
        const data = await handleApiResponse(response);
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error('Error al obtener clientes inmobiliarios:', error);
        throw error;
    }
}

export async function getClientesInmobiliarios(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<ClienteInmobiliario>> {
    let url = `${inmobiliariaBaseUrl}/clientes-inmobiliarios?page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener clientes inmobiliarios: ${response.status}`);
        }

        const json = await response.json();

        if(!json.data){
            return {
                data: [],
                meta: {
                    total: 0,
                    currentPage: page,
                    lastPage: 1,
                    perPage: perPage
                }
            };
        }

        const meta = {
            total: json.meta.total || 0,
            currentPage: json.meta.page || page,
            lastPage: json.meta.pages || 1,
            perPage: json.meta.limit || perPage
        };

        return {
            data: json.data,
            meta: meta
        };
    } catch (error) {
        return {
            data: [],
            meta: {
                total: 0,
                currentPage: page,
                lastPage: 1,
                perPage: perPage
            }
        };
    }
}

export async function createClienteInmobiliario(clienteInmobiliarioData: Partial<ClienteInmobiliario>): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    const transformedData = {
        id_persona: Number(clienteInmobiliarioData.idPersona),
        id_empresa: Number(clienteInmobiliarioData.idEmpresa),
        observaciones: clienteInmobiliarioData.observaciones,
        fecha_creacion: clienteInmobiliarioData.fechaCreacion,
    };
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/clientes-inmobiliarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function updateClienteInmobiliario(id: number, clienteInmobiliarioData: Partial<ClienteInmobiliario>): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    const transformedData = {
        id_persona: Number(clienteInmobiliarioData.idPersona),
        id_empresa: Number(clienteInmobiliarioData.idEmpresa),
        observaciones: clienteInmobiliarioData.observaciones,
        fecha_creacion: clienteInmobiliarioData.fechaCreacion,
    };
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/clientes-inmobiliarios/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function getClienteInmobiliario(id: number): Promise<ClienteInmobiliario>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/clientes-inmobiliarios/${id}`, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al obtener cliente inmobiliario:', error);
        throw error;
    }
}

export async function deleteClienteInmobiliario(id: number): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}/clientes-inmobiliarios/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al eliminar cliente inmobiliario:', error);
        throw error;
    }
}

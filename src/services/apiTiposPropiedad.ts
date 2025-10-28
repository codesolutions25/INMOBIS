import { TipoPropiedad } from "@/types/tiposPropiedad"



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

export async function getTiposPropiedadSimple(): Promise<TipoPropiedad[]> {
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad`)
    const json = await response.json()
    return await json.data
}

export async function getTiposPropiedad(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<TipoPropiedad>> {
    let url = `/api/proxy?service=inmobiliaria&path=tipos-propiedad&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener tipos de propiedad: ${response.status}`);
        }

        const json = await response.json();

        if (!json.data) {
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

export async function createTipoPropiedad(tipoPropiedadData: Partial<TipoPropiedad>): Promise<void>{
    const transformedData = {
        nombre: tipoPropiedadData.nombre,
        descripcion: tipoPropiedadData.descripcion,
    };
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad`, {
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

export async function updateTipoPropiedad(id: number, tipoPropiedadData: Partial<TipoPropiedad>): Promise<void>{
    const transformedData = {
        nombre: tipoPropiedadData.nombre,
        descripcion: tipoPropiedadData.descripcion,
    };
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}`, {
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

export async function getTipoPropiedad(id: number): Promise<TipoPropiedad>{
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}`, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al obtener tipo de propiedad:', error);
        throw error;
    }
}

export async function checkTipoPropiedadInUse(id: number): Promise<{ inUse: boolean; count?: number }> {
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}/check-in-use`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error en checkTipoPropiedadInUse:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            
            // Si el error es 404, asumimos que el tipo de propiedad no está en uso
            if (response.status === 404) {
                return { inUse: false, count: 0 };
            }
            
            throw new Error(errorData.message || 'Error al verificar el tipo de propiedad');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en checkTipoPropiedadInUse:', error);
        // En caso de error en la conexión, asumimos que el tipo está en uso para evitar eliminaciones no deseadas
        return { inUse: true, count: 1 };
    }
}

export async function deleteTipoPropiedad(id: number): Promise<void> {
    const inUse = await checkTipoPropiedadInUse(id);
    if (inUse.inUse) {
        throw new Error('El tipo de propiedad está en uso y no se puede eliminar');
    }

    const response = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el tipo de propiedad');
    }
}

import { TipoOperacion } from "@/types/tiposoperacion"



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

export async function getTiposOperacion(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<TipoOperacion>> {
    let url = `/api/proxy?service=caja&path=tipos-de-operacion&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener tipos de operación: ${response.status}`);
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


        return {
            data: json.data,
            meta: {
                total: json.meta?.total || 0,
                currentPage: json.meta?.page || page,
                lastPage: json.meta?.pages || 1,
                perPage: json.meta?.limit || perPage
            }
        };
    } catch (error) {
        console.error('Error al obtener tipos de operación:', error);
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

export async function createTipoOperacion(tipoOperacionData: Omit<TipoOperacion, 'id_tipo_operacion' | 'created_at'>): Promise<TipoOperacion> {
    
    
    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-operacion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tipoOperacionData),
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al crear tipo de operación:', error);
        throw error;
    }
}

export async function updateTipoOperacion(id: number, tipoOperacionData: Partial<Omit<TipoOperacion, 'id_tipo_operacion' | 'created_at'>>): Promise<TipoOperacion> {
    
    
    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-operacion/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tipoOperacionData),
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al actualizar tipo de operación:', error);
        throw error;
    }
}

export async function getTipoOperacion(id: number): Promise<TipoOperacion> {
    
    
    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-operacion/${id}`, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al obtener tipo de operación:', error);
        throw error;
    }
}

export async function deleteTipoOperacion(id: number): Promise<void> {
    
    
    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-operacion/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al eliminar tipo de operación:', error);
        throw error;
    }
}
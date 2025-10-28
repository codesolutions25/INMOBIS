import { TipoCaja } from "@/types/tiposcaja";
import { PaginatedResponse } from "./apiPropiedades";



export interface TiposCajaMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface TiposCajaResponse {
    data: TipoCaja[];
    meta: TiposCajaMeta;
}

export async function getTiposCaja(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<TipoCaja>> {
   

    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-caja&page=${page}&limit=${perPage}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error al obtener tipos de caja: ${response.status} ${response.statusText}`
            );
        }

        const responseData = await response.json() as TiposCajaResponse;

        return {
            data: responseData.data || [],
            meta: {
                total: responseData.meta?.total || 0,
                page: responseData.meta?.page || page,
                pages: responseData.meta?.pages || 1,
                limit: responseData.meta?.limit || perPage
            }
        };
    } catch (error) {
        console.error('Error en getTiposCaja:', error);
        return {
            data: [],
            meta: {
                total: 0,
                page: page,
                pages: 1,
                limit: perPage
            }
        };
    }
}

export async function createTipoCaja(tipoCajaData: Partial<TipoCaja>): Promise<TipoCaja> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-caja`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tipoCajaData),
            credentials: 'include',
        });

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
            if (data && typeof data === 'object') {
                console.log('Claves en data:', Object.keys(data));
            }
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
    } catch (error) {
        console.error('Error al crear tipo de caja:', error);
        throw error;
    }
}

export async function updateTipoCaja(id: number, tipoCajaData: Partial<TipoCaja>): Promise<TipoCaja> {
    try {
        // Remove id_tipo_caja from payload if it exists
        const payload = { ...tipoCajaData };
        delete payload.id_tipo_caja;

        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-caja/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

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
    } catch (error) {
        console.error('Error al actualizar tipo de caja:', error);
        throw error;
    }
}

export async function deleteTipoCaja(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=tipos-de-caja/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
        });

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

        return;
    } catch (error) {
        console.error('Error al eliminar tipo de caja:', error);
        throw error;
    }
}
import { Caja } from "@/types/cajas";
import { PaginatedResponse } from "./apiPropiedades";



export interface CajaMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface CajasResponse {
    data: Caja[];
    meta: CajaMeta;
}

export async function getCajas(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<Caja>> {
    
    try {
        const response = await fetch(`/api/proxy?service=caja&path=cajas&page=${page}&limit=${perPage}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                `Error al obtener cajas: ${response.status} ${response.statusText}`
            );
        }

        const responseData = await response.json();
       
        // Ensure we have the expected meta structure
        const meta = {
            total: responseData.meta?.total || 0,
            page: responseData.meta?.page || page,
            pages: responseData.meta?.pages || 1,
            limit: responseData.meta?.limit || perPage
        };

        return {
            data: responseData.data || [],
            meta: meta
        };
    } catch (error) {
        console.error('Error en getCajas:', error);
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

export async function createCaja(cajaData: Partial<Caja>): Promise<Caja> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=cajas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cajaData),
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
        console.error('Error al crear caja:', error);
        throw error;
    }
}

export async function updateCaja(id: number, cajaData: Partial<Caja>): Promise<Caja> {
    try {
        // Remove id_caja from payload if it exists
        const payload = { ...cajaData };
        delete payload.id_caja;

        const response = await fetch(`/api/proxy?service=caja&path=cajas/${id}`, {
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
        console.error('Error al actualizar caja:', error);
        throw error;
    }
}

export async function deleteCaja(id: number): Promise<void> {
    try {
        console.log('URL:', `/api/proxy?service=caja&path=cajas/${id}`);

        const response = await fetch(`/api/proxy?service=caja&path=cajas/${id}`, {
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
        console.error('Error al eliminar caja:', error);
        throw error;
    }
}
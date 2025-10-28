import { EstadoCaja } from "@/types/estadoscaja";
import { PaginatedResponse } from "./apiPropiedades";



export async function getEstadosCaja(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<EstadoCaja>> {
    let url = `/api/proxy?service=caja&path=estados-de-caja&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener estados de caja: ${response.status}`);
        }

        const json = await response.json();

        if (!json.data) {
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

        const meta = {
            total: json.meta.total || 0,
            page: json.meta.page || page,
            pages: json.meta.pages || 1,
            limit: json.meta.limit || perPage
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
                page: page,
                pages: 1,
                limit: perPage
            }
        };
    }
}

export async function createEstadoCaja(estadoCajaData: Partial<EstadoCaja>): Promise<EstadoCaja> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=estados-de-caja`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(estadoCajaData),
            credentials: 'include',
        });

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
        console.error('Error al crear estado de caja:', error);
        throw error;
    }
}

export async function updateEstadoCaja(id: number, estadoCajaData: Partial<EstadoCaja>): Promise<EstadoCaja> {
    try {
        // Remove id_estado_caja from payload if it exists
        const payload = { ...estadoCajaData };
        delete payload.id_estado_caja;

        const response = await fetch(`/api/proxy?service=caja&path=estados-de-caja/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

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
    } catch (error) {
        console.error('Error al actualizar estado de caja:', error);
        throw error;
    }
}

export async function deleteEstadoCaja(id: number): Promise<void> {
    try {
        console.log('URL:', `/api/proxy?service=caja&path=estados-de-caja/${id}`);

        const response = await fetch(`/api/proxy?service=caja&path=estados-de-caja/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
        });

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

        return;
    } catch (error) {
        console.error('Error al eliminar estado de caja:', error);
        throw error;
    }
}
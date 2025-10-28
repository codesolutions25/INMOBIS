import { Modulo } from "@/types/modulos"
import { PaginatedResponse } from "./apiPropiedades";



export async function getModulos(
    page: number = 1,
    perPage: number = 20,
    search?: string
): Promise<PaginatedResponse<Modulo>> {
    let url = `/api/proxy?service=config&path=modulos&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener módulos: ${response.status}`);
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
        console.error('Error al obtener módulos:', error);
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

export async function createModulo(moduloData: Partial<Modulo>): Promise<Modulo> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=modulos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(moduloData),
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
        console.error('Error al crear módulo:', error);
        throw error;
    }
}

export async function updateModulo(id: number, moduloData: Partial<Modulo>): Promise<Modulo> {
    try {
        // Remove idModulo from payload if it exists
        const payload = { ...moduloData };
        delete payload.modulos_id;
        
        const response = await fetch(`/api/proxy?service=config&path=modulos/${id}`, {
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
        console.error('Error al actualizar módulo:', error);
        throw error;
    }
}

export async function deleteModulo(id: number): Promise<void> {
    try {
        console.log('URL:', `/api/proxy?service=config&path=modulos/${id}`);
        
        const response = await fetch(`/api/proxy?service=config&path=modulos/${id}`, {
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
            data = responseText ? JSON.parse(responseText) : {};
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
        console.error('Error al eliminar módulo:', error);
        throw error;
    }
}
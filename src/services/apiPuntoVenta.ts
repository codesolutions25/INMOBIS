import { PuntoVenta } from "@/types/puntoventa"
import { PaginatedResponse } from "./apiPropiedades";



export async function getPuntosVenta(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<PuntoVenta>> {
    let url = `/api/proxy?service=caja&path=puntos-de-venta&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener puntos de venta: ${response.status}`);
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

export async function createPuntoVenta(puntoVentaData: Partial<PuntoVenta>): Promise<PuntoVenta> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=puntos-de-venta`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(puntoVentaData),
            credentials: 'include',
        });

        const responseText = await response.text();   
        let data;
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error('La respuesta no es un JSON válido');
            throw new Error(`La respuesta del servidor no es un JSON válido: ${responseText}`);
        }
        
        if (!response.ok) {
            let errorMessage = 'Error desconocido';
            
            // Verificar si es un error de duplicado (generalmente 409 Conflict o 400 con un mensaje específico)
            if (response.status === 409 || 
                (response.status === 400 && 
                 (data.message?.toLowerCase().includes('ya existe') || 
                  data.error?.toLowerCase().includes('ya existe')))) {
                // Crear un error personalizado sin stack trace
                const error = new Error('Ya existe un punto de venta con ese nombre. Por favor, elija un nombre diferente.');
                error.name = 'DuplicatePointOfSaleError';
                // Eliminar el stack trace completamente
                delete error.stack;
                // Lanzar un objeto simple en lugar de un Error
                throw { message: error.message, __isHandledError: true };
            }
            
            // Manejo de otros errores
            if (data && typeof data === 'object') {
                
                // Intentar obtener mensaje de error de validación
                if (data.errors && Array.isArray(data.errors)) {
                    errorMessage = data.errors.map((err: any) => 
                        `${err.path}: ${err.msg || 'Error de validación'}`
                    ).join('. ');
                } else if (data.message) {
                    errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
                } else if (data.error) {
                    errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                } else {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
            } else {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error: any) {
        console.error('Error al crear punto de venta:', error);
        
        // Si el error ya tiene un mensaje claro, lo propagamos tal cual
        if (error.message && error.message.includes('Ya existe')) {
            throw error;
        }
        
        // Para otros errores, proporcionamos un mensaje genérico
        if (error instanceof Error) {
            throw new Error(`No se pudo crear el punto de venta: ${error.message}`);
        } else {
            throw new Error('Ocurrió un error inesperado al crear el punto de venta');
        }
    }
}

export async function updatePuntoVenta(id: number, puntoVentaData: Partial<PuntoVenta>): Promise<PuntoVenta> {
    try {
        // Remove id_punto_venta from payload if it exists
        const payload = { ...puntoVentaData };
        delete payload.id_punto_venta;
        
        const response = await fetch(`/api/proxy?service=caja&path=puntos-de-venta/${id}`, {
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
        console.error('Error al actualizar punto de venta:', error);
        throw error;
    }
}

export async function deletePuntoVenta(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=puntos-de-venta/${id}`, {
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
        console.error('Error al eliminar punto de venta:', error);
        throw error;
    }
}
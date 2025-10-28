import { Opcion } from "@/types/opciones"
import { PaginatedResponse } from "./apiPropiedades";



/**
 * Obtiene una lista paginada de opciones
 * @param page Número de página (por defecto 1)
 * @param perPage Cantidad de elementos por página (por defecto 10)
 * @param search Término de búsqueda opcional
 * @returns Promise con la respuesta paginada de opciones
 */
export async function getOpciones(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<Opcion>> {
    const url = new URL(`/api/proxy?service=config&path=opciones`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', perPage.toString());
    
    if (search) {
        url.searchParams.append('search', search);
    }

    try {
        const response = await fetch(url.toString(), {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Error al obtener opciones: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getOpciones:', error);
        throw error;
    }
}

/**
 * Obtiene una opción por su ID
 * @param id ID de la opción a obtener
 * @returns Promise con los datos de la opción
 */
export async function getOpcionById(id: number): Promise<Opcion> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=opciones/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Error al obtener la opción: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error(`Error al obtener la opción con ID ${id}:`, error);
        throw error;
    }
}

/**
 * Crea una nueva opción
 * @param opcionData Datos de la opción a crear
 * @returns Promise con la opción creada
 */
export async function createOpcion(opcionData: Partial<Opcion>): Promise<Opcion> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=opciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(opcionData),
            credentials: 'include',
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || `Error al crear la opción: ${response.status}`
            );
        }

        return data;
    } catch (error) {
        console.error('Error al crear la opción:', error);
        throw error;
    }
}

/**
 * Actualiza una opción existente
 * @param id ID de la opción a actualizar
 * @param opcionData Datos a actualizar
 * @returns Promise con la opción actualizada
 */
export async function updateOpcion(
    id: number,
    opcionData: Partial<Opcion>
): Promise<Opcion> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=opciones/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(opcionData),
            credentials: 'include',
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || `Error al actualizar la opción: ${response.status}`
            );
        }

        return data;
    } catch (error) {
        console.error(`Error al actualizar la opción con ID ${id}:`, error);
        throw error;
    }
}

/**
 * Elimina una opción
 * @param id ID de la opción a eliminar
 * @returns Promise que se resuelve cuando la operación es exitosa
 */
export async function deleteOpcion(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=opciones/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Error al eliminar la opción: ${response.status}`
            );
        }
    } catch (error) {
        console.error(`Error al eliminar la opción con ID ${id}:`, error);
        throw error;
    }
}
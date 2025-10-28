import { Rol } from "@/types/roles";
import { PaginatedResponse } from "./apiPropiedades";


/**
 * Obtiene una lista paginada de roles
 * @param page Número de página (por defecto 1)
 * @param perPage Cantidad de elementos por página (por defecto 10)
 * @param search Término de búsqueda opcional
 */
export async function getRoles(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<Rol>> {
    try {
        let url = `/api/proxy?service=auth&path=roles&page=${page}&limit=${perPage}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error al obtener roles: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        
        // Normalize the role data to match the Rol type
        if (data.data && Array.isArray(data.data)) {
            data.data = data.data.map((role: any) => ({
                id_rol: role.idRol,
                nombre: role.nombre,
                descripcion: role.descripcion,
                es_global: role.esGlobal,
                created_at: role.createdAt,
                updated_at: role.updatedAt
            }));
        }
        
        return data;
    } catch (error) {
        console.error('Error en getRoles:', error);
        throw error;
    }
}

/**
 * Obtiene un rol por su ID
 * @param id ID del rol a obtener
 */
export async function getRolById(id: number): Promise<Rol> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=roles/${id}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error al obtener el rol: ${response.status} ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getRolById:', error);
        throw error;
    }
}

/**
 * Crea un nuevo rol
 * @param rolData Datos del rol a crear
 */
export async function createRol(rolData: Partial<Rol>): Promise<Rol> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=roles`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(rolData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error al crear el rol: ${response.status} ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error en createRol:', error);
        throw error;
    }
}

/**
 * Actualiza un rol existente
 * @param id ID del rol a actualizar
 * @param rolData Datos actualizados del rol
 */
export async function updateRol(id: number, rolData: Partial<Rol>): Promise<Rol> {
    try {
        // Only include the fields that the API expects
        const { id_rol, ...updateData } = rolData;
        
        // Prepare the request data with the correct property names
        const requestData = {
            nombre: updateData.nombre,
            descripcion: updateData.descripcion,
            es_global: updateData.es_global
        };

        console.log('Sending update request with data:', requestData);
        
        const response = await fetch(`/api/proxy?service=auth&path=roles/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error al actualizar el rol: ${response.status} ${response.statusText}`
            );
        }

        const updatedRole = await response.json();
        
        // Return the updated role
        return updatedRole;
    } catch (error) {
        console.error('Error en updateRol:', error);
        throw error;
    }
}

/**
 * Elimina un rol
 * @param id ID del rol a eliminar
 */
export async function deleteRol(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=roles/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error al eliminar el rol: ${response.status} ${response.statusText}`
            );
        }
    } catch (error) {
        console.error('Error en deleteRol:', error);
        throw error;
    }
}
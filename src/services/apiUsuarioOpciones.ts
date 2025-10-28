import { PaginatedResponse } from "./apiPropiedades";
import { UsuarioOpcion } from "@/types/usuarioOpciones";


/**
 * Obtiene las opciones de un usuario
 * @param idUsuario ID del usuario (opcional)
 * @param idEmpresaModuloOpcion ID de la opción de módulo de empresa (opcional)
 * @param page Número de página (por defecto: 1)
 * @param perPage Cantidad de elementos por página (por defecto: 10)
 * @param search Término de búsqueda (opcional)
 */
export async function getUsuarioOpciones(
    idUsuario?: number,
    idEmpresaModuloOpcion?: number,
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<UsuarioOpcion>> {
    // Si tenemos ambos IDs, usamos la ruta específica
  

   
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuario-opciones&page=${page}&limit=${perPage}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });
  

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Error al obtener opciones de usuario: ${response.status}`
            );
        }

        const data = await response.json();
    
        // Si se proporcionó idUsuario, filtramos los resultados
        if (idUsuario) {
            const filteredData = {
                ...data,
                data: data.data.filter((item: any) => 
                    item.idDetalleUsuario === idUsuario || item.id_detalle_usuario === idUsuario
                )
            };
            
            // Actualizamos la paginación para reflejar los resultados filtrados
            return {
                ...filteredData,
                meta: {
                    ...filteredData.meta,
                    total: filteredData.data.length,
                    currentPage: page,
                    lastPage: Math.ceil(filteredData.data.length / perPage) || 1,
                    perPage: perPage
                }
            };
        }
        
        return data;
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

/**
 * Obtiene una usuario-opción específica por su clave compuesta
 */
export async function getUsuarioOpcion(
    idUsuario: number | string,
    idEmpresaModuloOpcion: number | string
): Promise<UsuarioOpcion | null> {  
    try {
        // Ensure both IDs are numbers
        const userId = Number(idUsuario);
        const opcionId = Number(idEmpresaModuloOpcion);
        
        // Validate numeric values
        if (isNaN(userId) || isNaN(opcionId)) {
            throw new Error('Los IDs deben ser valores numéricos válidos');
        }

        const response = await fetch(
            `/api/proxy?service=auth&path=usuario-opciones/${userId}/${opcionId}`,
            {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;  
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Error al obtener la opción de usuario: ${response.status}`
            );
        }

        const data = await response.json();
        
        // La API devuelve los datos directamente, no en un objeto 'data'
        if (data) {
            return {
                idDetalleUsuario: data.idDetalleUsuario,
                idEmpresaModuloOpcion: data.idEmpresaModuloOpcion,
                puedeVer: data.puedeVer,
                puedeCrear: data.puedeCrear,
                puedeEditar: data.puedeEditar,
                puedeEliminar: data.puedeEliminar,
                asignadoPor: data.asignadoPor,
                asignadoEn: data.asignadoEn
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error al obtener la opción de usuario:', error);
        throw error;
    }
}

/**
 * Crea una nueva usuario-opción
 */
export async function createUsuarioOpcion(opcionData: Omit<UsuarioOpcion, 'asignadoEn'>): Promise<UsuarioOpcion> {
    try {
        // Asegurarse de que los valores booleanos sean booleanos
        const requestData = {
            id_detalle_usuario: Number(opcionData.idDetalleUsuario),
            id_empresa_modulo_opcion: Number(opcionData.idEmpresaModuloOpcion),
            puede_ver: Boolean(opcionData.puedeVer),
            puede_crear: Boolean(opcionData.puedeCrear),
            puede_editar: Boolean(opcionData.puedeEditar),
            puede_eliminar: Boolean(opcionData.puedeEliminar),
            asignado_por: Number(opcionData.asignadoPor)
        };

      
        const response = await fetch(`/api/proxy?service=auth&path=usuario-opciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error en la respuesta:', errorData);
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Error al crear opción de usuario: ${response.status}`
            );
        }

        const responseData = await response.json();
        
        // Transformar la respuesta de snake_case a camelCase
        return {
            idDetalleUsuario: responseData.id_detalle_usuario,
            idEmpresaModuloOpcion: responseData.id_empresa_modulo_opcion,
            puedeVer: Boolean(responseData.puede_ver),
            puedeCrear: Boolean(responseData.puede_crear),
            puedeEditar: Boolean(responseData.puede_editar),
            puedeEliminar: Boolean(responseData.puede_eliminar),
            asignadoPor: responseData.asignado_por,
            asignadoEn: responseData.asignado_en
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Actualiza una usuario-opción existente
 */
export async function updateUsuarioOpcion(
    idDetalleUsuario: number | string,
    idEmpresaModuloOpcion: number | string,
    opcionData: Partial<Omit<UsuarioOpcion, 'idDetalleUsuario' | 'idEmpresaModuloOpcion' | 'asignadoEn'>>
): Promise<UsuarioOpcion> {
    try {
        // Convertir los IDs a números para asegurar que sean válidos
        const numericDetalleId = Number(idDetalleUsuario);
        const numericOpcionId = Number(idEmpresaModuloOpcion);

        if (isNaN(numericDetalleId) || isNaN(numericOpcionId)) {
            throw new Error('Los IDs proporcionados no son válidos');
        }

        // Mapear los campos de camelCase a snake_case para la petición
        const requestData: Record<string, any> = {};
        
        if (opcionData.puedeVer !== undefined) requestData.puede_ver = opcionData.puedeVer;
        if (opcionData.puedeCrear !== undefined) requestData.puede_crear = opcionData.puedeCrear;
        if (opcionData.puedeEditar !== undefined) requestData.puede_editar = opcionData.puedeEditar;
        if (opcionData.puedeEliminar !== undefined) requestData.puede_eliminar = opcionData.puedeEliminar;
        if (opcionData.asignadoPor !== undefined) requestData.asignado_por = opcionData.asignadoPor;

        const response = await fetch(
            `/api/proxy?service=auth&path=usuario-opciones/${numericDetalleId}/${numericOpcionId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Error al actualizar la opción de usuario: ${response.status}`
            );
        }

        const data = await response.json();
        
        // Transformar de snake_case a camelCase para el frontend
        if (data.data) {
            return {
                idDetalleUsuario: data.data.id_detalle_usuario,
                idEmpresaModuloOpcion: data.data.id_empresa_modulo_opcion,
                puedeVer: data.data.puede_ver,
                puedeCrear: data.data.puede_crear,
                puedeEditar: data.data.puede_editar,
                puedeEliminar: data.data.puede_eliminar,
                asignadoPor: data.data.asignado_por,
                asignadoEn: data.data.asignado_en
            };
        }

        throw new Error('Respuesta del servidor no válida');
    } catch (error) {
        console.error('Error al actualizar la opción de usuario:', error);
        throw error;
    }
}

/**
 * Elimina una usuario-opción
 */
export async function deleteUsuarioOpcion(
    idUsuario: number,
    idEmpresaModuloOpcion: number
): Promise<void> {
    try {
        const response = await fetch(
            `/api/proxy?service=auth&path=usuario-opciones/${idUsuario}/${idEmpresaModuloOpcion}`,
            {
                method: 'DELETE',
                credentials: 'include',
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Error al eliminar opción de usuario: ${response.status}`
            );
        }
    } catch (error) {
        console.error('Error al eliminar opción de usuario:', error);
        throw error;
    }
}
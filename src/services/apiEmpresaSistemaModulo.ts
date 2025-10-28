import { EmpresaSistemaModulo } from "@/types/empresaSistemaModulo";
import { PaginatedResponse } from "./apiPropiedades";


/**
 * Obtiene una lista paginada de empresa-sistema-modulo
 * @param page Número de página (por defecto: 1)
 * @param perPage Cantidad de elementos por página (por defecto: 10)
 * @param search Término de búsqueda (opcional)
 */
export async function getEmpresaSistemaModulos(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<EmpresaSistemaModulo>> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-sistema-modulo&page=${page}&limit=${perPage}`, {
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
                `Error al obtener relaciones empresa-sistema-módulo: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener relaciones empresa-sistema-módulo:', error);
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
 * Obtiene una relación empresa-sistema-módulo por su ID
 * @param id ID de la relación empresa-sistema-módulo
 */
export async function getEmpresaSistemaModuloById(id: number): Promise<EmpresaSistemaModulo> {
    try {
        const response = await fetch(
            `/api/proxy?service=config&path=empresa-sistema-modulo/${id}`,
            {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                errorData.error || 
                `Error al obtener la relación empresa-sistema-módulo: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener relación empresa-sistema-módulo:', error);
        throw error;
    }
}

/**
 * Crea una nueva relación empresa-sistema-módulo
 * @param data Datos de la relación a crear
 */
export async function createEmpresaSistemaModulo(data: Omit<EmpresaSistemaModulo, 'id'>): Promise<EmpresaSistemaModulo> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-sistema-modulo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                errorData.error || 
                `Error al crear la relación empresa-sistema-módulo: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error al crear relación empresa-sistema-módulo:', error);
        throw error;
    }
}

/**
 * Actualiza una relación empresa-sistema-módulo existente
 * @param id ID de la relación a actualizar
 * @param data Datos a actualizar
 */
export async function updateEmpresaSistemaModulo(
    id: number, 
    data: Partial<EmpresaSistemaModulo>
): Promise<EmpresaSistemaModulo> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-sistema-modulo/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                errorData.error || 
                `Error al actualizar la relación empresa-sistema-módulo: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error al actualizar relación empresa-sistema-módulo:', error);
        throw error;
    }
}

/**
 * Elimina una relación empresa-sistema-módulo
 * @param id ID de la relación a eliminar
 */
export async function deleteEmpresaSistemaModulo(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-sistema-modulo/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                errorData.error || 
                `Error al eliminar la relación empresa-sistema-módulo: ${response.status}`
            );
        }
    } catch (error) {
        console.error('Error al eliminar relación empresa-sistema-módulo:', error);
        throw error;
    }
}
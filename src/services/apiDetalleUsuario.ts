import { PaginatedResponse } from "./apiPropiedades";
import { DetalleUsuario } from "@/types/detalleUsuario";

export async function getDetallesUsuario(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<DetalleUsuario>> {
    try {
        let url = `/api/proxy?service=auth&path=detalle-usuario&page=${page}&limit=${perPage}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener los detalles de usuario: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getDetallesUsuario:', error);
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

export async function getDetalleUsuarioById(id: number): Promise<DetalleUsuario | null> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=detalle-usuario/${id}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener el detalle de usuario: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getDetalleUsuarioById:', error);
        throw error;
    }
}

export async function createDetalleUsuario(detalleData: Omit<DetalleUsuario, 'id' | 'created_at' | 'updated_at'>): Promise<DetalleUsuario> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=detalle-usuario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(detalleData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al crear el detalle de usuario');
        }

        return data;
    } catch (error) {
        console.error('Error en createDetalleUsuario:', error);
        throw error;
    }
}

export async function updateDetalleUsuario(id: number, detalleData: Partial<DetalleUsuario>): Promise<DetalleUsuario> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=detalle-usuario/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(detalleData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar el detalle de usuario');
        }

        return data;
    } catch (error) {
        console.error('Error en updateDetalleUsuario:', error);
        throw error;
    }
}

export async function deleteDetalleUsuario(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=detalle-usuario/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al eliminar el detalle de usuario: ${response.status}`);
        }
    } catch (error) {
        console.error('Error en deleteDetalleUsuario:', error);
        throw error;
    }
}

// Client-side filtering functions
export async function getDetallesByUsuarioId(usuarioId: number): Promise<DetalleUsuario[]> {
    try {
        // First get all detalles
        const response = await getDetallesUsuario(1, 1000);
        
        // Then filter client-side
        return response.data.filter((detalle: any) => 
            detalle.idUsuario === usuarioId
        );
    } catch (error) {
        console.error('Error en getDetallesByUsuarioId:', error);
        return [];
    }
}

export async function getDetallesByUsuarioEmpresaId(usuarioEmpresaId: number): Promise<DetalleUsuario[]> {
    try {
        // First get all detalles
        const response = await getDetallesUsuario(1, 1000);
      
        // Then filter client-side
        return response.data.filter((detalle: any) => 
            detalle.idUsuarioEmpresa === usuarioEmpresaId
        );
    } catch (error) {
        console.error('Error en getDetallesByUsuarioEmpresaId:', error);
        return [];
    }
}
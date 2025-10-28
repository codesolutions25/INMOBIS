import { PaginatedResponse } from "./apiPropiedades";


import { UsuarioEmpresa } from "@/types/usuarioEmpresa";

interface UsuarioEmpresaResponse {
    data: UsuarioEmpresa[];
    meta: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
}

export async function getUsuariosEmpresa(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<UsuarioEmpresa>> {
    let url = `/api/proxy?service=auth&path=usuario-empresa&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });
       
        if (!response.ok) {
            throw new Error(`Error al obtener usuarios de empresa: ${response.status}`);
        }

        const responseData = await response.json();
        return {
            data: responseData.data,
            meta: {
                total: responseData.meta?.total || 0,
                page: responseData.meta?.page || 1,
                pages: responseData.meta?.pages || 1,
                limit: responseData.meta?.limit || perPage
            }
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

export async function getUsuarioEmpresaById(id: number): Promise<UsuarioEmpresa> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuario-empresa/${id}`, {
            credentials: 'include',
        });


        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener el usuario de empresa: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function getUsuarioEmpresaByUserId(userId: number): Promise<UsuarioEmpresa | null> {
    try {

        const response = await fetch(`/api/proxy?service=auth&path=usuario-empresa/${userId}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener el usuario de empresa: ${response.status}`);
        }

        const data = await response.json();

        // Verificar que el ID de persona sea válido
        if (data.id_persona && data.id_persona > 0) {
            return data;
        } else if (data.idPersona && data.idPersona > 0) {
            data.id_persona = data.idPersona;
            return data;
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
}

export async function createUsuarioEmpresa(usuarioData: Omit<UsuarioEmpresa, 'id' | 'created_At' | 'updated_at'>): Promise<UsuarioEmpresa> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuario-empresa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(usuarioData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al crear el usuario de empresa');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export async function updateUsuarioEmpresa(id: number, usuarioData: Partial<UsuarioEmpresa>): Promise<UsuarioEmpresa> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuario-empresa/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
            body: JSON.stringify(usuarioData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar el usuario de empresa');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export async function deleteUsuarioEmpresa(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuario-empresa/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al eliminar el usuario de empresa: ${response.status}`);
        }
    } catch (error) {
        throw error;
    }
}
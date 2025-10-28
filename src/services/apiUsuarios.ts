import { Usuario } from "@/types/usuario";
import { PaginatedResponse } from "./apiPropiedades";
import { Persona } from "@/types/persona";
import { LoginCredentials } from "@/types/LoginCredentials";
import { LoginResponse } from "@/types/LoginResponse";


export async function getUsuarios(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<Usuario>> {
    try {
        let url = `/api/proxy?service=auth&path=usuarios&page=${page}&limit=${perPage}`;
        
        // Add search parameter if provided
        if (search && search.trim() !== '') {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        const response = await fetch(url, {
            credentials: 'include',
        });
       
        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.status}`);
        }

        const data = await response.json();

        return {
            data: data.data || [],
            meta: {
                total: data.meta?.total || 0,
                page: data.meta?.page || page,
                pages: data.meta?.pages || 1,
                limit: data.meta?.limit || perPage
            }
        };
    } catch (error) {
        console.error('Error en getUsuarios:', error);
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

export async function getUsuarioById(id: number): Promise<Usuario | null> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuarios/${id}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            // Si el error es 404 (no encontrado), retornar null
            if (response.status === 404) {
                return null;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener el usuario: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getUsuarioById:', error);
        throw error;
    }
}

export async function createUsuario(usuarioData: Partial<Usuario>): Promise<Usuario> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuarioData),
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al crear el usuario');
        }

        return data;
    } catch (error) {
        console.error('Error en createUsuario:', error);
        throw error;
    }
}

export async function updateUsuario(id: number, usuarioData: Partial<Usuario>): Promise<Usuario> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuarios/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(usuarioData),
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar el usuario');
        }

        return data;
    } catch (error) {
        console.error('Error en updateUsuario:', error);
        throw error;
    }
}

export async function deleteUsuario(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=usuarios/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al eliminar el usuario: ${response.status}`);
        }
    } catch (error) {
        console.error('Error en deleteUsuario:', error);
        throw error;
    }
}

export async function getUsuariosEmpresaByPersonaId(
    idPersona: number,
    includeInactive: boolean = false
): Promise<Usuario[]> {
    try {
        // Use the correct endpoint for company users
        const response = await fetch(`/api/proxy?service=auth&path=usuario-empresa&page=1&limit=1000`, {
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener usuarios: ${response.status}`);
        }

        const responseData = await response.json();
        const usuariosEmpresa = responseData.data || [];
        
        
        // Filter by persona ID and active status
        const filtered = usuariosEmpresa.filter((usuario: any) => {
            const matches = usuario.idPersona === idPersona && 
                          (includeInactive || usuario.estaActivo);
                 return matches;
        });
        
        return filtered;

    } catch (error) {
        console.error('Error en getUsuariosEmpresaByPersonaId:', error);
        throw error;
    }
}

export async function getUsuariosSistemaByPersonaId(
    idPersona: number,
    includeInactive: boolean = false
): Promise<Usuario[]> {
    try {
        // Fetch all system users
        const response = await fetch(`/api/proxy?service=auth&path=usuarios&page=1&limit=1000`, {
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener usuarios del sistema: ${response.status}`);
        }

        const responseData = await response.json();
        const usuariosSistema = responseData.data || [];
        
        
        // Filter by persona ID and active status
        const filtered = usuariosSistema.filter((usuario: Usuario) => {
            const matches = usuario.idPersona === idPersona && 
                          (includeInactive || usuario.estaActivo);
           
            return matches;
        });
        
        return filtered;

    } catch (error) {
        console.error('Error en getUsuariosSistemaByPersonaId:', error);
        throw error;
    }
}


export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`/api/proxy?service=auth&path=auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en el inicio de sesión');
      }
  
      const data = await response.json();
  
      // Store both token and user data
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
  
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
}
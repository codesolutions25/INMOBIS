import { CajaUsuario } from "@/types/cajausuario";
import { PaginatedResponse } from "./apiPropiedades";


export async function getCajasUsuario(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<CajaUsuario>> {
    let url = `/api/proxy?service=caja&path=caja-usuario&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener asignaciones de caja: ${response.status}`);
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
            currentPage: json.meta.page || page,
            lastPage: json.meta.pages || 1,
            perPage: json.meta.limit || perPage
        };

        return {
            data: json.data,
            meta: meta
        };
    } catch (error) {
        console.error('Error en getCajasUsuario:', error);
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

export async function createCajaUsuario(cajaUsuarioData: Partial<CajaUsuario>): Promise<CajaUsuario> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=caja-usuario`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cajaUsuarioData),
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
        console.error('Error al crear asignación de caja:', error);
        throw error;
    }
}

export async function updateCajaUsuario(id: number, cajaUsuarioData: Partial<CajaUsuario>): Promise<CajaUsuario> {
    try {
        const payload = { ...cajaUsuarioData };
        delete payload.id_asignacion;
        
        const response = await fetch(`/api/proxy?service=caja&path=caja-usuario/${id}`, {
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
        console.error('Error al actualizar asignación de caja:', error);
        throw error;
    }
}

export async function deleteCajaUsuario(id: number): Promise<void> {
    try {
        console.log('URL:', `/api/proxy?service=caja&path=caja-usuario/${id}`);
        
        const response = await fetch(`/api/proxy?service=caja&path=caja-usuario/${id}`, {
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
        console.error('Error al eliminar asignación de caja:', error);
        throw error;
    }
}

export async function getCajaUsuarioById(id: number): Promise<CajaUsuario> {
    try {
        const response = await fetch(`/api/proxy?service=caja&path=caja-usuario/${id}`, {
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
        console.error('Error al obtener asignación de caja por ID:', error);
        throw error;
    }
}
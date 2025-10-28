import { EmpresaModuloOpcion } from "@/types/empresaModuloOpcion";
import { PaginatedResponse } from "./apiPropiedades";


/**
 * Obtiene las opciones de módulo de empresa con paginación
 * @param page Número de página (por defecto: 1)
 * @param perPage Cantidad de elementos por página (por defecto: 10)
 * @param idEmpresaSistemaModulo Filtrar por ID de empresa sistema módulo (opcional)
 */
export async function getEmpresaModuloOpciones(
    page: number = 1,
    perPage: number = 1000,
    idEmpresaSistemaModulo?: number
): Promise<PaginatedResponse<EmpresaModuloOpcion>> {
  
    
   

    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-modulo-opcion&page=${page}&limit=${perPage}`, {
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
                `Error al obtener opciones de módulo de empresa: ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener opciones de módulo de empresa:', error);
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

export async function createEmpresaModuloOpcion(empresaModuloOpcionData: Partial<EmpresaModuloOpcion>): Promise<EmpresaModuloOpcion> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-modulo-opcion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(empresaModuloOpcionData),
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
        console.error('Error al crear opción de módulo de empresa:', error);
        throw error;
    }
}

export async function updateEmpresaModuloOpcion(
    id: number, 
    empresaModuloOpcionData: Partial<EmpresaModuloOpcion>
): Promise<EmpresaModuloOpcion> {
    try {
        // Remove idEmpresaModuloOpcion from payload if it exists
        const payload = { ...empresaModuloOpcionData };
        delete payload.idEmpresaModuloOpcion;
        
        const response = await fetch(`/api/proxy?service=config&path=empresa-modulo-opcion/${id}`, {
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
        console.error('Error al actualizar opción de módulo de empresa:', error);
        throw error;
    }
}

export async function deleteEmpresaModuloOpcion(id: number): Promise<void> {
    try {
        
        
        const response = await fetch(`/api/proxy?service=config&path=empresa-modulo-opcion/${id}`, {
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
        console.error('Error al eliminar opción de módulo de empresa:', error);
        throw error;
    }
}
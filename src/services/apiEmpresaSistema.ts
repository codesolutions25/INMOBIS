import { EmpresaSistema } from "@/types/empresaSistema";
import { PaginatedResponse } from "./apiPropiedades";


export async function getEmpresaSistemas(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    idEmpresa?: number,
    idSistema?: number
): Promise<PaginatedResponse<EmpresaSistema>> {
    let url = `/api/proxy?service=config&path=empresa-sistema&page=${page}&limit=${perPage}`;
    
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    if (idEmpresa) {
        url += `&idEmpresa=${idEmpresa}`;
    }
    if (idSistema) {
        url += `&idSistema=${idSistema}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener relaciones empresa-sistema: ${response.status}`);
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
        console.error('Error al obtener relaciones empresa-sistema:', error);
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

export async function createEmpresaSistema(empresaSistemaData: Omit<EmpresaSistema, 'esActivo'> & { esActivo?: boolean }): Promise<EmpresaSistema> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-sistema`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(empresaSistemaData),
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
        console.error('Error al crear relación empresa-sistema:', error);
        throw error;
    }
}

export async function updateEmpresaSistema(
    idEmpresa: number, 
    idSistema: number, 
    empresaSistemaData: Partial<Omit<EmpresaSistema, 'idEmpresa' | 'idSistema'>>
): Promise<EmpresaSistema> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresa-sistema/empresa/${idEmpresa}/sistema/${idSistema}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(empresaSistemaData),
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
        console.error('Error al actualizar relación empresa-sistema:', error);
        throw error;
    }
}

export async function deleteEmpresaSistema(idEmpresa: number, idSistema: number): Promise<void> {
    try {
        const url = `/api/proxy?service=config&path=empresa-sistema/empresa/${idEmpresa}/sistema/${idSistema}`;
        
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
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
        console.error('Error al eliminar relación empresa-sistema:', error);
        throw error;
    }
}
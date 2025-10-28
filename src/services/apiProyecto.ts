import { Proyecto } from "@/types/proyectos"
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";


const handleApiResponse = async (response: Response) => {
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
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        currentPage: number;
        lastPage: number;
        perPage: number;
    };
}

export async function getProyectosSimple(): Promise<Proyecto[]> {
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios`)
    const json = await response.json()
    return await json.data
}

export async function getProyectos(
    page: number = 1,
    perPage: number = 1000,
    search?: string,
    idEmpresa?: number | string
): Promise<PaginatedResponse<Proyecto>> {
    try {
         // Usar InmobiliariaApi para realizar la petición
        const response = await InmobiliariaApi.proyectoController.getProyectoList({
            page,
            perPage,
            search,
            ...(idEmpresa && { idEmpresa: Number(idEmpresa) })
        });

        if (!response) {
            throw new Error('No se pudo obtener la lista de proyectos');
        }

       
        // Mapear la respuesta del servidor a la estructura esperada
        const data = Array.isArray(response.data) ? response.data : [];
        const meta = response.meta || {};
        
        // Asegurarse de que la respuesta cumpla con la interfaz PaginatedResponse
        const paginatedResponse: PaginatedResponse<Proyecto> = {
            data: data,
            meta: {
                total: meta.total || data.length || 0,
                currentPage: meta.page || page,
                lastPage: meta.pages || Math.ceil((meta.total || data.length || 0) / (meta.limit || perPage)) || 1,
                perPage: meta.limit || perPage
            }
        };
        
        return paginatedResponse;
    } catch (error) {
        console.error('Error en getProyectos:', error);
        throw error;
    }
}

export async function createProyecto(proyectoData: Partial<Proyecto>): Promise<void>{
    

    const transformedData = {
        id_empresa: Number(proyectoData.idEmpresa),
        nombre: proyectoData.nombre,
        ubicacion: proyectoData.ubicacion,
        descripcion: proyectoData.descripcion,
        fecha_inicio: proyectoData.fechaInicio,
        fecha_fin: proyectoData.fechaFin,
        id_estado_propiedad: proyectoData.idEstadoPropiedad,
        telefono_contacto: proyectoData.telefonoContacto,
        email_contacto: proyectoData.emailContacto,
        id_distrito: proyectoData.idDistrito,
    };
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function updateProyecto(id: number, proyectoData: Partial<Proyecto>): Promise<void>{

    const transformedData = {
        id_empresa: Number(proyectoData.idEmpresa),
        nombre: proyectoData.nombre,
        ubicacion: proyectoData.ubicacion,
        descripcion: proyectoData.descripcion,
        fecha_inicio: proyectoData.fechaInicio,
        fecha_fin: proyectoData.fechaFin,
        id_estado_propiedad: proyectoData.idEstadoPropiedad,
        telefono_contacto: proyectoData.telefonoContacto,
        email_contacto: proyectoData.emailContacto,
        id_distrito: proyectoData.idDistrito,
    };
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function getProyecto(id: number): Promise<Proyecto>{
    
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/${id}`, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        
        // Verificamos la estructura de la respuesta
        let proyectoData;
        if (data && data.data) {
            proyectoData = data.data;
        } else {
            proyectoData = data;
        }
        
        // Aseguramos que siempre devolvemos un objeto con la estructura esperada
        if (!proyectoData || typeof proyectoData !== 'object') {
            console.warn('La respuesta no tiene la estructura esperada:', data);
            // Devolvemos un objeto con valores por defecto
            return {
                idProyectoInmobiliario: Number(id),
                nombre: `Proyecto #${id}`,
                idEmpresa: 1,
                ubicacion: '',
                descripcion: '',
                fechaInicio: new Date().toISOString(),
                fechaFin: new Date().toISOString(),
                idEstadoPropiedad: 1,
                telefonoContacto: '',
                emailContacto: '',
                idDistrito: 1
            };
        }
        
        // Si no tiene idProyectoInmobiliario pero tiene id, lo asignamos
        if (!proyectoData.idProyectoInmobiliario && proyectoData.id) {
            proyectoData.idProyectoInmobiliario = proyectoData.id;
        }
        
        // Si no tiene nombre, asignamos uno por defecto
        if (!proyectoData.nombre) {
            proyectoData.nombre = `Proyecto #${id}`;
        }
        
        return proyectoData as Proyecto;
    } catch (error) {
        console.error('Error al obtener proyecto:', error);
        // En caso de error, devolvemos un objeto con valores por defecto
        return {
            idProyectoInmobiliario: Number(id),
            nombre: `Proyecto #${id}`,
            idEmpresa: 1,
            ubicacion: '',
            descripcion: '',
            fechaInicio: new Date().toISOString(),
            fechaFin: new Date().toISOString(),
            idEstadoPropiedad: 1,
            telefonoContacto: '',
            emailContacto: '',
            idDistrito: 1
        };
    }
}

export async function deleteProyecto(id: number): Promise<void>{
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        throw error;
    }
}


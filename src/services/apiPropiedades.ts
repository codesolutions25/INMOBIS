import { Propiedad } from "@/types/propiedades"


// Función auxiliar para manejar errores de respuesta
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
        // Extraer mensaje de error de diferentes formatos posibles
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
        page: number;
        pages: number;
        limit: number;
    };
}

export async function getPropiedadesSimple(): Promise<Propiedad[]> {
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades`)
    const json = await response.json()
    return await json.data
}

export async function getPropiedades(
    page: number = 1, 
    perPage: number = 10, 
    search?: string
): Promise<PaginatedResponse<Propiedad>> {
    // Construir la URL con parámetros de paginación y búsqueda
    let url = `/api/proxy?service=inmobiliaria&path=propiedades&page=${page}&limit=${perPage}`;
    
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    try {
        const response = await fetch(url, {
            credentials: 'include',
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener propiedades: ${response.status}`);
        }
        
        const json = await response.json();
        
        // Verificar si la respuesta tiene el formato esperado
        if (!json.data) {
            console.error('Formato de respuesta inesperado:', json);
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
        
        // Adaptar el formato de meta de la API al formato que espera nuestra aplicación
        // La API devuelve: { total, page, limit, pages }
        // Nuestra app espera: { total, currentPage, lastPage, perPage }
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
        console.error('Error al obtener propiedades:', error);
        // Devolver una respuesta vacía en caso de error
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

export async function createPropiedad(propiedadData: any): Promise<void>{
    
    
    // Transformar los datos al formato que espera la API
    const transformedData = {
        // Usar los nombres de campos exactos que espera la API
        id_proyecto_inmobiliario: Number(propiedadData.idProyectoInmobiliario),
        id_tipos_propiedad: Number(propiedadData.idTiposPropiedad),
        id_estado_propiedad: Number(propiedadData.idEstadoPropiedad),
        codigo_propiedad: propiedadData.codigoPropiedad,
        area_m2: Number(propiedadData.areaM2),
        numero_habitaciones: Number(propiedadData.numeroHabitaciones),
        numero_banos: Number(propiedadData.numeroBanos),
        
        // Resto de campos que no necesitan transformación
        direccion: propiedadData.direccion,
        nombre: propiedadData.nombre,
        descripcion: propiedadData.descripcion,
        precio: Number(propiedadData.precio),
        piso: Number(propiedadData.piso),
        estacionamiento: propiedadData.estacionamiento
    };
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades`, {
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

export async function updatePropiedad(id: number, propiedadData: any): Promise<void>{
    
    
    // Transformar los datos al formato que espera la API
    const transformedData = {
        // Usar los nombres de campos exactos que espera la API
        id_proyecto_inmobiliario: Number(propiedadData.idProyectoInmobiliario),
        id_tipos_propiedad: Number(propiedadData.idTiposPropiedad),
        id_estado_propiedad: Number(propiedadData.idEstadoPropiedad),
        codigo_propiedad: propiedadData.codigoPropiedad,
        area_m2: Number(propiedadData.areaM2),
        numero_habitaciones: Number(propiedadData.numeroHabitaciones),
        numero_banos: Number(propiedadData.numeroBanos),
        
        // Resto de campos que no necesitan transformación
        direccion: propiedadData.direccion,
        nombre: propiedadData.nombre,
        descripcion: propiedadData.descripcion,
        precio: Number(propiedadData.precio),
        piso: Number(propiedadData.piso),
        estacionamiento: propiedadData.estacionamiento
    };
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${id}`, {
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

export async function getPropiedad(id: number): Promise<Propiedad>{
    
    
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Error en la respuesta de la API (${response.status}):`, errorData);
            throw new Error(`Error al obtener propiedad: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Verificar si la propiedad existe en la respuesta
        if (!data) {
            throw new Error('La propiedad no fue encontrada');
        }
        
        return data;
    } catch (error) {
        console.error('Error al obtener propiedad:', error);
        throw error;
    }
}

export async function deletePropiedad(id: number): Promise<any> {
    

    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=propiedades/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('Foreign key constraint')) {
                return { error: 'ForeignKeyConstraint' };
            }
            // Para otros errores, podemos seguir usando handleApiResponse o lanzar un error
            return handleApiResponse(response);
        }

        // Si la respuesta es ok, puede que no haya cuerpo o que sea un mensaje de éxito
        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : {};

    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        throw error;
    }
}

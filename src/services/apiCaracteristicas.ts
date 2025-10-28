import { CaracteristicaPropiedad, CatalogoCaracteristica } from "@/types/caracteristicas";

// Usar la URL correcta para la API


// Función auxiliar para manejar respuestas de la API
const handleApiResponse = async (response: Response) => {
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
        // Si el error es por una foreign key, no lanzamos una excepción para que no salte el overlay de Next.js.
        // En su lugar, devolvemos un objeto que la lógica del componente puede interpretar.
        if (errorMessage.toLowerCase().includes('foreign key')) {
            console.warn('Error de Foreign Key manejado:', errorMessage);
            return { error: 'ForeignKeyConstraint', message: errorMessage };
        }

        throw new Error(errorMessage);
    }
    
    return data;
}

// Configuración para las llamadas a la API

// Funciones para el catálogo de características

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        currentPage: number;
        lastPage: number;
        perPage: number;
    };
}

// Funciones para el catálogo de características con paginación
export async function getCatalogoCaracteristicas(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    activo?: boolean
): Promise<PaginatedResponse<CatalogoCaracteristica>> {
    let url = `/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    if (activo !== undefined) {
        url += `&activo=${activo}`;
    }
    
    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener catálogo de características: ${response.status}`);
        }

        const json = await response.json();

        if (!json.data) {
            return {
                data: [],
                meta: {
                    total: 0,
                    currentPage: page,
                    lastPage: 1,
                    perPage: perPage
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
        return {
            data: [],
            meta: {
                total: 0,
                currentPage: page,
                lastPage: 1,
                perPage: perPage
            }
        };
    }
}

export async function createCatalogoCaracteristica(caracteristicaData: Omit<CatalogoCaracteristica, 'idCatalogoCaracteristicas' | 'creadoEn'>): Promise<CatalogoCaracteristica> {
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(caracteristicaData),
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al crear característica:', error);
        throw error;
    }
}

export async function deleteCatalogoCaracteristica(idCatalogoCaracteristicas: number): Promise<any> {
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas/${idCatalogoCaracteristicas}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
        });
        
        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al eliminar característica:', error);
        throw error;
    }
}

export async function updateCatalogoCaracteristica(
    idCatalogoCaracteristicas: number,
    caracteristicaData: Partial<CatalogoCaracteristica>
): Promise<CatalogoCaracteristica> {
   
    
    try {
        console.log(`Actualizando característica ID ${idCatalogoCaracteristicas}:`, caracteristicaData);
        
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=catalogo-caracteristicas/${idCatalogoCaracteristicas}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(caracteristicaData),
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error(`Error al actualizar característica ID ${idCatalogoCaracteristicas}:`, error);
        throw error;
    }
}

export async function toggleCaracteristicaActiva(
    idCatalogoCaracteristicas: number,
    activo: boolean
): Promise<CatalogoCaracteristica> {
    return updateCatalogoCaracteristica(idCatalogoCaracteristicas, { activo });
}

// Funciones para las características de propiedad
export async function getCaracteristicasPropiedad(
    idPropiedad: number,
    limit: number = 1000 // Usar un límite alto para asegurar que se obtengan todas las características
): Promise<CaracteristicaPropiedad[]> {
  
    try {
        console.log(`Obteniendo características para propiedad ID: ${idPropiedad}`);
        // URL correcta según el backend, agregando parámetros para obtener todas las características
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/propiedad/${idPropiedad}&page=1&limit=${limit}`, {
            credentials: 'include',
        });
        
        // Si la respuesta es 404, significa que no hay características para esta propiedad
        // Esto es un caso válido, no un error
        if (response.status === 404) {
            console.log(`No se encontraron características para la propiedad con ID ${idPropiedad}`);
            return [];
        }
        
        const responseData = await handleApiResponse(response);
        console.log('Características obtenidas:', responseData);
        
        let caracteristicas: CaracteristicaPropiedad[] = [];
        if (Array.isArray(responseData)) {
            caracteristicas = responseData;
        } else if (responseData && typeof responseData === 'object') {
            if (Array.isArray(responseData.data)) {
                caracteristicas = responseData.data;
            }
        }
        
        // Verificar si hay más páginas y obtenerlas si es necesario
        if (responseData && responseData.meta && responseData.meta.lastPage > 1) {
            console.log(`Se detectaron ${responseData.meta.lastPage} páginas de características, obteniendo todas...`);
            
            // Ya tenemos la primera página, obtener el resto
            const promises = [];
            for (let page = 2; page <= responseData.meta.lastPage; page++) {
                promises.push(
                    fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/propiedad/${idPropiedad}&page=${page}&limit=${limit}`, {
                        credentials: 'include',
                    })
                    .then(resp => handleApiResponse(resp))
                    .then(data => {
                        if (data && data.data && Array.isArray(data.data)) {
                            return data.data;
                        }
                        return [];
                    })
                );
            }
            
            const additionalPages = await Promise.all(promises);
            additionalPages.forEach(pageData => {
                caracteristicas = [...caracteristicas, ...pageData];
            });
            
            console.log(`Total de características obtenidas después de combinar páginas: ${caracteristicas.length}`);
        }
        
        return caracteristicas;
    } catch (error) {
        console.error('Error al obtener características de propiedad:', error);
        return [];
    }
}

export async function createCaracteristicaPropiedad(caracteristicaData: Omit<CaracteristicaPropiedad, 'createdAt' | 'updatedAt'>): Promise<CaracteristicaPropiedad> {
    try {
        const payload = {
            id_catalogo_caracteristicas: Number(caracteristicaData.idCatalogoCaracteristicas),
            id_propiedad: Number(caracteristicaData.idPropiedad),
            valor: caracteristicaData.valor || ''
        };
        
        console.log('Creando característica de propiedad:', payload);
        
        // URL correcta según el backend
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: 'include',
        });
        
        const responseData = await handleApiResponse(response);
        console.log('Respuesta de creación:', responseData);
        
        let createdData: CaracteristicaPropiedad;
        if (responseData.data) {
            createdData = responseData.data;
        } else {
            createdData = responseData;
        }
        
        return createdData;
    } catch (error) {
        console.error('Error al crear característica de propiedad:', error);
        throw error;
    }
}

// PATCH /api/caracteristicas_propiedad/catalogo/{idCatalogo}/propiedad/{idPropiedad}
export async function updateCaracteristicaPropiedad(
    idCatalogoCaracteristicas: number,
    idPropiedad: number,
    data: { valor: string }
): Promise<CaracteristicaPropiedad> {
    try {
        console.log(`Actualizando característica ${idCatalogoCaracteristicas} de propiedad ${idPropiedad}:`, data);
        
        // URL correcta según la documentación de la API
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/catalogo/${idCatalogoCaracteristicas}/propiedad/${idPropiedad}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        
        const responseData = await handleApiResponse(response);
        console.log('Respuesta de actualización:', responseData);
        
        let updatedData: CaracteristicaPropiedad;
        if (responseData.data) {
            updatedData = responseData.data;
        } else {
            updatedData = responseData;
        }
        
        return updatedData;
    } catch (error) {
        console.error('Error al actualizar característica de propiedad:', error);
        throw error;
    }
}

export async function deleteCaracteristicaPropiedad(
    idCatalogoCaracteristicas: number,
    idPropiedad: number
): Promise<void> {
    try {
        console.log(`Eliminando característica ${idCatalogoCaracteristicas} de propiedad ${idPropiedad}`);
        
        // URL correcta según la documentación de la API
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad/catalogo/${idCatalogoCaracteristicas}/propiedad/${idPropiedad}`, {
            method: "DELETE",
            credentials: 'include',
        });
        
        await handleApiResponse(response);
        console.log('Característica eliminada correctamente');
    } catch (error) {
        console.error('Error al eliminar característica de propiedad:', error);
        throw error;
    }
}

// Nueva función para obtener todas las características de propiedad asignadas
export async function getAllCaracteristicasPropiedad(): Promise<CaracteristicaPropiedad[]> {
    try {
        let allItems: CaracteristicaPropiedad[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            // Endpoint para obtener todas las características asignadas, paginado
            const url = `/api/proxy?service=inmobiliaria&path=caracteristicas_propiedad&page=${page}&limit=100`;
            const response = await fetch(url, { credentials: 'include' });
            const data = await handleApiResponse(response);

            const items = data.data || [];
            allItems = [...allItems, ...items];

            const meta = data.meta;
            if (meta && meta.currentPage < meta.lastPage) {
                page++;
            } else {
                hasMore = false;
            }
        }
        return allItems;
    } catch (error) {
        console.error('Error al obtener todas las características de propiedad:', error);
        // Devolver un array vacío en caso de error para no bloquear la UI
        return [];
    }
}

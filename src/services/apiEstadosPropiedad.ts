import { EstadoPropiedad } from "@/types/estadosPropiedad"



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

export async function getEstadosPropiedadSimple(): Promise<EstadoPropiedad[]> {
    try {
        const firstPageResponse = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad&page=1&limit=100`);
        if (!firstPageResponse.ok) {
            throw new Error('Error al obtener la primera página de estados de propiedad');
        }
        const firstPageData = await firstPageResponse.json();

        const allEstados: EstadoPropiedad[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad&page=${page}&limit=100`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allEstados.push(...pageData.data);
                    }
                } else {
                    console.warn(`Error al obtener una página de estados de propiedad: ${response.statusText}`);
                }
            }
        }

        return allEstados;
    } catch (error) {
        console.error('Error al obtener los estados de propiedad:', error);
        return [];
    }
}

export async function getEstadoDisponible(): Promise<EstadoPropiedad | null> {
    try {
        // Accedemos directamente a la variable de entorno usando window
        const estadoDisponibleUrl = process.env.ESTADO_DISPONIBLE_URL;
        console.log('URL estado disponible:', estadoDisponibleUrl);

        if (!estadoDisponibleUrl) {
            console.error('URL para estado disponible no configurada');
            return null;
        }

        // Hacemos la petición para buscar el estado Disponible
        const response = await fetch(estadoDisponibleUrl);
        const json = await response.json();
        console.log('Respuesta estado disponible:', json);

        if (json.data && json.data.length > 0) {
            console.log('Estado Disponible encontrado:', json.data[0]);
            return json.data[0];
        } else {
            // Si no existe, intentamos buscarlo por nombre
            console.log('Buscando estado por nombre "Disponible"');
            const allEstados = await getEstadosPropiedadSimple();
            const estadoDisponible = allEstados.find(estado =>
                estado.nombre.toLowerCase() === 'disponible'
            );

            if (estadoDisponible) {
                console.log('Estado Disponible encontrado por nombre:', estadoDisponible);
                return estadoDisponible;
            } else {
                console.error('No se encontró el estado Disponible');
                return null;
            }
        }
    } catch (error) {
        console.error('Error al obtener el estado Disponible:', error);
        return null;
    }
}

export async function getEstadosPropiedad(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<EstadoPropiedad>> {
    let url = `/api/proxy?service=inmobiliaria&path=estado_propiedad&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener estados de propiedad: ${response.status}`);
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

export async function createEstadoPropiedad(estadoPropiedadData: Partial<EstadoPropiedad>): Promise<void> {
    const transformedData = {
        nombre: estadoPropiedadData.nombre,
        descripcion: estadoPropiedadData.descripcion,
        es_final: estadoPropiedadData.esFinal,
    };

    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad`, {
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

export async function updateEstadoPropiedad(id: number, estadoPropiedadData: Partial<EstadoPropiedad>): Promise<void> {
    const transformedData = {
        nombre: estadoPropiedadData.nombre,
        descripcion: estadoPropiedadData.descripcion,
        es_final: estadoPropiedadData.esFinal,
    };

    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad/${id}`, {
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

export async function getEstadoPropiedad(id: number): Promise<EstadoPropiedad> {
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad/${id}`, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al obtener estado de propiedad:', error);
        throw error;
    }
}

export async function deleteEstadoPropiedad(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=inmobiliaria&path=estado_propiedad/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}


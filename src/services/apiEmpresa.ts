import { Empresa } from "@/types/empresas"




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
        currentPage: number;
        lastPage: number;
        perPage: number;
    };
}

export async function getEmpresas(
    page: number = 1,
    perPage: number = 1000,
    search?: string
): Promise<PaginatedResponse<Empresa>> {
    try {
        const response = await fetch(`/api/proxy?service=config&path=empresas&page=${page}&limit=${perPage}`, {
            credentials: 'include',
        })

        if (!response.ok) {
            throw new Error(`Error al obtener empresas: ${response.status}`)
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
    // const response = await fetch(`${configBaseUrl}/empresas`)
    // const json = await response.json()

    // return await json.data
}

export async function createEmpresa(empresaData: any): Promise<void> {
    console.log(empresaData)
    // Transformar los datos al formato que espera la API
    const transformedData = {
        razon_social: empresaData.razon_social,
        ruc: empresaData.ruc,
        direccion: empresaData.direccion,
        telefono: empresaData.telefono,
        correo: empresaData.correo,
        logo_url: empresaData.logo_url,
        es_activa: empresaData.es_activa,
    };

    try {
        const response = await fetch(`/api/proxy?service=config&path=empresas`, {
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

export async function updateEmpresa(id: number, empresaData: any): Promise<void> {

    const transformedData = {
        razon_social: empresaData.razon_social,
        ruc: empresaData.ruc,
        direccion: empresaData.direccion,
        telefono: empresaData.telefono,
        correo: empresaData.correo,
        logo_url: empresaData.logo_url,
        es_activa: empresaData.es_activa,
    }

    try {
        const response = await fetch(`/api/proxy?service=config&path=empresas/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        })

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export async function deleteEmpresa(id: number): Promise<void> {

    try {
        const response = await fetch(`/api/proxy?service=config&path=empresas/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        throw error;
    }
}

type UploadImageResponse = {
    ruta: string;
    nombre: string;
    tamanio: number;
    tipo: string;
    idImagen: number;
    fechaCreacion: string;
    fechaActualizacion: string;
};

export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log('Enviando imagen al servidor...');

        // Usar la ruta correcta de la API
        const res = await fetch(`/api/proxy?service=archivos&path=imagenes/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });
        console.log('Respuesta del servidor:', res);
        // Verificar el estado de la respuesta
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error en la respuesta:', errorText);
            throw new Error(`Error ${res.status}: ${errorText || 'Error al subir la imagen'}`);
        }

        // Intentar parsear la respuesta como JSON
        let result;
        try {
            result = await res.json();
            console.log('Respuesta del servidor (JSON):', result);
        } catch (jsonError) {
            console.error('Error al parsear la respuesta JSON:', jsonError);
            throw new Error('La respuesta del servidor no es un JSON válido');
        }

        // Verificar si la respuesta tiene la estructura esperada
        if (!result || typeof result !== 'object') {
            console.error('Estructura de respuesta inesperada:', result);
            throw new Error('La respuesta del servidor no tiene el formato esperado');
        }

        // Verificar si hay un mensaje de error en la respuesta
        if (result.error) {
            throw new Error(result.message || 'Error al subir la imagen');
        }

        // Extraer los datos de la respuesta
        const responseData = result.data || result;
        console.log('Datos de la imagen subida:', responseData);

        // Buscar la ruta en diferentes ubicaciones posibles
        let rutaImagen = null;
        let idImagen = 0;

        if (responseData.ruta) {
            rutaImagen = responseData.ruta;
        } else if (responseData.url) {
            rutaImagen = responseData.url;
        } else if (responseData.path) {
            rutaImagen = responseData.path;
        } else if (responseData.data?.ruta) {
            rutaImagen = responseData.data.ruta;
        } else if (responseData.data?.url) {
            rutaImagen = responseData.data.url;
        } else if (responseData.data?.path) {
            rutaImagen = responseData.data.path;
        }

        // Obtener el ID de la imagen si está disponible
        if (responseData.idImagen) {
            idImagen = responseData.idImagen;
        } else if (responseData.id) {
            idImagen = responseData.id;
        } else if (responseData.data?.idImagen) {
            idImagen = responseData.data.idImagen;
        } else if (responseData.data?.id) {
            idImagen = responseData.data.id;
        }

        if (!rutaImagen) {
            console.error('No se pudo encontrar la ruta de la imagen en la respuesta:', responseData);
            throw new Error('La respuesta no contiene la ruta de la imagen');
        }

        // Devolver los datos en el formato esperado
        return {
            ruta: rutaImagen,
            nombre: file.name,
            tamanio: file.size,
            tipo: file.type,
            idImagen: idImagen,
            fechaCreacion: responseData.fechaCreacion || new Date().toISOString(),
            fechaActualizacion: responseData.fechaActualizacion || new Date().toISOString()
        };

    } catch (error) {
        console.error('Error en uploadImage:', error);
        throw error instanceof Error
            ? error
            : new Error('Error desconocido al subir la imagen');
    }
};

export async function updateImage(id: number, file: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`/api/proxy?service=archivos&path=imagenes/${id}`, {
            method: "PATCH",
            body: formData,
        });

        const result = await res.json();
        console.log("Respuesta del backend al actualizar imagen:", result);

        if (!res.ok || !result?.data?.ruta) {
            throw new Error("La respuesta no contiene la ruta de la imagen");
        }

        return result.data;
    } catch (error) {
        console.error("Error en updateImage:", error);
        throw error;
    }
}

export async function deleteImage(id: number): Promise<void> {
    const response = await fetch(`/api/proxy?service=config&path=imagenes/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Imagen no encontrada');
        } else {
            const text = await response.text();
            throw new Error(`Error al eliminar la imagen: ${text}`);
        }
    }

    console.log(`Imagen con ID ${id} eliminada exitosamente.`);
}
export async function searchImage(urlImage: string): Promise<UploadImageResponse> {
    try {
        console.log(`Buscando imagen con URL: ${urlImage}`);
        const res = await fetch(`/api/proxy?service=archivos&path=imagenes/?search=${encodeURIComponent(urlImage)}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log("Estado de la respuesta:", res.status, res.statusText);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error en la respuesta del servidor:', errorText);
            throw new Error(`Error ${res.status}: ${errorText || 'Error al buscar la imagen'}`);
        }

        let result;
        try {
            result = await res.json();
            console.log("Respuesta completa de búsqueda de imagen:", result);
        } catch (jsonError) {
            console.error('Error al parsear la respuesta JSON:', jsonError);
            throw new Error('La respuesta del servidor no es un JSON válido');
        }

        // Verificar diferentes formatos de respuesta
        const responseData = result.data || result;

        if (!responseData || (Array.isArray(responseData) && responseData.length === 0)) {
            console.error('No se encontraron resultados de búsqueda');
            throw new Error('No se encontró la imagen solicitada');
        }

        // Si es un array, tomar el primer elemento
        const imageData = Array.isArray(responseData) ? responseData[0] : responseData;

        // Mapear los campos según lo esperado
        const mappedImage: UploadImageResponse = {
            ruta: imageData.ruta || imageData.url || imageData.path || '',
            nombre: imageData.nombre || 'imagen.jpg',
            tipo: imageData.tipo || 'image/jpeg',
            tamanio: imageData.tamanio || 0,
            idImagen: imageData.idImagen || imageData.id || 0,
            fechaCreacion: imageData.fechaCreacion || new Date().toISOString(),
            fechaActualizacion: imageData.fechaActualizacion || new Date().toISOString()
        };

        if (!mappedImage.ruta) {
            console.error('La imagen encontrada no tiene una ruta válida:', imageData);
            throw new Error('La imagen encontrada no tiene una ruta válida');
        }

        return mappedImage;

    } catch (error) {
        console.error('Error en searchImage:', error);
        throw error instanceof Error
            ? error
            : new Error('Error desconocido al buscar la imagen');
    }
}

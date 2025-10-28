// Sistema de caché para reducir llamadas a la API
interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const cache: Record<string, CacheItem<any>> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// Variable para controlar si hay una precarga en curso
let isPreloadingCatalogs = false;
// Promise para la precarga en curso
let preloadPromise: Promise<void> | null = null;
// Timestamp de la última precarga exitosa
let lastPreloadTimestamp = 0;
// Duración de validez de la precarga (30 segundos)
const PRELOAD_VALID_DURATION = 30 * 1000;

// Claves de caché para los diferentes catálogos
const CACHE_KEYS = {
    PROYECTOS: 'proyectos-inmobiliarios',
    TIPOS: 'tipos-propiedad',
    ESTADOS: 'estados-propiedad'
};

/**
 * Limpia la caché de un catálogo específico o de todos si no se especifica
 * @param cacheKey - Clave opcional del catálogo a limpiar
 */
export function clearCache(cacheKey?: string): void {
    if (cacheKey) {
        delete cache[cacheKey];
        console.log(`Caché de ${cacheKey} limpiada`);
    } else {
        // Limpiar toda la caché
        Object.keys(cache).forEach(key => {
            delete cache[key];
        });
        console.log('Toda la caché ha sido limpiada');
    }
}

/**
 * Precarga todos los catálogos en paralelo para mejorar el rendimiento
 * @returns Promise que se resuelve cuando todos los catálogos han sido cargados
 */
export async function preloadAllCatalogos(): Promise<void> {
    const now = Date.now();
    
    // Si ya hay una precarga en curso, devolver la promesa existente
    if (isPreloadingCatalogs && preloadPromise) {
        return preloadPromise;
    }
    
    // Si la última precarga fue reciente, no volver a precargar
    if (lastPreloadTimestamp > 0 && (now - lastPreloadTimestamp) < PRELOAD_VALID_DURATION) {
        // Devolver una promesa resuelta inmediatamente
        return Promise.resolve();
    }
    
    // Marcar que estamos iniciando una precarga
    isPreloadingCatalogs = true;
    
    // Crear una nueva promesa para esta precarga
    preloadPromise = new Promise<void>(async (resolve) => {
        try {
            // Cargar todos los catálogos en paralelo
            await Promise.all([
                getProyectosInmobiliarios(),
                getTiposPropiedades(),
                getEstadosPropiedades()
            ]);
            // Actualizar el timestamp de la última precarga exitosa
            lastPreloadTimestamp = Date.now();
        } catch (error) {
            console.error('Error al precargar catálogos:', error);
        } finally {
            // Marcar que la precarga ha terminado
            isPreloadingCatalogs = false;
            resolve();
        }
    });
    
    return preloadPromise;
}

// Función para obtener datos de la caché o de la API
const getCachedData = async <T>(key: string, fetchFn: () => Promise<T>, fallbackData: T): Promise<T> => {
    const now = Date.now();
    const cachedItem = cache[key];
    
    // Si hay datos en caché y no han expirado, devolverlos
    if (cachedItem && (now - cachedItem.timestamp) < CACHE_DURATION) {
        return cachedItem.data;
    }
    
    // Si no hay datos en caché o han expirado, obtenerlos de la API
    try {
        const data = await fetchFn();
        // Guardar en caché
        cache[key] = {
            data,
            timestamp: now
        };
        return data;
    } catch (error) {
        // Si hay un error y tenemos datos en caché (aunque hayan expirado), usarlos como fallback
        if (cachedItem) {
            console.warn('Error al obtener datos frescos, usando caché expirada');
            return cachedItem.data;
        }
        // Si no hay datos en caché, usar los datos de fallback
        return fallbackData;
    }
}

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

// Tipos para los catálogos
export type ProyectoInmobiliario = {
    id: number;
    nombre: string;
    // Otros campos que pueda tener
}

export type TipoPropiedad = {
    id: number;
    nombre: string;
    // Otros campos que pueda tener
}

export type EstadoPropiedad = {
    id: number;
    nombre: string;
    // Otros campos que pueda tener
}

// Función para obtener proyectos inmobiliarios
export async function getProyectosInmobiliarios(): Promise<ProyectoInmobiliario[]> {
    const datosEjemploProyectos = [
        { id: 1, nombre: "Proyecto Alpha" },
        { id: 2, nombre: "Proyecto Beta" },
        { id: 3, nombre: "Proyecto Gamma" }
    ];

    return getCachedData<ProyectoInmobiliario[]>(CACHE_KEYS.PROYECTOS, async () => {
        const firstPageResponse = await fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/findAll&page=1&limit=100`);
        await handleApiResponse(firstPageResponse);
        const firstPageData = await firstPageResponse.json();

        const totalPages = firstPageData.meta?.pages || 1;
        let allProyectos: ProyectoInmobiliario[] = firstPageData.data || [];

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=inmobiliaria&path=proyectos-inmobiliarios/findAll&page=${page}&limit=100`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allProyectos.push(...pageData.data);
                    }
                } else {
                    console.warn(`Error al obtener una página de proyectos: ${response.statusText}`);
                }
            }
        }

        return allProyectos.length > 0 ? allProyectos : datosEjemploProyectos;
    }, datosEjemploProyectos);
}

// Función para obtener tipos de propiedad
export async function getTiposPropiedades(): Promise<TipoPropiedad[]> {
    const datosEjemploTipos = [
        { id: 1, nombre: "Departamento" },
        { id: 2, nombre: "Casa" },
        { id: 3, nombre: "Local Comercial" }
    ];

    return getCachedData<TipoPropiedad[]>(CACHE_KEYS.TIPOS, async () => {
        const firstPageResponse = await fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/findAll&page=1&limit=100`);
        await handleApiResponse(firstPageResponse);
        const firstPageData = await firstPageResponse.json();

        const totalPages = firstPageData.meta?.pages || 1;
        let allTipos: TipoPropiedad[] = firstPageData.data || [];

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=inmobiliaria&path=tipos-propiedad/findAll&page=${page}&limit=100`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allTipos.push(...pageData.data);
                    }
                } else {
                    console.warn(`Error al obtener una página de tipos de propiedad: ${response.statusText}`);
                }
            }
        }

        return allTipos.length > 0 ? allTipos : datosEjemploTipos;
    }, datosEjemploTipos);
}

// Función para obtener estados de propiedad
export async function getEstadosPropiedades(): Promise<EstadoPropiedad[]> {
    const datosEjemploEstados = [
        { id: 1, nombre: "Disponible" },
        { id: 2, nombre: "Vendido" },
        { id: 3, nombre: "Reservado" }
    ];

    return getCachedData<EstadoPropiedad[]>(CACHE_KEYS.ESTADOS, async () => {
        const firstPageResponse = await fetch(`/api/proxy?service=inmobiliaria&path=estados-propiedad/findAll&page=1&limit=100`);
        await handleApiResponse(firstPageResponse);
        const firstPageData = await firstPageResponse.json();

        const totalPages = firstPageData.meta?.pages || 1;
        let allEstados: EstadoPropiedad[] = firstPageData.data || [];

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=inmobiliaria&path=estados-propiedad/findAll&page=${page}&limit=100`));
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

        return allEstados.length > 0 ? allEstados : datosEjemploEstados;
    }, datosEjemploEstados);
}

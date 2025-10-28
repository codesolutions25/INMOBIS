import { Cotizacion } from "@/types/cotizaciones";

const inmobiliariaBaseUrl = `/api/proxy?service=inmobiliaria&path=`

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

export async function getEstadosCotizacionSimple(): Promise<Cotizacion[]> {
    const response = await fetch(`${inmobiliariaBaseUrl}/estado_cotizacion`)
    const json = await response.json()
    return await json.data
}

// Función para obtener el ID del estado "Anulada"
export async function getEstadoCotizacionAnuladaId(): Promise<number> {
    try {
        

        const response = await fetch('/api/proxy?service=estado_cotizacion_cancelada_url');
        if (!response.ok) {
            throw new Error(`Error al obtener estado Anulada: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta del estado Anulada:', data);

        // Buscar el estado "Anulada" en la respuesta
        if (data.data && Array.isArray(data.data)) {
            const estadoAnulada = data.data.find((estado: any) => 
                estado.nombre?.toLowerCase().includes('anulada') ||
                estado.descripcion?.toLowerCase().includes('anulada')
            );
            
            if (estadoAnulada) {
                return estadoAnulada.id_estado_cotizacion || estadoAnulada.id || estadoAnulada.idEstadoCotizacion;
            }
        }

        // Si no encuentra el estado específico, usar el primer resultado
        if (data.data && data.data.length > 0) {
            const primerEstado = data.data[0];
            return primerEstado.id_estado_cotizacion || primerEstado.id || primerEstado.idEstadoCotizacion;
        }

        throw new Error('No se encontró el estado "Anulada"');
    } catch (error) {
        console.error('Error al obtener estado Anulada:', error);
        throw error;
    }
}

// Función para anular una cotización cambiando su estado
export async function anularCotizacion(idCotizacion: number): Promise<void> {
    try {
        
        // Obtener el ID del estado "Anulada"
        const estadoAnuladaId = await getEstadoCotizacionAnuladaId();

        // Actualizar el estado de la cotización
        const updateUrl = `${inmobiliariaBaseUrl}cotizaciones/${idCotizacion}`;
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_estado_cotizacion: estadoAnuladaId
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error al anular cotización: ${response.status} - ${errorData}`);
        }

        const result = await handleApiResponse(response);
        
    } catch (error) {
        throw error;
    }
}

// Función optimizada para obtener el estado de cotizaciones (anuladas, aprobadas y activas) en una sola consulta
export async function getEstadoCotizacionesOptimizado(): Promise<{
    cotizacionesAnuladas: Set<number>;
    cotizacionesAprobadas: Set<number>;
    cotizacionesActivas: Set<number>;
    estadoAnuladaId: number;
    estadoAprobadaId: number;
}> {
    try {
        
        // Obtener los IDs de los estados "Anulada" y "Aprobada"
        const [estadoAnuladaId, estadoAprobadaId] = await Promise.all([
            getEstadoCotizacionAnuladaId(),
            getEstadoCotizacionAprobadaId()
        ]);
        
        // Obtener todas las cotizaciones en una sola consulta
        const cotizacionesResponse = await getCotizaciones(1, 1000); // Obtener un número grande para cubrir todas
        
        const cotizacionesAnuladas = new Set<number>();
        const cotizacionesAprobadas = new Set<number>();
        const cotizacionesActivas = new Set<number>();
        
        cotizacionesResponse.data.forEach(cotizacion => {
            const idCotizacion = cotizacion.idCotizaciones;
            const estadoCotizacion = cotizacion.idEstadoCotizacion;
            
            if (estadoCotizacion === estadoAnuladaId) {
                cotizacionesAnuladas.add(idCotizacion);
            } else if (estadoCotizacion === estadoAprobadaId) {
                cotizacionesAprobadas.add(idCotizacion);
            } else {
                cotizacionesActivas.add(idCotizacion);
            }
        });
        
        return {
            cotizacionesAnuladas,
            cotizacionesAprobadas,
            cotizacionesActivas,
            estadoAnuladaId,
            estadoAprobadaId
        };
        
    } catch (error) {
        return {
            cotizacionesAnuladas: new Set(),
            cotizacionesAprobadas: new Set(),
            cotizacionesActivas: new Set(),
            estadoAnuladaId: 0,
            estadoAprobadaId: 0
        };
    }
}

export async function getCotizaciones(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<Cotizacion>> {
    let url = `${inmobiliariaBaseUrl}cotizaciones&page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener proyectos: ${response.status}`);
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

export async function createCotizacion(cotizacionData: Partial<Cotizacion>): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    const transformedData = {
        id_cliente_inmobiliario: Number(cotizacionData.idClienteInmobiliario),
        id_propiedad: Number(cotizacionData.idPropiedad),
        id_estado_cotizacion: Number(cotizacionData.idEstadoCotizacion),
        id_plan_pago_propiedad: Number(cotizacionData.idPlanPagoPropiedad),
        descuento: Number(cotizacionData.descuento),
        precio_final: Number(cotizacionData.precioFinal),
        moneda: cotizacionData.moneda,
        observaciones: cotizacionData.observaciones,
        fecha_cotizacion: cotizacionData.fechaCotizacion,
    };
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}cotizaciones`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
        });

        if (!response.ok) {
            throw new Error(`Error al crear cotizacion: ${response.status}`);
        }
    } catch (error) {
        console.error('Error al crear cotizacion:', error);
        throw error;
    }
}

export async function updateCotizacion(id: number, cotizacionData: Partial<Cotizacion>): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }

    const transformedData: any = {};
    
    if (cotizacionData.idClienteInmobiliario !== undefined && cotizacionData.idClienteInmobiliario !== null) {
        transformedData.id_cliente_inmobiliario = Number(cotizacionData.idClienteInmobiliario);
    }
    if (cotizacionData.idPropiedad !== undefined && cotizacionData.idPropiedad !== null) {
        transformedData.id_propiedad = Number(cotizacionData.idPropiedad);
    }
    if (cotizacionData.idEstadoCotizacion !== undefined && cotizacionData.idEstadoCotizacion !== null) {
        transformedData.id_estado_cotizacion = Number(cotizacionData.idEstadoCotizacion);
    }
    if (cotizacionData.descuento !== undefined && cotizacionData.descuento !== null) {
        transformedData.descuento = Number(cotizacionData.descuento);
    }
    if (cotizacionData.precioFinal !== undefined && cotizacionData.precioFinal !== null) {
        transformedData.precio_final = Number(cotizacionData.precioFinal);
    }
    if (cotizacionData.moneda !== undefined && cotizacionData.moneda !== null) {
        transformedData.moneda = cotizacionData.moneda;
    }
    if (cotizacionData.observaciones !== undefined && cotizacionData.observaciones !== null) {
        transformedData.observaciones = cotizacionData.observaciones;
    }
    if (cotizacionData.fechaCotizacion !== undefined && cotizacionData.fechaCotizacion !== null) {
        transformedData.fecha_cotizacion = cotizacionData.fechaCotizacion;
    }
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}cotizaciones/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al actualizar cotizacion:', error);
        throw error;
    }
}

export async function getCotizacion(id: number): Promise<Cotizacion>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}cotizaciones/${id}`, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        console.error('Error al obtener cotizacion:', error);
        throw error;
    }
}

export async function deleteCotizacion(id: number): Promise<void>{
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}cotizaciones/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error al eliminar cotizacion:', error);
        throw error;
    }
}

// Función para obtener cotizaciones por propiedad
export async function getCotizacionesPorPropiedad(idPropiedad: number): Promise<Cotizacion[]> {
    if (!inmobiliariaBaseUrl) {
        throw new Error('URL del servicio no configurada. Verifique la variable de entorno INMOBILIARIA_SERVICE_URL');
    }
    
    try {
        const response = await fetch(`${inmobiliariaBaseUrl}cotizaciones&search=${idPropiedad}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener cotizaciones: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
            // Filtrar por idPropiedad ya que la búsqueda puede traer otros resultados
            return data.data.filter((cotizacion: any) => 
                cotizacion.idPropiedad === idPropiedad || cotizacion.id_propiedad === idPropiedad
            );
        }
        
        return [];
    } catch (error) {
        return [];
    }
}

// Función para verificar si existe cotización para un plan de pago
export async function verificarCotizacionPorPlan(idPlanPago: number): Promise<boolean> {
    try {
        const response = await getCotizaciones(1, 100); // Obtener todas las cotizaciones
        
        if (response.data && Array.isArray(response.data)) {
            const existeCotizacion = response.data.some((cotizacion: any) => {
                const planId = cotizacion.idPlanPagoPropiedad || cotizacion.id_plan_pago_propiedad;
                return planId === idPlanPago;
            });
            return existeCotizacion;
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

// Función para obtener el ID del estado "Aprobada"
export async function getEstadoCotizacionAprobadaId(): Promise<number> {
    try {
       

        const response = await fetch('/api/proxy?service=estado_cotizacion_aprobada_url');
        if (!response.ok) {
            throw new Error(`Error al obtener estado Aprobada: ${response.status}`);
        }

        const data = await response.json();

        // Buscar el estado "Aprobada" en la respuesta
        if (data.data && Array.isArray(data.data)) {
            
            const estadoAprobada = data.data.find((estado: any) => {
                const nombre = estado.nombre?.toLowerCase() || '';
                const descripcion = estado.descripcion?.toLowerCase() || '';
                const includeAprobada = nombre.includes('aprobada') || descripcion.includes('aprobada');
              
                return includeAprobada;
            });
            
            if (estadoAprobada) {
                const idEstado = estadoAprobada.id_estado_cotizacion || estadoAprobada.id || estadoAprobada.idEstadoCotizacion;
                return idEstado;
            }
        }

        // Si no encuentra el estado específico, usar el primer resultado
        if (data.data && data.data.length > 0) {
            const primerEstado = data.data[0];
            const idEstado = primerEstado.id_estado_cotizacion || primerEstado.id || primerEstado.idEstadoCotizacion;
            return idEstado;
        }

        throw new Error('No se encontró el estado "Aprobada"');
    } catch (error) {
        throw error;
    }
}

// Función para obtener el ID del estado "Pendiente"
export async function getEstadoCotizacionPendienteId(): Promise<number> {
    const estadoPendienteUrl = '/api/proxy?service=estado_cotizacion_pendiente_url';
    
    if (!estadoPendienteUrl) {
        throw new Error('URL del estado cotización pendiente no configurada');
    }
    
    try {
        const response = await fetch(estadoPendienteUrl, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error al obtener estado pendiente: ${response.status}`);
        }

        const data = await response.json();
        
        // Buscar el estado "Pendiente" en la respuesta
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const estadoPendiente = data.data.find((estado: any) => 
                estado.nombre && estado.nombre.toLowerCase().includes('pendiente')
            );
            
            if (estadoPendiente && estadoPendiente.idEstadoCotizacion) {
                return estadoPendiente.idEstadoCotizacion;
            }
        }
        
        throw new Error('No se encontró el estado "Pendiente"');
    } catch (error) {
        console.error('Error al obtener estado cotización pendiente:', error);
        throw error;
    }
}









import { CajaOperacion } from "@/types/cajaoperaciones"


interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    currentPage: number
    lastPage: number
    perPage: number
  }
}

interface ErrorResponse {
  message: string
  error?: any
  statusCode?: number
}

const handleApiResponse = async <T = any>(response: Response): Promise<T> => {
  const responseText = await response.text()
   
  let data: any
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch (e) {
    console.error('La respuesta no es un JSON válido')
    throw new Error(`La respuesta del servidor no es un JSON válido: ${responseText}`)
  }

  if (!response.ok) {
    let errorMessage = 'Error desconocido'
    if (data?.message) {
      errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message)
    } else if (data?.error) {
      errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    } else {
      errorMessage = `Error ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  return data
}

export async function getCajaOperaciones(
  page: number = 1,
  perPage: number = 10,
  search?: string,
  idCaja?: number
): Promise<PaginatedResponse<CajaOperacion>> {
  let url = `/api/proxy?service=caja&path=caja-operaciones&page=${page}&limit=${perPage}`
  if (search) {
    url += `&search=${encodeURIComponent(search)}`
  }
  if (idCaja) {
    url += `&idCaja=${idCaja}`
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ 
      data: CajaOperacion[]
      meta: {
        total: number
        page: number
        pages: number
        limit: number
      }
    }>(response)

    return {
      data: data.data || [],
      meta: {
        total: data.meta?.total || 0,
        currentPage: data.meta?.page || page,
        lastPage: data.meta?.pages || 1,
        perPage: data.meta?.limit || perPage
      }
    }
  } catch (error) {
    console.error('Error al obtener operaciones de caja:', error)
    return {
      data: [],
      meta: {
        total: 0,
        currentPage: page,
        lastPage: 1,
        perPage: perPage
      }
    }
  }
}

export async function getCajaOperacion(id: number): Promise<CajaOperacion> {

  const response = await fetch(`/api/proxy?service=caja&path=caja-operaciones/${id}`, {
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: CajaOperacion }>(response)
  return data.data
}

export async function createCajaOperacion(
  operacionData: Omit<CajaOperacion, 'id_operacion' | 'fecha_operacion' | 'created_at'>
): Promise<CajaOperacion> {

  const response = await fetch(`/api/proxy?service=caja&path=caja-operaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(operacionData),
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: CajaOperacion }>(response)
  return data.data
}

export async function updateCajaOperacion(
  id: number,
  updates: Partial<CajaOperacion>
): Promise<CajaOperacion> {

  try {
    // Aseguramos que el ID no se incluya en los datos de actualización
    const { id_operacion, ...updateData } = updates;
    
    const response = await fetch(`/api/proxy?service=caja&path=caja-operaciones/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
      credentials: 'include',
    });

    const data = await handleApiResponse<{ data: CajaOperacion }>(response);
    return data.data;
  } catch (error) {
    console.error('Error en updateCajaOperacion:', error);
    throw error;
  }
}

export async function deleteCajaOperacion(id: number): Promise<void> {

  const response = await fetch(`/api/proxy?service=caja&path=caja-operaciones/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_operacion: id }),
    credentials: 'include',
  })

  await handleApiResponse(response)
}

export interface TransaccionUnificada {
  id: number;
  tipo: 'operacion' | 'movimiento';
  fecha: string;
  descripcion: string;
  monto: number;
  referencia: string | null;
  id_caja: number | null;
  id_tipo_operacion: number | null;
  // Add other common fields as needed
}

export async function getMovimientosYOperaciones(
  page: number = 1,
  perPage: number = 10,
  search?: string,
  idCaja?: number,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<TransaccionUnificada>> {
  let url = `/api/proxy?service=caja&path=caja-operaciones/movimientos-y-operaciones&page=${page}&limit=${perPage}`
  
  const params = new URLSearchParams();
  
  if (search) {
    params.append('search', search);
  }
  if (idCaja) {
    params.append('idCaja', idCaja.toString());
  }
  if (startDate) {
    params.append('fechaInicio', startDate);
  }
  if (endDate) {
    // Set time to end of day for the end date
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    params.append('fechaFin', endOfDay.toISOString());
  }
  
  // Add all parameters to the URL
  const queryString = params.toString();
  if (queryString) {
    url += `&${queryString}`;
  }

  try {

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // First, get the raw response text for debugging
    const responseText = await response.text();
    let data;
    
    try {
      // Try to parse the response as JSON
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', responseText);
      throw new Error(`Error al analizar la respuesta del servidor: ${responseText.substring(0, 200)}...`);
    }

    // Check if the response is an error
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      throw new Error(`Error ${response.status}: ${errorMessage}`);
    }

    // Validate the response structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data);
      throw new Error('Formato de respuesta inválido: la respuesta no es un objeto');
    }

    // The response might be the data directly or in a data property
    const responseData = data.data || data;
    
    if (!Array.isArray(responseData)) {
      console.error('Invalid data format: expected an array', responseData);
      throw new Error('Formato de datos inválido: se esperaba un arreglo');
    }

    // Ensure we have a meta object with pagination info
    const meta = data.meta || {
      total: responseData.length,
      page: page,
      limit: perPage,
      totalPages: Math.ceil((data.meta?.total || responseData.length) / perPage)
    };

    return {
      data: responseData,
      meta: meta
    };
    
  } catch (error) {
    console.error('Error en getMovimientosYOperaciones:', {
      error,
      url,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
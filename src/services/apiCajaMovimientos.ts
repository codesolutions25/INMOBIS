import { CajaMovimiento } from "@/types/cajamovimientos"


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

export async function getCajaMovimientos(
  page: number = 1,
  perPage: number = 10,
  search?: string,
  idCaja?: number,
  idTipoOperacion?: number,
  estado?: number,
  cajaIds?: string // Comma-separated list of caja IDs
): Promise<PaginatedResponse<CajaMovimiento>> {
  let url = `/api/proxy?service=caja&path=caja-movimientos&page=${page}&limit=${perPage}`
  
  const params = new URLSearchParams();
  
  if (search) {
    params.append('search', search);
  }
  if (idCaja) {
    params.append('idCaja', idCaja.toString());
  }
  if (idTipoOperacion) {
    params.append('idTipoOperacion', idTipoOperacion.toString());
  }
  if (estado !== undefined) {
    params.append('estado', estado.toString());
  }
  if (cajaIds) {
    params.append('cajaIds', cajaIds);
  }
  
  // Add all parameters to the URL
  const queryString = params.toString();
  if (queryString) {
    url += `&${queryString}`;
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ 
      data: CajaMovimiento[]
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
    console.error('Error al obtener movimientos de caja:', error)
    return {
      data: [],
      meta: {
        total: 0,
        currentPage: page,
        lastPage: 1,
        perPage
      }
    }
  }
}

export async function getCajaMovimiento(id: number): Promise<CajaMovimiento> {
  const response = await fetch(`/api/proxy?service=caja&path=caja-movimientos/${id}`, {
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: CajaMovimiento }>(response)
  return data.data
}

export async function createCajaMovimiento(
  movimientoData: Omit<CajaMovimiento, 'idMovimiento' | 'fechaMovimiento' | 'createdAt'>
): Promise<CajaMovimiento> {
  const response = await fetch(`/api/proxy?service=caja&path=caja-movimientos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movimientoData),
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: CajaMovimiento }>(response)
  return data.data
}

export async function updateCajaMovimiento(
  id: number,
  updates: Partial<Omit<CajaMovimiento, 'idMovimiento' | 'fechaMovimiento' | 'createdAt'>>
): Promise<CajaMovimiento> {
  try {
    console.log('Updating movimiento with ID:', id);
    console.log('Sending data:', updates);
    
    const url = `/api/proxy?service=caja&path=caja-movimientos/${id}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      credentials: 'include',
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in updateCajaMovimiento:', error);
    throw error;
  }
}

export async function deleteCajaMovimiento(id: number): Promise<void> {
  const response = await fetch(`/api/proxy?service=caja&path=caja-movimientos/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_movimiento: id }),
    credentials: 'include',
  })

  await handleApiResponse(response)
}
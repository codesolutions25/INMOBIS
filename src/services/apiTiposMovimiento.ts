// src/services/apiTiposMovimiento.ts
import { TipoMovimiento } from "@/types/tiposmovimiento"


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

export async function getTiposMovimiento(
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<PaginatedResponse<TipoMovimiento>> {
  let url = `/api/proxy?service=caja&path=tipos-de-movimiento&page=${page}&limit=${perPage}`
  if (search) {
    url += `&search=${encodeURIComponent(search)}`
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ 
      data: TipoMovimiento[]
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
          pages: data.meta?.pages || 1,  // Usar el mismo nombre que el API
          perPage: data.meta?.limit || perPage
      }
  }
  } catch (error) {
    console.error('Error al obtener tipos de movimiento:', error)
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

export async function getTipoMovimiento(id: number): Promise<TipoMovimiento> {

  const response = await fetch(`/api/proxy?service=caja&path=tipos-de-movimiento/${id}`, {
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: TipoMovimiento }>(response)
  return data.data
}

export async function createTipoMovimiento(
  tipoMovimientoData: Omit<TipoMovimiento, 'idTipoMovimiento' | 'createdAt' | 'updatedAt'>
): Promise<TipoMovimiento> {

  const response = await fetch(`/api/proxy?service=caja&path=tipos-de-movimiento`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tipoMovimientoData),
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: TipoMovimiento }>(response)
  return data.data
}

export async function updateTipoMovimiento(
  id: number,
  updates: Partial<Omit<TipoMovimiento, 'idTipoMovimiento' | 'createdAt' | 'updatedAt'>>
): Promise<TipoMovimiento> {

  const response = await fetch(`/api/proxy?service=caja&path=tipos-de-movimiento/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
    credentials: 'include',
  })

  const data = await handleApiResponse<{ data: TipoMovimiento }>(response)
  return data.data
}

export async function deleteTipoMovimiento(id: number): Promise<void> {

  const response = await fetch(`/api/proxy?service=caja&path=tipos-de-movimiento/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  await handleApiResponse(response)
}
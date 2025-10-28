import { TipoGenero } from "@/types/tipoGenero"


interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    currentPage: number
    lastPage: number
    perPage: number
  }
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

type CreateTipoGeneroDto = Omit<TipoGenero, 'idTipoGenero' | 'createdAt' | 'updatedAt'>
type UpdateTipoGeneroDto = Partial<CreateTipoGeneroDto>

export async function getTiposGenero(
  page: number = 1,
  perPage: number = 1000,
  search?: string
): Promise<PaginatedResponse<TipoGenero>> {
  let url = `/api/proxy?service=auth&path=tipo-genero&page=${page}&limit=${perPage}`
  if (search) {
    url += `&search=${encodeURIComponent(search)}`
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ 
      data: TipoGenero[]
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
    console.error('Error al obtener tipos de género:', error)
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

export async function getTipoGeneroById(id: number): Promise<TipoGenero> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-genero/${id}`, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ data: TipoGenero }>(response)
    return data.data
  } catch (error) {
    console.error(`Error al obtener el tipo de género con ID ${id}:`, error)
    throw error
  }
}

export async function createTipoGenero(
  tipoGenero: CreateTipoGeneroDto
): Promise<TipoGenero> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-genero`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tipoGenero),
      credentials: 'include',
    })

    const data = await handleApiResponse<{ data: TipoGenero }>(response)
    return data.data
  } catch (error) {
    console.error('Error al crear el tipo de género:', error)
    throw error
  }
}

export async function updateTipoGenero(
  id: number,
  updates: UpdateTipoGeneroDto
): Promise<TipoGenero> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-genero/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      credentials: 'include',
    })

    const data = await handleApiResponse<{ data: TipoGenero }>(response)
    return data.data
  } catch (error) {
    console.error(`Error al actualizar el tipo de género con ID ${id}:`, error)
    throw error
  }
}

export async function deleteTipoGenero(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-genero/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    await handleApiResponse(response)
  } catch (error) {
    console.error(`Error al eliminar el tipo de género con ID ${id}:`, error)
    throw error
  }
}
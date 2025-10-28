import { TipoDocumento } from "@/types/tipoDocumento"


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

type CreateTipoDocumentoDto = Omit<TipoDocumento, 'idTipoDocumento' | 'createdAt' | 'updatedAt'>
type UpdateTipoDocumentoDto = Partial<CreateTipoDocumentoDto>

export async function getTiposDocumento(
  page: number = 1,
  perPage: number = 1000,
  search?: string
): Promise<PaginatedResponse<TipoDocumento>> {
  let url = `/api/proxy?service=auth&path=tipo-documento&page=${page}&limit=${perPage}`
  if (search) {
    url += `&search=${encodeURIComponent(search)}`
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ 
      data: TipoDocumento[]
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
    console.error('Error al obtener tipos de documento:', error)
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

export async function getTipoDocumentoById(id: number): Promise<TipoDocumento> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-documento/${id}`, {
      credentials: 'include',
    })

    const data = await handleApiResponse<{ data: TipoDocumento }>(response)
    return data.data
  } catch (error) {
    console.error(`Error al obtener el tipo de documento con ID ${id}:`, error)
    throw error
  }
}

export async function createTipoDocumento(
  tipoDocumento: CreateTipoDocumentoDto
): Promise<TipoDocumento> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-documento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tipoDocumento),
      credentials: 'include',
    })

    const data = await handleApiResponse<{ data: TipoDocumento }>(response)
    return data.data
  } catch (error) {
    console.error('Error al crear el tipo de documento:', error)
    throw error
  }
}

export async function updateTipoDocumento(
  id: number,
  updates: UpdateTipoDocumentoDto
): Promise<TipoDocumento> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-documento/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      credentials: 'include',
    })

    const data = await handleApiResponse<{ data: TipoDocumento }>(response)
    return data.data
  } catch (error) {
    console.error(`Error al actualizar el tipo de documento con ID ${id}:`, error)
    throw error
  }
}

export async function deleteTipoDocumento(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/proxy?service=auth&path=tipo-documento/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    await handleApiResponse(response)
  } catch (error) {
    console.error(`Error al eliminar el tipo de documento con ID ${id}:`, error)
    throw error
  }
}
import { TipoPersona } from "@/types/atenciones";



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

type CreateTipoPersonaDto = Omit<TipoPersona, 'idTipoPersona' | 'createdAt' | 'updatedAt'>
type UpdateTipoPersonaDto = Partial<CreateTipoPersonaDto>

export async function getTiposPersona(
    page: number = 1,
    perPage: number = 10,
    search?: string
): Promise<PaginatedResponse<TipoPersona>> {
    let url = `/api/proxy?service=auth&path=tipo-persona&page=${page}&limit=${perPage}`
    if (search) {
        url += `&search=${encodeURIComponent(search)}`
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
        })

        const data = await handleApiResponse<{ 
            data: TipoPersona[]
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
        console.error('Error al obtener tipos de persona:', error)
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

export async function getTipoPersonaById(id: number): Promise<TipoPersona> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=tipo-persona/${id}`, {
            credentials: 'include',
        })

        const data = await handleApiResponse<{ data: TipoPersona }>(response)
        return data.data
    } catch (error) {
        console.error(`Error al obtener el tipo de persona con ID ${id}:`, error)
        throw error
    }
}

export async function createTipoPersona(
    tipoPersona: CreateTipoPersonaDto
): Promise<TipoPersona> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=tipo-persona`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tipoPersona),
            credentials: 'include',
        })

        const data = await handleApiResponse<{ data: TipoPersona }>(response)
        return data.data
    } catch (error) {
        console.error('Error al crear el tipo de persona:', error)
        throw error
    }
}

export async function updateTipoPersona(
    id: number,
    updates: UpdateTipoPersonaDto
): Promise<TipoPersona> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=tipo-persona/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
            credentials: 'include',
        })

        const data = await handleApiResponse<{ data: TipoPersona }>(response)
        return data.data
    } catch (error) {
        console.error(`Error al actualizar el tipo de persona con ID ${id}:`, error)
        throw error
    }
}

export async function deleteTipoPersona(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=tipo-persona/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        })

        await handleApiResponse(response)
    } catch (error) {
        console.error(`Error al eliminar el tipo de persona con ID ${id}:`, error)
        throw error
    }
}

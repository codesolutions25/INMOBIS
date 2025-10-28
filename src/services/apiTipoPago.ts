import { TipoPago, CreateTipoPagoDto, UpdateTipoPagoDto } from "@/types/tipospago";



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
  const responseText = await response.text();
  
  let data: any;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    throw { message: 'Invalid JSON response', error: responseText };
  }

  if (!response.ok) {
    const error: ErrorResponse = {
      message: data.message || 'Error en la solicitud',
      error: data.error,
      statusCode: response.status
    };
    throw error;
  }

  return data as T;
};

export const getTiposPago = async (
  page: number = 1,
  perPage: number = 1000,
  search?: string
): Promise<PaginatedResponse<TipoPago>> => {
  try {
    
    
    

    const response = await fetch(`/api/proxy?service=ventas&path=tipos-pago&page=${page}&limit=${perPage}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse<PaginatedResponse<TipoPago>>(response);
  } catch (error) {
    console.error('Error al obtener tipos de pago:', error);
    throw error;
  }
};

export const getTipoPagoById = async (id: number): Promise<TipoPago> => {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=tipos-pago/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse<TipoPago>(response);
  } catch (error) {
    console.error(`Error al obtener el tipo de pago con ID ${id}:`, error);
    throw error;
  }
};

export const createTipoPago = async (
  tipoPago: CreateTipoPagoDto
): Promise<TipoPago> => {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=tipos-pago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tipoPago),
    });

    return handleApiResponse<TipoPago>(response);
  } catch (error) {
    console.error('Error al crear tipo de pago:', error);
    throw error;
  }
};

export const updateTipoPago = async (
  id: number,
  updates: UpdateTipoPagoDto
): Promise<TipoPago> => {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=tipos-pago/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return handleApiResponse<TipoPago>(response);
  } catch (error) {
    console.error(`Error al actualizar el tipo de pago con ID ${id}:`, error);
    throw error;
  }
};

export const deleteTipoPago = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=tipos-pago/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el tipo de pago');
    }
  } catch (error) {
    console.error(`Error al eliminar el tipo de pago con ID ${id}:`, error);
    throw error;
  }
};

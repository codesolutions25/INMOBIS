import { Venta } from "@/types/venta";



// Interfaz para los metadatos de paginación
export interface VentasMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// El backend puede devolver un array de ventas directamente
// o un objeto con una propiedad 'data' que contenga el array
export type VentasResponse = Venta[] | { 
  data: Venta[];
  meta?: VentasMeta;
};

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
}

export async function getVentas(
  page: number = 1,
  perPage: number = 1000,
  search?: string
): Promise<PaginatedResponse<Venta>> {
  // Asegurarse de que los parámetros sean números
  const pageNum = Number.isInteger(page) ? page : 1;
  const perPageNum = Number.isInteger(perPage) ? perPage : 10;
  
  // Construir la URL con parámetros de consulta
  const params = new URLSearchParams();
  params.append('page', String(pageNum));
  params.append('perPage', String(perPageNum));
  
  if (search && search.trim() !== '') {
    params.append('search', search.trim());
  }
  
  const url = `/api/proxy?service=ventas&path=ventas&${params.toString()}`;
  

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Error al obtener ventas: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    // El backend puede devolver directamente el array o un objeto con data y meta
    const items = Array.isArray(responseData) 
      ? responseData 
      : (responseData?.data || []);
    
    // Obtener los metadatos de la respuesta o calcularlos
    const meta = responseData?.meta || {
      total: items.length,
      page: pageNum,
      pages: Math.ceil((responseData?.total || items.length) / perPageNum),
      limit: perPageNum
    };
    
 
    
    return {
      data: items,
      meta: {
        total: meta.total,
        page: meta.page,
        pages: meta.pages,
        limit: meta.limit
      }
    };
  } catch (error) {
    console.error('Error en getVentas:', error);
    return {
      data: [],
      meta: {
        total: 0,
        page: page,
        pages: 1,
        limit: perPage
      }
    };
  }
}

export async function getVentaById(id: number): Promise<Venta> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=ventas/${id}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Error al obtener la venta: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error(`Error al obtener la venta con ID ${id}:`, error);
    throw error;
  }
}

export async function createVenta(ventaData: Omit<Venta, "id">): Promise<Venta> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ventaData),
      credentials: 'include',
    });

    const responseText = await response.text();
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
  } catch (error) {
    console.error('Error al crear la venta:', error);
    throw error;
  }
}

export async function updateVenta(
  id: number,
  ventaData: Partial<Venta>
): Promise<Venta> {
  try {
    const payload = { ...ventaData };
    delete payload.id_venta;

    const response = await fetch(`/api/proxy?service=ventas&path=ventas/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('La respuesta no es un JSON válido', e);
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
  } catch (error) {
    console.error(`Error al actualizar la venta con ID ${id}:`, error);
    throw error;
  }
}

export async function deleteVenta(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=ventas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Error al eliminar la venta: ${response.status} ${response.statusText}`
      );
    }

    return;
  } catch (error) {
    console.error(`Error al eliminar la venta con ID ${id}:`, error);
    throw error;
  }
}
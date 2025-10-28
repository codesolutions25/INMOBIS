import { DetalleVenta, DetalleVentaResponse } from "@/types/detalleVenta";


export async function getDetallesVentaByVentaId(idVenta: number): Promise<DetalleVenta[]> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=detalle-ventas/venta/${idVenta}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Error al obtener detalles de venta: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json() as DetalleVentaResponse;
    return Array.isArray(responseData.data) ? responseData.data : [responseData.data];
  } catch (error) {
    console.error(`Error al obtener detalles de venta para venta ID ${idVenta}:`, error);
    throw error;
  }
}

export async function getDetalleVentaById(id: number): Promise<DetalleVenta> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=detalle-ventas/${id}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Error al obtener el detalle de venta: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json() as DetalleVentaResponse;
    return responseData.data as DetalleVenta;
  } catch (error) {
    console.error(`Error al obtener detalle de venta con ID ${id}:`, error);
    throw error;
  }
}

export async function createDetalleVenta(detalleData: Omit<DetalleVenta, 'id_detalle_venta'>): Promise<DetalleVenta> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=detalle-ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(detalleData),
      credentials: 'include',
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`La respuesta del servidor no es un JSON válido: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(
        responseData.message || 
        `Error al crear detalle de venta: ${response.status} ${response.statusText}`
      );
    }

    return responseData.data || responseData;
  } catch (error) {
    console.error('Error al crear detalle de venta:', error);
    throw error;
  }
}

export async function updateDetalleVenta(
  id: number,
  detalleData: Partial<DetalleVenta>
): Promise<DetalleVenta> {
  try {
    const payload = { ...detalleData };
    delete payload.id_detalle_venta;

    const response = await fetch(`/api/proxy?service=ventas&path=detalle-ventas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`La respuesta del servidor no es un JSON válido: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(
        responseData.message || 
        `Error al actualizar detalle de venta: ${response.status} ${response.statusText}`
      );
    }

    return responseData.data || responseData;
  } catch (error) {
    console.error(`Error al actualizar detalle de venta con ID ${id}:`, error);
    throw error;
  }
}

export async function deleteDetalleVenta(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/proxy?service=ventas&path=detalle-ventas/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Error al eliminar detalle de venta: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error(`Error al eliminar detalle de venta con ID ${id}:`, error);
    throw error;
  }
}

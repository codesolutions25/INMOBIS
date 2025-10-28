import axios from 'axios';



export interface TipoAtencion {
  idTipoAtencion: number;
  nombre: string;
  descripcion?: string;
}

export const getTipoAtencion = async (search: string = ''): Promise<{ data: TipoAtencion[] }> => {
  try {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    
    const response = await axios.get(`/api/proxy?service=atencion&path=tipos-atencion`, { params });
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response.data)) {
      return { data: response.data };
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.items)) {
      return { data: response.data.items };
    } else if (response.data && Array.isArray(response.data.results)) {
      return { data: response.data.results };
    }
    
    // Si no se puede determinar el formato, devolver un array vacío
    console.warn('Formato de respuesta desconocido para tipos de atención:', response.data);
    return { data: [] };
  } catch (error) {
    console.error('Error al obtener tipos de atención:', error);
    throw error;
  }
};

import axios from 'axios';

// URL base para las APIs de atención

export interface CanalComunicacion {
  idCanal: number;
  nombre: string;
  descripcion?: string;
}

export const getCanalesComunicacion = async (): Promise<{ data: CanalComunicacion[] }> => {
  try {
    const response = await axios.get(`/api/proxy?service=atencion&path=canales-comunicacion`);
    
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
    console.warn('Formato de respuesta desconocido para canales de comunicación:', response.data);
    return { data: [] };
  } catch (error) {
    console.error('Error al obtener canales de comunicación:', error);
    throw error;
  }
};

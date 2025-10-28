import axios from 'axios';

// URL base para las APIs de atención


export interface AtencionData {
  idPersona: number;
  idEmpresa: number;
  idUsuario: number;
  idCanal: number;
  idTipoAtencion: number;
  idEstadoAtencion: number;
  observaciones: string;
  
  // Propiedades alternativas en formato snake_case para compatibilidad
  id_persona?: number;
  id_empresa?: number;
  id_usuario?: number;
  id_canal?: number;
  id_tipo_atencion?: number;
  id_estado_atencion?: number;
}

export interface Atencion extends AtencionData {
  id_atencion: number;
  created_at: string;
  updated_at: string;
}

export const createAtencion = async (data: AtencionData): Promise<Atencion> => {
  try {
    // Verificar que el canal sea seleccionado
    const canalId = data.idCanal ? parseInt(String(data.idCanal)) : 0;
    
    if (canalId === 0 || isNaN(canalId)) {
      throw new Error('El canal de comunicación es requerido');
    }
    
    // Crear un objeto con el formato exacto que espera el backend
    // Según el nuevo formato requerido con prefijo id_
    const requestData = {
      id_persona: data.idPersona,
      id_empresa: data.idEmpresa,
      id_usuario: data.idUsuario,
      id_canal: data.idCanal,
      id_tipo_atencion: data.idTipoAtencion,
      id_estado_atencion: data.idEstadoAtencion,
      observaciones: data.observaciones || 'Observaciones de la atención'
    };
    
    
    
    // Enviar los datos con el formato correcto
    const response = await axios.post(`/api/proxy?service=atencion&path=atenciones`, requestData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    
    return response.data;
  } catch (error: any) {
    console.error('Error al crear atención:', error);
    if (error.response) {
      // La solicitud fue realizada y el servidor respondió con un código de estado
      // que cae fuera del rango 2xx
      console.error('Datos de respuesta de error:', error.response.data);
      console.error('Estado de error:', error.response.status);
      console.error('Cabeceras de error:', error.response.headers);
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor:', error.request);
    } else {
      // Algo sucedió al configurar la solicitud que desencadenó un error
      console.error('Error al configurar la solicitud:', error.message);
    }
    throw error;
  }
};

export const getAtenciones = async (page = 1, limit = 10, search = ''): Promise<{ data: Atencion[], meta: any }> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await axios.get(`/api/proxy?service=atencion&path=atenciones`, { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener atenciones:', error);
    throw error;
  }
};

export const getAtencionById = async (id: number): Promise<Atencion> => {
  try {
    const response = await axios.get(`/api/proxy?service=atencion&path=atenciones/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener atención con ID ${id}:`, error);
    throw error;
  }
};

export const getAtencionesByPersona = async (idPersona: number): Promise<Atencion[]> => {
  try {
    
    
    // Primera llamada para obtener la primera página y la metainformación de paginación
    const firstPageResponse = await axios.get(`/api/proxy?service=atencion&path=atenciones&page=1&limit=10`);
    
    const responseData = firstPageResponse.data;
    const totalPages = responseData.meta?.pages || 1;
    

    let allAtenciones: Atencion[] = [];

    // Extraer atenciones de la primera página
    if (responseData && Array.isArray(responseData.data)) {
      allAtenciones = responseData.data;
    } else {
      console.warn('Formato de respuesta inesperado en la primera página:', responseData);
    }

    // Si hay más páginas, obtenerlas concurrentemente
    if (totalPages > 1) {
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        
        pagePromises.push(axios.get(`/api/proxy?service=atencion&path=atenciones&page=${page}&limit=10`));
      }

      const responses = await Promise.all(pagePromises);

      responses.forEach((response, index) => {
        const pageData = response.data;
        if (pageData && Array.isArray(pageData.data)) {
          allAtenciones.push(...pageData.data);
        } else {
          console.warn(`No se encontraron atenciones en la página ${index + 2} o el formato es incorrecto.`);
        }
      });
    }

   
    // Filtrar todas las atenciones por idPersona en el cliente
    const atencionesFiltradas = allAtenciones.filter(atencion => {
      // Manejar ambos casos: idPersona y id_persona
      const atencionPersonaId = atencion.idPersona ?? atencion.id_persona;
      return atencionPersonaId === idPersona;
    });

    
    return atencionesFiltradas;

  } catch (error) {
    console.error(`Error al obtener atenciones para la persona con ID ${idPersona}:`, error);
    return []; // Devolver un array vacío en caso de error para evitar que la UI falle
  }
};

export const updateAtencion = async (idAtencion: number, data: Partial<AtencionData>): Promise<Atencion> => {
  try {
    const response = await axios.patch(`/api/proxy?service=atencion&path=atenciones/${idAtencion}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar la atención con ID ${idAtencion}:`, error);
    throw error;
  }
};

export const deleteAtencion = async (idAtencion: number): Promise<void> => {
  try {
    await axios.delete(`/api/proxy?service=atencion&path=atenciones/${idAtencion}`);
  } catch (error) {
    console.error(`Error al eliminar la atención con ID ${idAtencion}:`, error);
    throw error;
  }
};

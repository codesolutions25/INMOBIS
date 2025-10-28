import axios from 'axios';

// Interfaz para crear una nueva imagen
export interface PropiedadImagenData {
  idPropiedad: number;
  urlImagen: string;
  descripcion: string;
}

// Interfaz para la respuesta de la API
export interface PropiedadImagen {
  idPropiedadImagenes: number;
  idPropiedad: number;
  urlImagen: string;
  descripcion: string;
  createdAt: string;
}

// Crear una nueva imagen para una propiedad
export const createPropiedadImagen = async (data: PropiedadImagenData): Promise<PropiedadImagen> => {
  try {
    
    
    // Convertir de camelCase a snake_case para el backend
    const snakeCaseData = {
      id_propiedad: data.idPropiedad,
      url_imagen: data.urlImagen,
      descripcion: data.descripcion
    };
    

    
    const response = await axios.post(`/api/proxy?service=inmobiliaria&path=propiedad-imagenes`, snakeCaseData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    
    return response.data;
  } catch (error: any) {
    console.error('Error al crear imagen de propiedad:', error);
    if (error.response) {
      // La solicitud fue realizada y el servidor respondió con un código de estado
      // que cae fuera del rango 2xx
      console.error('Datos de error:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      console.error('No se recibió respuesta:', error.request);
    } else {
      // Algo sucedió en la configuración de la solicitud que desencadenó un error
      console.error('Error de configuración:', error.message);
    }
    throw error;
  }
};

// Obtener todas las imágenes de una propiedad con paginación
export const getPropiedadImagenes = async (idPropiedad: number, page = 1, limit = 10): Promise<{ data: PropiedadImagen[], meta: { total: number, page: number, limit: number, pages: number } }> => {
  try {
    const response = await axios.get(`/api/proxy?service=inmobiliaria&path=propiedad-imagenes/propiedad/${idPropiedad}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener imágenes de la propiedad ${idPropiedad}:`, error);
    throw error;
  }
};

// Eliminar una imagen de propiedad (método general)
export const deletePropiedadImagen = async (idPropiedadImagen: number): Promise<void> => {
  try {
    await axios.delete(`/api/proxy?service=inmobiliaria&path=propiedad-imagenes/${idPropiedadImagen}`);
  } catch (error) {
    console.error(`Error al eliminar imagen de propiedad ${idPropiedadImagen}:`, error);
    throw error;
  }
};

// Eliminar una imagen específica de una propiedad
export const deletePropiedadImagenFromPropiedad = async (idPropiedad: number, idPropiedadImagen: number): Promise<void> => {
  try {
    await axios.delete(`/api/proxy?service=inmobiliaria&path=propiedad-imagenes/propiedad/${idPropiedad}/imagen/${idPropiedadImagen}`);
  } catch (error) {
    console.error(`Error al eliminar imagen ${idPropiedadImagen} de la propiedad ${idPropiedad}:`, error);
    throw error;
  }
};

// Establecer una imagen como principal
export const setImagenPrincipal = async (idPropiedadImagen: number, idPropiedad: number): Promise<void> => {
  try {
    await axios.patch(`/api/proxy?service=inmobiliaria&path=propiedad-imagenes/${idPropiedadImagen}/principal`, { idPropiedad: idPropiedad });
  } catch (error) {
    console.error(`Error al establecer imagen ${idPropiedadImagen} como principal:`, error);
    throw error;
  }
};

import axios from 'axios';

// Interfaz para crear una nueva imagen
export interface ProyectoImagenData {
  idProyectoInmobiliario: number;
  urlImagen: string;
  descripcion: string;
}

// Interfaz para la respuesta de la API
export interface ProyectoImagen {
  idProyectosImagenes: number;
  idProyectoInmobiliario: number;
  urlImagen: string;
  descripcion: string;
  createdAt: string;
}

// Crear una nueva imagen para un proyecto
export const createProyectoImagen = async (data: ProyectoImagenData): Promise<ProyectoImagen> => {
  try {
    
    // Convertir de camelCase a snake_case para el backend
    const snakeCaseData = {
      id_proyecto_inmobiliario: data.idProyectoInmobiliario,
      url_imagen: data.urlImagen,
      descripcion: data.descripcion
    };
    
     
    const response = await axios.post(`/api/proxy?service=inmobiliaria&path=proyectos-imagenes`, snakeCaseData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error al crear imagen de proyecto:', error);
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

// Obtener todas las imágenes de un proyecto con paginación
export const getProyectoImagenes = async (idProyecto: number, page = 1, limit = 10): Promise<{ data: ProyectoImagen[], meta: { total: number, page: number, limit: number, pages: number } }> => {
  try {
    const response = await axios.get(`/api/proxy?service=inmobiliaria&path=proyectos-imagenes/proyecto/${idProyecto}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener imágenes del proyecto ${idProyecto}:`, error);
    throw error;
  }
};

// Eliminar una imagen de proyecto (método general)
export const deleteProyectoImagen = async (idProyectoImagen: number): Promise<void> => {
  try {
    await axios.delete(`/api/proxy?service=inmobiliaria&path=proyectos-imagenes/${idProyectoImagen}`);
  } catch (error) {
    console.error(`Error al eliminar imagen de proyecto ${idProyectoImagen}:`, error);
    throw error;
  }
};

// Eliminar una imagen específica de un proyecto
export const deleteProyectoImagenFromProyecto = async (idProyecto: number, idProyectoImagen: number): Promise<void> => {
  try {
    await axios.delete(`/api/proxy?service=inmobiliaria&path=proyectos-imagenes/proyecto/${idProyecto}/imagen/${idProyectoImagen}`);
  } catch (error) {
    console.error(`Error al eliminar imagen ${idProyectoImagen} del proyecto ${idProyecto}:`, error);
    throw error;
  }
};

// Establecer una imagen como principal
export const setImagenPrincipal = async (idProyectoImagen: number, idProyecto: number): Promise<void> => {
  try {
    await axios.patch(`/api/proxy?service=inmobiliaria&path=proyectos-imagenes/${idProyectoImagen}/principal`, { idProyectoInmobiliario: idProyecto });
  } catch (error) {
    console.error(`Error al establecer imagen ${idProyectoImagen} como principal:`, error);
    throw error;
  }
};

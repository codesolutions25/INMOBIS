import axios from 'axios';



export interface AtencionPropiedadData {
  id_atencion: number;
  id_propiedad: number;
  fecha_registro: string; // Fecha en formato ISO
  observaciones: string;
}

// Crear una nueva atención de propiedad
export const crearAtencionPropiedad = async (data: AtencionPropiedadData) => {
  try {
    console.log('Datos enviados a la API:', data);
    
    // Asegurar que la URL tenga el formato correcto
    const url = `/api/proxy?service=inmobiliaria&path=atencion-propiedad`;
    console.log('URL completa:', url);
    
    const response = await axios.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error('Error al crear atención de propiedad:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

// Obtener todas las atenciones de propiedades
export const getAtencionesPropiedades = async () => {
  try {
    let allData: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    // Obtener todas las páginas
    while (hasMorePages) {
      const response = await axios.get(`/api/proxy?service=inmobiliaria&path=atencion-propiedad&page=${currentPage}&limit=100`);
      
      const responseData = response.data;
      
      // Extraer datos de la página actual
      let pageData = [];
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        pageData = responseData.data;
        
        // Verificar si hay más páginas
        if (responseData.meta) {
          const { page, pages } = responseData.meta;
          hasMorePages = page < pages;
        } else {
          hasMorePages = pageData.length === 100;
        }
      } else if (Array.isArray(responseData)) {
        pageData = responseData;
        hasMorePages = false;
      } else {
        hasMorePages = false;
      }
      
      allData = [...allData, ...pageData];
      
      if (pageData.length === 0) {
        hasMorePages = false;
      }
      
      currentPage++;
      
      if (currentPage > 100) {
        console.warn('Deteniendo obtención después de 100 páginas');
        hasMorePages = false;
      }
    }
    
    return { data: allData, total: allData.length };
  } catch (error: any) {
    console.error('Error al obtener atenciones de propiedad:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

// Obtener propiedades asociadas a una atención específica
export const getPropiedadesPorAtencion = async (idAtencion: number) => {
  try {
    let allData: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    // Obtener todas las páginas
    while (hasMorePages) {
      const response = await axios.get(`/api/proxy?service=inmobiliaria&path=atencion-propiedad&page=${currentPage}&limit=100`);
      
      const responseData = response.data;
      
      // Extraer datos de la página actual
      let pageData = [];
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        pageData = responseData.data;
        
        // Verificar si hay más páginas
        if (responseData.meta) {
          const { page, pages } = responseData.meta;
          hasMorePages = page < pages;
        } else {
          hasMorePages = pageData.length === 100; // Si obtuvimos el límite, podría haber más
        }
      } else if (Array.isArray(responseData)) {
        pageData = responseData;
        hasMorePages = false; // Sin paginación
      } else {
        console.warn('La respuesta de la API no contiene un array de datos:', responseData);
        hasMorePages = false;
      }
      
      // Agregar datos de esta página al total
      allData = [...allData, ...pageData];
      
      // Si no hay datos en esta página, detener
      if (pageData.length === 0) {
        hasMorePages = false;
      }
      
      currentPage++;
     
    }
    
    
    
    // Filtrar las atenciones-propiedades que corresponden a la atención especificada
    const propiedadesFiltradas = allData.filter((item: any) => {
      const idAtencionItem = item.id_atencion || item.idAtencion;
      return idAtencionItem === idAtencion;
    });
    
    return propiedadesFiltradas;
  } catch (error: any) {
    console.error('Error al obtener propiedades por atención:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    return [];
  }
};

// Obtener una atención de propiedad por ID
export const getAtencionPropiedadPorId = async (id: number) => {
  try {
    const response = await axios.get(`/api/proxy?service=inmobiliaria&path=atencion-propiedad/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener atención de propiedad por ID:', error);
    throw error;
  }
};

// Actualizar una atención de propiedad
export const actualizarAtencionPropiedad = async (id: number, data: Partial<AtencionPropiedadData>) => {
  try {
    const response = await axios.patch(`/api/proxy?service=inmobiliaria&path=atencion-propiedad/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error al actualizar atención de propiedad:', error);
    throw error;
  }
};

// Eliminar una atención de propiedad
export const eliminarAtencionPropiedad = async (id: number) => {
  try {
    const response = await axios.delete(`/api/proxy?service=inmobiliaria&path=atencion-propiedad/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error al eliminar atención de propiedad:', error);
    throw error;
  }
};

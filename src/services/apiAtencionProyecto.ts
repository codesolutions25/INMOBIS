import axios from 'axios';



export interface AtencionProyectoData {
  id_atencion: number;
  id_proyecto_inmobiliario: number;
  fecha_registro: string; // Fecha en formato ISO
  observaciones: string;
}

// Crear una nueva atención de proyecto
export const crearAtencionProyecto = async (data: AtencionProyectoData) => {
  try {
    
    // Asegurar que la URL tenga el formato correcto
    // Modificar la ruta para usar el formato correcto según la API
    const url = `/api/proxy?service=inmobiliaria&path=atencion-proyecto`;
    console.log('URL completa:', url);
    
    const response = await axios.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error('Error al crear atención de proyecto:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

// Obtener todas las atenciones de proyectos
export const getAtencionesProyecto = async () => {
  try {
    let allData: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    // Obtener todas las páginas
    while (hasMorePages) {
      const response = await axios.get(`/api/proxy?service=inmobiliaria&path=atencion-proyecto&page=${currentPage}&limit=100`);
      
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
    }
    
    return { data: allData, total: allData.length };
  } catch (error: any) {
    console.error('Error al obtener atenciones de proyecto:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

// Obtener proyectos asociados a una atención específica
export const getProyectosPorAtencion = async (idAtencion: number) => {
  try {
    let allData: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    // Obtener todas las páginas
    while (hasMorePages) {
      const response = await axios.get(`/api/proxy?service=inmobiliaria&path=atencion-proyecto&page=${currentPage}&limit=100`);
      
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
      
      // Protección contra bucles infinitos
      if (currentPage > 100) {
        console.warn('Deteniendo obtención después de 100 páginas');
        hasMorePages = false;
      }
    }
  
    // Filtramos para encontrar las que corresponden a la atención especificada
    const proyectosDeAtencion = allData.filter(
      (item: any) => {
        // Convertimos ambos valores a número para comparar
        const itemIdAtencion = Number(item.id_atencion || item.idAtencion);
        const targetIdAtencion = Number(idAtencion);
        return !isNaN(itemIdAtencion) && !isNaN(targetIdAtencion) && itemIdAtencion === targetIdAtencion;
      }
    );
    
    return proyectosDeAtencion;
  } catch (error: any) {
    console.error(`Error al obtener proyectos para la atención ${idAtencion}:`, error);
    console.error('Detalles del error:', error.response?.data || error.message);
    return []; // Retornar array vacío en caso de error para facilitar el manejo
  }
};

// Obtener una atención de proyecto por ID
export const getAtencionProyectoPorId = async (id: number) => {
  try {
    const response = await axios.get(`/api/proxy?service=inmobiliaria&path=atencion-proyecto/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener atención de proyecto:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

// Actualizar una atención de proyecto
export const actualizarAtencionProyecto = async (id: number, data: Partial<AtencionProyectoData>) => {
  try {
    const response = await axios.patch(`/api/proxy?service=inmobiliaria&path=atencion-proyecto/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error al actualizar atención de proyecto:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

// Eliminar una atención de proyecto
export const eliminarAtencionProyecto = async (id: number) => {
  try {
    const response = await axios.delete(`/api/proxy?service=inmobiliaria&path=atencion-proyecto/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error al eliminar atención de proyecto:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

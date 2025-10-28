import { FILES_API_URL, FETCH_OPTIONS } from '@/config/constants';

/**
 * Busca una imagen por su URL para obtener su ID
 * @param urlImagen - URL de la imagen a buscar
 * @returns Promise con el ID de la imagen o null si no se encuentra
 */
export const buscarImagenPorUrl = async (urlImagen: string): Promise<number | null> => {
  try {
    console.log('Iniciando búsqueda de imagen con URL:', urlImagen);

    let currentPage = 1;
    let totalPages = 1; // Asumimos al menos una página para iniciar el bucle
    const limit = 100; // Un límite razonable por página para no sobrecargar la API

    do {
      const url = `${FILES_API_URL}/imagenes?page=${currentPage}&limit=${limit}`;
      console.log(`Consultando página ${currentPage}/${totalPages}... URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        console.error(`Error al buscar imágenes en la página ${currentPage}:`, response.status, response.statusText);
        // Si una página falla, es mejor detener la búsqueda para evitar resultados parciales.
        return null;
      }

      const data = await response.json();

      // Actualizamos el total de páginas en la primera iteración
      if (currentPage === 1 && data.meta?.pages) {
        totalPages = data.meta.pages;
        console.log(`Total de páginas detectadas: ${totalPages}`);
      }

      if (data.data && Array.isArray(data.data)) {
        // Buscamos la imagen que coincida con la URL en la página actual
        const imagen = data.data.find((img: any) => {
          if (!img.ruta) return false;
          // Normalizar URLs para una comparación más robusta
          const urlNormalizada = urlImagen.replace(/^https?:\/\//, '').replace(/^localhost/, '');
          const rutaNormalizada = img.ruta.replace(/^https?:\/\//, '').replace(/^localhost/, '');
          return rutaNormalizada.includes(urlNormalizada) || urlNormalizada.includes(rutaNormalizada);
        });

        if (imagen) {
          console.log('¡Imagen encontrada!:', imagen);
          return imagen.idImagen; // Devolvemos el ID tan pronto como la encontramos
        }
      }

      currentPage++;
    } while (currentPage <= totalPages);

    console.log('Búsqueda finalizada. No se encontró ninguna imagen con la URL proporcionada en todas las páginas.');
    return null;

  } catch (error) {
    console.error('Error fatal durante la búsqueda de imagen por URL:', error);
    return null;
  }
};

/**
 * Elimina un archivo del microservicio de archivos
 * @param rutaArchivo - Ruta del archivo a eliminar
 * @returns Promise con la respuesta del servidor
 */
export const deleteArchivo = async (rutaArchivo: string): Promise<boolean> => {
  try {
    console.log('Iniciando eliminación de archivo con URL:', rutaArchivo);
    
    // 1. Primero buscamos la imagen por su URL para obtener su ID
    const idImagen = await buscarImagenPorUrl(rutaArchivo);
    
    if (!idImagen) {
      console.error('No se pudo encontrar la imagen con la URL proporcionada');
      return false;
    }
    
    console.log('ID de imagen encontrado:', idImagen);
    
    // 2. Ahora eliminamos la imagen usando su ID
    const deleteUrl = `${FILES_API_URL}/imagenes/${idImagen}`;
    console.log('URL para eliminar imagen por ID:', deleteUrl);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      ...FETCH_OPTIONS
    });
    
    console.log('Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'No se pudo leer el mensaje de error';
      }
      console.error(`Error al eliminar archivo (${response.status}):`, errorText);
      return false;
    }
    
    console.log('Imagen eliminada exitosamente del microservicio de archivos');
    return true;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
};

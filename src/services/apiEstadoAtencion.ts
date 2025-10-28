
export interface EstadoAtencion {
  idEstadoAtencion: number;
  nombre: string;
  descripcion?: string;
}

export const getEstadoAtencion = async (search: string = ''): Promise<EstadoAtencion[]> => {
  try {
    const firstPageUrl = `/api/proxy?service=atencion&path=estado-atencion&page=1&limit=100` + (search ? `&search=${encodeURIComponent(search)}` : '');
    const firstPageResponse = await fetch(firstPageUrl);
    if (!firstPageResponse.ok) {
      throw new Error('Error al obtener la primera página de estados de atención');
    }
    const firstPageData = await firstPageResponse.json();

    const allEstados: EstadoAtencion[] = firstPageData.data || [];
    const totalPages = firstPageData.meta?.pages || 1;

    if (totalPages > 1) {
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `/api/proxy?service=atencion&path=estado-atencion&page=${page}&limit=100` + (search ? `&search=${encodeURIComponent(search)}` : '');
        pagePromises.push(fetch(pageUrl));
      }

      const responses = await Promise.all(pagePromises);

      for (const response of responses) {
        if (response.ok) {
          const pageData = await response.json();
          if (pageData.data && Array.isArray(pageData.data)) {
            allEstados.push(...pageData.data);
          }
        } else {
          console.warn(`Error al obtener una página de estados de atención: ${response.statusText}`);
        }
      }
    }

    return allEstados;
  } catch (error) {
    console.error('Error al obtener estados de atención:', error);
    return [];
  }
};

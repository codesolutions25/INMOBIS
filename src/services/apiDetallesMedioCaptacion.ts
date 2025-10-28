import { DetalleMedioCaptacion } from '@/types/detalleMedioCaptacion';

export const getDetallesMedioCaptacion = async (): Promise<DetalleMedioCaptacion[]> => {
    try {
        const firstPageResponse = await fetch(`/api/proxy?service=atencion&path=detalle-medios-captacion&page=1&limit=100`);
        if (!firstPageResponse.ok) {
            throw new Error('Error al obtener la primera página de detalles de medios de captación');
        }
        const firstPageData = await firstPageResponse.json();

        let allDetalles: any[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=atencion&path=detalle-medios-captacion&page=${page}&limit=100`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allDetalles.push(...pageData.data);
                    }
                } else {
                    console.warn(`Error al obtener una página de detalles de medios de captación: ${response.statusText}`);
                }
            }
        }

        return allDetalles.map((detalle: any) => ({
            idDetalleMedioCaptacion: detalle.idDetalleMedioCaptacion,
            idMedioCaptacion: detalle.idMedioCaptacion,
            nombre: detalle.servicio || detalle.nombre || 'Sin descripción'
        }));
    } catch (error) {
        console.error('Error en getDetallesMedioCaptacion:', error);
        return [];
    }
};

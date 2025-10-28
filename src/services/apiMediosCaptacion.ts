import { MedioCaptacion } from '@/types/medioCaptacion';

export const getMediosCaptacion = async (): Promise<MedioCaptacion[]> => {
    try {
        const firstPageResponse = await fetch(`/api/proxy?service=atencion&path=medios-captacion&page=1&limit=100`);
        if (!firstPageResponse.ok) {
            if (firstPageResponse.status === 404) return [];
            throw new Error('Error al obtener la primera página de medios de captación');
        }
        const firstPageData = await firstPageResponse.json();

        const allMedios: MedioCaptacion[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=atencion&path=medios-captacion&page=${page}&limit=100`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allMedios.push(...pageData.data);
                    }
                } else {
                    console.warn(`Error al obtener una página de medios de captación: ${response.statusText}`);
                }
            }
        }

        return allMedios;
    } catch (error) {
        console.error('Error en getMediosCaptacion:', error);
        return [];
    }
};

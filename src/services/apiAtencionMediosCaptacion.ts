import { AtencionMedioCaptacion } from "@/types/atencionMediosCaptacion";

export const getMediosCaptacionByPersona = async (idPersona: number): Promise<AtencionMedioCaptacion[]> => {
    if (!idPersona) return [];

    try {
        const firstPageResponse = await fetch(`/api/proxy?service=atencion&path=persona-medio-captacion&page=1&limit=100`);
        if (!firstPageResponse.ok) {
            if (firstPageResponse.status === 404) return [];
            throw new Error('Error al obtener la primera página de medios de captación');
        }

        const firstPageData = await firstPageResponse.json();
        const totalPages = firstPageData.meta?.pages || 1;
        let allMedios: AtencionMedioCaptacion[] = firstPageData.data || [];

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=atencion&path=persona-medio-captacion&page=${page}&limit=100`));
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

        const filteredData = allMedios.filter((mc: any) => mc.idPersona === idPersona);
        return filteredData;

    } catch (error) {
        console.error('Error en getMediosCaptacionByPersona:', error);
        return [];
    }
};

export const createAtencionMedioCaptacion = async (datos: { idPersona: number; idMedioCaptacion: number; idDetalleMedioCaptacion: number }): Promise<any> => {
    try {
        // Transformar los nombres de los campos a los que espera la API
        const datosFormateados = {
            id_persona: datos.idPersona,
            id_medio_captacion: datos.idMedioCaptacion,
            id_detalle_medio_captacion: datos.idDetalleMedioCaptacion
        };

        const response = await fetch(`/api/proxy?service=atencion&path=persona-medio-captacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosFormateados),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al registrar el medio de captación');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en createAtencionMedioCaptacion:', error);
        throw error;
    }
};

export const updateMedioCaptacion = async (id: number, data: any): Promise<any> => {
    try {
        const response = await fetch(`/api/proxy?service=atencion&path=persona-medio-captacion/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el medio de captación');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en updateMedioCaptacion:', error);
        throw error;
    }
};

export const deleteMedioCaptacion = async (idPersonaMedioCaptacion: number): Promise<void> => {
    try {
        const response = await fetch(`/api/proxy?service=atencion&path=persona-medio-captacion/${idPersonaMedioCaptacion}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al eliminar el medio de captación con ID ${idPersonaMedioCaptacion}`);
        }
    } catch (error) {
        console.error('Error en deleteMedioCaptacion:', error);
        throw error;
    }
};

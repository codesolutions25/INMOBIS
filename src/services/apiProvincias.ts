import { Provincia } from "@/types/provincias"

export async function getProvincias(): Promise<Provincia[]> {
    try {
        const firstPageResponse = await fetch(`/api/proxy?service=config&path=provincias&page=1&limit=1000`);
        const firstPageData = await firstPageResponse.json();

        let allProvincias: Provincia[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=config&path=provincias&page=${page}&limit=1000`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allProvincias.push(...pageData.data);
                    }
                }
            }
        }

        return allProvincias;
    } catch (error) {
        console.error('Error en getProvincias:', error);
        return [];
    }
}
//comentario

export async function createProvincia(provinciaData: Partial<Provincia>): Promise<void> {
    const response = await fetch(`/api/proxy?service=config&path=provincias`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(provinciaData),
    })

    if (!response.ok) {
        throw new Error("Error al crear provincia");
    }
    const data = await response.json()
    alert(data.error)
}

import { Distrito } from "@/types/distritos"



export async function getDistritos(): Promise<Distrito[]> {
    try {
        const firstPageResponse = await fetch(`/api/proxy?service=config&path=distritos&page=1&limit=100`);
        const firstPageData = await firstPageResponse.json();

        let allDistritos: Distrito[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=config&path=distritos&page=${page}&limit=100`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allDistritos.push(...pageData.data);
                    }
                }
            }
        }

        return allDistritos;
    } catch (error) {
        console.error('Error en getDistritos:', error);
        return [];
    }
}

export async function createDistrito(distritoData: Partial<Distrito>): Promise<void> {
    const response = await fetch(`/api/proxy?service=config&path=distritos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(distritoData),
    })

    if (!response.ok) {
        throw new Error("Error al crear distrito");
    }
    const data = await response.json()
    alert(data.error)
}

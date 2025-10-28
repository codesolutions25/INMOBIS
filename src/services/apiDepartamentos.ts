import { Departamento } from "@/types/departamentos"

export async function getDepartamentos(): Promise<Departamento[]> {
    try {
        const firstPageResponse = await fetch(`/api/proxy?service=config&path=departamentos&page=1&limit=1000`);
        const firstPageData = await firstPageResponse.json();

        let allDepartamentos: Departamento[] = firstPageData.data || [];
        const totalPages = firstPageData.meta?.pages || 1;

        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetch(`/api/proxy?service=config&path=departamentos&page=${page}&limit=1000`));
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
                if (response.ok) {
                    const pageData = await response.json();
                    if (pageData.data && Array.isArray(pageData.data)) {
                        allDepartamentos.push(...pageData.data);
                    }
                }
            }
        }

        return allDepartamentos;
    } catch (error) {
        console.error('Error en getDepartamentos:', error);
        return [];
    }
}

export async function createDepartamento(departamentoData: Partial<Departamento>): Promise<void> {
    const response = await fetch(`/api/proxy?service=config&path=departamentos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(departamentoData),
    })

    if (!response.ok) {
        throw new Error("Error al crear departamento");
    }
    const data = await response.json()
    alert(data.error)
}

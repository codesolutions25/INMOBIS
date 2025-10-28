import { Persona } from "@/types/persona"



// Helper function to handle API responses consistently
const handleApiResponse = async (response: Response) => {
    const responseText = await response.text();
    
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Server response is not valid JSON: ${responseText}`);
    }
    
    if (!response.ok) {
        let errorMessage = 'Unknown error';
        if (data?.message) {
            errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else if (data?.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    return data;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        currentPage: number;
        totalPages: number;
        perPage: number;
    };
}

export async function getPersonas(
    page: number = 1, 
    perPage: number = 5000, 
    search?: string
): Promise<PaginatedResponse<Persona>> {
   
    try {
        let url = `/api/proxy?service=auth&path=personas&page=${page}&limit=${perPage}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        const response = await fetch(url, {
            credentials: 'include',
        });

        const data = await handleApiResponse(response);

        return {
            data: data.data || [],
            meta: {
                total: data.meta?.total || 0,
                currentPage: data.meta?.page || page,
                totalPages: data.meta?.pages || 1,
                perPage: data.meta?.limit || perPage
            }
        };
    } catch (error) {
        return {
            data: [],
            meta: {
                total: 0,
                currentPage: page,
                totalPages: 1,
                perPage: perPage
            }
        };
    }
}

export async function getPersona(id: number): Promise<Persona> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=personas/${id}`, {
            credentials: 'include',
        });

        const responseText = await response.text();
       
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            const errorMessage = data?.message || data?.error || response.statusText;
            throw new Error(errorMessage);
        }

        // Return the data directly if it's already the persona object
        if (data && (data.nombre || data.idPersona)) {
            return data;
        }
        
        // Otherwise try to get the data from the data property
        if (data && data.data) {
            return data.data;
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export async function createPersona(personaData: Partial<Persona>): Promise<Persona> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=personas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(personaData),
            credentials: 'include',
        });

        const data = await handleApiResponse(response);
        return data.data;
    } catch (error) {
        throw error;
    }
}

export async function updatePersona(id: number, personaData: Record<string, any>): Promise<Persona> {
    try {
        
        const response = await fetch(`/api/proxy?service=auth&path=personas/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(personaData),
            credentials: 'include',
        });


        const responseText = await response.text();

        let data;
        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            const errorMessage = data?.message || data?.error || response.statusText;
            throw new Error(errorMessage);
        }


        // Return the data directly if it's already the persona object
        if (data && (data.nombre || data.idPersona)) {
            return data;
        }
        
        // Otherwise try to get the data from the data property
        if (data && data.data) {
            return data.data;
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export async function deletePersona(id: number): Promise<void> {
    try {
        const response = await fetch(`/api/proxy?service=auth&path=personas/${id}`, {
            method: "DELETE",
            credentials: 'include',
        });

        await handleApiResponse(response);
    } catch (error) {
        throw error;
    }
}

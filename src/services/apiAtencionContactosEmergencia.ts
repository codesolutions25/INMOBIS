import { AtencionContactoEmergencia } from '@/types/atencionContactosEmergencia';
import { getPersona } from './apiPersona';


export const getContactosEmergenciaByPersona = async (idPersonaAtencion: number): Promise<AtencionContactoEmergencia[]> => {
  try {
    const firstPageResponse = await fetch(`/api/proxy?service=atencion&path=atencion-contactos-emergencia&page=1&limit=100`);
    if (!firstPageResponse.ok) {
      throw new Error('Error al obtener los contactos de emergencia');
    }

    const firstPageData = await firstPageResponse.json();
    const totalPages = firstPageData.meta?.pages || 1;
    let allContacts: AtencionContactoEmergencia[] = firstPageData.data || [];

    if (totalPages > 1) {
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(fetch(`/api/proxy?service=atencion&path=atencion-contactos-emergencia&page=${page}&limit=100`));
      }

      const responses = await Promise.all(pagePromises);

      for (const response of responses) {
        if (response.ok) {
          const pageData = await response.json();
          if (pageData.data && Array.isArray(pageData.data)) {
            allContacts.push(...pageData.data);
          }
        } else {
          console.warn(`Error al obtener una página de contactos: ${response.statusText}`);
        }
      }
    }

    return allContacts.filter(c => c.idPersonaAtencion === idPersonaAtencion);
  } catch (error) {
    console.error('Error al obtener contactos de emergencia por persona:', error);
    return [];
  }
};

export const getDetallesContactosEmergencia = async (idPersonaAtencion: number): Promise<any[]> => {
  try {
    const contactosRelacion = await getContactosEmergenciaByPersona(idPersonaAtencion);

    if (contactosRelacion.length === 0) {
      return [];
    }

    const promesas = contactosRelacion.map(async (relacion) => {
      const persona = await getPersona(relacion.idPersonaContactoEmergencia);
      return {
        ...persona, // Datos de la persona (nombre, etc.)
        idAtencionContactoEmergencia: relacion.idAtencionContactoEmergencia, // ID de la relación para poder borrar
      };
    });

    return Promise.all(promesas);
  } catch (error) {
    console.error('Error al obtener los detalles de los contactos:', error);
    return [];
  }
};

export const createContactoEmergencia = async (data: Omit<AtencionContactoEmergencia, 'idAtencionContactoEmergencia'>): Promise<AtencionContactoEmergencia> => {
  // El backend espera una estructura plana con snake_case según la documentación
  const body = {
    id_persona_atencion: data.idPersonaAtencion,
    id_persona_contacto_emergencia: data.idPersonaContactoEmergencia,
  };

  const response = await fetch(`/api/proxy?service=atencion&path=atencion-contactos-emergencia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error creating contacto de emergencia:', errorBody);
    throw new Error('Error al crear el contacto de emergencia');
  }

  return await response.json();
};

export const deleteContactoEmergencia = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/proxy?service=atencion&path=atencion-contactos-emergencia/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      // Si la respuesta no es exitosa, intenta leer el cuerpo para más detalles
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      throw new Error('Error al eliminar el contacto de emergencia');
    }
    // Si la respuesta es 200 OK, no se necesita hacer nada más, ya que no hay cuerpo.
  } catch (error) {
    console.error(error);
    throw error;
  }
};

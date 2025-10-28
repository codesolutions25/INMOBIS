// Tipos para la API de reservas



export interface ReservaPropiedad {
  id_reservas_propiedad?: number;
  id_cliente_inmobiliario: number;
  id_propiedad: number;
  id_cotizaciones: number;
  fecha_reserva: string;
  monto_reserva: number;
  estado_reserva: string;
  observaciones: string;
  fecha_creacion?: string;
}

export interface CreateReservaPropiedadDto {
  id_cliente_inmobiliario: number;
  id_propiedad: number;
  id_cotizaciones: number;
  fecha_reserva: string;
  monto_reserva: number;
  estado_reserva: string;
  observaciones: string;
}

// Crear una nueva reserva de propiedad
export const crearReservaPropiedad = async (reservaData: CreateReservaPropiedadDto): Promise<ReservaPropiedad> => {
  try {
    
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error al crear reserva de propiedad:', error);
    throw error;
  }
};

// Obtener todas las reservas y filtrar por cotización localmente
export const getReservasPorCotizacion = async (idCotizacion: number): Promise<ReservaPropiedad[]> => {
  try {
    
    
    // Obtener todas las reservas
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad&page=1&limit=10`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Manejar el formato de respuesta que vimos en las capturas
    // {"data": [{...}], "meta": {...}}
    const reservas = result.data && Array.isArray(result.data) ? result.data : [];
    
    
    // Filtrar localmente por id_cotizaciones
    // Nota: Basado en las capturas, parece que el campo se llama "id_cotizaciones" (con s al final)
    const reservasFiltradas = reservas.filter((reserva: any) => {
      // Intentar comparar por id_cotizaciones si existe
      if (reserva.id_cotizaciones && Number(reserva.id_cotizaciones) === idCotizacion) {
        return true;
      }
      
      return false;
    });
    
    
    
    // Mapear los campos al formato esperado por el frontend
    return reservasFiltradas.map((reserva: any) => ({
      id_reserva_propiedad: reserva.idReservaPropiedad,
      id_cliente_inmobiliario: reserva.idClienteInmobiliario,
      id_propiedad: reserva.idPropiedad,
      id_cotizaciones: Number(reserva.id_cotizaciones),
      fecha_reserva: reserva.fechaReserva,
      monto_reserva: reserva.montoReserva,
      estado_reserva: reserva.estadoReserva,
      observaciones: reserva.observaciones,
      fecha_creacion: reserva.fechaCreacion
    }));
  } catch (error) {
    console.error('Error al obtener reservas por cotización:', error);
    return [];
  }
};

// Obtener reserva por ID
export const getReservaPorId = async (idReserva: number): Promise<ReservaPropiedad | null> => {
  try {
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad/${idReserva}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error al obtener reserva por ID:', error);
    return null;
  }
};

// Verificar si una propiedad ya tiene reservas activas
export const verificarReservaActivaPropiedad = async (idPropiedad: number): Promise<boolean> => {
  try {
    
    
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad&page=1&limit=100`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const reservas = result.data && Array.isArray(result.data) ? result.data : [];
    
    // Buscar reservas activas (pendiente) para esta propiedad
    const reservaActiva = reservas.find((reserva: any) => {
      const propiedadId = reserva.idPropiedad || reserva.id_propiedad;
      const estado = reserva.estadoReserva || reserva.estado_reserva;
      
      return Number(propiedadId) === idPropiedad && estado === 'pendiente';
    });
    
    const tieneReservaActiva = !!reservaActiva;
    
    
    return tieneReservaActiva;
  } catch (error) {
    console.error('💥 Error al verificar reserva activa de propiedad:', error);
    return false;
  }
};

// Verificar si un cliente ya tiene una reserva activa para una propiedad
export const verificarReservaClientePropiedad = async (idCliente: number, idPropiedad: number): Promise<boolean> => {
  try {
    
    
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad&page=1&limit=100`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const reservas = result.data && Array.isArray(result.data) ? result.data : [];
    
    // Buscar reservas activas del cliente para esta propiedad
    const reservaExistente = reservas.find((reserva: any) => {
      const clienteId = reserva.idClienteInmobiliario || reserva.id_cliente_inmobiliario;
      const propiedadId = reserva.idPropiedad || reserva.id_propiedad;
      const estado = reserva.estadoReserva || reserva.estado_reserva;
      
      return Number(clienteId) === idCliente && 
             Number(propiedadId) === idPropiedad && 
             estado === 'pendiente';
    });
    
    const tieneReserva = !!reservaExistente;
    
    return tieneReserva;
  } catch (error) {
    console.error('💥 Error al verificar reserva cliente-propiedad:', error);
    return false;
  }
};

// Actualizar estado de reserva
export const actualizarEstadoReserva = async (idReserva: number, nuevoEstado: string): Promise<ReservaPropiedad | null> => {
  try {
    
    
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad/${idReserva}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estado_reserva: nuevoEstado
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('💥 Error al actualizar estado de reserva:', error);
    throw error;
  }
};

// Obtener reservas por propiedad
export const getReservasPorPropiedad = async (idPropiedad: number): Promise<ReservaPropiedad[]> => {
  try {
    
    
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad&page=1&limit=1000`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const reservas = result.data && Array.isArray(result.data) ? result.data : [];
    
    // Filtrar por propiedad
    const reservasFiltradas = reservas.filter((reserva: any) => {
      const propiedadId = reserva.idPropiedad || reserva.id_propiedad;
      return Number(propiedadId) === idPropiedad;
    });
    
    
    
    // Mapear al formato esperado
    return reservasFiltradas.map((reserva: any) => {
      
      return {
        id_reservas_propiedad: reserva.idReservasPropiedad,
        id_cliente_inmobiliario: reserva.idClienteInmobiliario,
        id_propiedad: reserva.idPropiedad,
        id_cotizaciones: Number(reserva.idCotizaciones || 0),
        fecha_reserva: reserva.fechaReserva,
        monto_reserva: reserva.montoReserva,
        estado_reserva: reserva.estadoReserva,
        observaciones: reserva.observaciones,
        fecha_creacion: reserva.fechaCreacion
      };
    });
  } catch (error) {
    console.error('💥 Error al obtener reservas por propiedad:', error);
    return [];
  }
};

// Obtener todas las reservas del sistema
export const getAllReservas = async (): Promise<ReservaPropiedad[]> => {
  try {
    
    
    const response = await fetch(`/api/proxy?service=inmobiliaria&path=reservas-propiedad&page=1&limit=1000`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const reservas = result.data && Array.isArray(result.data) ? result.data : [];
    
    
    
    // Mapear al formato esperado - usar los nombres de campos que vienen de la API
    return reservas.map((reserva: any) => {
      
      
      return {
        id_reservas_propiedad: reserva.id_reservas_propiedad || reserva.idReservasPropiedad,
        id_cliente_inmobiliario: reserva.id_cliente_inmobiliario || reserva.idClienteInmobiliario,
        id_propiedad: reserva.id_propiedad || reserva.idPropiedad,
        id_cotizaciones: reserva.id_cotizaciones || reserva.idCotizaciones,
        fecha_reserva: reserva.fecha_reserva || reserva.fechaReserva,
        monto_reserva: reserva.monto_reserva || reserva.montoReserva,
        estado_reserva: reserva.estado_reserva || reserva.estadoReserva,
        observaciones: reserva.observaciones,
        fecha_creacion: reserva.fecha_creacion || reserva.fechaCreacion
      };
    });
  } catch (error) {
    console.error('💥 Error al obtener todas las reservas:', error);
    return [];
  }
};

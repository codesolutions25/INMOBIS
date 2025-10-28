import { PagoConMora } from "@/types/mora";

export interface ConfiguracionMora {
  id: number;
  idEmpresa: number;
  idTipoConfiguracion: number;
  valor: number;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  nombreEmpresa?: string;
  nombreTipoConfiguracion?: string;
}

/**
 * Calcula el monto de mora para una cuota vencida
 * @param idCuota - ID de la cuota a calcular mora
 * @param fechaPago - Fecha de pago en formato ISO string (opcional, por defecto usa la fecha actual)
 * @returns Promesa con el cálculo de mora
 */
export const calcularMoraCuota = async (
  idCuota: number,
  fechaPago: string = new Date().toISOString()
): Promise<PagoConMora> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=cuotas/${idCuota}/calcular-mora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fechaPago }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al calcular la mora');
    }

    return response.json();
  } catch (error) {
    console.error('Error al calcular mora:', error);
    throw error;
  }
};

/**
 * Calcula la mora para múltiples cuotas
 * @param idsCuotas - Array de IDs de cuotas
 * @returns Promesa con array de cálculos de mora
 */
export const calcularMoraMultiple = async (idsCuotas: number[]): Promise<PagoConMora[]> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=cuotas/calcular-mora-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idsCuotas }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al calcular mora múltiple');
    }

    return response.json();
  } catch (error) {
    console.error('Error al calcular mora múltiple:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración de mora activa para una empresa
 * @param idEmpresa - ID de la empresa
 * @returns Promesa con la configuración de mora
 */
const obtenerConfiguracionMoraActiva = async (idEmpresa?: number): Promise<number> => {
  try {
    if (!idEmpresa) {
      console.warn('No se proporcionó ID de empresa, buscando cualquier configuración activa');
    }
    
    // Obtener configuraciones activas para la empresa (si se proporciona)
    const configuraciones = await obtenerConfiguracionesMora(idEmpresa, true, 1, 1000);
    
    // Si la respuesta es un objeto con paginación, extraer el array de datos
    const configuracionesArray = Array.isArray(configuraciones) 
      ? configuraciones 
      : configuraciones?.data || [];
    
    const ahora = new Date();
    
    // Filtrar por empresa (si se proporcionó), fechas y estado asctivo
    const configActiva:any = configuracionesArray.find((c: any) => {
      const fechaInicio = new Date(c.aplicaDesdeDia);
      const fechaFin = c.aplicaHastaDia ? new Date(c.aplicaHastaDia) : null;
      
      const cumpleEmpresa = !idEmpresa || c.idEmpresa === idEmpresa;
      const dentroRangoFechas = ahora >= fechaInicio && (!fechaFin || ahora <= fechaFin);
    
      return  cumpleEmpresa && dentroRangoFechas;
    });
    
    if (!configActiva) {
      console.warn('No se encontró configuración de mora activa para la fecha actual, usando valor por defecto 0.05%');
      return 0.0005; // 0.05% diario por defecto (0.0005 en decimal)
    }
    
    // Convertir monto fijo a tasa diaria (si es tipo 1)
    if (configActiva.tipoConfigFinanciera === 1) {
      // Asumiendo que el monto fijo es un porcentaje diario
      return configActiva.montoFijo; // Convertir a decimal
    }
   
    // Para otros tipos de configuración, mantener la lógica anterior
    const tasaDiaria = configActiva.montoFijo;
    console.log('tasaDiaria', tasaDiaria);
    return tasaDiaria;
  } catch (error) {
    console.error('Error al obtener configuración de mora, usando valor por defecto 0.05%:', error);
    return 0.0005; // 0.05% diario por defecto en caso de error (0.0005 en decimal)
  }
};

/**
 * Función de utilidad para calcular la mora en el frontend
 * @param fechaVencimiento - Fecha de vencimiento de la cuota
 * @param montoCuota - Monto de la cuota
 * @param idEmpresa - ID de la empresa para obtener la configuración de mora
 * @param fechaActual - Fecha actual de cálculo (opcional, por defecto usa la fecha actual)
 * @returns Promesa con el objeto que contiene el cálculo de mora
 */
// Función para normalizar fechas a inicio del día (UTC)
const normalizeDate = (date: Date | string) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

export const calcularMora = async (
  fechaVencimiento: string | Date,
  montoCuota: number,
  idEmpresa?: number,
  fechaActual: Date | string = new Date()
): Promise<PagoConMora> => {
  try {
    // Normalizar fechas para comparación
    const fechaVenc = normalizeDate(fechaVencimiento);
    const fechaAct = typeof fechaActual === 'string' ? new Date(fechaActual) : fechaActual;
    const fechaActNormalizada = normalizeDate(fechaAct);
    
    // Si no se proporciona un ID de empresa, se intentará buscar cualquier configuración activa
    if (!idEmpresa) {
      console.warn('No se proporcionó ID de empresa, se intentará encontrar cualquier configuración activa');
    }
    
   
    // Si la fecha actual es menor o igual a la de vencimiento, no hay mora
    if (fechaActNormalizada <= fechaVenc) {
      const diasDiferencia = Math.ceil((fechaVenc.getTime() - fechaActNormalizada.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`No hay mora - Fecha actual es menor o igual a la fecha de vencimiento (diferencia: ${diasDiferencia} días)`);
      return {
        idCuota: 0, // Se debe establecer después
        fechaVencimiento: fechaVenc.toISOString(),
        montoOriginal: montoCuota,
        montoMora: 0,
        montoTotal: montoCuota,
        diasMora: 0,
        estaVencido: false // No está vencido
      };
    }

    // Obtener la tasa de mora diaria de la configuración
    const tasaMoraDiaria = await obtenerConfiguracionMoraActiva(idEmpresa);
    
    // Calcular días de mora (redondeando hacia arriba)
    const diffTime = Math.abs(fechaActNormalizada.getTime() - fechaVenc.getTime());
    const diasMora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Asegurarse de que al menos sea 1 día de mora si está vencido
    const diasMoraAjustado = Math.max(1, diasMora);
    
    
    
    // Calcular monto de mora (interés simple diario)
    const montoMora = Number((tasaMoraDiaria * diasMoraAjustado).toFixed(2));
    
   
    
    return {
      idCuota: 0, // Se debe establecer después
      fechaVencimiento: fechaVenc.toISOString(),
      montoOriginal: montoCuota,
      montoMora,
      montoTotal: Number((montoCuota + montoMora).toFixed(2)),
      diasMora: diasMoraAjustado,
      tasaMoraDiaria, // Incluimos la tasa usada para referencia
      estaVencido: true // Agregamos un flag explícito para saber si está vencido
    };
  } catch (error) {
    console.error('Error al calcular mora:', error);
    throw error;
  }
};

/**
 * Obtiene todas las configuraciones de intereses y mora
 * @param idEmpresa - ID de la empresa (opcional)
 * @param activo - Filtrar por estado activo (opcional)
 * @returns Promesa con el listado de configuraciones
 */
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const obtenerConfiguracionesMora = async (
  empresaId?: number,
  activo?: boolean,
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<ConfiguracionMora[] | PaginatedResponse<ConfiguracionMora>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      ...(empresaId && { empresaId: empresaId.toString() }),
      ...(activo !== undefined && { activo: activo.toString() })
    });

    // Remove one /api since it's likely already included in MORA_SERVICE_URL
    const response = await fetch(`/api/proxy?service=planes&path=config-interes-mora&${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener las configuraciones de mora');
    }

    const data = await response.json();
    
    
    // Si la respuesta es un array, devolverlo directamente
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si es un objeto con paginación, devolver el objeto completo
    if (data && typeof data === 'object' && 'data' in data) {
      return data as PaginatedResponse<ConfiguracionMora>;
    }
    
    // En caso de formato desconocido, devolver array vacío
    console.warn('Formato de respuesta inesperado:', data);
    return [];
  } catch (error) {
    console.error('Error al obtener configuraciones de mora:', error);
    throw error;
  }
};

/**
 * Crea una nueva configuración de intereses y mora
 * @param configuracion - Datos de la configuración a crear
 * @returns Promesa con la configuración creada
 */
export const crearConfiguracionMora = async (
  configuracion: Omit<ConfiguracionMora, 'id' | 'creadoEn' | 'actualizadoEn'>
): Promise<ConfiguracionMora> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=config-interes-mora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configuracion),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear la configuración de mora');
    }

    return response.json();
  } catch (error) {
    console.error('Error al crear configuración de mora:', error);
    throw error;
  }
};

/**
 * Obtiene una configuración de intereses y mora por su ID
 * @param id - ID de la configuración
 * @returns Promesa con la configuración encontrada
 */
export const obtenerConfiguracionMoraPorId = async (id: number): Promise<ConfiguracionMora> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=config-interes-mora/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener la configuración de mora');
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener configuración de mora por ID:', error);
    throw error;
  }
};

/**
 * Actualiza una configuración de intereses y mora existente
 * @param id - ID de la configuración a actualizar
 * @param cambios - Campos a actualizar
 * @returns Promesa con la configuración actualizada
 */
export const actualizarConfiguracionMora = async (
  id: number,
  cambios: Partial<Omit<ConfiguracionMora, 'id' | 'creadoEn' | 'actualizadoEn'>>
): Promise<ConfiguracionMora> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=config-interes-mora/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cambios),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar la configuración de mora');
    }

    return response.json();
  } catch (error) {
    console.error('Error al actualizar configuración de mora:', error);
    throw error;
  }
};

/**
 * Elimina una configuración de intereses y mora
 * @param id - ID de la configuración a eliminar
 * @returns Promesa que se resuelve cuando la operación es exitosa
 */
export const eliminarConfiguracionMora = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=config-interes-mora/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar la configuración de mora');
    }
  } catch (error) {
    console.error('Error al eliminar configuración de mora:', error);
    throw error;
  }
};

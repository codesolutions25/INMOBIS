export interface PlanPago {
  idPlanPagoPropiedad?: number;
  idEmpresa?: number;
  idUsuario?: number;
  idPropiedad?: number;
  idTipoPlanPagoPropiedad?: number;
  descripcion?: string;
  montoInicial?: number;
  cantidadCuotas?: number;
  idFrecuenciaPago?: number;
  aplicaMora?: boolean;
  tasaInteres?: number;
  fechaRegistro?: string;
  estado?: string;
  montoTotal?: number;
  moneda?: string;
  cuotas?: CuotaPago[];
}

export interface CuotaPago {
  numero: number;
  monto: number;
  fechaVencimiento: string;
  estado?: string;
  fechaPago?: string | null;
}

/**
 * Obtiene todos los planes de pago
 */
export const getPlanesPago = async (): Promise<PlanPago[]> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=planes-pago`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener los planes de pago');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener planes de pago:', error);
    throw error;
  }
};

/**
 * Obtiene un plan de pago por su ID
 */
export const getPlanPagoById = async (id: number): Promise<PlanPago> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=planes-pago/${id}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error al obtener el plan de pago ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener el plan de pago ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo plan de pago
 */
export const crearPlanPago = async (planPago: Omit<PlanPago, 'id'>): Promise<PlanPago> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=planes-pago`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planPago),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error al obtener el plan de pago`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al crear plan de pago:', error);
    throw error;
  }
};

/**
 * Actualiza un plan de pago existente
 */
export const actualizarPlanPago = async (id: number, planPago: Partial<PlanPago>): Promise<PlanPago> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=planes-pago/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planPago),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error al obtener el plan de pago ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al actualizar el plan de pago ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un plan de pago
 */
export const eliminarPlanPago = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=planes-pago/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el plan de pago');
    }
  } catch (error) {
    console.error(`Error al eliminar el plan de pago ${id}:`, error);
    throw error;
  }
};

/**
 * Valida si un plan de pago existe
 */
export const validarPlanPagoExiste = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/proxy?service=planes&path=planes-pago/${id}`, {
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Error al validar plan de pago:', error);
    return false;
  }
};

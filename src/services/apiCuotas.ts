// Servicio para manejo de cuotas del plan de pagos

export interface Cuota {
  idCuota?: number;
  idUsuario: number;
  idPropiedad: number;
  idPlanPagoPropiedad: number;
  numeroCuota: number;
  fechaVencimiento: string;
  saldo_capital: number;
  monto_amortizacion: number;
  monto_total_cuota: number;
  monto_interes: number;
  id_estado_plan_pago: number;
  fecha_pago_estimada: string;
}

// Obtener cuotas por usuario y propiedad
export const getCuotasPorUsuarioYPropiedad = async (idUsuario: number, idPropiedad: number): Promise<Cuota[]> => {
  try {
    console.log(`🔍 Obteniendo cuotas para usuario ${idUsuario} y propiedad ${idPropiedad}`);
    
    const response = await fetch(`/api/proxy?service=planes&path=cuotas&page=1&limit=100`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const cuotas = result.data && Array.isArray(result.data) ? result.data : [];
    
    // Filtrar por usuario y propiedad
    const cuotasFiltradas = cuotas.filter((cuota: any) => {
      const usuarioId = cuota.id_usuario || cuota.idUsuario;
      const propiedadId = cuota.id_propiedad || cuota.idPropiedad;
      return Number(usuarioId) === idUsuario && Number(propiedadId) === idPropiedad;
    });
    
    console.log(`📋 Se encontraron ${cuotasFiltradas.length} cuotas para usuario ${idUsuario} y propiedad ${idPropiedad}`);
    
    return cuotasFiltradas;
  } catch (error) {
    console.error('💥 Error al obtener cuotas:', error);
    return [];
  }
};

// Actualizar estado de una cuota
export const actualizarCuota = async (idCuota: number, idEstado: number): Promise<boolean> => {
  try {
    console.log(`🔄 Actualizando estado de la cuota ${idCuota} a ${idEstado}`);
    
    const response = await fetch(`/api/proxy?service=planes&path=cuotas/${idCuota}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id_estado_plan_pago: idEstado 
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ Estado de la cuota ${idCuota} actualizado correctamente`);
    return true;
  } catch (error) {
    console.error(`💥 Error al actualizar la cuota ${idCuota}:`, error);
    return false;
  }
};

// Eliminar cuota por ID
export const eliminarCuota = async (idCuota: number): Promise<boolean> => {
  try {
    console.log(`🗑️ Eliminando cuota con ID: ${idCuota}`);
    
    const response = await fetch(`/api/proxy?service=planes&path=cuotas/${idCuota}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    console.log(`✅ Cuota ${idCuota} eliminada exitosamente`);
    return true;
  } catch (error) {
    console.error(`💥 Error al eliminar cuota ${idCuota}:`, error);
    throw error;
  }
};

// Eliminar todas las cuotas de un usuario para una propiedad específica
export const eliminarCuotasPorUsuarioYPropiedad = async (idUsuario: number, idPropiedad: number): Promise<number> => {
  try {
    console.log(`🗑️ Eliminando todas las cuotas para usuario ${idUsuario} y propiedad ${idPropiedad}`);
    
    // Obtener todas las cuotas del usuario para esta propiedad
    const cuotas = await getCuotasPorUsuarioYPropiedad(idUsuario, idPropiedad);
    
    if (cuotas.length === 0) {
      console.log('ℹ️ No se encontraron cuotas para eliminar');
      return 0;
    }
    
    // Eliminar cada cuota individualmente
    const promesasEliminacion = cuotas.map(async (cuota: any) => {
      const idCuota = cuota.id_cuota || cuota.idCuota || cuota.id;
      if (idCuota) {
        return await eliminarCuota(idCuota);
      }
      return false;
    });
    
    const resultados = await Promise.all(promesasEliminacion);
    const cuotasEliminadas = resultados.filter(resultado => resultado === true).length;
    
    console.log(`✅ Se eliminaron ${cuotasEliminadas} cuotas exitosamente`);
    return cuotasEliminadas;
  } catch (error) {
    console.error('💥 Error al eliminar cuotas por usuario y propiedad:', error);
    throw error;
  }
};


// Obtener cuotas por idPlanPagoPropiedad, validando que la cotización asociada no esté anulada (idEstadoCotizacion 5)
export const getCuotasPorPlanPago = async (idPlanPagoPropiedad: number): Promise<Cuota[]> => {
  try {
    
    
    // Obtener la cotización asociada al plan de pago
    const cotizacionesResponse = await fetch(`/api/proxy?service=inmobiliaria&path=cotizaciones&page=1&limit=1000`);
    
    if (!cotizacionesResponse.ok) {
      throw new Error(`Error al obtener cotizaciones: ${cotizacionesResponse.status}`);
    }

    const cotizacionesData = await cotizacionesResponse.json();
    const cotizaciones = cotizacionesData.data || [];
    
    // Buscar la cotización que tenga el idPlanPagoPropiedad
    const cotizacionAsociada = cotizaciones.find((cotizacion: any) => {
      const planPagoId = cotizacion.id_plan_pago_propiedad || cotizacion.idPlanPagoPropiedad;
      return Number(planPagoId) === idPlanPagoPropiedad;
    });

    // Si la cotización tiene estado 5 (anulada), retornar array vacío
    if (cotizacionAsociada) {
      const estadoCotizacion = cotizacionAsociada.id_estado_cotizacion || cotizacionAsociada.idEstadoCotizacion;
      if (Number(estadoCotizacion) === 5) {
        console.log(`⚠️ No se devuelven cuotas: La cotización asociada al plan ${idPlanPagoPropiedad} está anulada`);
        return [];
      }
    }
    
    // Si no hay cotización asociada o no está anulada, obtener las cuotas normalmente
    const response = await fetch(`/api/proxy?service=planes&path=cuotas&page=1&limit=1000`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const cuotas = result.data && Array.isArray(result.data) ? result.data : [];
    
    // Filtrar por idPlanPagoPropiedad
    const cuotasFiltradas = cuotas.filter((cuota: any) => {
      const planPagoId = cuota.id_plan_pago_propiedad || cuota.idPlanPagoPropiedad;
      return Number(planPagoId) === idPlanPagoPropiedad;
    });
    
    
    
    return cuotasFiltradas;
  } catch (error) {
    console.error('💥 Error al obtener cuotas por plan de pago:', error);
    return [];
  }
};
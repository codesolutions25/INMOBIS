import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, AlertCircle } from "lucide-react";
import { Reserva } from "../types";
import { Cuota } from "@/services/apiCuotas";
import { toCamelCase } from "@/utils/caseConverter";

interface IndicadoresReservaProps {
  reserva: Reserva | null;
  cuotas?: Cuota[];
}

// Interface for the API response with snake_case
interface ApiReserva {
  id: string | number;
  proyecto: string;
  lote: string;
  distrito: string;
  provincia: string;
  departamento: string;
  fecha_reserva: string;
  monto: number;
  estado: string;
  estado_pago: string;
  cuotas_vencidas?: number;
  monto_cuotas_vencidas?: number;
  cuotas_pendientes?: number;
  proximo_vencimiento?: string;
  deuda_pendiente?: number;
  saldo_capital?: number;
}

export function IndicadoresReserva({ reserva, cuotas = [] }: IndicadoresReservaProps) {
 
  // Convert snake_case API response to camelCase
  const normalizedReserva = reserva ? toCamelCase<Reserva>(reserva) : null;
  
  if (!normalizedReserva) {
    return (
      <div className="text-center py-6 text-gray-500">
        Seleccione una reserva para ver los indicadores
      </div>
    );
  }

  // Convert cuotas to camelCase and calculate indicators
  const normalizedCuotas = cuotas.map((cuota:any) => ({
    ...cuota,
    fechaVencimiento: cuota.fechaVencimiento,
    idEstadoPlanPago: cuota.idEstadoPlanPago,
    montoTotalCuota: cuota.montoTotalCuota,
    numeroCuota: cuota.numeroCuota,
    saldoCapital: cuota.saldoCapital,
    montoAmortizacion: cuota.montoAmortizacion,
    montoInteres: cuota.monto_interes
  }));

  // Calculate indicators based on normalized cuotas
  // Función para normalizar fechas (ignorar horas, minutos, segundos)
  // Función para normalizar fechas (ignorar horas, minutos, segundos, milisegundos)
  const normalizeDate = (date: Date | string): Date => {
    const d = new Date(date);
    // Establecer a inicio del día (00:00:00.000) en hora local
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const hoy = normalizeDate(new Date());
  
  // Obtener el ID del estado pendiente desde la API
  const [PENDING_STATUS_ID, setPendingStatusId] = useState<number>(1);

  useEffect(() => {
    const fetchEstadoPendiente = async () => {
      try {
        const response = await fetch('api/proxy?service=estado_plan_pago_pendiente');
        if (!response.ok) throw new Error('Error al obtener el estado pendiente');
        const data = await response.json();
        const statusId = data?.data?.[0]?.idEstadoPlanPago;
        if (statusId) setPendingStatusId(statusId);
      } catch (error) {
        console.error('Error fetching PENDING_STATUS_ID:', error);
      }
    };

    fetchEstadoPendiente();
  }, []);


  const cuotasVencidas = normalizedCuotas.filter(cuota => {
    // Solo considerar cuotas pendientes
    if (cuota.idEstadoPlanPago !== PENDING_STATUS_ID) return false;
    
    // Normalizar fecha de vencimiento
    const fechaVencimiento = normalizeDate(new Date(cuota.fechaVencimiento));
    
    // Solo se considera vencida si la fecha de vencimiento es estrictamente menor a hoy
    // (es decir, si es de ayer o antes)
    return fechaVencimiento < hoy;
  });

  const montoCuotasVencidas = cuotasVencidas.reduce((total, cuota) => {
    return total + (cuota.montoTotalCuota || 0);
  }, 0);
  
  const cantidadCuotasVencidas = cuotasVencidas.length;

  // Calcular cuotas pendientes (estado 1) que no están vencidas o vencen hoy
  const cuotasPendientes = normalizedCuotas.filter(cuota => {
    if (cuota.idEstadoPlanPago !== PENDING_STATUS_ID) return false;
    
    // Normalizar fechas para comparación
    const fechaVencimiento = normalizeDate(new Date(cuota.fechaVencimiento));
    
    // Es pendiente si no está vencida o vence hoy
    return fechaVencimiento >= hoy;
  }).length;
  


  const proximaCuota = normalizedCuotas
    .filter(cuota => cuota.idEstadoPlanPago === PENDING_STATUS_ID)
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];

  // Get the last pending installment
  const ultimaCuotaPendiente = [...normalizedCuotas]
    .filter(cuota => cuota.idEstadoPlanPago === PENDING_STATUS_ID)
    .sort((a, b) =>  (b.numeroCuota || 0) -(a.numeroCuota || 0))
    .pop();

  // Calculate total pending debt
  const deudaTotalPendiente = normalizedCuotas
    .filter(cuota => cuota.idEstadoPlanPago === PENDING_STATUS_ID)
    .reduce((total, cuota) => total + (cuota.montoTotalCuota || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Indicador de Cuotas Vencidas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">Cuotas Vencidas</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {cantidadCuotasVencidas}
          </p>
          <p className="text-sm text-muted-foreground">
            S/ {montoCuotasVencidas.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </CardContent>
      </Card>

      {/* Indicador de Cuotas Pendientes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">Cuotas Pendientes</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {cuotasPendientes}
          </p>
        </CardContent>
      </Card>

      {/* Indicador de Deuda Pendiente */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">Deuda Pendiente</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            S/ {deudaTotalPendiente.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </CardContent>
      </Card>

      {/* Indicador de Saldo Capital */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">Saldo Capital</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {ultimaCuotaPendiente ? (
              `S/ ${(ultimaCuotaPendiente.saldoCapital || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            ) : (
              'N/A'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
}

export interface Reserva {
  id: string | number;
  proyecto: string;
  cliente: any; // Puedes reemplazar 'any' con una interfaz más específica si es necesario
  propiedad: string;
  lote: string;
  nombrePropiedad: string;
  distrito: string;
  provincia: string;
  departamento: string;
  fechaReserva?: string;
  monto?: number;
  estado?: string;
  estadoPago: 'PENDIENTE' | 'PAGADO';
  idPlanPagoPropiedad?: number;
  idEmpresa?: number; // Añadido para manejar el filtrado por empresa
  cuotasVencidas?: number;
  montoCuotasVencidas?: number;
  cuotasPendientes?: number;
  proximoVencimiento?: string;
  deudaPendiente?: number;
  saldoCapital?: number;
}

export interface Pago {
  id: string | number;
  concepto: string;
  monto: number;
  montoPagar: number;
  totalPagar: number;
  saldoCapital: number;
  amortizacion: number;
  interes: number;
  mora: number;
  descripcion: string;
  numeroCuota: number;
  fecha?: string;
  fechaPago?: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Pagado' | 'Vencido' | 'Cancelado';
  referencia?: string;
  nroItem: number;

  diasMora?: number;
  idCuota?: number;
  _estado_original?: number;
}

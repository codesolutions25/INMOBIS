export interface MoraCalculo {
  fechaVencimiento: string; // Fecha de vencimiento de la cuota
  fechaActual: string;      // Fecha actual de cálculo
  diasMora: number;         // Días de mora
  montoCuota: number;       // Monto original de la cuota
  tasaMoraDiaria?: number;  // Tasa de mora diaria (opcional, por defecto 0.05%)
  montoMora: number;        // Monto calculado de la mora
  montoTotal: number;       // Monto total a pagar (cuota + mora)
}

export interface PagoConMora {
  idCuota: number;
  fechaVencimiento: string;
  montoOriginal: number;
  montoMora: number;
  montoTotal: number;
  diasMora: number;
  tasaMoraDiaria?: number; // Tasa de mora diaria usada para el cálculo
  estaVencido: boolean;    // Indica si el pago está vencido
}

export interface TipoPago {
    id_tipo_pago: number;
    idTipoPago?: number; // Added for compatibility with different API responses
    nombre: string;
    descripcion: string;
  }
  
  export interface CreateTipoPagoDto {
    nombre: string;
    descripcion: string;
  }
  
  export interface UpdateTipoPagoDto {
    nombre?: string;
    descripcion?: string;
  }
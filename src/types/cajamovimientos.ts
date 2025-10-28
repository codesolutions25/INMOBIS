export interface CajaMovimiento {
    id_movimiento?: number;  // Optional as it's likely auto-generated
    id_caja: number;
    id_caja_destino?: number;
    id_tipo_operacion: number;
    id_tipo_movimiento: number;
    monto: number;
    descripcion_movimiento: string;
    referencia_externa: string;
    fecha_movimiento: string; // ISO date string
    id_usuario: number;
    estado: number;
    created_at?: string; // Optional for backward compatibility
    
  }
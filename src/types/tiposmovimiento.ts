export interface TipoMovimiento {
    id_tipo_movimiento: number;
    nombre_tipo_movimiento: string;
    descripcion_tipo_movimiento: string | null;
    created_at?: string; // ISO string (timestamp)
   
}
export interface Venta {
    id?: number;
    empresa_id: number;
    id_usuario: number;
    persona_id: number;
    id_caja: number;
    id_punto_venta: number;
    id_tipo_documento: number;
    serie: string;
    correlativo: string;
    fecha_emision: string; // Agregado
    fecha_vencimiento: string | null; // Agregado
    moneda: string;
    subtotal: number | string; // La API puede devolver string
    igv: number | string; // La API puede devolver string
    total: number | string; // La API puede devolver string
    id_estado_venta: number;
    id_tipo_pago: number;
    id_plan_pago: number | null;
    observaciones: string;
    id_venta: number;
    referencia_externa: string;
    numero_cuota: number | null; // Agregado
    created_at?: string; // Agregado para compatibilidad
    updated_at?: string; // Agregado para compatibilidad
}
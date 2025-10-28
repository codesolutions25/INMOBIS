export interface CajaOperacion {
    id_operacion: number;
    id_caja: number | null;
    id_tipo_operacion: number | null;
    monto: number;  // numeric(14, 2) in database
    descripcion_operacion: string | null;
    referencia_externa: string | null;
    fechaOperacion: string | Date;  // timestamp in database
    createdAt: string | Date;        // timestamp in database
    realizadoPor: number | null;
    autorizadoPor: number | null;
}

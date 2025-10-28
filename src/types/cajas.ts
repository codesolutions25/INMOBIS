export type Caja = {
    id_caja: number
    id_punto_venta?: number | null
    id_tipo_caja?: number | null
    nombre_caja?: string | null
    id_estado_caja?: number | null
    saldo_inicial?: number | null
    fecha_apertura?: string | null // ISO string (timestamp)
    fecha_cierre?: string | null   // ISO string (timestamp)
    updated_at?: string | null     // ISO string (timestamp)
    id_usuario?: number | null
}
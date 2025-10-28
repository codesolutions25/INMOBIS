export interface PuntoVentaUsuario {
    id_asignacion_punto_venta: number;
    id_punto_venta: number | null;
    fecha_asignacion: Date | string | null;
    fecha_termino: Date | string | null;
    id_usuario: number | null;
}


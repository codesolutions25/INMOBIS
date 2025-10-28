export interface CajaUsuario {
    id_asignacion: number;
    id_caja: number | null;
    fecha_asignacion: Date | string | null;
    fecha_termino: Date | string | null;
    id_usuario: number | null;
}
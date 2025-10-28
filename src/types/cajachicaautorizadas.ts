export interface CajaChicaAutorizada {
    id_autorizacion: number;
    id_caja: number;
    id_usuario: number;
    fecha_asignacion?: string;  // Made optional
    fecha_termino?: string | null;  // Made optional
}
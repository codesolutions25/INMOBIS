export interface DetalleUsuario {
    id: number;
    id_usuario: number;
    id_usuario_empresa: number;
    fecha_inicio: string | Date;
    fecha_fin?: string | Date | null;
    estado: boolean;
    created_at: string | Date;
    updated_at: string | Date;
}


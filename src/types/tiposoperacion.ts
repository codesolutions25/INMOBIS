export interface TipoOperacion {
    idTipoOperacion: number;
    nombreTipoOperacion: string;
    descripcionTipoOperacion: string | null;
    createdAt?: string; // ISO string (timestamp)
}
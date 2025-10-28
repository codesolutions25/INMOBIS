export interface Usuario {
    idUsuario: number;
    idPersona: number;
    username: string;
    passwordHash: string;
    estaActivo: boolean;
    esSuperAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}
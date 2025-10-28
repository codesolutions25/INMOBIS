import { Usuario } from './usuario';

export interface UsuarioConEmpresa extends Usuario {
    // Properties from UsuarioEmpresa
    id_persona: number;
    id_empresa: number;
    id_usuario: number;
    id_sistema: number;
    password_hash: string;
    
    // Add any additional properties that might be needed
    [key: string]: any;
}

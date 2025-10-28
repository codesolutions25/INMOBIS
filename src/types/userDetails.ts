import { Usuario } from './usuario';
import { UsuarioEmpresa } from './usuarioEmpresa';

export interface DetalleUsuario {
  id: number;
  idUsuario?: number;
  idUsuarioEmpresa?: number;
  // Add other fields from DetalleUsuario as needed
  [key: string]: any;
}

export interface UserDetailsState<T> {
  userInfo: T | null;
  userDetails: DetalleUsuario[];
  loading: boolean;
  error: Error | null;
}

export type UserDetails = UserDetailsState<Usuario | UsuarioEmpresa>;

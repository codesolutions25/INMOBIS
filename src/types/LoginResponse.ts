export interface UserData {
  id: number;
  idPersona?: number;
  username: string;
  email: string;
  telefonoPrincipal: string;
  telefonoSecundario: string;
  direccion: string;
  tipo_usuario: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  es_super_admin: boolean;
  idEmpresa?: number;
  id_empresa?: number; // Alias para compatibilidad con el backend
  persona?: any; // Keep this for backward compatibility
  detalle_usuarios?: any[]; // Keep this for backward compatibility
  token?: string;
}

export interface LoginResponse {
  message: string;
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserData;
}
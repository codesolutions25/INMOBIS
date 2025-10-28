// En types/user.ts
export type UserType = 'system' | 'company';

export interface BaseUser {
  id: number;
  idPersona?: number;
  username: string;
  email: string;
  telefonoPrincipal: string;
  telefonoSecundario: string;
  direccion: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  genero?: string;
  fechaNacimiento?: string;
  numeroDocumento?: string;
  avatar?: string;
  tipo_usuario?: string;
  role?: string;
}

export interface SystemUser extends BaseUser {
  type: 'system';
  // Campos específicos de usuario de sistema
}

export interface CompanyUser extends BaseUser {
  type: 'company';
  id_empresa: number;
  // Campos específicos de usuario de empresa
}


export type User = SystemUser | CompanyUser;
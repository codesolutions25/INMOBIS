export interface Usuario {
  id?: number;
  idUsuario?: number;  // Añadido para compatibilidad
  idPersona?: number;
  username: string;
  email?: string;
  password?: string;
  password_hash?: string;  // Mantener para compatibilidad
  role?: string;
  estaActivo: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Campos adicionales que pueda necesitar el formulario
  esSuperAdmin?: boolean;
  fechaInicio?: Date | string;
  fechaFin?: Date | string;
}
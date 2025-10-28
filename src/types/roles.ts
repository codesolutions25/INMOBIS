
export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
  es_global: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}
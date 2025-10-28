export interface EmpresaSistemaModulo {
  idEmpresaSistemaModulo: number;
  idEmpresa: number;
  idSistema: number;
  idModulo: number;
  estado: string; // Consider using a union type if there are specific possible values
  fechaActivacion: string; // ISO 8601 date string
  fechaExpiracion: string; // ISO 8601 date string
  createdAt: string; // ISO 8601 date string
}
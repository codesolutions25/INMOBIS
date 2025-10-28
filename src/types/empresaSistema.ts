export interface EmpresaSistema {
  idEmpresa: number;
  idSistema: number;
  fechaInicio: string; // ISO 8601 date string
  fechaFin: string;    // ISO 8601 date string
  esActivo: boolean;
}
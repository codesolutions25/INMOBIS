export interface EmpresaModuloOpcion {
  idEmpresaModuloOpcion: number;
  idEmpresaSistemaModulo: number;
  idOpcion: number;
  nombreAlias: string;
  ruta: string;
  otorgadoEn: string; // ISO 8601 date string
}
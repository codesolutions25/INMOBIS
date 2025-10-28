export interface Persona {
  idPersona: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  idTipoGenero: number;
  idTipoDocumento: number;
  numeroDocumento: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion?: string;
  fechaNacimiento: string;
  correoElectronico?: string;
  createdAt?: string;
  updatedAt?: string;
}
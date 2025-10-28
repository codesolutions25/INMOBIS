export type TipoDocumento = {
    idTipoDocumento: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    longitudMax: number;
    esActivo: boolean;
    createdAt: string;
}

export type TipoGenero = {
    idTipoGenero: number
    codigo: string
    nombre: string
    descripcion: string
    esActivo: boolean
    createdAt: string
}

export type TipoPersona = {
    idTipoPersona: number
    nombre: string
    descripcion: string
    createdAt: string
}

export type Persona = {
    idPersona: number
    nombre: string
    apellidoPaterno: string
    apellidoMaterno: string
    idTipoDocumento: number
    numeroDocumento: string
    telefonoPrincipal: string
    telefonoSecundario: string
    direccion: string
    correoElectronico: string
    fechaNacimiento: string
    idTipoGenero: number
    idTipoPersona: number
    createdAt: string
    updatedAt: string
}
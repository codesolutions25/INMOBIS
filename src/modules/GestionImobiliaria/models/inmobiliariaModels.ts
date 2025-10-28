

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface PaginatedRequest {
    page: number;
    perPage: number;
    search?: string;
}

export type Proyecto = {
    idProyectoInmobiliario: number;
    idEmpresa: number;
    nombre: string;
    ubicacion: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    idEstadoPropiedad: number;
    telefonoContacto: string;
    emailContacto: string;
    idDistrito: number;
}

export type Propiedad = {
    idPropiedad: number;
    idProyectoInmobiliario: number;
    idTiposPropiedad: number;
    idEstadoPropiedad: number;
    direccion: string;
    codigoPropiedad: string;
    nombre: string;
    descripcion: string;
    precio: number;
    areaM2: number;
    piso: number;
    numeroHabitaciones: number;
    numeroBanos: number;
    estacionamiento: boolean;
}

export type TipoPropiedad = {
    idTiposPropiedad: number
    nombre: string
    descripcion: string
    propiedadesCount?: number
}

export type EstadoPropiedad = {
    idEstadoPropiedad: number
    nombre: string
    descripcion: string
    esFinal: boolean
}

export type CatalogoCaracteristica = {
    idCatalogoCaracteristicas: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    isReadOnly?: boolean; // Para controlar si el formulario de edición debe ser de solo lectura
    creadoEn: string;
}

export type CaracteristicaPropiedad = {
    idCatalogoCaracteristicas: number;
    idPropiedad: number;
    valor: string;
    createdAt: string;
    updatedAt: string;
}

// Tipo para el TransferList
export type CaracteristicaTransfer = CatalogoCaracteristica & {
    seleccionada: boolean;
    valor?: string;
}

export type Provincia = {
    idProvincia: number
    idDepartamento: number
    nombre: string
}

export type Distrito = {
    idDistrito: number
    idProvincia: number
    nombre: string
}

export type Departamento = {
    idDepartamento: number
    nombre: string
}
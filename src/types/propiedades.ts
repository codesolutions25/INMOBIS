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
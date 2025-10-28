export type Cotizacion = {
    idCotizaciones: number;
    idClienteInmobiliario: number;
    idPropiedad: number;
    idEstadoCotizacion: number;
    idPlanPagoPropiedad?: number;
    descuento: number;
    precioFinal: number;
    moneda: string;
    observaciones: string;
    fechaCotizacion: string;
};
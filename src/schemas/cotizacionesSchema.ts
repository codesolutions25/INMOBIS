import { z } from "zod";

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const cotizacionSchema = z.object({
    idClienteInmobiliario: numberSchema("Debe seleccionar un cliente inmobiliario"),
    idPropiedad: numberSchema("Debe seleccionar una propiedad"),
    idEstadoCotizacion: numberSchema("Debe seleccionar un estado de cotización"),
    descuento: numberSchema("Debe ingresar un descuento válido"),
    precioFinal: numberSchema("Debe ingresar un precio final válido"),
    moneda: z.string({
        required_error: "Debe seleccionar una moneda",
        invalid_type_error: "La moneda debe ser una cadena de texto"
    })
        .min(1, { message: "La moneda es obligatoria" })
        .max(3, { message: "La moneda no puede tener más de 3 caracteres" })
        .trim(),
    observaciones: z.string({
        required_error: "Las observaciones son requeridas",
        invalid_type_error: "Las observaciones deben ser una cadena de texto"
    })
        .min(1, { message: "Las observaciones son obligatorias" })
        .max(255, { message: "Las observaciones no pueden tener más de 255 caracteres" })
        .trim(),
    fechaCotizacion: z.date({
        required_error: "La fecha de cotización es requerida",
        invalid_type_error: "La fecha de cotización debe ser una fecha válida"
    })
})
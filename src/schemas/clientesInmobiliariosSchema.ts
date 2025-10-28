import { z } from 'zod'

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const clientesInmobiliariosSchema = z.object({
    idPersona: numberSchema("Debe seleccionar una persona")
    .min(1, { message: "Debe seleccionar una persona válida" }),
    idEmpresa: numberSchema("Debe seleccionar una empresa")
    .min(1, { message: "Debe seleccionar una empresa válida" }),
    observaciones: z.string({
        required_error: "Las observaciones son requeridas",
        invalid_type_error: "Las observaciones deben ser una cadena de texto"
    })
        .min(1, { message: "Las observaciones son obligatorias" })
        .max(255, { message: "Las observaciones no pueden tener más de 255 caracteres" })
        .trim(),
    fechaCreacion: z.date({
        required_error: "La fecha de creación es requerida",
        invalid_type_error: "La fecha de creación debe ser una fecha válida"
    })
})

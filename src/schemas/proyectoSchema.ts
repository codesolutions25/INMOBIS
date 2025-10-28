import { z } from 'zod'

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const proyectoSchema = z.object({
    idEmpresa: numberSchema("Debe seleccionar una empresa")
    .min(1, { message: "Debe seleccionar una empresa válida" }),
    nombre: z.string({
        required_error: "El nombre es requerido",
        invalid_type_error: "El nombre debe ser una cadena de texto"
    })
        .min(1, { message: "El nombre es obligatorio" })
        .trim(),

    ubicacion: z.string({
        required_error: "La ubicación es requerida",
        invalid_type_error: "La ubicación debe ser una cadena de texto"
    })
        .min(1, { message: "La ubicación es obligatoria" })
        .trim(),
    
    descripcion: z.string({
        required_error: "La descripción es requerida",
        invalid_type_error: "La descripción debe ser una cadena de texto"
    })
        .min(1, { message: "La descripción es obligatoria" })
        .trim(),
    
    fechaInicio: z.date({
        required_error: "La fecha de inicio es requerida",
        invalid_type_error: "La fecha de inicio debe ser una fecha válida"
    }),
    
    fechaFin: z.date({
        required_error: "La fecha de fin es requerida",
        invalid_type_error: "La fecha de fin debe ser una fecha válida"
    }),
    
    idEstadoPropiedad: numberSchema("El estado de propiedad es requerido")
        .min(1, { message: "Debe seleccionar un estado válido" }),
    
    telefonoContacto: z.string({
        required_error: "El teléfono de contacto es requerido",
        invalid_type_error: "El teléfono de contacto debe ser una cadena de texto"
    })
        .min(1, { message: "El teléfono de contacto es obligatorio" })
        .trim(),
    
    emailContacto: z.string({
        required_error: "El email de contacto es requerido",
        invalid_type_error: "El email de contacto debe ser una cadena de texto"
    })
        .min(1, { message: "El email de contacto es obligatorio" })
        .trim(),
    
    idDistrito: numberSchema("El distrito es requerido")
        .min(1, { message: "Debe seleccionar un distrito válido" }),
})
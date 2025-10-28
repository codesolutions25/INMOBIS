import { z } from 'zod'

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const tipoOperacionSchema = z.object({
    idTipoOperacion: numberSchema("El ID del tipo de operación es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .optional(), // Optional because it's auto-generated on create
    
    nombreTipoOperacion: z.string({
        required_error: "El nombre del tipo de operación es requerido",
        invalid_type_error: "El nombre debe ser una cadena de texto"
    })
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(50, { message: "El nombre no puede tener más de 50 caracteres" })
    .trim(),
    
    descripcionTipoOperacion: z.string({
        required_error: "La descripción es requerida",
        invalid_type_error: "La descripción debe ser una cadena de texto"
    })
    .max(255, { message: "La descripción no puede tener más de 255 caracteres" })
    .trim()
    .optional()
    .nullable(),
    
    createdAt: z.string().or(z.date()).optional() // Optional as it's set by the database
})

// Type for TypeScript type inference
export type TipoOperacionFormValues = z.infer<typeof tipoOperacionSchema>;
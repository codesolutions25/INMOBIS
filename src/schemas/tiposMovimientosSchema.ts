import { z } from 'zod'

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const tipoMovimientoSchema = z.object({
    id_tipo_movimiento: numberSchema("El ID del tipo de movimiento es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .optional(), // Optional because it's auto-generated on create
    
    nombre_tipo_movimiento: z.string({
        required_error: "El nombre del tipo de movimiento es requerido",
        invalid_type_error: "El nombre debe ser una cadena de texto"
    })
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(50, { message: "El nombre no puede tener más de 50 caracteres" })
    .trim(),
    
    descripcion_tipo_movimiento: z.string({
        invalid_type_error: "La descripción debe ser una cadena de texto"
    })
    .max(255, { message: "La descripción no puede tener más de 255 caracteres" })
    .trim()
    .nullable()
    .optional(),
    
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
})

export type TipoMovimientoFormValues = z.infer<typeof tipoMovimientoSchema>
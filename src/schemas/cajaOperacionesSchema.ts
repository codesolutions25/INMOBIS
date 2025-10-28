import { z } from 'zod'

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const cajaOperacionSchema = z.object({
    id_operacion: numberSchema("El ID de la operación es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .optional(), // Auto-generado al crear

    id_caja: numberSchema("El ID de la caja es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .nullable()
        .optional(),

    id_tipo_operacion: numberSchema("El ID del tipo de operación es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .nullable()
        .optional(),

    monto: numberSchema("El monto es requerido")
        .positive({ message: "El monto debe ser un número positivo" })
        .transform(val => parseFloat(val.toFixed(2))), // Asegura 2 decimales

    descripcion_operacion: z.string({
        invalid_type_error: "La descripción debe ser una cadena de texto"
    })
    .max(1000, { message: "La descripción no puede tener más de 1000 caracteres" })
    .trim()
    .nullish()
    .transform(val => val ?? null),

    referencia_externa: z.string({
        invalid_type_error: "La referencia externa debe ser una cadena de texto"
    })
    .max(255, { message: "La referencia externa no puede tener más de 255 caracteres" })
    .trim()
    .nullish()
    .transform(val => val ?? null),

    fecha_operacion: z.string().datetime().optional(), // Auto-generado si no se provee
    created_at: z.string().datetime().optional(), // Auto-generado
    id_usuario: numberSchema("El ID de usuario es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .nullable()
        .optional()
})

export type CajaOperacionFormValues = z.infer<typeof cajaOperacionSchema>
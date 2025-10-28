import { z } from 'zod'

const numberSchema = (errorMsg: string) => z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: "Debe ser un número válido"
})

export const cajaMovimientoSchema = z.object({
    id_movimiento: numberSchema("El ID del movimiento es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .optional(),

    id_caja: numberSchema("El ID de la caja es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" }),

    id_caja_destino: numberSchema("El ID de la caja destino es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" })
        .optional()
        .or(z.literal(0)) // Aceptar 0 como valor válido
        .transform(val => val === 0 ? undefined : val), // Convertir 0 a undefined

    id_tipo_operacion: numberSchema("El ID del tipo de operación es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" }),

    id_tipo_movimiento: numberSchema("El ID del tipo de movimiento es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" }),

    monto: z.coerce.number()
        .min(0.01, "El monto debe ser mayor a 0")
        .transform(val => Number(val.toFixed(2))),

    descripcion_movimiento: z.string({
        invalid_type_error: "La descripción debe ser una cadena de texto"
    })
        .max(1000, { message: "La descripción no puede tener más de 1000 caracteres" })
        .trim(),

    referencia_externa: z.string({
        invalid_type_error: "La referencia externa debe ser una cadena de texto"
    })
        .max(255, { message: "La referencia externa no puede tener más de 255 caracteres" })
        .trim(),

    fecha_movimiento: z.string().datetime({ message: "Formato de fecha inválido" }),

    id_usuario: numberSchema("El ID de usuario es requerido")
        .int({ message: "Debe ser un número entero" })
        .positive({ message: "Debe ser un número positivo" }),

    estado: numberSchema("El estado es requerido")
        .int({ message: "Debe ser un número entero" })
        .min(0, { message: "El estado no puede ser negativo" }),

    created_at: z.string().datetime().optional()
})

export type CajaMovimientoFormValues = z.infer<typeof cajaMovimientoSchema>
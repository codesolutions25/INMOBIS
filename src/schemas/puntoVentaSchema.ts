import { z } from 'zod'

export const puntoVentaSchema = z.object({
    id_punto_venta: z.coerce
        .number({
            required_error: "El ID del punto de venta es requerido",
            invalid_type_error: "El ID del punto de venta debe ser numérico",
        })
        .int()
        .positive("El ID del punto de venta no es válido")
        .optional(),
    nombre_punto_venta: z.string({
        required_error: "El nombre del punto de venta es requerido"
    })
        .min(5, {
            message: "El nombre del punto de venta debe tener mínimo 5 caracteres"
        })
        .max(100, {
            message: "El nombre del punto de venta debe tener máximo 100 caracteres"
        }),
    direccion_punto_venta: z.string({
        required_error: "La dirección del punto de venta es requerida"
    })
        .min(5, {
            message: "La dirección del punto de venta debe tener mínimo 5 caracteres"
        })
        .max(255, {
            message: "La dirección del punto de venta debe tener máximo 255 caracteres"
        }),
    telefono_punto_venta: z.string({
        required_error: "El teléfono del punto de venta es requerido"
    })
        .min(10, {
            message: "El teléfono del punto de venta debe tener mínimo 10 caracteres"
        })
        .max(20, {
            message: "El teléfono del punto de venta debe tener máximo 20 caracteres"
        }),
    empresa_id: z.number({
        required_error: "Debe seleccionar una empresa",
        invalid_type_error: "Seleccione una empresa válida"
    }).positive("Debe seleccionar una empresa"),
});
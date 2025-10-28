import { z } from 'zod';

export const estadoCajaSchema = z.object({
    id_estado_caja: z.coerce
        .number({
            required_error: "El ID de estado de caja es requerido",
            invalid_type_error: "El ID debe ser numérico"
        })
        .int("El ID debe ser un número entero")
        .positive("El ID debe ser un número positivo"),
        
    nombre_estado_caja: z.string({
            required_error: "El nombre del estado de caja es requerido"
        })
        .min(3, {
            message: "El nombre debe tener mínimo 3 caracteres"
        })
        .max(50, {
            message: "El nombre debe tener máximo 50 caracteres"
        }),
        
    descripcion_estado_caja: z.string({
            required_error: "La descripción es requerida"
        })
        .min(5, {
            message: "La descripción debe tener mínimo 5 caracteres"
        })
        .max(200, {
            message: "La descripción debe tener máximo 200 caracteres"
        })
});

export type EstadoCajaFormValues = z.infer<typeof estadoCajaSchema>;
import { z } from 'zod';

export const puntoVentaUsuarioSchema = z.object({
    id_asignacion_punto_venta: z.number({
        invalid_type_error: "El ID de asignación debe ser un número",
    })
    .int("El ID de asignación debe ser un número entero")
    .positive("El ID de asignación debe ser un número positivo")
    .optional(),

    id_punto_venta: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number({
            required_error: "El ID del punto de venta es requerido",
            invalid_type_error: "El ID del punto de venta debe ser numérico",
        })
        .int("El ID del punto de venta debe ser un número entero")
        .positive("El ID del punto de venta debe ser un número positivo")
    ),

    id_usuario: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number({
            required_error: "El ID del usuario es requerido",
            invalid_type_error: "El ID del usuario debe ser numérico",
        })
        .int("El ID del usuario debe ser un número entero")
        .positive("El ID del usuario debe ser un número positivo")
    ),

    fecha_asignacion: z.union([
        z.string().datetime({
            message: "La fecha de asignación debe ser una fecha válida",
        }),
        z.date({
            invalid_type_error: "La fecha de asignación debe ser una fecha válida",
        })
    ])
    .optional(),

    fecha_termino: z.union([
        z.string().datetime({
            message: "La fecha de término debe ser una fecha válida",
        }),
        z.date({
            invalid_type_error: "La fecha de término debe ser una fecha válida",
        })
    ])
    .optional(),
})
.refine(
    (data) => {
        if (!data.fecha_asignacion || !data.fecha_termino) return true;
        const fechaAsignacion = new Date(data.fecha_asignacion);
        const fechaTermino = new Date(data.fecha_termino);
        return fechaTermino > fechaAsignacion;
    },
    {
        message: "La fecha de término debe ser posterior a la fecha de asignación",
        path: ["fecha_termino"],
    }
);


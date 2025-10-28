import { z } from 'zod';

export const cajaChicaAutorizadaSchema = z.object({
    id_autorizacion: z.number({
        invalid_type_error: "El ID de autorización debe ser un número",
    })
    .int("El ID de autorización debe ser un número entero")
    .positive("El ID de autorización debe ser un número positivo")
    .optional(),

    id_caja: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number({
            required_error: "La caja es requerida",
            invalid_type_error: "La caja debe ser un valor numérico",
        })
        .int("La caja debe ser un número entero")
        .positive("La caja debe ser un número positivo")
    ),

    id_usuario: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number({
            required_error: "El usuario es requerido",
            invalid_type_error: "El usuario debe ser un valor numérico",
        })
        .int("El usuario debe ser un número entero")
        .positive("El usuario debe ser un número positivo")
    ),

    // Fechas son manejadas internamente
    fecha_asignacion: z.string().datetime().optional(),
    fecha_termino: z.string().datetime().nullable().optional()
});

export type CajaChicaAutorizadaFormValues = {
    id_usuario: number;
    id_caja: number;
    id_autorizacion?: number;
    fecha_asignacion?: string;
    fecha_termino?: string | null;
};
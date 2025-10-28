import { z } from 'zod';

export const rolSchema = z.object({
    id_rol: z.number().int().positive().optional(),
    nombre: z.string()
        .min(1, { message: "El nombre del rol es requerido" })
        .max(100, { message: "El nombre no puede tener más de 100 caracteres" }),
    descripcion: z.string()
        .min(1, { message: "La descripción es requerida" })
        .max(500, { message: "La descripción no puede tener más de 500 caracteres" }),
    es_global: z.boolean().default(false),
    created_at: z.date().or(z.string()).optional(),
    updated_at: z.date().or(z.string()).optional()
});

import { z } from 'zod';

export const tipoCajaSchema = z.object({
    id_tipo_caja: z.number().int().positive().optional(),
    nombre_tipo_caja: z.string()
        .min(1, { message: "El nombre del tipo de caja es requerido" })
        .max(100, { message: "El nombre no puede tener más de 100 caracteres" }),
    descripcion_tipo_caja: z.string()
        .max(500, { message: "La descripción no puede tener más de 500 caracteres" })
        .optional()
        .or(z.literal('')),
});

export type TipoCajaFormValues = z.infer<typeof tipoCajaSchema>;

// This matches your existing type structure
export type TipoCaja = {
    id_tipo_caja: number;
    nombre_tipo_caja: string;
    descripcion_tipo_caja: string;
};
import { z } from "zod";

export const tipoPropiedadSchema = z.object({
    idTipoPropiedad: z.number().int().positive().optional(),
    nombre: z.string()
        .min(1, { message: "El nombre del tipo de propiedad es requerido" })
        .max(100, { message: "El nombre no puede tener más de 100 caracteres" }),
    descripcion: z.string()
        .min(1, { message: "La descripción es requerida" })
        .max(500, { message: "La descripción no puede tener más de 500 caracteres" })
        .transform(val => val.trim() === '' ? null : val)
});

export type TipoPropiedadFormValues = z.infer<typeof tipoPropiedadSchema>;

// This matches your existing type structure
export type TipoPropiedad = {
    idTipoPropiedad: number;
    nombre: string;
    descripcion: string | null;
};

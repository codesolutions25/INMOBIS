import { z } from "zod"

const stringSchema = (errorMsg: string) => z.coerce.string({
    required_error: errorMsg,
    invalid_type_error: "Debe ser una cadena de texto"
})

export const feriadosGlobalesSchema = z.object({
    idFeriado: z.number().int().positive().optional(),

    fecha: stringSchema("La fecha es requerida"),
    
    descripcion: stringSchema("La descripción es requerida")
    .max(200, { message: "La descripción no puede tener más de 200 caracteres" }),
})

export type FeriadosGlobalesFormValues = z.infer<typeof feriadosGlobalesSchema>;

export type FeriadosGlobales = {
    idFeriado: number;
    fecha: string;
    descripcion: string;
}


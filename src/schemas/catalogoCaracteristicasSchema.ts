import { z } from "zod"

export const catalogoCaracteristicasSchema = z.object({
    nombre: z.string({
        required_error: "El nombre es requerido",
        invalid_type_error: "El nombre debe ser una cadena de texto"
    })
        .min(1, { message: "El nombre es obligatorio" })
        .trim(),
    descripcion: z.string({
        required_error: "La descripción es requerida",
        invalid_type_error: "La descripción debe ser una cadena de texto"
    })
        .min(1, { message: "La descripción es obligatoria" })
        .trim(),
    activo: z.boolean({
        required_error: "Debe seleccionar un estado",
        invalid_type_error: "El estado debe ser un booleano"
    })
})
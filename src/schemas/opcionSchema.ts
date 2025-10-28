import { z } from "zod";

export const opcionSchema = z.object({
    id_opcion: z.number().optional(),
    nombre: z.string({
        required_error: "El nombre de la opción es obligatorio"
    })
    .min(1, "El nombre de la opción es obligatorio")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
    
    descripcion: z.string()
        .max(500, "La descripción no puede exceder los 500 caracteres")
        .nullable()
        .optional(),
    
    icono: z.string()
        .max(50, "El nombre del ícono no puede exceder los 50 caracteres")
        .nullable()
        .optional(),
        
    ruta: z.string({
        required_error: "La ruta es obligatoria"
    })
    .min(1, "La ruta es obligatoria")
    .max(255, "La ruta no puede exceder los 255 caracteres"),
    
    id_modulo: z.number({
        required_error: "Debe seleccionar un módulo",
        invalid_type_error: "El ID del módulo debe ser un número"
    }).min(1, "Debe seleccionar un módulo"),
        
    es_activo: z.boolean().default(true),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional()
});

export type OpcionFormValues = z.infer<typeof opcionSchema>;
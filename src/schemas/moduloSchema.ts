import { z } from "zod";

export const moduloSchema = z.object({
    id_modulo: z.number().optional(),
    nombre: z.string({
        required_error: "El nombre del módulo es obligatorio"
    }).min(1, "El nombre del módulo es obligatorio")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
    
    descripcion: z.string()
        .max(500, "La descripción no puede exceder los 500 caracteres")
        .optional(),
        
    
    icono: z.string()
        .max(50, "El nombre del ícono no puede exceder los 50 caracteres")
        .optional(),
        
    orden: z.number({
        required_error: "El orden es obligatorio",
        invalid_type_error: "El orden debe ser un número"
    }).int("El orden debe ser un número entero")
    .min(0, "El orden no puede ser negativo"),
    
    es_activo: z.boolean({
        required_error: "El estado activo es obligatorio",
        invalid_type_error: "El estado activo debe ser verdadero o falso"
    }).default(true),
    
    fecha_creacion: z.union([z.string(), z.date()])
        .optional()
        .transform(val => {
            if (!val) return undefined;
            return val instanceof Date ? val.toISOString() : val;
        }),
        
    fecha_actualizacion: z.union([z.string(), z.date()])
        .optional()
        .transform(val => {
            if (!val) return undefined;
            return val instanceof Date ? val.toISOString() : val;
        }),
        

    
    
});


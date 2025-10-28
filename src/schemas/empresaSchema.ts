import { z } from 'zod'

export const empresaSchema = z.object({
    razon_social: z.string({
            required_error: "La razón social es requerida"
        })
        .min(5, {
            message: "Debe tener al menos 5 caracteres"
        })
        .max(30, {
            message: "Debe tener como máximo 30 caracteres"
        }),
    // logo_url: z.string({
    //         required_error: "La url es requerida"
    //     })
    ruc: z.coerce
        .number({
            required_error: "El RUC es requerido",
            invalid_type_error: "El RUC debe ser numérico",
        })
        .int("El RUC debe ser un número entero")
        .positive("El RUC debe ser positivo")
        .refine((val) => {
            const str = val.toString()
            return str.startsWith("10") || str.startsWith("20")
        }, {
            message: "Debe empezar con 20 o 10",
        })
        .refine((val) => val.toString().length === 11, {
            message: "Debe tener 11 dígitos",
        }),        
    direccion: z.string({
            required_error: "La dirección es requerida",
        })
        .min(10, "Debe tener al menos 10 caracteres")
        .max(50, "Debe tener como máximo 50 caracteres"),
    telefono: z.coerce
        .number({
            required_error: "El teléfono es requerido",
            invalid_type_error: "El teléfono no es válido",
        })
        .int()
        .positive("El teléfono no es válido")
        .refine((val) => {
            const str = val.toString()
            return str.startsWith("9")
        }, {
            message: "Debe empezar con 9",
        })
        .refine((val) => val.toString().length === 9, {
            message: "Debe tener 9 dígitos",
        }),               
    correo: z.string({
            required_error: "El correo es requerido"
        })
        .email("El correo no es válido"),
    es_activa: z.boolean(),
    files: z.array(z.instanceof(File))
        .max(1, "Solo se puede subir un archivo")
        .refine((files) => {
            if (files.length === 0) return true;
            return files.every((file) => file.size <= 5 * 1024 * 1024);
        }, {
            message: "El archivo debe pesar menos de 5MB"
        })
        .optional()
        .default([]),
})
import { z } from "zod";

export const cajaSchema = z.object({
    id_caja: z.number().optional(),
    id_punto_venta: z.number({
        required_error: "El punto de venta es obligatorio",
        invalid_type_error: "Seleccione un punto de venta válido"
    }),
    id_tipo_caja: z.number({
        required_error: "El tipo de caja es obligatorio",
        invalid_type_error: "Seleccione un tipo de caja válido"
    }),
    nombre_caja: z.string({
        required_error: "El nombre de la caja es obligatorio"
      }).min(1, "El nombre de la caja es obligatorio"),
    id_estado_caja: z.number({
        required_error: "El estado de caja es obligatorio",
        invalid_type_error: "Seleccione un estado de caja válido"
    }).min(1, "El estado de caja debe ser un número válido"),
    saldo_inicial: z.string()
        .min(0, "El saldo inicial debe ser mayor o igual a 0")
        .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
            message: "El saldo debe ser un número positivo"
        })
        .default("0"),
    fecha_apertura: z.union([z.string(), z.date()]).optional().transform(val => {
        if (!val) return undefined;
        return val instanceof Date ? val.toISOString() : val;
    }),
    fecha_cierre: z.union([z.string(), z.date()]).optional().transform(val => {
        if (!val) return undefined;
        return val instanceof Date ? val.toISOString() : val;
    }),
});

export type CajaFormType = z.infer<typeof cajaSchema>;
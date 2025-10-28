import { z } from "zod";

export const pagoSchema = z.object({
    montoEntregado: z.number({
        required_error: "El monto es requerido",
        invalid_type_error: "El monto debe ser un número"
    }).min(0.01, "El monto debe ser mayor a 0"),
    idTipoPago: z.number({
        required_error: "El tipo de pago es requerido"
    }),
    numeroOperacion: z.string().optional(),
    banco: z.string().optional(),
    fechaOperacion: z.string().optional(),
    observaciones: z.string().optional()
}).refine(
    (data) => {
        if (data.idTipoPago === 2 || data.idTipoPago === 3) {
            return !!data.numeroOperacion && !!data.banco && !!data.fechaOperacion;
        }
        return true;
    },
    {
        message: "Número de operación, banco y fecha son requeridos para transferencia o depósito",
        path: ["numeroOperacion"]
    }
);

export type PagoFormValues = z.infer<typeof pagoSchema>;

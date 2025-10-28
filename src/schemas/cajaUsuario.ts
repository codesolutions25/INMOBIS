import { z } from "zod";

export const cajaUsuarioSchema = z.object({
    id_asignacion: z.number().optional(),
    id_caja: z.number({
        required_error: "La caja es obligatoria",
        invalid_type_error: "Seleccione una caja válida"
    }).min(1, "Seleccione una caja válida"),
    id_usuario: z.number({
        required_error: "El usuario es obligatorio",
        invalid_type_error: "Seleccione un usuario válido"
    }).min(1, "Seleccione un usuario válido"),
    fecha_asignacion: z.union([z.string(), z.date()]).transform(val => {
        if (!val) return new Date().toISOString();
        return val instanceof Date ? val.toISOString() : val;
    }).optional(),
    fecha_termino: z.union([z.string(), z.date()]).optional().transform(val => {
        if (!val) return undefined;
        return val instanceof Date ? val.toISOString() : val;
    }).refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, {
        message: "Fecha de término no válida"
    }),
}).refine(data => {
    if (!data.fecha_termino) return true;
    const fechaAsignacion = new Date(data.fecha_asignacion || new Date());
    const fechaTermino = new Date(data.fecha_termino);
    return fechaTermino >= fechaAsignacion;
}, {
    message: "La fecha de término debe ser posterior a la fecha de asignación",
    path: ["fecha_termino"]
});

export type CajaUsuarioFormType = z.infer<typeof cajaUsuarioSchema>;
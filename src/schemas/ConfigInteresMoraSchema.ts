import { z } from 'zod';

// Función para validar fechas
const isValidDate = (dateString: string): boolean => {
  return !isNaN(Date.parse(dateString));
};

// Esquema base
export const configInteresMoraSchema = z.object({
  // Validación de empresa
  idEmpresa: z.number({
    required_error: "Debe seleccionar una empresa",
    invalid_type_error: "El ID de la empresa debe ser un número"
  }).min(1, { message: "Debe seleccionar una empresa" }),
  
  // Validación de monto fijo
  montoFijo: z.string()
    .min(1, { message: "El monto fijo es requerido" })
    .refine(val => !isNaN(parseFloat(val)), { message: "Debe ser un número válido" })
    .refine(val => parseFloat(val) > 0, { message: "El monto debe ser mayor a cero" }),
  
  // Validación de fechas
  aplicaDesdeDia: z.string()
    .min(1, { message: "La fecha de inicio es requerida" })
    .refine(isValidDate, { message: "Fecha inválida" }),
    
  aplicaHastaDia: z.string()
    .min(1, { message: "La fecha final es requerida" })
    .refine(isValidDate, { message: "Fecha inválida" })
    
}).superRefine((data, ctx) => {
  // Validación de rango de fechas
  if (data.aplicaDesdeDia && data.aplicaHastaDia) {
    const desde = new Date(data.aplicaDesdeDia);
    const hasta = new Date(data.aplicaHastaDia);
    
    if (hasta < desde) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha final debe ser mayor o igual a la fecha inicial",
        path: ["aplicaHastaDia"]
      });
    }
  }
});

import { z } from "zod"

// Helper para campos numéricos que pueden venir como string o estar vacíos
const numberSchema = (errorMsg: string) => z.coerce.number({
  required_error: errorMsg,
  invalid_type_error: "Debe ser un número válido"
})

export const propiedadSchema = z.object({
    idProyectoInmobiliario: numberSchema("El proyecto inmobiliario es requerido")
        .min(1, { message: "Debe seleccionar un proyecto válido" }),
    
    idTiposPropiedad: numberSchema("El tipo de propiedad es requerido")
        .min(1, { message: "Debe seleccionar un tipo válido" }),
    
    idEstadoPropiedad: numberSchema("El estado de propiedad es requerido")
        .min(1, { message: "Debe seleccionar un estado válido" }),
    
    direccion: z.string({
            required_error: "La dirección es requerida",
        })
        .min(1, { message: "La dirección no puede estar vacía" })
        .trim(),
    
    codigoPropiedad: z.string({
            required_error: "El código es requerido",
        })
        .min(1, { message: "El código no puede estar vacío" })
        .max(50, { message: "El código debe tener máximo 50 caracteres" })
        .trim(),
    
    nombre: z.string({
            required_error: "El nombre es requerido",
        })
        .min(1, { message: "El nombre no puede estar vacío" })
        .trim(),
    
    descripcion: z.string({
            required_error: "La descripción es requerida",
        })
        .min(1, { message: "La descripción no puede estar vacía" })
        .trim(),
    
    precio: numberSchema("El precio es requerido")
        .min(0.01, { message: "El precio debe ser mayor que cero" })
        .refine((val: number) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
            message: "El precio debe tener máximo 2 decimales",
        }),
    
    areaM2: numberSchema("El área es requerida")
        .min(0.01, { message: "El área debe ser mayor que cero" })
        .refine((val: number) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
            message: "El área debe tener máximo 2 decimales",
        }),
    
    piso: numberSchema("El número de piso es requerido")
        .int({ message: "El piso debe ser un número entero" }),
    
    numeroHabitaciones: numberSchema("El número de habitaciones es requerido")
        .int({ message: "El número de habitaciones debe ser un entero" })
        .min(0, { message: "El número de habitaciones no puede ser negativo" }),
    
    numeroBanos: numberSchema("El número de baños es requerido")
        .int({ message: "El número de baños debe ser un entero" })
        .min(0, { message: "El número de baños no puede ser negativo" }),
    
    estacionamiento: z.boolean({
            required_error: "Debe indicar si tiene estacionamiento",
        }),
})

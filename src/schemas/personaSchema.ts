import { z } from "zod"

// Helper for numeric fields that might come as strings or be empty
const numberSchema = (errorMsg: string) => z.coerce.number({
  required_error: errorMsg,
  invalid_type_error: "Debe ser un número válido"
})

export const personaSchema = z.object({
    // Optional ID for updates
    idPersona: numberSchema("ID de persona requerido").optional(),
    
    // Required text fields with length validation
    nombre: z.string({
        required_error: "El nombre es requerido",
    })
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(50, { message: "El nombre no puede exceder los 50 caracteres" })
    .trim(),
    
    apellidoPaterno: z.string({
        required_error: "El apellido paterno es requerido",
    })
    .min(1, { message: "El apellido paterno no puede estar vacío" })
    .max(50, { message: "El apellido paterno no puede exceder los 50 caracteres" })
    .trim(),
    
    apellidoMaterno: z.string({
        required_error: "El apellido materno es requerido",
    })
    .min(1, { message: "El apellido materno no puede estar vacío" })
    .max(50, { message: "El apellido materno no puede exceder los 50 caracteres" })
    .trim(),
    
    // Required numeric fields with validation
    idTipoGenero: numberSchema("El género es requerido")
        .int({ message: "El género debe ser un número entero" })
        .positive({ message: "Seleccione un género válido" }),
        
    id_tipo_documento: numberSchema("El tipo de documento es requerido")
        .int({ message: "El tipo de documento debe ser un número entero" })
        .positive({ message: "Seleccione un tipo de documento válido" }),
    
    // Document number validation
    numeroDocumento: z.string({
        required_error: "El número de documento es requerido",
    })
    .min(1, { message: "El número de documento no puede estar vacío" })
    .max(20, { message: "El número de documento no puede exceder los 20 caracteres" })
    .trim(),
    
    // Contact information
    telefonoPrincipal: z.string({
        required_error: "El teléfono principal es requerido",
    })
    .min(1, { message: "El teléfono principal no puede estar vacío" })
    .max(20, { message: "El teléfono principal no puede exceder los 20 caracteres" })
    .regex(/^[0-9+\-\s()]*$/, {
        message: "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +"
    })
    .trim(),
    
    telefonoSecundario: z.string()
        .max(20, { message: "El teléfono secundario no puede exceder los 20 caracteres" })
        .regex(/^[0-9+\-\s()]*$/, {
            message: "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +"
        })
        .optional()
        .or(z.literal('')),
    
    direccion: z.string({
        required_error: "La dirección es requerida",
    })
    .min(1, { message: "La dirección no puede estar vacía" })
    .max(255, { message: "La dirección no puede exceder los 255 caracteres" })
    .trim(),
    
    // Date validation for birth date
    fechaNacimiento: z.string({
        required_error: "La fecha de nacimiento es requerida",
        invalid_type_error: "Formato de fecha inválido"
    })
    .refine(
        (date) => {
            // Check if it's in YYYY-MM-DD format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
            
            // Parse the date and check if it's valid
            const d = new Date(date);
            // Check if the date is valid and not in the future
            return !isNaN(d.getTime()) && d <= new Date();
        },
        {
            message: "Ingrese una fecha de nacimiento válida (formato: AAAA-MM-DD)"
        }
    ),
    
    // Email validation
    correoElectronico: z.string({
        required_error: "El correo electrónico es requerido",
    })
    .email({ message: "Ingrese un correo electrónico válido" })
    .max(100, { message: "El correo electrónico no puede exceder los 100 caracteres" })
    .trim()
    .toLowerCase()
})
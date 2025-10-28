import { z } from 'zod';

export const clienteSchema = z.object({
  id_tipo_documento: z.number(),
  nombre: z.string().min(1, { message: 'El nombre es requerido' }),
  apellidoPaterno: z.string().min(1, { message: 'El apellido paterno es requerido' }),
  apellidoMaterno: z.string().min(1, { message: 'El apellido materno es requerido' }),
  numeroDocumento: z.string().min(8, { message: 'El DNI debe tener 8 dígitos' }).max(8, { message: 'El DNI debe tener 8 dígitos' }),
  telefonoPrincipal: z.string().min(1, { message: 'El teléfono es requerido' }).max(9, { message: 'El teléfono no puede tener más de 9 caracteres' }),
  telefonoSecundario: z.string().optional(),
  direccion: z.string().min(1, { message: 'La dirección es requerida' }),
  correoElectronico: z.string().email({ message: 'Correo electrónico no válido' }),
  fechaNacimiento: z.any().refine((val) => (typeof val === 'string' && val.length > 0) || val instanceof Date, {
    message: 'La fecha de nacimiento es requerida',
  }),
  idTipoGenero: z.number().min(1, { message: 'Debe seleccionar un género' }),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;

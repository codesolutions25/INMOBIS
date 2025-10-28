import { z } from "zod";
import { getUsuarios } from "@/services/apiUsuarios"

const checkUsernameUnique = async (username: string) => {
    try {
        const user = await getUsuarios(1, 1000, username);
        return !user.data.length;
    } catch (error) {
        console.error('Error al verificar el nombre de usuario:', error);
        return false;
    }
};

export const usuarioPerfilSchema = z.object({
    id_usuario: z.number().int().positive().optional(),
    correoElectronico: z.string().email({ message: "Correo electrónico no válido" }),
    username: z.string()
      .min(1, { message: "El nombre de usuario es requerido" })
      .superRefine(async (username, ctx) => {
        try {
          const user = await getUsuarios(1, 1000, username);
          if (user.data.length > 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Este nombre de usuario ya está en uso",
            });
          }
        } catch (error) {
          console.error('Error al verificar el nombre de usuario:', error);
          // En caso de error, no marcamos como inválido para no bloquear al usuario
        }
    }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    telefonoPrincipal: z.string().min(9, { message: "El teléfono debe tener 9 caracteres" }).max(9, { message: "El teléfono debe tener 9 caracteres" }),
    direccion: z.string().min(1, { message: "La dirección es requerida" }),
    idPersona: z.number().int().positive().optional(),
    idEmpresa: z.number().int().positive().optional(),
})

export type UsuarioPerfilFormValues = z.infer<typeof usuarioPerfilSchema>;

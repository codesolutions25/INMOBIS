import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from 'react';
import {
  Mail, Phone, User as UserIcon, KeyRound, MapPin, UserCircle2, Building2, IdCard, Loader2, UserRoundCog,
  Pencil
} from 'lucide-react';
import { Persona } from '@/types/persona';
import { Empresa } from '@/types/empresas';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updatePersona, createPersona, getPersona } from "@/services/apiPersona";
import { updateUsuarioEmpresa, getUsuarioEmpresaByUserId } from "@/services/apiUsuarioEmpresa";
import { updateUsuario } from "@/services/apiUsuarios";
import { toast } from "sonner";
import type { User } from "@/types/userData";
import { usuarioPerfilSchema, type UsuarioPerfilFormValues } from "@/schemas/usuarioPerfilSchema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";



interface UsuarioPerfilModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  persona?: Persona;
  empresa?: Empresa;
}

export function UsuarioPerfilModal({ open, onOpenChange, user, persona, empresa }: UsuarioPerfilModalProps) {

  const [editing, setEditing] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [personaData, setPersonaData] = useState<Persona | null>(persona || null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      if ((name === 'newPassword' || name === 'confirmPassword') &&
        (newData.newPassword || newData.confirmPassword)) {

        if (newData.newPassword && newData.confirmPassword &&
          newData.newPassword !== newData.confirmPassword) {
          setPasswordMatchError('Las contraseñas no coinciden');
        } else {
          setPasswordMatchError(null);
        }
      }

      if (name === 'newPassword') {
        if (value.length > 0 && value.length < 6) {
          setPasswordError('La contraseña debe tener al menos 6 caracteres');
        } else {
          setPasswordError(null);
        }
      }

      return newData;
    });

    if (name === 'currentPassword') {
      setCurrentPasswordError(null);
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const getInitialFormValues = () => {
    const initialValues = {
      nombre: persona?.nombre || user.nombre || "",
      apellidoPaterno: persona?.apellidoPaterno || user.apellidoPaterno || "",
      apellidoMaterno: persona?.apellidoMaterno || user.apellidoMaterno || "",
      genero: persona?.idTipoGenero?.toString() || user.genero?.toString() || "",
      fechaNacimiento: formatDateForInput(persona?.fechaNacimiento) || "",
      numeroDocumento: persona?.numeroDocumento || user.numeroDocumento || "",
      telefonoPrincipal: persona?.telefonoPrincipal || user.telefonoPrincipal || "",
      telefonoSecundario: persona?.telefonoSecundario || "",
      direccion: persona?.direccion || user.direccion || "",
      email: user.email || persona?.correoElectronico || "",
      username: user.username || "",
      password: "",
      idPersona: persona?.idPersona || user.idPersona,
      id: user.id
    };

    return initialValues;
  };

  const [form, setForm] = useState(getInitialFormValues());

  const [currentPersona, setCurrentPersona] = useState<Persona | null>(persona || null);

  useEffect(() => {
    // Actualizar currentPersona cuando cambian los props
    setCurrentPersona(persona || null);
  }, [persona]);

  useEffect(() => {
    if (open) {
      const newForm = getInitialFormValues();
      setForm(newForm);
      setEditing({});
    }
  }, [open, persona, user, currentPersona]);

  const getInitials = () => {
    const n = currentPersona?.nombre ?? user.nombre ?? '';
    const ap = currentPersona?.apellidoPaterno ?? user.apellidoPaterno ?? '';
    if (n || ap) return `${n[0] || ''}${ap[0] || ''}`.toUpperCase();
    return 'US';
  };

  const formatFecha = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${da}/${m}/${y}`;
    } catch {
      return iso;
    }
  };

  const generoLabel = (id?: number) => {
    if (id === undefined || id === null) return '';
    const map: Record<number, string> = {
      1: 'Masculino',
      2: 'Femenino',
      3: 'Otro',
    };
    return map[id] || String(id);
  };

  const toggleEdit = (key: keyof typeof form) => {
    setEditing(prev => {
      const newEditingState = { ...prev, [key]: !prev[key] };

      if (prev[key]) {
        setForm(prevForm => {
          const originalValues = getInitialFormValues();
          return {
            ...prevForm,
            [key]: originalValues[key as keyof typeof originalValues]
          };
        });
      }
      return newEditingState;
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const hasChanges = () => {
    const profileChanged =
      form.nombre !== (currentPersona?.nombre || user.nombre || "") ||
      form.apellidoPaterno !== (currentPersona?.apellidoPaterno || user.apellidoPaterno || "") ||
      form.apellidoMaterno !== (currentPersona?.apellidoMaterno || user.apellidoMaterno || "") ||
      form.email !== (user.email || currentPersona?.correoElectronico || "") ||
      form.telefonoPrincipal !== (currentPersona?.telefonoPrincipal || user.telefonoPrincipal || "") ||
      form.direccion !== (currentPersona?.direccion || user.direccion || "");

    const usernameChanged = form.username !== user.username;

    const passwordFieldsFilled =
      passwordData.currentPassword !== '' ||
      passwordData.newPassword !== '' ||
      passwordData.confirmPassword !== '';

    const hasAnyChanges = profileChanged || usernameChanged || passwordFieldsFilled;


    return hasAnyChanges;
  };

  const isPasswordFormValid = () => {
    if (!passwordData.currentPassword && !passwordData.newPassword && !passwordData.confirmPassword) {
      return true;
    }

    const allFieldsFilled =
      passwordData.currentPassword !== '' &&
      passwordData.newPassword !== '' &&
      passwordData.confirmPassword !== '';

    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;
    const isLengthValid = passwordData.newPassword.length >= 6;

    return allFieldsFilled && passwordsMatch && isLengthValid;
  };

  const isFormValid = () => {
    if (passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword) {
      return isPasswordFormValid();
    }

    return hasChanges();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setPasswordError(null);
    setCurrentPasswordError(null);
    setPasswordMatchError(null);

    let shouldCloseModal = true;
    let hasErrors = false;

    try {

      // 1. Verificar si hay cambios en datos de persona (solo si tiene idPersona válido)
      const personaFieldsChanged =
        form.nombre !== (currentPersona?.nombre || user.nombre || "") ||
        form.apellidoPaterno !== (currentPersona?.apellidoPaterno || user.apellidoPaterno || "") ||
        form.apellidoMaterno !== (currentPersona?.apellidoMaterno || user.apellidoMaterno || "") ||
        form.email !== (user.email || currentPersona?.correoElectronico || "") ||
        form.telefonoPrincipal !== (currentPersona?.telefonoPrincipal || user.telefonoPrincipal || "") ||
        form.direccion !== (currentPersona?.direccion || user.direccion || "");


      // 2. Verificar si hay cambios en los 3 campos editables (email, telefono, direccion)
      const emailChanged = form.email !== (user.email || currentPersona?.correoElectronico || "");
      const telefonoChanged = form.telefonoPrincipal !== (currentPersona?.telefonoPrincipal || user.telefonoPrincipal || "");
      const direccionChanged = form.direccion !== (currentPersona?.direccion || user.direccion || "");

      const hasPersonaChanges = emailChanged || telefonoChanged || direccionChanged;

      // Solo actualizar si hay cambios en los 3 campos editables
      if (hasPersonaChanges) {

        // Determinar correctamente el ID de persona para evitar actualizar la persona equivocada
        let personaIdToUpdate = null;

        // PRIORIDAD 1: Usar currentPersona.idPersona si existe (debe ser el ID correcto)
        if (currentPersona && currentPersona.idPersona && currentPersona.idPersona > 0) {
          personaIdToUpdate = currentPersona.idPersona;
        }
        // PRIORIDAD 2: Si no tiene currentPersona.idPersona, usar user.idPersona
        else if (user.idPersona && user.idPersona > 0) {
          personaIdToUpdate = user.idPersona;
        }
        // PRIORIDAD 3: Si no hay ninguno, buscar en usuario_empresa (SOLO para usuarios de empresa)
        else if (user.type !== 'system' && user.tipo_usuario !== 'regular') {
          try {
            const usuarioEmpresa = await getUsuarioEmpresaByUserId(user.id);

            if (usuarioEmpresa && usuarioEmpresa.id_persona && usuarioEmpresa.id_persona > 0) {
              personaIdToUpdate = usuarioEmpresa.id_persona;
            } else if (usuarioEmpresa && (usuarioEmpresa as any).idPersona && (usuarioEmpresa as any).idPersona > 0) {
              personaIdToUpdate = (usuarioEmpresa as any).idPersona;
            } else {
              toast.error('No se pudo determinar la persona a actualizar');
              return;
            }
          } catch (error) {
            toast.error('Error al verificar datos del usuario');
            return;
          }
        }

        // Para usuarios del sistema sin id_persona, intentar obtener datos del usuario completo
        if (!personaIdToUpdate && (user.type === 'system' || user.tipo_usuario === 'regular')) {
          try {
            const userResponse = await fetch(`/api/proxy?service=auth&path=usuarios/${user.id}`, {
              credentials: 'include',
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();

              if (userData.idPersona && userData.idPersona > 0) {
                personaIdToUpdate = userData.idPersona;
              } else {
                // Crear nueva persona para usuarios del sistema sin id_persona
                const newPersonaData = {
                  nombre: user.nombre || '',
                  apellido_paterno: user.apellidoPaterno || '',
                  apellido_materno: user.apellidoMaterno || '',
                  correo_electronico: form.email.trim(),
                  telefono_principal: form.telefonoPrincipal.trim(),
                  direccion: form.direccion.trim(),
                  numero_documento: user.numeroDocumento || '',
                  fecha_nacimiento: user.fechaNacimiento || null,
                  id_tipo_genero: user.genero ? Number(user.genero) : 1,
                  id_tipo_documento: 1 // DNI por defecto
                };

                try {
                  const newPersona = await createPersona(newPersonaData);

                  // Actualizar el usuario del sistema para asociarlo con la nueva persona
                  await updateUsuario(user.id, { idPersona: newPersona.idPersona });

                  personaIdToUpdate = newPersona.idPersona;

                  // Actualizar datos locales
                  setPersonaData(newPersona);
                  setCurrentPersona(newPersona);

                  toast.success("Perfil de persona creado y asociado correctamente");
                } catch (createError) {
                  toast.error('Error al crear perfil de persona');
                  return;
                }
              }
            } else {
              toast.error('Error al obtener datos del usuario');
              return;
            }
          } catch (userError) {
            toast.error('Error de conexión al obtener datos del usuario');
            return;
          }
        }

        // Verificar que la persona que vamos a actualizar es la correcta
        if (personaIdToUpdate && personaIdToUpdate > 0) {
          try {
            const personaToUpdate = await getPersona(personaIdToUpdate);

            // Validación más robusta: verificar múltiples campos
            const isValidPersona =
              personaToUpdate &&
              user.nombre && user.apellidoPaterno &&
              (
                // Opción 1: Coincide nombre completo
                (personaToUpdate.nombre === user.nombre &&
                  personaToUpdate.apellidoPaterno === user.apellidoPaterno) ||
                // Opción 2: Coincide email
                (personaToUpdate.correoElectronico === user.email) ||
                // Opción 3: Es la currentPersona que ya sabemos que es correcta
                (currentPersona && personaToUpdate.idPersona === currentPersona.idPersona)
              );

            if (!isValidPersona) {
              // Si hay currentPersona, usar esa en su lugar
              if (currentPersona && currentPersona.idPersona && currentPersona.idPersona > 0) {
                personaIdToUpdate = currentPersona.idPersona;
              } else {
                toast.error('Los datos de persona no coinciden con el usuario actual');
                return;
              }
            }
          } catch (error) {
            // Continuar de todos modos
          }
        }

        if (personaIdToUpdate && personaIdToUpdate > 0) {
          const apiData: any = {};

          // Solo incluir campos que cambiaron
          if (emailChanged) {
            apiData.correo_electronico = form.email.trim();
          }
          if (telefonoChanged) {
            apiData.telefono_principal = form.telefonoPrincipal.trim();
          }
          if (direccionChanged) {
            apiData.direccion = form.direccion.trim();
          }

          const personaActualizada = await updatePersona(personaIdToUpdate, apiData);

          // Actualizar datos locales después del guardado exitoso
          setPersonaData(personaActualizada);

          // Actualizar el formulario con los nuevos valores
          setForm(prev => ({
            ...prev,
            email: personaActualizada.correoElectronico || '',
            telefonoPrincipal: personaActualizada.telefonoPrincipal || '',
            direccion: personaActualizada.direccion || '',
          }));

          // Forzar actualización del componente para que refleje los cambios
          setCurrentPersona(personaActualizada);

          // Actualizar localStorage y contexto global
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('userProfileUpdated', {
              detail: {
                userId: user.id,
                personaData: personaActualizada
              }
            });
            window.dispatchEvent(event);

            // También actualizar el usuario en localStorage directamente aquí
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = {
              ...currentUser,
              email: personaActualizada.correoElectronico,
              telefonoPrincipal: personaActualizada.telefonoPrincipal,
              direccion: personaActualizada.direccion
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          toast.success("Datos actualizados correctamente");
        } else {
          toast.error('No se pudo determinar la persona a actualizar');
        }
      }

      // 3. Actualizar username si ha cambiado (API de usuarios, NO de personas)
      const usernameChanged = form.username.trim() !== user.username;

      if (usernameChanged) {
        try {
          const isSystemUser = user.type === 'system' || user.tipo_usuario === 'regular';

          if (isSystemUser) {
            await updateUsuario(user.id, { username: form.username.trim() });
          } else {
            await updateUsuarioEmpresa(user.id, { username: form.username.trim() });
          }

          // Actualizar localStorage para que los cambios persistan
          if (user) {
            const updatedUser = {
              ...user,
              username: form.username.trim()
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          toast.error('Error al actualizar nombre de usuario');
          hasErrors = true;
        }
      }

      // 4. Actualizar contraseña si se proporcionó una nueva
      if (passwordData.newPassword && passwordData.confirmPassword) {

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setCurrentPasswordError('Las contraseñas no coinciden');
          hasErrors = true;
          shouldCloseModal = false;
          return;
        }

        try {
          const isSystemUser = user.type === 'system' || user.tipo_usuario === 'regular';

          if (isSystemUser) {
            await updateUsuario(user.id, {
              password_hash: passwordData.newPassword
            });
          } else {
            await updateUsuarioEmpresa(user.id, {
              password_hash: passwordData.newPassword
            });
          }

          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setShowPasswordFields(false);

          toast.success("Contraseña actualizada correctamente");
        } catch (error) {
          if (error instanceof Error) {
            setCurrentPasswordError(error.message);
          } else {
            setCurrentPasswordError('Error al actualizar la contraseña');
          }
          hasErrors = true;
        }
      }

      // 5. Mostrar resultado final
      if (!hasErrors) {
        if (personaFieldsChanged || usernameChanged || (passwordData.newPassword && passwordData.confirmPassword)) {
          toast.success("Perfil actualizado correctamente");
          onOpenChange(false);
        } else {
          toast.info("No se detectaron cambios para guardar");
          onOpenChange(false);
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Error desconocido al guardar los cambios');
      }
      hasErrors = true;
    } finally {
      setIsSaving(false);
      if (hasErrors && shouldCloseModal) {
        // No cerrar el modal si hubo errores
      }
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      document.body.style.pointerEvents = '';
      setEditing({});
      setShowPasswordFields(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError(null);
      setPasswordMatchError(null);
      setCurrentPasswordError(null);
    }
    onOpenChange(isOpen);
  };

  // Agrega este efecto para limpiar el pointer-events cuando el modal se cierre
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="w-[95vw] max-w-4xl h-[97vh] max-h-[1050px] rounded-lg p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <VisuallyHidden>
                <DialogTitle>Perfil de Usuario</DialogTitle>
              </VisuallyHidden>
              <h1 className="text-lg font-semibold">Perfil de Usuario</h1>
              <DialogDescription>
                Gestiona tu información personal y credenciales de acceso
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
          <div className="p-1 space-y-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border-b border-blue-100 dark:border-blue-900">
                <h3 className="text-blue-700 dark:text-blue-200 font-medium flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Información principal
                </h3>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  {/* Sección del avatar */}
                  <div className="relative">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-2 border-white dark:border-gray-800 shadow-md">
                        <AvatarImage src={user.avatar} alt="Avatar" className="object-cover" />
                        <AvatarFallback className="text-2xl font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Información del usuario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Nombres y Apellidos</Label>
                      <div className="text-base font-semibold text-foreground">
                        {`${currentPersona?.nombre ?? user.nombre ?? ''} ${currentPersona?.apellidoPaterno ?? user.apellidoPaterno ?? ''} ${currentPersona?.apellidoMaterno ?? user.apellidoMaterno ?? ''}`.trim()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tipo de usuario</Label>
                      <div className="text-sm text-foreground">
                        {user.tipo_usuario}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Correo electrónico</Label>
                      <div className="text-sm text-foreground">
                        {form.email}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Teléfono</Label>
                      <div className="text-sm text-foreground">
                        {currentPersona?.telefonoPrincipal || user.telefonoPrincipal || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-white dark:bg-gray-900">
            <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border-b border-blue-100 dark:border-blue-900 rounded-t-md">
              <h3 className="text-blue-700 dark:text-blue-200 font-medium flex items-center gap-2"><IdCard className="h-4 w-4" />Datos de Persona</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Número de documento</Label>
                <div className="mt-1 text-sm">{currentPersona?.numeroDocumento || user.numeroDocumento || '—'}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fecha de nacimiento</Label>
                <div className="mt-1 text-sm">{formatFecha(currentPersona?.fechaNacimiento || user.fechaNacimiento) || '—'}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Género</Label>
                <div className="mt-1 text-sm">{generoLabel(currentPersona?.idTipoGenero || Number(user.genero)) || '—'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-white dark:bg-gray-900">
            <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border-b border-blue-100 dark:border-blue-900 rounded-t-md">
              <h3 className="text-blue-700 dark:text-blue-200 font-medium flex items-center gap-2"><Building2 className="h-4 w-4" />Empresa</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <div className="mt-1 text-sm">{empresa?.razonSocial}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">RUC</Label>
                <div className="mt-1 text-sm">{empresa?.ruc}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Teléfono empresa</Label>
                <div className="mt-1 text-sm">{empresa?.telefono || ''}</div>
              </div>
            </div>
          </div>

          <DialogDescription className="text-xl flex items-center gap-2">
            Aquí puedes actualizar tus credenciales de acceso
            <UserRoundCog className="h-4 w-4" />
          </DialogDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Correo electrónico</Label>
              <div className="flex gap-2">
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  readOnly={!editing.email}
                />
                <Button type="button" className={editing.email ? "bg-red-500 hover:bg-red-400 cursor-pointer" : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'} onClick={() => toggleEdit('email')}>
                  {editing.email ? 'Cancelar' : 'Cambiar'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Teléfono</Label>
              <div className="flex gap-2">
                <Input
                  name="telefonoPrincipal"
                  value={form.telefonoPrincipal}
                  onChange={handleChange}
                  readOnly={!editing.telefonoPrincipal}
                />
                <Button type="button" className={editing.telefonoPrincipal ? 'bg-red-500 hover:bg-red-400 cursor-pointer' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'} onClick={() => toggleEdit('telefonoPrincipal')}>
                  {editing.telefonoPrincipal ? 'Cancelar' : 'Cambiar'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Nombre de usuario</Label>
              <div className="flex gap-2">
                <Input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  readOnly={!editing.username}
                />
                <Button type="button" className={editing.username ? 'bg-red-500 hover:bg-red-400 cursor-pointer' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'} onClick={() => toggleEdit('username')}>
                  {editing.username ? 'Cancelar' : 'Cambiar'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Dirección
              </Label>
              <div className="flex gap-2">
                <Input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  readOnly={!editing.direccion}
                />
                <Button type="button" className={editing.direccion ? 'bg-red-500 hover:bg-red-400 cursor-pointer' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'} onClick={() => toggleEdit('direccion')}>
                  {editing.direccion ? 'Cancelar' : 'Cambiar'}
                </Button>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Cambiar contraseña</Label>
                <Button
                  type="button"
                  className={showPasswordFields ? 'bg-red-500 hover:bg-red-400 cursor-pointer' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}
                  size="sm"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                >
                  {showPasswordFields ? 'Cancelar cambios' : 'Cambiar contraseña'}
                </Button>
              </div>

              {showPasswordFields && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border">
                  <div className="space-y-2">
                    <Label>Contraseña actual</Label>
                    <Input
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Ingresa tu contraseña actual"
                      className={currentPasswordError ? 'border-red-500' : ''}
                    />
                    {currentPasswordError && (
                      <p className="text-sm text-red-500 mt-1">{currentPasswordError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Nueva contraseña</Label>
                    <Input
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Ingresa tu nueva contraseña"
                      className={passwordMatchError ? 'border-red-500' : ''}
                    />
                    <p className={`text-xs ${passwordMatchError ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {passwordMatchError || 'La contraseña debe tener al menos 6 caracteres'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar nueva contraseña</Label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirma tu nueva contraseña"
                      className={passwordMatchError ? 'border-red-500' : ''}
                    />
                    {passwordMatchError && passwordData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordMatchError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t px-6 py-4 flex justify-end gap-3">
          <Button
            variant="outline"
            className="px-5 cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cerrar
          </Button>
          <Button
            className="px-5 cursor-pointer"
            onClick={handleSave}
            disabled={isSaving || !hasChanges() || !isFormValid()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin cursor-pointer" />
                Guardando...
              </>
            ) : 'Guardar cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

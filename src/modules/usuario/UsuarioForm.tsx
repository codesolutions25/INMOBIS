import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUsuarioEmpresa, updateUsuarioEmpresa } from "@/services/apiUsuarioEmpresa";
import { createUsuario, updateUsuario } from "@/services/apiUsuarios";
import { Usuario } from "@/types/usuarios";
import { useAlert } from "@/contexts/AlertContext";
import { useState, useEffect, useCallback } from "react";
import { Persona } from "@/types/persona";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { getEmpresas } from "@/services/apiEmpresa";
import { getDetallesByUsuarioId, getDetallesByUsuarioEmpresaId, createDetalleUsuario, updateDetalleUsuario } from "@/services/apiDetalleUsuario";
import { useAuth } from "@/contexts/AuthContext";

const usuarioSchema = z.object({
    idUsuario: z.number().optional(),
    username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
    idPersona: z.number().min(1, "Debe seleccionar una persona").optional(),
    idEmpresa: z.number({
        required_error: "Debe seleccionar una empresa",
        invalid_type_error: "Debe seleccionar una empresa válida"
    }).min(1, "Debe seleccionar una empresa").optional(),
    esSuperAdmin: z.boolean().default(false),
    estaActivo: z.boolean().default(true),
    fechaInicio: z.union([
        z.string().min(1, "La fecha de inicio es requerida"),
        z.date()
    ]).transform(val => typeof val === 'string' ? new Date(val) : val),
    fechaFin: z.union([
        z.string().min(1, "La fecha de fin es requerida"),
        z.date()
    ]).transform(val => typeof val === 'string' ? new Date(val) : val).optional()
});

type UsuarioFormValues = z.infer<typeof usuarioSchema> & {
    [key: string]: any;
};

type UsuarioFormProps = {
    usuario?: any;
    persona?: Persona;
    onSuccess?: () => void;
    activeTab?: string;
    isSystemUser?: boolean;
    isEditing?: boolean;
}

export default function UsuarioForm({
    usuario ,
    persona,
    onSuccess,
    activeTab,
    isSystemUser = false,
    isEditing: externalIsEditing = false
}: UsuarioFormProps) {
    const isEditing = !!usuario;
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [empresas, setEmpresas] = useState<{ value: string; label: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch empresas and user data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // First, fetch all companies
                const empresasResponse = await getEmpresas(1, 1000);
                
                if (empresasResponse?.data && Array.isArray(empresasResponse.data)) {
                    let filteredEmpresas = [...empresasResponse.data];
                    
                    // If user is a company user, filter to only show their company
                    if (user?.tipo_usuario === 'company' && user?.id_empresa) {
                        filteredEmpresas = filteredEmpresas.filter(
                            empresa => empresa.idEmpresa === user.id_empresa
                        );
                        
                        // If we found the user's company, set it in the form
                        if (filteredEmpresas.length > 0) {
                            form.setValue('idEmpresa', user.id_empresa);
                        }
                    }
                    
                    // Map the (filtered) companies to the format needed for the combobox
                    const empresasOptions = filteredEmpresas.map((empresa) => ({
                        value: empresa.idEmpresa.toString(),
                        label: empresa.razonSocial || 'Sin nombre'
                    }));
                    
                    setEmpresas(empresasOptions);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.tipo_usuario, user?.id_empresa]);

    // Form initialization
    const form = useForm<UsuarioFormValues>({
        resolver: zodResolver(usuarioSchema),
        defaultValues: {
            idUsuario: undefined,
            username: "",
            password: "",
            idPersona: persona?.idPersona || undefined,
            idEmpresa: isSystemUser ? undefined : undefined,
            esSuperAdmin: false,
            estaActivo: true,
            fechaInicio: undefined,
            fechaFin: undefined
        }
    });

    // Efecto para actualizar los valores del formulario cuando cambien los props
    useEffect(() => {
        // Solo establecer valores si estamos en modo edición
        if (isEditing && (usuario || persona)) {
            const values: Partial<UsuarioFormValues> = {
                username: usuario?.username || "",
                password: "", // No mostrar la contraseña existente
                idPersona: persona?.idPersona || usuario?.idPersona || undefined,
                esSuperAdmin: usuario?.esSuperAdmin || false,
                estaActivo: usuario?.estaActivo ?? true,
                idEmpresa: isSystemUser ? undefined : (usuario?.idEmpresa || undefined),
            };

            if (usuario?.fechaInicio) {
                values.fechaInicio = new Date(usuario.fechaInicio);
            }
            if (usuario?.fechaFin) {
                values.fechaFin = new Date(usuario.fechaFin);
            }

            form.reset(values);
        } else if (persona) {
            // En modo creación, solo establecer la persona
            form.reset({
                idPersona: persona.idPersona,
                username: "",
                password: "",
                esSuperAdmin: false,
                estaActivo: true
            });
        }
    }, [usuario, persona, isSystemUser, form, isEditing]);

    const onSubmit = async (data: UsuarioFormValues) => {
        try {
            setIsSubmitting(true);

            // Determinar si es un usuario de sistema o empresa basado en la pestaña activa
            const isSystemUser = activeTab === 'system';

            if (isSystemUser) {
                // Lógica para usuarios del sistema
                const isEditing = externalIsEditing || !!usuario?.idUsuario;

                // 1. Crear/actualizar el usuario del sistema
                const usuarioData: any = {
                    username: data.username,
                    // Para creación de usuario, solo incluir campos necesarios
                    ...(!isEditing && {
                        id_persona: Number(persona?.idPersona || usuario?.idPersona),
                        password_hash: data.password || undefined
                    })
                };

                let savedUsuario: any;

                try {
                    if (!isEditing) {
                        // Crear nuevo usuario del sistema
                        const response: any = await createUsuario({
                            username: data.username,
                            password_hash: data.password,
                            id_persona: Number(persona?.idPersona || usuario?.idPersona)
                        });
                        savedUsuario = response;
                    } else {
                        // Actualizar usuario existente - solo enviar campos permitidos
                        const usuarioId = usuario?.idUsuario;
                        if (!usuarioId) {
                            throw new Error('No se puede actualizar: ID de usuario no válido');
                        }

                        // Solo incluir campos permitidos para actualización
                        const updateData: any = { username: data.username };
                        if (data.password && data.password.trim() !== '') {
                            updateData.password_hash = data.password;
                            // Remover el campo password si existe
                            delete updateData.password;
                        }

                        const response: any = await updateUsuario(usuarioId, updateData);
                        savedUsuario = response.data;
                    }

                    // 2. Crear/actualizar el detalle de usuario si hay fechas
                    const userData = savedUsuario.data || savedUsuario; // Handle both response formats

                    if (userData?.idUsuario && (data.fechaInicio || data.fechaFin)) {
                        try {
                            // Asegurarse de que el ID del usuario sea un número
                            const userId = Number(userData.idUsuario);
                            if (isNaN(userId)) {
                                console.error('ID de usuario no válido:', userData.idUsuario);
                                throw new Error('ID de usuario no válido');
                            }

                            const detalleData:any = {
                                id_usuario: userId,
                                id_usuario_empresa: 0, // 0 for system users
                                fecha_inicio: data.fechaInicio ? new Date(data.fechaInicio).toISOString().split('T')[0] : null,
                                fecha_fin: data.fechaFin ? new Date(data.fechaFin).toISOString().split('T')[0] : null,
                                estado: Boolean(data.estaActivo ?? true)
                            };

                            const detalles = await getDetallesByUsuarioId(userId);
                           

                            if (detalles && detalles.length > 0) {
                                // Actualizar detalle existente
                                const detalleExistente = detalles[0];
                                
                                await updateDetalleUsuario(Number(detalleExistente.id), detalleData);
                                
                            } else {
                                // Crear nuevo detalle
                                
                                const nuevoDetalle = await createDetalleUsuario(detalleData);
                                
                            }
                        } catch (error:any) {
                            console.error('Error al gestionar el detalle del usuario:', error.message);
                            // Mostrar mensaje de error pero no fallar la operación principal
                            showAlert('warning', 'Advertencia', 'El usuario se creó correctamente pero hubo un error al guardar los detalles de acceso. Puede editarlos más tarde.');
                        }
                    } else {
                        console.log('No se creará detalle de usuario. Razón:', {
                            tieneSavedUsuario: !!savedUsuario,
                            tieneId: savedUsuario?.idUsuario,
                            tieneFechas: !!(data.fechaInicio || data.fechaFin)
                        });
                    }

                    // Mostrar mensaje de éxito
                    showAlert('success', 'Éxito', `Usuario del sistema ${isEditing ? 'actualizado' : 'creado'} correctamente`);

                    // Llamar a la función de éxito si existe
                    if (onSuccess) {
                        onSuccess();
                    }

                } catch (error:any) {
                    console.error('Error al guardar el usuario del sistema:', error);
                    const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el usuario del sistema';
                    showAlert('error', 'Error', errorMessage);
                }
            } else {
                // Usar el modo de edición explícito si se proporciona, de lo contrario, verificar por idUsuarioEmpresa
                const isEditing = externalIsEditing || !!usuario?.idUsuarioEmpresa;
         

                // 1. Crear/actualizar en usuario_empresa
                const usuarioEmpresaData: any = {
                    id_usuario: 0, // No usamos la tabla de usuarios
                    id_empresa: user?.tipo_usuario === 'company' ? user.id_empresa : Number(data.idEmpresa),
                    id_persona: Number(persona?.idPersona || usuario?.idPersona),
                    username: data.username,
                    id_sistema: 1
                };
                
                console.log('ID de empresa a guardar:', usuarioEmpresaData.id_empresa, 'Tipo:', typeof usuarioEmpresaData.id_empresa);

                // Solo incluir la contraseña si se proporcionó un valor
                if (data.password && data.password.trim() !== '') {
                    usuarioEmpresaData.password_hash = data.password;
                }

                console.log('Datos de usuario empresa a guardar:', usuarioEmpresaData);

                let savedUsuarioEmpresa: any;

                try {
                    if (!isEditing) {
                        // Siempre crear un nuevo usuario por defecto
                       
                        const response: any = await createUsuarioEmpresa(usuarioEmpresaData);
                        savedUsuarioEmpresa = response.data;
                       
                    } else {
                        // Solo actualizar si estamos en modo edición explícito
                        const usuarioEmpresaId:any = usuario?.idUsuarioEmpresa;
                        if (!usuarioEmpresaId) {
                            throw new Error('No se puede actualizar: ID de usuario-empresa no válido');
                        }

                        const response: any = await updateUsuarioEmpresa(usuarioEmpresaId, usuarioEmpresaData);
                        savedUsuarioEmpresa = response.data;
                       
                    }

                    // 2. Crear/actualizar el detalle de usuario
                    if (savedUsuarioEmpresa) {
                        // Asegurarnos de que tenemos un ID válido
                        const usuarioEmpresaId:any = savedUsuarioEmpresa.idUsuarioEmpresa || savedUsuarioEmpresa.id_usuario_empresa;

                        if (!usuarioEmpresaId) {
                            throw new Error('No se pudo obtener un ID de usuario-empresa válido');
                        }

                        const detalleData = {
                            id_usuario: 0,
                            id_usuario_empresa: usuarioEmpresaId,
                            fecha_inicio: data.fechaInicio ? new Date(data.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            fecha_fin: data.fechaFin ? new Date(data.fechaFin).toISOString().split('T')[0] : null,
                            estado: data.estaActivo !== undefined ? data.estaActivo : true
                        };

                        

                        try {
                            // Primero verificar si ya existe un detalle
                            
                            const detalles = await getDetallesByUsuarioEmpresaId(usuarioEmpresaId);

                            if (detalles && detalles.length > 0) {
                                
                                // Actualizar el detalle existente
                                await updateDetalleUsuario(detalles[0].id, detalleData);
                                
                            } else {
                                
                                // Crear nuevo detalle
                                await createDetalleUsuario(detalleData);
                            
                            }
                        } catch (error) {
                            console.error('Error al gestionar el detalle de usuario:', error);
                            throw error; // Relanzar el error para manejarlo en el catch externo
                        }
                    } else {
                        console.error('No se pudo guardar la relación usuario-empresa');
                        throw new Error('Error al guardar la relación usuario-empresa');
                    }

                    showAlert('success', 'Éxito', isEditing ? 'Usuario de empresa actualizado correctamente' : 'Usuario de empresa creado correctamente');
                } catch (error) {
                    console.error('Error al crear/actualizar usuario empresa:', error);
                    throw error;
                }
            }

            // Solo llamar onSuccess si existe, sin resetear el formulario
            if (onSuccess) {
                onSuccess();
            } else {
                // Mantener los valores actuales del formulario
                form.reset({
                    ...data,
                    // Mantener la contraseña como está si existe, de lo contrario dejarla vacía
                    password: data.password || ''
                }, {
                    keepValues: true,  // Mantener los valores actuales
                    keepDirty: true,   // Mantener el estado de "sucio"
                    keepIsSubmitted: true,  // Mantener el estado de envío
                    keepTouched: true, // Mantener los campos tocados
                    keepIsValid: true, // Mantener el estado de validación
                    keepSubmitCount: true // Mantener el contador de envíos
                });
            }
        } catch (error) {
            console.error('Error saving user:', error);
            showAlert('error', 'Error', 'No se pudo guardar el usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = useCallback(() => {
        form.reset({
            idEmpresa: undefined,
            username: '',
            password: '',
            esSuperAdmin: false,
            estaActivo: true,
            fechaInicio: undefined,
            fechaFin: undefined
        });
    }, [form]);

    useEffect(() => {
        if (persona) {
            resetForm();
        }
    }, [persona, resetForm]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold">
                                {isEditing ? 'Editar Acceso' : 'Nuevo Acceso'}
                            </h3>
                            <span className="text-muted-foreground">
                                {isSystemUser ? '(Usuario del Sistema)' : '(Usuario de Empresa)'}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {isEditing ? 'Actualice los datos del acceso' : 'Complete los datos para otorgar un nuevo acceso'}
                    </p>

                    <div className="w-full">
                        {isSystemUser || persona && (
                            <div className="mb-3 rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 w-full">
                                <div className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <h4 className="font-medium">Información de la Persona Seleccionada</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Nombres y apellidos: {persona.nombre} {persona.apellidoPaterno} {persona.apellidoMaterno || ''}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium">Documento de identidad:</span> {persona.numeroDocumento || 'No especificado'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isSystemUser && (
                            <FormField
                                control={form.control}
                                name="idEmpresa"
                                render={({ field }) => {
                                    const value = field.value ? field.value.toString() : '';
                                    const error = form.formState.errors.idEmpresa;

                                    return (
                                        <FormItem>
                                            <FormLabel>Empresa <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <div className={error ? 'border border-red-500 rounded-md' : ''}>
                                                    <Combobox
                                                        options={user?.tipo_usuario === 'company' ? empresas : [
                                                            { value: '', label: 'Seleccione una empresa', disabled: true },
                                                            ...empresas
                                                        ]}
                                                        selected={user?.tipo_usuario === 'company' && user?.id_empresa ? user.id_empresa.toString() : value}
                                                        onChange={(selectedValue) => {
                                                            if (selectedValue && selectedValue !== '') {
                                                                field.onChange(Number(selectedValue));
                                                            } else {
                                                                field.onChange(null);
                                                            }
                                                            // Trigger validation on change
                                                            form.trigger('idEmpresa');
                                                        }}
                                                        onBlur={() => {
                                                            field.onBlur();
                                                            form.trigger('idEmpresa');
                                                        }}
                                                        name={field.name}
                                                        ref={field.ref}
                                                        placeholder={user?.tipo_usuario === 'company' ? '' : 'Seleccione una empresa'}
                                                        disabled={isLoading || isSubmitting || user?.tipo_usuario === 'company'}
                                                    />
                                                </div>
                                            </FormControl>
                                            {error && (
                                                <p className="text-sm font-medium text-destructive">
                                                    {error.message}
                                                </p>
                                            )}
                                        </FormItem>
                                    );
                                }}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="username"

                            render={({ field }) => (
                                <FormItem className="mt-3">
                                    <FormLabel>Nombre de usuario <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ingrese el nombre de usuario"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="mt-3">
                                    <FormLabel>Contraseña </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={usuario ? "Dejar en blanco para no cambiar" : "Ingrese la contraseña"}
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        {activeTab === 'system' && (
                            <FormField
                                control={form.control}
                                name="esSuperAdmin"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Administrador del sistema
                                            </FormLabel>
                                            <FormDescription>
                                                Los administradores tienen acceso completo al sistema
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => field.onChange(checked)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex flex-wrap gap-4 items-end">
                            <FormField
                                control={form.control}
                                name="fechaInicio"
                                render={({ field }) => (
                                    <FormItem className="flex-1 min-w-[200px]">
                                        <FormLabel>Fecha de inicio <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                className={`w-full ${form.formState.errors.fechaInicio ? 'border-red-500' : ''}`}
                                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                }}
                                                required
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fechaFin"
                                render={({ field }) => (
                                    <FormItem className="flex-1 min-w-[200px]">
                                        <FormLabel>Fecha de fin <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                className={`w-full ${form.formState.errors.fechaFin ? 'border-red-500' : ''}`}
                                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                }}
                                                required
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="estaActivo"
                                render={({ field }) => (
                                    <FormItem className="flex-1 min-w-[200px]">
                                        <div className="flex items-center space-x-4 p-4 border rounded-lg h-full">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => field.onChange(checked)}
                                                />
                                            </FormControl>
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Usuario activo
                                                </FormLabel>
                                                <FormDescription className="text-xs">
                                                    Los usuarios inactivos no pueden iniciar sesión
                                                </FormDescription>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>




                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onSuccess?.()}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={(e) => {
                                // Trigger validation before submission
                                form.trigger().then(isValid => {
                                    if (!isValid) {
                                        e.preventDefault();
                                        showAlert('error', 'Error', 'Por favor complete todos los campos requeridos');
                                    }
                                });
                            }}
                        >
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
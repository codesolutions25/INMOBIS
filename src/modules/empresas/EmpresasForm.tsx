"use client"

// Importaciones de componentes de UI
import { DialogContent } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

// Hooks de React y formularios
import { useForm } from "react-hook-form"
import { useState, useEffect, ReactElement, Dispatch, SetStateAction } from "react"

// Validación de esquema con Zod
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { empresaSchema } from "@/schemas/empresaSchema"

// Utilidades y servicios
import { formatDate } from "@/utils/dateUtils"
import { createEmpresa, updateEmpresa, uploadImage, updateImage, deleteImage, searchImage } from "@/services/apiEmpresa"

// Tipos y contextos
import { Empresa } from "@/types/empresas"
import { useAlert } from "@/contexts/AlertContext"

// Componentes personalizados
import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"

// Componentes para carga de archivos
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
    FileUploadTrigger,
} from "@/components/ui/file-upload"
import { CloudUpload, X } from "lucide-react"

import { toast } from "sonner"

type EmpresaFormValues = z.infer<typeof empresaSchema> & {
    files?: File[]
}

type EmpresaFormProps = {
    empresa?: Empresa
    onSuccess?: () => void
    closeModal?: () => void
}

export default function EmpresasForm({ empresa, onSuccess, closeModal }: EmpresaFormProps): ReactElement {
    const isEditing = !!empresa;
    const [loading, setLoading] = useState(false);
    // En la parte superior del componente, con los demás estados
    const [file, setFile] = useState<File | null>(null);
    const [imagenPrevia, setImagenPrevia] = useState<string | null>(null);

    // Hook para mostrar alertas/notificaciones
    const { showAlert } = useAlert();

    // Inicialización del formulario con react-hook-form y validación con Zod
    const form = useForm<EmpresaFormValues>({
        // Resolver para la validación con Zod
        resolver: zodResolver(empresaSchema) as any, // Type assertion to handle the optional files field

        // Valores por defecto del formulario
        defaultValues: {
            razon_social: empresa?.razonSocial || "",
            ruc: empresa?.ruc ? Number(empresa.ruc) : undefined,
            direccion: empresa?.direccion || "",
            telefono: empresa?.telefono ? Number(empresa.telefono) : undefined,
            correo: empresa?.correo || "",
            es_activa: empresa?.esActiva || false,
            files: [],
        }
    })

    // const watchAllFields = form.watch();
    // useEffect(() => {
    //     console.log("FORMULARIO:", watchAllFields);
    // }, [watchAllFields]);

    // Descargar imagen de la url para mostrar en edit
    // En tu EmpresasForm.tsx, modifica el useEffect que carga la imagen:

    useEffect(() => {
        const cargarImagenDesdeUrl = async () => {
            if (empresa?.logoUrl) {
                try {
                    // Verificar si la URL es válida
                    if (!empresa.logoUrl.startsWith('http')) {
                        // Si es una ruta relativa, construir la URL completa
                        const baseUrl = process.env.API_BASE_URL || '';
                        const imageUrl = empresa.logoUrl.startsWith('/')
                            ? `${baseUrl}${empresa.logoUrl}`
                            : `${baseUrl}/${empresa.logoUrl}`;

                        const response = await fetch(imageUrl, {
                            credentials: 'include', // Importante para incluir cookies si es necesario
                        });

                        if (!response.ok) {
                            throw new Error('No se pudo cargar la imagen');
                        }

                        const blob = await response.blob();
                        const nombre = empresa.logoUrl.split("/").pop() || "logo.jpg";
                        const archivoSimulado = new File([blob], nombre, { type: blob.type });
                        setFile(archivoSimulado);
                        setImagenPrevia(URL.createObjectURL(blob));
                    } else {
                        // Si es una URL absoluta
                        const response = await fetch(empresa.logoUrl, {
                            credentials: 'include',
                        });

                        if (!response.ok) {
                            throw new Error('No se pudo cargar la imagen');
                        }

                        const blob = await response.blob();
                        const nombre = empresa.logoUrl.split("/").pop() || "logo.jpg";
                        const archivoSimulado = new File([blob], nombre, { type: blob.type });
                        setFile(archivoSimulado);
                        setImagenPrevia(empresa.logoUrl);
                    }
                } catch (error) {
                    console.error('Error al cargar la imagen:', error);
                    // Opcional: Mostrar un mensaje al usuario
                    toast.error('No se pudo cargar la imagen del logo');
                    setImagenPrevia('/placeholder-logo.png'); // Imagen por defecto
                }
            }
        };

        cargarImagenDesdeUrl();
    }, [empresa]);

    

    const preparePayload = (data: EmpresaFormValues, logo_url: string, id_imagen?: number) => {
        const { files, ...rest } = data;
        return {
            ...rest,
            logo_url,
            id_imagen,
            ruc: String(data.ruc),
            telefono: String(data.telefono),
        };
    };

    const handlePostSubmit = () => {
        if (closeModal) closeModal();
        if (onSuccess) setTimeout(() => onSuccess(), 600);
    };

    const handleFormSubmit = async (data: EmpresaFormValues) => {
        try {
            setLoading(true);
            let logo_url = empresa?.logoUrl || "";
            let id_imagen: number | undefined = empresa?.idImagen;
            let operacionExitosa = false;

            const file = data.files?.[0];

            // --- EDICIÓN ---
            if (isEditing && empresa) {
                try {
                    // Si hay un nuevo archivo y ya existía una imagen
                    if (file && empresa.logoUrl) {
                        if (empresa.idImagen) {
                            await updateImage(empresa.idImagen, file);
                        } else {
                            const response = await uploadImage(file);
                            logo_url = response.ruta;
                            id_imagen = response.idImagen;
                        }
                    } 
                    // Si hay un nuevo archivo pero no existía imagen anterior
                    else if (file) {
                        const response = await uploadImage(file);
                        logo_url = response.ruta;
                        id_imagen = response.idImagen;
                    }

                    const empresaPayload = preparePayload(data, logo_url, id_imagen);
                    await updateEmpresa(empresa.idEmpresa, empresaPayload);
                    showAlert('success', 'Éxito', 'Empresa actualizada correctamente');
                    operacionExitosa = true;
                    handlePostSubmit();
                } catch (updateError: any) {
                    setLoading(false);
                    console.error('Error al actualizar empresa:', updateError);
                    toast.error("Error al actualizar empresa", {
                        description: updateError?.message || 'Error al actualizar la empresa',
                    });
                    return;
                }
                return;
            }

            // --- CREACIÓN ---
            if (file) {
                try {
                    const response = await uploadImage(file);
                    logo_url = response.ruta;
                    id_imagen = response.idImagen;
                    console.log("Logo nuevo:", logo_url, " ID:", id_imagen);
                } catch (uploadError) {
                    setLoading(false);
                    toast.error("Error al subir la imagen");
                    return;
                }
            }

            const empresaPayload = preparePayload(data, logo_url, id_imagen);

            try {
                await createEmpresa(empresaPayload);
                showAlert('success', 'Éxito', 'Empresa creada correctamente');
                operacionExitosa = true;
                handlePostSubmit();
            } catch (createError: any) {
                setLoading(false);
                console.error('Error desde createEmpresa:', createError);
                toast.error("Error al crear empresa", {
                    description: createError?.message || 'Error al guardar la empresa',
                });
                if (typeof id_imagen === 'number') {
                    await deleteImage(id_imagen);
                }
            }
        } catch (error) {
            setLoading(false);
            console.error('Error inesperado en handleFormSubmit:', error);
        }
    };


    const onSubmit = async (data: EmpresaFormValues) => {
        return handleFormSubmit(data);
    }

    return (
        <DialogContent className="md:min-w-[700px] max-h-[90vh] overflow-y-auto">
            <EntityForm<EmpresaFormValues>
                title={isEditing ? "Editar empresa" : "Registrar empresa"}
                titleClassName="text-xl font-semibold text-center text-[#0C4A6E] mb-6"
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <FormFieldWrapper
                            name="razon_social"
                            control={form.control}
                            label="Razón social"
                            error={form.formState.errors?.razon_social?.message as string}
                        >
                            {(field: any) => (
                                <Input type="text" {...field} />
                            )}
                        </FormFieldWrapper>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <FormFieldWrapper
                                name="direccion"
                                control={form.control}
                                label="Dirección"
                                error={form.formState.errors?.direccion?.message as string}
                            >
                                {(field: any) => (
                                    <Input type="text" {...field} />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className="grid gap-2">
                            <FormFieldWrapper
                                name="correo"
                                control={form.control}
                                label="Correo"
                                error={form.formState.errors?.correo?.message as string}
                            >
                                {(field: any) => (
                                    <Input type="text" {...field} />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        <div className="grid gap-3 col-span-3">
                            <FormFieldWrapper
                                name="telefono"
                                control={form.control}
                                label="Teléfono"
                                error={form.formState.errors?.telefono?.message as string}
                            >
                                {(field: any) => (
                                    <Input type="text" {...field} />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className="grid gap-3 col-span-3">
                            <FormFieldWrapper
                                name="ruc"
                                control={form.control}
                                label="RUC"
                                error={form.formState.errors?.ruc?.message as string}
                            >
                                {(field: any) => (
                                    <Input
                                        type="text"
                                        {...field}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className="flex col-span-1 items-start">
                            <FormFieldWrapper
                                name="es_activa"
                                control={form.control}
                                label="Activo"
                                error={form.formState.errors?.es_activa?.message as string}
                            >
                                {(field: any) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="mt-1"
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                    {/* File-input con preview de imagen, nombre y peso */}
                    {/* <FormFieldWrapper
                        name="files"
                        control={form.control}
                        label="Logo de la empresa"
                        error={form.formState.errors?.files?.message as string}
                    >
                        {(field: any) => (
                            <FileUpload
                                value={field.value}
                                onValueChange={field.onChange}
                                accept="image/*" // Solo permite archivos de imagen
                                maxFiles={1} // Máximo un archivo
                                maxSize={5 * 1024 * 1024} // Tamaño máximo de 5MB
                                multiple={false} // No permitir múltiples archivos
                                onFileReject={(_, message) => {
                                    // Manejar errores de carga de archivos
                                    form.setError("files", { message })
                                }}
                            >
                                {(!field.value || field.value.length === 0) && (
                                    <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center p-6">
                                        <CloudUpload className="size-4" />
                                            Arrastra y suelta la imagen aquí, o haz clic para seleccionar
                                    </FileUploadDropzone>
                                )}
                                
                                <FileUploadList>
                                    {(field.value || []).map((file: File, index: number) => (
                                        <FileUploadItem key={index} value={file}>
                                            <FileUploadItemPreview />                                            
                                            <FileUploadItemMetadata />                                            
                                            <FileUploadItemDelete asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 hover:bg-red-50 hover:text-red-600"
                                                    title="Eliminar archivo"
                                                >
                                                    <X className="size-4" />
                                                    <span className="sr-only">Eliminar</span>
                                                </Button>
                                            </FileUploadItemDelete>
                                        </FileUploadItem>
                                    ))}
                                </FileUploadList>
                            </FileUpload>
                        )}
                    </FormFieldWrapper> */}
                    {/* File-input con solo preview de imagen */}
                    <FormFieldWrapper
                        name="files"
                        control={form.control}
                        label="Logo de la empresa"
                        error={form.formState.errors?.files?.message as string}
                    >
                        {(field: any) => (
                            <FileUpload
                                value={field.value}
                                onValueChange={field.onChange}
                                accept="image/*" // Solo permite archivos de imagen
                                maxFiles={1} // Máximo un archivo
                                maxSize={5 * 1024 * 1024} // Tamaño máximo de 5MB
                                multiple={false} // No permitir múltiples archivos
                                onFileReject={(_, message) => {
                                    // Manejar errores de carga de archivos
                                    form.setError("files", { message })
                                }}
                            >
                                {(!field.value || field.value.length === 0) && (
                                    <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center p-6">
                                        <CloudUpload className="size-4" />
                                        Arrastra y suelta la imagen aquí, o haz <span className="font-bold">click</span> para seleccionar
                                    </FileUploadDropzone>
                                )}

                                <FileUploadList orientation="horizontal">
                                    {(field.value || []).map((file: File, index: number) => (
                                        <FileUploadItem key={index} value={file} className="p-0">
                                            <FileUploadItemPreview className="size-30 [&>svg]:size-12" />
                                            <FileUploadItemMetadata className="sr-only" />
                                            <FileUploadItemDelete asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="-top-1 -right-1 absolute size-5 rounded-full"
                                                >
                                                    <X className="size-3" />
                                                </Button>
                                            </FileUploadItemDelete>
                                        </FileUploadItem>
                                    ))}
                                </FileUploadList>
                            </FileUpload>
                        )}
                    </FormFieldWrapper>
                </div>
            </EntityForm>
        </DialogContent>
    )
}
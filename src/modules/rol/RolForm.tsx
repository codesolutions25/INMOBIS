"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createRol, updateRol } from "@/services/apiRol";
import { Rol } from "@/types/roles";
import { useAlert } from "@/contexts/AlertContext";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import styles from "./styles/RolForm.module.css";

const rolSchema = z.object({
    id_rol: z.number().optional(),
    nombre: z.string().min(2, "El nombre es obligatorio"),
    descripcion: z.string().optional(),
    es_global: z.boolean().default(false),
});

type RolFormValues = z.infer<typeof rolSchema> & {
    [key: string]: any;
};

type RolFormProps = {
    rol?: Rol;
    closeModal: () => void;
    onSuccess?: () => void;
};

export default function RolForm({ rol, onSuccess, closeModal }: RolFormProps) {
     const isEditing = !!rol?.id_rol;  // Check if we have a valid role ID
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);

    const form = useForm<RolFormValues>({
        resolver: zodResolver(rolSchema),
        defaultValues: {
            id_rol: rol?.id_rol || undefined,
            nombre: rol?.nombre || "",
            descripcion: rol?.descripcion || "",
            es_global: rol?.es_global || false,
        }
    });

    // Reset form when rol prop changes
    useEffect(() => {
        form.reset({
            id_rol: rol?.id_rol || undefined,
            nombre: rol?.nombre || "",
            descripcion: rol?.descripcion || "",
            es_global: rol?.es_global || false,
        });
    }, [rol, form]);

    const handleFormSubmit = async (data: RolFormValues) => {
        try {
            setLoading(true);
            
      
            if (isEditing && rol?.id_rol) {
                const updateData = {
                    id_rol: rol.id_rol,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    es_global: data.es_global
                };
                
                const updatedRol = await updateRol(rol.id_rol, updateData);
                showAlert('success', 'Éxito', 'Rol actualizado correctamente');
                
                if (onSuccess) onSuccess();
                if (closeModal) closeModal();
            } else {
                const createData = {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    es_global: data.es_global
                };
                
                const newRol = await createRol(createData);
                showAlert('success', 'Éxito', 'Rol creado correctamente');
                
                if (onSuccess) onSuccess();
                if (closeModal) closeModal();
            }
        } catch (error: any) {
            showAlert('error', 'Error', error.message || 'Error al guardar el rol');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleFormSubmit);

    return (
        <DialogContent className={styles.dialogContent} >
            <EntityForm<RolFormValues>
                title={`${isEditing ? 'Editar' : 'Nuevo'} Rol`}
                titleClassName="text-xl font-semibold text-left text-[#0C4A6E] mb-6"
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
                submitButtonText={isEditing ? "Actualizar" : "Crear"}
            >
                <div className={styles.grid}>
                    {/* First Row - Nombre */}
                    <div className="min-h-[100px] col-span-12">
                        <FormFieldWrapper
                            name="nombre"
                            control={form.control}
                            label="Nombre del Rol"
                            error={form.formState.errors?.nombre?.message as string}
                        >
                            {(field: any) => (
                                <Input
                                    type="text"
                                    placeholder="Ej: Administrador, Vendedor"
                                    className="h-10"
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Second Row - Descripción */}
                    <div className="min-h-[120px] col-span-12">
                        <FormFieldWrapper
                            name="descripcion"
                            control={form.control}
                            label="Descripción"
                            error={form.formState.errors?.descripcion?.message as string}
                        >
                            {(field: any) => (
                                <Textarea
                                    placeholder="Descripción detallada del rol y sus permisos"
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Third Row - Es Global */}
                    <div className="flex items-center space-x-2 col-span-12">
                        <FormField
                            control={form.control}
                            name="es_global"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Rol Global
                                        </FormLabel>
                                        <FormDescription>
                                            Los roles globales están disponibles en toda la aplicación
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                   
                </div>
            </EntityForm>
        </DialogContent>
    );
}
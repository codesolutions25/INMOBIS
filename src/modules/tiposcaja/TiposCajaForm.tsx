"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTipoCaja, updateTipoCaja } from "@/services/apiTiposCaja";
import { TipoCaja } from "@/types/tiposcaja";
import { useAlert } from "@/contexts/AlertContext";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { useState } from "react";
import styles from "./styles/TiposCajaForm.module.css"

const tipoCajaSchema = z.object({
    id_tipo_caja: z.number().optional(),
    nombre_tipo_caja: z.string().min(2, "El nombre es obligatorio"),
    descripcion_tipo_caja: z.string().optional(),
});

type TipoCajaFormValues = z.infer<typeof tipoCajaSchema> & {
    [key: string]: any; // This helps with form field types
};

type TipoCajaFormProps = {
    tipoCaja?: TipoCaja;
    closeModal: () => void;
    onSuccess?: () => void;
}

export default function TiposCajaForm({ tipoCaja, closeModal, onSuccess }: TipoCajaFormProps) {
    const isEditing = !!tipoCaja;
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);

    const form = useForm<TipoCajaFormValues>({
        resolver: zodResolver(tipoCajaSchema),
        defaultValues: {
            id_tipo_caja: tipoCaja?.id_tipo_caja || undefined,
            nombre_tipo_caja: tipoCaja?.nombre_tipo_caja || "",
            descripcion_tipo_caja: tipoCaja?.descripcion_tipo_caja || "",
        }
    });

    const handleFormSubmit = async (data: TipoCajaFormValues) => {
        try {
            setLoading(true);

            if (isEditing && tipoCaja?.id_tipo_caja) {
                await updateTipoCaja(tipoCaja.id_tipo_caja, {
                    nombre_tipo_caja: data.nombre_tipo_caja,
                    descripcion_tipo_caja: data.descripcion_tipo_caja
                });
                showAlert('success', 'Éxito', 'Tipo de caja actualizado correctamente');
            } else {
                await createTipoCaja({
                    nombre_tipo_caja: data.nombre_tipo_caja,
                    descripcion_tipo_caja: data.descripcion_tipo_caja
                });
                showAlert('success', 'Éxito', 'Tipo de caja creado correctamente');
            }

            if (onSuccess) onSuccess();
            if (closeModal) closeModal();

        } catch (error) {
            console.error('Error al guardar el tipo de caja:', error);
            showAlert('error', 'Error', 'Error al guardar el tipo de caja');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleFormSubmit);

    return (
        <DialogContent className={styles.dialogContent} >
            <EntityForm<TipoCajaFormValues>
                title={`${isEditing ? 'Editar' : 'Nuevo'} Tipo de Caja`}
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
                            name="nombre_tipo_caja"
                            control={form.control}
                            label="Nombre del Tipo de Caja"
                            error={form.formState.errors?.nombre_tipo_caja?.message as string}
                        >
                            {(field: any) => (
                                <Input
                                    type="text"
                                    placeholder="Ej: Caja chica, Caja principal"
                                    className="h-10"
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Second Row - Descripción */}
                    <div className={styles.textareaContainer}>
                        <FormFieldWrapper
                            name="descripcion_tipo_caja"
                            control={form.control}
                            label="Descripción"
                            error={form.formState.errors?.descripcion_tipo_caja?.message as string}
                        >
                            {(field: any) => (
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Descripción detallada del tipo de caja"
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );
}
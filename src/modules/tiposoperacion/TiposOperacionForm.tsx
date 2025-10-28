"use client"

import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTipoOperacion, updateTipoOperacion } from "@/services/apiTiposOperacion";
import { TipoOperacion } from "@/types/tiposoperacion";
import { useAlert } from "@/contexts/AlertContext";
import { useState } from "react";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { DialogContent } from "@/components/ui/dialog";
import { tipoOperacionSchema } from "@/schemas/tiposOperacionSchema";
import { z } from "zod";
import styles from "./styles/TiposOperacionForm.module.css"

type TipoOperacionFormValues = z.infer<typeof tipoOperacionSchema>;

type Props = {
    tipoOperacion?: TipoOperacion;
    onSuccess?: () => void;
    closeModal: () => void;
}

export default function TiposOperacionForm({ tipoOperacion, onSuccess, closeModal }: Props) {
    const { showAlert } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = Boolean(tipoOperacion?.idTipoOperacion);

    const form = useForm<TipoOperacionFormValues>({
        resolver: zodResolver(tipoOperacionSchema),
        defaultValues: {
            idTipoOperacion: tipoOperacion?.idTipoOperacion,
            nombreTipoOperacion: tipoOperacion?.nombreTipoOperacion || "",
            descripcionTipoOperacion: tipoOperacion?.descripcionTipoOperacion || "",
        }
    });

    const handleFormSubmit = async (data: TipoOperacionFormValues) => {
        try {
            setIsLoading(true);

            const apiData = {
                nombre_tipo_operacion: data.nombreTipoOperacion,
                descripcion_tipo_operacion: data.descripcionTipoOperacion || null
            };

            if (isEditing && tipoOperacion?.idTipoOperacion) {
                await updateTipoOperacion(tipoOperacion.idTipoOperacion, apiData);
                showAlert('success', 'Éxito', 'Tipo de operación actualizado correctamente');
            } else {
                await createTipoOperacion(apiData);
                showAlert('success', 'Éxito', 'Tipo de operación creado correctamente');
            }

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error al guardar tipo de operación:', error);
            showAlert(
                'error',
                'Error',
                error instanceof Error
                    ? error.message
                    : 'Ocurrió un error al procesar la solicitud'
            );
            // Close the modal even on error
            closeModal();
        } finally {
            setIsLoading(false);
            closeModal();
        }
    };
    const onSubmit = form.handleSubmit(handleFormSubmit);

    return (
        <DialogContent className={styles.dialogContent} style={{ width: '600px' }}>
            <EntityForm<TipoOperacionFormValues>
                title={`${isEditing ? 'Editar' : 'Nuevo'} Tipo de Operación`}
                titleClassName={styles.title}
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={isLoading}
                onCancel={closeModal}
                submitButtonText={isEditing ? "Actualizar" : "Crear"}
            >
                <div className={styles.subFormContainer}>
                    {/* First Row - Nombre */}
                    <div className="min-h-[100px] col-span-12">
                        <FormFieldWrapper
                            name="nombreTipoOperacion"
                            control={form.control}
                            label="Nombre del Tipo de Operación"
                            error={form.formState.errors?.nombreTipoOperacion?.message}
                        >
                            {(field) => (
                                <Input
                                    type="text"
                                    placeholder="Ej: Venta, Alquiler, Compra"
                                    className="h-10"
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Second Row - Descripción */}
                    <div className={styles.minH100px}>
                        <FormFieldWrapper
                            name="descripcionTipoOperacion"
                            control={form.control}
                            label="Descripción"
                            error={form.formState.errors?.descripcionTipoOperacion?.message}
                        >
                            {(field) => (
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Descripción detallada del tipo de operación"
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
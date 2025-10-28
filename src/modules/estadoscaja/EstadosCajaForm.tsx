"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createEstadoCaja, updateEstadoCaja } from "@/services/apiEstadosCaja";
import { EstadoCaja } from "@/types/estadoscaja";
import { useAlert } from "@/contexts/AlertContext";
import { useEffect, useState } from "react";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const estadoCajaSchema = z.object({
    id_estado_caja: z.number().optional(),
    nombre_estado_caja: z.string().min(2, "El nombre es obligatorio"),
    descripcion_estado_caja: z.string().optional(),
});

type EstadoCajaFormValues = z.infer<typeof estadoCajaSchema>;

type Props = {
    estadoCaja?: EstadoCaja;
    onSuccess?: () => void;
    closeModal: () => void;
}

export default function EstadosCajaForm({ estadoCaja, onSuccess, closeModal }: Props) {
    const { showAlert } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = Boolean(estadoCaja?.id_estado_caja);

    const form = useForm<EstadoCajaFormValues>({
        resolver: zodResolver(estadoCajaSchema),
        defaultValues: {
            id_estado_caja: estadoCaja?.id_estado_caja,
            nombre_estado_caja: estadoCaja?.nombre_estado_caja || "",
            descripcion_estado_caja: estadoCaja?.descripcion_estado_caja || "",
        }
    });

    const handleFormSubmit = async (data: EstadoCajaFormValues) => {
        try {
            setIsLoading(true);

            if (isEditing && estadoCaja?.id_estado_caja) {
                await updateEstadoCaja(estadoCaja.id_estado_caja, {
                    nombre_estado_caja: data.nombre_estado_caja,
                    descripcion_estado_caja: data.descripcion_estado_caja
                });
                showAlert('success', 'Éxito', 'Estado de caja actualizado correctamente');
            } else {
                await createEstadoCaja({
                    nombre_estado_caja: data.nombre_estado_caja,
                    descripcion_estado_caja: data.descripcion_estado_caja
                });
                showAlert('success', 'Éxito', 'Estado de caja creado correctamente');
            }

            if (onSuccess) onSuccess();
            closeModal();

        } catch (error) {
            console.error('Error al guardar estado de caja:', error);
            showAlert(
                'error', 
                'Error', 
                error instanceof Error 
                    ? error.message 
                    : 'Ocurrió un error al procesar la solicitud'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleFormSubmit);

    return (
        <DialogContent className="sm:max-w-[500px] max-h-[100vh] overflow-y-auto overflow-x-visible">
            <EntityForm<EstadoCajaFormValues>
                title={`${isEditing ? 'Editar' : 'Nuevo'} Estado de Caja`}
                titleClassName="text-xl font-semibold text-left text-[#0C4A6E] mb-6"
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={isLoading}
                onCancel={closeModal}
                submitButtonText={isEditing ? "Actualizar" : "Crear"}
            >
                <div className="md:grid md:grid-cols-12 md:gap-x-8 md:gap-y-4">
                    {/* First Row - Nombre */}
                    <div className="min-h-[100px] col-span-12">
                        <FormFieldWrapper
                            name="nombre_estado_caja"
                            control={form.control}
                            label="Nombre del Estado"
                            error={form.formState.errors?.nombre_estado_caja?.message}
                        >
                            {(field) => (
                                <Input
                                    type="text"
                                    placeholder="Ej: Abierto, Cerrado, En proceso"
                                    className="h-10"
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Second Row - Descripción */}
                    <div className="min-h-[150px] col-span-12">
                        <FormFieldWrapper
                            name="descripcion_estado_caja"
                            control={form.control}
                            label="Descripción"
                            error={form.formState.errors?.descripcion_estado_caja?.message}
                        >
                            {(field) => (
                                <textarea
                                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Descripción detallada del estado de caja"
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
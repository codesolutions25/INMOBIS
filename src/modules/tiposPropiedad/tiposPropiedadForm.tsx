"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TipoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi"
import { useAlert } from "@/contexts/AlertContext"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { tipoPropiedadSchema, TipoPropiedadFormValues } from "@/schemas/tipoPropiedadSchema"
import { DialogContent } from "@/components/ui/dialog"
import EntityForm from "@/components/form/EntityForm"
import styles from "./styles/tiposPropiedadForm.module.css"


interface TiposPropiedadFormProps {
    tipo?: TipoPropiedad
    onSuccess?: () => void
    closeModal: () => void
}

export default function TiposPropiedadForm({ tipo, onSuccess, closeModal }: TiposPropiedadFormProps) {
    const { showAlert } = useAlert();
    const isEditing = Boolean(tipo)
    const [loading, setLoading] = useState(false);
    const form = useForm<TipoPropiedadFormValues>({
        resolver: zodResolver(tipoPropiedadSchema) as any,
        defaultValues: {
            nombre: "",
            descripcion: "",
        },
    })

    useEffect(() => {
        if (isEditing && tipo) {
            form.reset({
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || "",
            });
        } else if (!isEditing) {
            form.reset({
                nombre: "",
                descripcion: "",
            });
        }
    }, [tipo, isEditing, form]);


    const handleSubmit = async (data: TipoPropiedadFormValues) => {
        setLoading(true);
        try {
            if (isEditing && tipo?.idTiposPropiedad) {
                await InmobiliariaApi.tipoPropiedadController.updateTipoPropiedad(tipo.idTiposPropiedad, data as Partial<TipoPropiedad>);
                showAlert('success', 'Éxito', 'Tipo de propiedad actualizado correctamente');
                onSuccess?.();
                closeModal();
            } else {
                await InmobiliariaApi.tipoPropiedadController.createTipoPropiedad(data as Omit<TipoPropiedad, 'idTipoPropiedad'>);
                showAlert('success', 'Éxito', 'Tipo de propiedad creado correctamente');
                onSuccess?.();
                closeModal();
            }
        } catch (error) {
            console.error("Error al guardar el tipo de propiedad:", error);
            showAlert('error', 'Error', 'Ocurrió un error al guardar el tipo de propiedad');
        } finally {
            setLoading(false);
        }

        
    }

    return (

        <DialogContent className={styles.dialogContent}>
            <EntityForm
                title={`${isEditing ? "Editar" : "Nuevo"} Tipo de Propiedad`}
                form={form}
                onSubmit={handleSubmit}
                isEditing={isEditing}
                isSubmitting={loading} 
                onCancel={closeModal}
            >
                <div className={styles.formContainer}>
                    <div className={styles.grid}>
                        <div className={styles.gridFull}>
                            <FormFieldWrapper
                                control={form.control}
                                name="nombre"
                                label="Nombre"
                                error={form.formState.errors?.nombre?.message as string}
                            >
                                <Input 
                                    {...form.register("nombre")}
                                    placeholder="Nombre del tipo de propiedad"
                                    disabled={form.formState.isSubmitting}
                                />
                            </FormFieldWrapper>
                        </div>
                    </div>
                </div>

                <div className={`${styles.grid} ${styles.gridLast}`}>
                    <div className={styles.gridFull}>
                        <FormFieldWrapper
                            control={form.control}
                            name="descripcion"
                            label="Descripción"
                            error={form.formState.errors?.descripcion?.message as string}
                        >
                            <Textarea
                                {...form.register("descripcion")}
                                placeholder="Descripción del tipo de propiedad"
                                disabled={form.formState.isSubmitting}
                                className={styles.textareaField}
                            />
                        </FormFieldWrapper>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );
}
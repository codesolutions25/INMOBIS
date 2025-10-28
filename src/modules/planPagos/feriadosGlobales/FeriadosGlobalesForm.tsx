"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form"
import{ useState, ReactElement, useEffect } from "react"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { feriadosGlobalesSchema } from "@/schemas/feriadosGlobalesSchema"
import PlanPagosApi from "@/modules/planPagos/services/PlanPagosApi"

import { FeriadosGlobales } from "@/modules/planPagos/models/planPagosModels"
import { useAlert } from "@/contexts/AlertContext"

import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import styles from './styles/FeriadosGlobalesForm.module.css';
type FeriadosGlobalesFormValues = z.infer<typeof feriadosGlobalesSchema>

type FeriadosGlobalesFormProps = {
    feriado?: FeriadosGlobales;
    onSuccess?: () => void;
    closeModal?: () => void;
}

export default function FeriadosGlobalesForm({ feriado, onSuccess, closeModal }: FeriadosGlobalesFormProps): ReactElement {
    const isEditing = !!feriado;
    const { showAlert } = useAlert();
    
    const [loading, setLoading] = useState(false);
    
    const form = useForm<FeriadosGlobalesFormValues>({
        resolver: zodResolver(feriadosGlobalesSchema),
        defaultValues: {
            fecha: "",
            descripcion: "",
        }
    });

    useEffect(() => {
        if (isEditing && feriado) {
            form.reset({
                fecha: feriado.fecha ? feriado.fecha.slice(0, 10) : "",
                descripcion: feriado.descripcion,
            });
        } else if (!isEditing) {
            form.reset({
                fecha: "",
                descripcion: "",
            });
        }
    }, [feriado, isEditing]);

    const handleSubmit = async (data: FeriadosGlobalesFormValues) => {
        setLoading(true);
        try {
            let operacionExitosa = false;
            
            if (isEditing && feriado?.idFeriadoGlobal) {
                // Actualizar feriado existente
                await PlanPagosApi.feriadosGlobalesController.updateFeriadosGlobales(
                    feriado.idFeriadoGlobal,
                    {
                        ...data,
                        fecha: data.fecha ? new Date(data.fecha).toISOString() : "",
                    }
                );
                showAlert('success', 'Éxito', 'Feriado actualizado correctamente');
                operacionExitosa = true;
            } else {
                // Crear nuevo feriado
                await PlanPagosApi.feriadosGlobalesController.createFeriadosGlobales(
                    {
                        ...data,
                        fecha: data.fecha ? new Date(data.fecha).toISOString() : "",
                    }
                );
                showAlert('success', 'Éxito', 'Feriado creado correctamente');
                operacionExitosa = true;
            }
            
            if (closeModal) {
                closeModal();
            }
            
            if (operacionExitosa && onSuccess) {
                setTimeout(() => onSuccess(), 600);
            }
        } catch (error) {
            console.error('Error al guardar feriado:', error);
            showAlert('error', 'Error', 'Ocurrió un error al guardar el feriado');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleSubmit);
    

    return (
        <DialogContent className={styles.dialogContent}>
            <EntityForm
                title={`${isEditing ? "Editar" : "Nuevo"} Feriado `}
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className={styles.formContainer}>
                    <div className={styles.grid}>
                        <div className={styles.gridFull}>
                            <FormFieldWrapper
                                name="fecha"
                                control={form.control}
                                label="Fecha"
                                error={form.formState.errors?.fecha?.message as string}
                            >
                                {(field: any) => (
                                    <div className={styles.inputContainer}>
                                        <Input
                                            type="date"
                                            placeholder="Fecha"
                                            className={styles.inputField}
                                            {...field}
                                            disabled={false}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                </div>
                <div className={`${styles.grid} ${styles.gridLast}`}>
                    <div className={styles.gridFull}>
                        <FormFieldWrapper
                            name="descripcion"
                            control={form.control}
                            label="Descripción"
                            error={form.formState.errors?.descripcion?.message as string}
                        >
                            {(field: any) => (
                                <div className={styles.inputContainer}>
                                    <Textarea
                                        placeholder="Descripción"
                                        className={styles.textareaField}
                                        {...field}
                                        disabled={false}
                                    />
                                </div>
                            )}
                        </FormFieldWrapper>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );

}
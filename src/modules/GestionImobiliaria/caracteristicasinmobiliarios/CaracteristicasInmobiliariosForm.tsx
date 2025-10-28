"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form"
import { useState, ReactElement, useEffect } from "react"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { catalogoCaracteristicasSchema } from "@/schemas/catalogoCaracteristicasSchema"

import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi"
import { CatalogoCaracteristica } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import { useAlert } from "@/contexts/AlertContext"

import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import styles from './styles/CaracteristicasInmobiliariosForm.module.css';

type CaracteristicasInmobiliariosFormValues = z.infer<typeof catalogoCaracteristicasSchema>

type CaracteristicasInmobiliariosFormProps = {
    caracteristica?: CatalogoCaracteristica & { isReadOnly?: boolean };
    onSuccess?: () => void;
    closeModal?: () => void;
    isReadOnly?: boolean;
}

export default function CaracteristicasInmobiliariosForm({ 
    caracteristica, 
    onSuccess, 
    closeModal,
    isReadOnly: propIsReadOnly 
}: CaracteristicasInmobiliariosFormProps): ReactElement {
   const isEditing = !!caracteristica?.idCatalogoCaracteristicas;
   // Use propIsReadOnly if provided, otherwise fall back to the caracteristica's isReadOnly
   const isReadOnly = propIsReadOnly !== undefined ? propIsReadOnly : (isEditing && caracteristica?.isReadOnly === true);
   const { showAlert } = useAlert();
   
   const [loading, setLoading] = useState(false);
   // Initialize form with default values or existing caracteristica data
   const form = useForm<CaracteristicasInmobiliariosFormValues>({
       resolver: zodResolver(catalogoCaracteristicasSchema),
       defaultValues: {
           nombre: '',
           descripcion: '',
           activo: true
       }
   });

   // Efecto para resetear el formulario cuando cambia la característica a editar
   useEffect(() => {
       if (isEditing && caracteristica) {
           form.reset({
               nombre: caracteristica.nombre || '',
               descripcion: caracteristica.descripcion || '',
               activo: caracteristica.activo ?? true
           });
       } else {
           form.reset({
               nombre: '',
               descripcion: '',
               activo: true
           });
       }
   }, [isEditing, caracteristica, form]);

    const handleSubmit = async (data: CaracteristicasInmobiliariosFormValues) => {
        console.log('Datos del formulario a enviar:', data);
        setLoading(true);
        try {
            let operacionExitosa = false;
            let response;
            
            if (isEditing && caracteristica?.idCatalogoCaracteristicas) {
                console.log('Actualizando característica existente con ID:', caracteristica.idCatalogoCaracteristicas);
                response = await InmobiliariaApi.catalogoCaracteristicaController.updateCatalogoCaracteristica(
                    caracteristica.idCatalogoCaracteristicas, 
                    { 
                        nombre: data.nombre,
                        descripcion: data.descripcion,
                        activo: data.activo 
                    }
                );
                console.log('Respuesta de actualización:', response);
                showAlert('success', 'Éxito', 'Característica actualizada correctamente');
                operacionExitosa = true;
            } else {
                console.log('Creando nueva característica');
                response = await InmobiliariaApi.catalogoCaracteristicaController.createCatalogoCaracteristica({
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    activo: data.activo
                });
                console.log('Respuesta de creación:', response);
                showAlert('success', 'Éxito', 'Característica creada correctamente');
                operacionExitosa = true;
            }

            if (closeModal) {
                closeModal();
            }
            
            if (operacionExitosa && onSuccess) {
                setTimeout(() => onSuccess(), 600);
            }
        } catch (error) {
            console.error('Error al guardar la característica:', error);
            // Mostrar más detalles del error si están disponibles
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Detalles del error:', error);
            showAlert('error', 'Error', `Error al guardar la característica: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleSubmit);

    return (
        <DialogContent className={styles.dialogContent}>
            <EntityForm
                title={`${isEditing ? 'Editar' : 'Registrar'} característica`}
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading || isReadOnly}
                onCancel={closeModal}
            >
                {isReadOnly && (
                    <div className={styles.readOnlyAlert}>
                        <AlertCircle />
                        <span>Esta característica no se puede editar porque está asignada a una o más propiedades.</span>
                    </div>
                )}
                <div className={styles.formContainer}>
                    <div className={styles.grid}>
                        <div className={styles.gridFull}>
                            <FormFieldWrapper
                                name="nombre"
                                control={form.control}
                                label="Nombre"
                                error={form.formState.errors?.nombre?.message as string}
                            >
                                {(field: any) => (
                                <div className={styles.inputContainer}>
                                    <div className="relative w-full">
                                        <Input
                                            type="text"
                                            placeholder="Nombre de la característica"
                                            className={styles.inputField}
                                            {...field}
                                            disabled={isReadOnly}
                                            onChange={field.onChange}

                                        />
                                    </div>
                                </div>
                            )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                            
                    {isEditing && (
                        <div className={styles.grid}>
                            <div className={styles.gridFull}>
                                <FormFieldWrapper
                                    name="activo"
                                    control={form.control}
                                    label="Activo"
                                >
                                    {(field: any) => (
                                        <div className={styles.switchContainer}>
                                        <div className={styles.switchWrapper}>
                                            <span className={styles.switchLabel}>{field.value ? "Sí" : "No"}</span>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={isReadOnly ? undefined : field.onChange}
                                                className={styles.switch}
                                                disabled={isReadOnly}
                                            />
                                            {/* {isReadOnly && (
                                                <span className={styles.readOnlyBadge}>(Solo lectura)</span>
                                            )} */}
                                        </div>
                                    </div>
                                    )}
                                </FormFieldWrapper>
                            </div>
                        </div>
                    )}
                            
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
                                            placeholder="Descripción de la característica"
                                            className={styles.textareaField}
                                            {...field}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );
}
"use client"

import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTipoMovimiento, updateTipoMovimiento } from "@/services/apiTiposMovimiento";
import { TipoMovimiento } from "@/types/tiposmovimiento";
import { useAlert } from "@/contexts/AlertContext";
import { useState } from "react";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { DialogContent } from "@/components/ui/dialog";
import { tipoMovimientoSchema } from "@/schemas/tiposMovimientosSchema";
import { z } from "zod";
import styles from "./styles/TipoMovimientoForm.module.css";

type TipoMovimientoFormValues = z.infer<typeof tipoMovimientoSchema>;

type Props = {
  tipoMovimiento?: TipoMovimiento;
  onSuccess?: () => void;
  closeModal: () => void;
}

export default function TiposMovimientoForm({ tipoMovimiento, onSuccess, closeModal }: Props) {
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = Boolean(tipoMovimiento?.id_tipo_movimiento);

  const form = useForm<TipoMovimientoFormValues>({
    resolver: zodResolver(tipoMovimientoSchema),
    defaultValues: {
      id_tipo_movimiento: tipoMovimiento?.id_tipo_movimiento,
      nombre_tipo_movimiento: tipoMovimiento?.nombre_tipo_movimiento || "",
      descripcion_tipo_movimiento: tipoMovimiento?.descripcion_tipo_movimiento || "",
    }
  });

  const handleFormSubmit = async (data: TipoMovimientoFormValues) => {
    try {
      setIsLoading(true);

      const apiData = {
        nombre_tipo_movimiento: data.nombre_tipo_movimiento,
        descripcion_tipo_movimiento: data.descripcion_tipo_movimiento || null,
      };

      if (isEditing && tipoMovimiento?.id_tipo_movimiento) {
        await updateTipoMovimiento(tipoMovimiento.id_tipo_movimiento, apiData as any);
        showAlert('success', 'Éxito', 'Tipo de movimiento actualizado correctamente');
      } else {
        await createTipoMovimiento(apiData as any);
        showAlert('success', 'Éxito', 'Tipo de movimiento creado correctamente');
      }

      if (onSuccess) onSuccess();
      closeModal();
    } catch (error) {
      console.error('Error al guardar tipo de movimiento:', error);
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

  const onSubmit = (data: TipoMovimientoFormValues) => {
    return handleFormSubmit(data);
  };

  return (
    <DialogContent className={styles.dialogContent}>
      <EntityForm<TipoMovimientoFormValues>
        title={`${isEditing ? 'Editar' : 'Nuevo'} Tipo de Movimiento`}
        titleClassName={styles.title}
        form={form}
        onSubmit={onSubmit}
        isEditing={isEditing}
        isSubmitting={isLoading}
        onCancel={closeModal}
        submitButtonText={isEditing ? "Actualizar" : "Crear"}
      >
        <div className={styles.grid}>
          {/* First Row - Nombre */}
          <div className={styles.fieldContainer}>
            <FormFieldWrapper
              name="nombre_tipo_movimiento"
              control={form.control}
              label="Nombre del Tipo de Movimiento"
              error={form.formState.errors?.nombre_tipo_movimiento?.message}
            >
              {(field) => (
                <Input
                  type="text"
                  placeholder="Ej: Pago de alquiler, Gasto de mantenimiento"
                  className="h-10"
                  {...field}
                />
              )}
            </FormFieldWrapper>
          </div>

          {/* Second Row - Descripción */}
          <div className={styles.fieldContainer2}>
            <FormFieldWrapper
              name="descripcion_tipo_movimiento"
              control={form.control}
              label="Descripción"
              error={form.formState.errors?.descripcion_tipo_movimiento?.message}
            >
              {(field) => (
                <textarea
                  className={styles.textarea}
                  placeholder="Descripción detallada del tipo de movimiento"
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
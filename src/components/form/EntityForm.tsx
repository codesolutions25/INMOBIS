"use client"

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface EntityFormProps<T extends FieldValues> {
  title: string;
  titleClassName?: string;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  isEditing: boolean;
  children: ReactNode;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  isSubmitting?: boolean;
  submitButtonDisabled?: boolean;
  submitTooltip?: string;
}

/**
 * Componente genérico para formularios de entidades CRUD
 * Proporciona una estructura consistente con título, contenido y botones de acción
 */
export default function EntityForm<T extends FieldValues>({
  title,
  titleClassName,
  form,
  onSubmit,
  isEditing,
  children,
  onCancel,
  submitButtonText,
  cancelButtonText = "Cancelar",
  isSubmitting = false,
  submitButtonDisabled = false,
  submitTooltip,
}: EntityFormProps<T>): React.ReactElement {
  return (
    <div className="p-2 max-w-4xl mx-auto w-[100%]">
      <h2 className={titleClassName || "text-xl font-bold mb-8 text-[#0C4A6E] pb-2"}>
        {title}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(async (data) => {
          try {
            await onSubmit(data);
          } catch (error) {
            console.error('Error in form submission:', error);
          }
        })} className="space-y-6">
          {/* Contenido del formulario (campos) */}
          {children}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-24"
              >
                {cancelButtonText}
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || submitButtonDisabled}
              className="w-24"
              title={submitTooltip}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                submitButtonText || (isEditing ? "Actualizar" : "Crear")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

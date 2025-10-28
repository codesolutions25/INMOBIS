"use client"

import React, { ReactNode } from "react";
import { Control, ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { AlertCircle } from "lucide-react";

interface FormFieldWrapperProps {
  name: string;
  control: Control<any>;
  label: string;
  error?: string;
  children: ReactNode | ((field: ControllerRenderProps<any, string>) => ReactNode);
  className?: string;
  zIndex?: number;
  labelClassName?: string;
}

/**
 * Componente reutilizable para envolver campos de formulario con estructura consistente
 * Proporciona etiqueta, control y manejo de errores con estilos uniformes
 */
export default function FormFieldWrapper({
  name,
  control,
  label,
  error,
  children,
  className = "",
  zIndex,
  labelClassName,
}: FormFieldWrapperProps) {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={`relative ${className}`} style={zIndex ? { zIndex } : undefined}>
          <FormLabel className={labelClassName || "text-[#0C4A6E] text-sm mb-1 block"}>{label}</FormLabel>
          <FormControl>
            {typeof children === 'function' ? (children as (field: ControllerRenderProps<any, string>) => ReactNode)(field) : children}
          </FormControl>
          {error && (
            <div className="flex items-center gap-1 mt-1 bg-red-50 px-2 py-1 rounded-sm border-l-2 border-red-500">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <FormDescription className="text-red-600 text-xs font-medium m-0">
                {error}
              </FormDescription>
            </div>
          )}
        </FormItem>
      )}
    />
  );
}

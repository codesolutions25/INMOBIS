"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAlert } from "@/contexts/AlertContext"
import { createTipoPago, updateTipoPago } from "@/services/apiTipoPago"
import { TipoPago, CreateTipoPagoDto, UpdateTipoPagoDto } from "@/types/tipospago"

// Define the form schema using Zod
const tipoPagoSchema = z.object({
    nombre: z.string().min(2, "El nombre es obligatorio"),
    descripcion: z.string(),
})

type TipoPagoFormValues = z.infer<typeof tipoPagoSchema>

type TipoPagoFormProps = {
    initialData?: TipoPago;
    onSuccess?: () => void;
    onCancel: () => void;
}

export default function TipoPagoForm({ initialData, onSuccess, onCancel }: TipoPagoFormProps) {
    const isEditing = !!(initialData?.id_tipo_pago || initialData?.idTipoPago)
    const { showAlert } = useAlert()

    const form = useForm<TipoPagoFormValues>({
        resolver: zodResolver(tipoPagoSchema),
        defaultValues: {
            nombre: initialData?.nombre || "",
            descripcion: initialData?.descripcion || "",
        },
    })

    const onSubmit = async (values: TipoPagoFormValues) => {
        try {
            const tipoPagoId = initialData?.id_tipo_pago || initialData?.idTipoPago;
            if (isEditing && tipoPagoId) {
                const updateData: UpdateTipoPagoDto = {
                    nombre: values.nombre,
                    descripcion: values.descripcion
                };
                await updateTipoPago(tipoPagoId, updateData)
                showAlert(
                    'success',
                    '¡Éxito!',
                    'El tipo de pago ha sido actualizado correctamente.'
                )
            } else {
                const createData: CreateTipoPagoDto = {
                    nombre: values.nombre,
                    descripcion: values.descripcion
                };
                await createTipoPago(createData)
                showAlert(
                    'success',
                    '¡Éxito!',
                    'El tipo de pago ha sido creado correctamente.'
                )
            }
            onSuccess?.()
        } catch (error) {
            console.error("Error al guardar el tipo de pago:", error)
            showAlert(
                'error',
                'Error',
                error instanceof Error ? error.message : "Error al guardar el tipo de pago"
            )
        }
    }

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-xl font-semibold">
                {isEditing ? 'Editar Tipo de Pago' : 'Nuevo Tipo de Pago'}
            </h2>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Efectivo, Transferencia, etc." 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción (Opcional)</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Descripción del tipo de pago" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isEditing ? 'Actualizar' : 'Crear'} Tipo de Pago
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
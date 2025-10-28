"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCajaMovimiento, updateCajaMovimiento } from "@/services/apiCajaMovimientos";
import { CajaMovimiento } from "@/types/cajamovimientos";
import { useAlert } from "@/contexts/AlertContext";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { getCajas } from "@/services/apiCajas";
import { getTiposMovimiento } from "@/services/apiTiposMovimiento";
import { getTiposOperacion } from "@/services/apiTiposOperacion"; // Import the getTiposOperacion function
import { getEstadosCaja } from "@/services/apiEstadosCaja"; // Import the getEstadosCaja function
import { Caja } from "@/types/cajas";
import { TipoMovimiento } from "@/types/tiposmovimiento";
import { cajaMovimientoSchema, CajaMovimientoFormValues } from "@/schemas/cajaMovimientosSchema";
import styles from "./styles/CajaMovimientoForm.module.css"

// Environment variables for operation types
const TIPO_OPERACION_TRANSFERENCIA = process.env.NEXT_PUBLIC_TIPO_OPERACION_TRANSFERENCIA || 'Transferencia';

// Obtener el ID de caja abierta desde las variables de entorno
const ESTADO_CAJA_ABIERTA = process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA ?
    parseInt(process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA, 10) : 1; // Valor por defecto: 1

interface CajaMovimientoFormProps {
    movimiento?: CajaMovimiento;
    closeModal: () => void;
    onSuccess?: () => void;
    cajaOrigenId?: number; // Add this line
}

export default function CajaMovimientosForm({ movimiento, closeModal, onSuccess, cajaOrigenId }: CajaMovimientoFormProps) {
    const isEditing = !!movimiento;
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [allCajas, setAllCajas] = useState<Caja[]>([]);
    const [cajas, setCajas] = useState<{ value: string; label: string }[]>([]);
    const [cajasDestino, setCajasDestino] = useState<{ value: string; label: string }[]>([]);
    const [tiposMovimiento, setTiposMovimiento] = useState<{ value: string; label: string }[]>([]);
    const [tiposOperacion, setTiposOperacion] = useState<{ value: string; label: string }[]>([]);
    const [estadosCaja, setEstadosCaja] = useState<{ value: string; label: string }[]>([]);
    const [selectedTipoMovimiento, setSelectedTipoMovimiento] = useState<number | null>(
        movimiento?.id_tipo_movimiento || null
    );

    const form = useForm<z.infer<typeof cajaMovimientoSchema>>({
        resolver: zodResolver(cajaMovimientoSchema),
        defaultValues: {
            id_movimiento: movimiento?.id_movimiento,
            id_caja: cajaOrigenId || movimiento?.id_caja || 0,
            id_caja_destino: movimiento?.id_caja_destino,
            id_tipo_operacion: movimiento?.id_tipo_operacion || 0,
            id_tipo_movimiento: movimiento?.id_tipo_movimiento || 0,
            monto: movimiento?.monto || 0.01,
            descripcion_movimiento: movimiento?.descripcion_movimiento || "",
            referencia_externa: movimiento?.referencia_externa || "",
            fecha_movimiento: movimiento?.fecha_movimiento || new Date().toISOString(),
            id_usuario: movimiento?.id_usuario || 1,
            estado: movimiento?.estado ?? 0,
        },
        mode: 'onChange',
        reValidateMode: 'onChange',
    });

    // Update form values when cajaOrigenId changes
    useEffect(() => {
        if (cajaOrigenId) {
            console.log('Setting initial cajaOrigenId:', cajaOrigenId);
            form.setValue('id_caja', cajaOrigenId, { shouldValidate: true });
            
            // Si es una edición, forzar la validación del formulario
            if (isEditing) {
                form.trigger('id_caja');
            }
        }
    }, [cajaOrigenId, form, isEditing]);

    // Update form values when movimiento prop changes
    useEffect(() => {
        if (movimiento) {
            form.reset({
                ...movimiento,
                id_caja: cajaOrigenId || movimiento.id_caja,
            });
        }
    }, [movimiento, cajaOrigenId, form]);

    // Check if the selected movement type is a transfer (ID 10)
    const selectedTipoMovimientoId = form.watch('id_tipo_movimiento');
    const isTransferencia = selectedTipoMovimientoId === 10;

    // Filter cajas to exclude the currently selected source caja for destination dropdown
    const filteredCajasDestino = useMemo(() => {
        const selectedCajaId = form.watch('id_caja')?.toString();
        return cajasDestino.filter(caja => caja.value !== selectedCajaId);
    }, [cajasDestino, form.watch('id_caja')]);

   

    // Add this useEffect to handle resetting the form when movimiento changes
    useEffect(() => {
        if (movimiento) {
            // Modo edición: Establecer todos los valores del formulario desde el movimiento
            form.reset({
                ...movimiento,
                id_caja: movimiento.id_caja,
                id_tipo_operacion: movimiento.id_tipo_operacion,
                id_tipo_movimiento: movimiento.id_tipo_movimiento,
                monto: parseFloat(movimiento.monto as any) || 0,
                descripcion_movimiento: movimiento.descripcion_movimiento,
                referencia_externa: movimiento.referencia_externa || "",
                fecha_movimiento: movimiento.fecha_movimiento,
                id_caja_destino: isTransferencia ? movimiento.id_caja_destino : undefined,
                estado: Number(movimiento.estado) || 1, // Ensure estado is a number
                id_usuario: 1, // Ensure this is a number
            });
        } else if (cajas.length > 0 && tiposMovimiento.length > 0 && tiposOperacion.length > 0) {
            // Modo creación: Establecer valores por defecto
            form.reset({
                id_caja: Number(cajas[0]?.value),
                id_tipo_operacion: Number(tiposOperacion[0]?.value),
                id_tipo_movimiento: Number(tiposMovimiento[0]?.value),
                monto: 0.01,
                descripcion_movimiento: '',
                referencia_externa: '',
                fecha_movimiento: new Date().toISOString(),
                id_caja_destino: undefined,
                estado: 0, // Default to 0 (pendiente)
                id_usuario: 1, // Ensure this is a number
            });
        }
    }, [movimiento, cajas, tiposMovimiento, tiposOperacion, form]);

    // Set default values after data is loaded
    useEffect(() => {
        if (cajas.length > 0) {
            // Si tenemos un cajaOrigenId, lo usamos; de lo contrario, usamos el primer valor disponible
            const initialCajaId = cajaOrigenId || Number(cajas[0]?.value);
            console.log('Setting initial caja ID:', initialCajaId);
            form.setValue('id_caja', initialCajaId, { shouldValidate: true });
        }
        
        if (tiposMovimiento.length > 0 && !movimiento?.id_tipo_movimiento) {
            form.setValue('id_tipo_movimiento', Number(tiposMovimiento[0]?.value), { shouldValidate: true });
        }
        
        if (tiposOperacion.length > 0 && !movimiento?.id_tipo_operacion) {
            form.setValue('id_tipo_operacion', Number(tiposOperacion[0]?.value), { shouldValidate: true });
        }
    }, [cajas, tiposMovimiento, tiposOperacion, form, cajaOrigenId]);

    // Efecto específico para manejar cambios en cajaOrigenId
    useEffect(() => {
        if (cajaOrigenId && !isEditing) {
            console.log('Updating caja from cajaOrigenId:', cajaOrigenId);
            form.setValue('id_caja', cajaOrigenId, { shouldValidate: true });
        }
    }, [cajaOrigenId, form, isEditing]);

    // Efecto específico para manejar la inicialización en modo edición
    useEffect(() => {
        if (movimiento && cajas.length > 0) {
            console.log('Setting form values from movimiento:', movimiento);
            form.reset({
                ...movimiento,
                id_caja: movimiento.id_caja,
                id_tipo_operacion: movimiento.id_tipo_operacion,
                id_tipo_movimiento: movimiento.id_tipo_movimiento,
                monto: parseFloat(movimiento.monto as any) || 0,
                descripcion_movimiento: movimiento.descripcion_movimiento,
                referencia_externa: movimiento.referencia_externa || "",
                fecha_movimiento: movimiento.fecha_movimiento,
                id_caja_destino: isTransferencia ? movimiento.id_caja_destino : undefined,
                estado: Number(movimiento.estado) || 1,
                id_usuario: 1,
            });
        }
    }, [movimiento, cajas, form, isTransferencia]);

    // Fetch cajas, tipos de operación y tipos de movimiento on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Obtener los estados de caja primero
                const estadosResponse = await getEstadosCaja(1, 100);
                setEstadosCaja(estadosResponse.data.map((ec: any) => ({
                    value: ec.id_estado_caja.toString(),
                    label: ec.nombre_estado_caja || `Estado ${ec.id_estado_caja}`
                })));

                // Buscar el ID del estado "abierta"
                const estadoAbierta = estadosResponse.data.find(
                    (ec: any) => ec.nombre_estado_caja?.toLowerCase().includes('abierta')
                );

                // Si no se encuentra un estado "abierta", usar el valor por defecto de la variable de entorno
                const estadoAbiertaId = estadoAbierta?.id_estado_caja || ESTADO_CAJA_ABIERTA;

                // Fetch cajas y filtrar por estado abierto
                const cajasResponse = await getCajas(1, 100);

                // Filtrar solo las cajas abiertas
                const cajasAbiertas = cajasResponse.data.filter(
                    (caja: Caja) => caja.id_estado_caja === estadoAbiertaId
                );

                // Guardar todas las cajas (para referencia)
                setAllCajas(cajasResponse.data);

                // Mapear solo las cajas abiertas para los selects
                const cajasOptions = cajasAbiertas.map((caja: Caja) => ({
                    value: caja.id_caja.toString(),
                    label: caja.nombre_caja ? `${caja.nombre_caja} (${caja.id_caja})` : `Caja #${caja.id_caja}`
                }));

                setCajas(cajasOptions);
                setCajasDestino(cajasOptions);

                // If editing, ensure the movement's caja is in the list
                if (movimiento) {
                    const cajaExistente = cajasResponse.data.some(c => c.id_caja === movimiento.id_caja);
                    if (!cajaExistente) {
                        // If the movement's caja isn't in the open cajas, fetch it specifically
                        const cajaResponse = await getCajas(1, 1,  movimiento.id_caja.toString());
                        if (cajaResponse.data.length > 0) {
                            const caja = cajaResponse.data[0];
                            const cajaOption = {
                                value: caja.id_caja.toString(),
                                label: caja.nombre_caja ?
                                    `${caja.nombre_caja} (${caja.id_caja})` :
                                    `Caja #${caja.id_caja}`
                            };
                            setCajas(prev => [...prev, cajaOption]);
                            setCajasDestino(prev => [...prev, cajaOption]);
                        }
                    }
                }

                // Fetch tipos de movimiento
                const tiposResponse = await getTiposMovimiento(1, 100); // Adjust pagination as needed
                setTiposMovimiento(tiposResponse.data.map((tipo: TipoMovimiento) => ({
                    value: tipo.id_tipo_movimiento.toString(), // Convert to string
                    label: tipo.nombre_tipo_movimiento + " (" + tipo.id_tipo_movimiento + ")" || `Tipo #${tipo.id_tipo_movimiento}`
                })));

                // Fetch tipos de operación from the API instead of using static values
                const tiposOperacionResponse = await getTiposOperacion(1, 100);
                setTiposOperacion(tiposOperacionResponse.data.map((tipo: any) => ({
                    value: tipo.idTipoOperacion.toString(), // Convert to string
                    label: tipo.nombreTipoOperacion
                })));
            } catch (error) {
                console.error('Error fetching data:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los datos necesarios');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [showAlert]);

    const handleFormSubmit = async (data: CajaMovimiento) => {
        console.log('Iniciando envío del formulario con datos:', JSON.stringify(data, null, 2));

        // Ensure we're using the correct cajaOrigenId if it's provided
        const formData = {
            ...data,
            id_caja: cajaOrigenId || data.id_caja,
            estado: data.estado !== undefined ? Number(data.estado) : 0,
            id_usuario: 1,
            // Asegurar que id_caja_destino sea undefined si no es transferencia
            id_caja_destino: isTransferencia ? data.id_caja_destino : undefined,
        };

        console.log('Datos después de la conversión:', JSON.stringify(formData, null, 2));

        try {
            setLoading(true);

            // Validate all fields
            const validationResult = await form.trigger(undefined, { shouldFocus: true });
            console.log('Resultado de validación:', validationResult);

            if (!validationResult) {
                console.error('Validación fallida. Errores:', form.formState.errors);
                const errorMessages = Object.entries(form.formState.errors)
                    .map(([field, error]) => `${field}: ${error?.message || 'Error desconocido'}`)
                    .join('\n');
                showAlert('error', 'Error de validación', `Por favor corrija los siguientes errores:\n${errorMessages}`);
                return;
            }

            // Create request data with proper type conversion
            const baseRequestData = {
                id_caja: Number(formData.id_caja),
                id_tipo_operacion: Number(formData.id_tipo_operacion),
                id_tipo_movimiento: Number(formData.id_tipo_movimiento),
                monto: Number(formData.monto),
                id_caja_destino: isTransferencia ? formData.id_caja_destino : undefined,
                estado: Number(formData.estado) || 0,
                descripcion_movimiento: formData.descripcion_movimiento,
                referencia_externa: formData.referencia_externa,
                fecha_movimiento: formData.fecha_movimiento,
                id_usuario: 1
            };

            let response;
            if (isEditing && movimiento?.id_movimiento) {
                console.log('Actualizando movimiento con ID:', movimiento.id_movimiento);
                // For updates, exclude read-only fields
                const { id_movimiento, created_at, ...updateData } = baseRequestData as any;
                response = await updateCajaMovimiento(movimiento.id_movimiento, updateData);
                showAlert('success', 'Éxito', 'Movimiento de caja actualizado correctamente');
            } else {
                console.log('Creando nuevo movimiento');
                response = await createCajaMovimiento(baseRequestData as CajaMovimiento);
                
                // If this is a transfer (type 10), create the reverse movement
                if (formData.id_tipo_movimiento === 10 && formData.id_caja_destino) {
                    try {
                        // Invert the operation type (assuming 1=income, 2=expense - adjust if different)
                        const invertedTipoOperacion = formData.id_tipo_operacion === 1 ? 2 : 1;
                        
                        const reverseMovementData = {
                            ...baseRequestData,
                            id_caja: formData.id_caja_destino, // Swap caja and caja_destino
                            id_caja_destino: formData.id_caja,
                            id_tipo_operacion: invertedTipoOperacion, // Invert operation type
                            descripcion_movimiento: `Transferencia recibida de Caja #${formData.id_caja}`,
                            id_movimiento: undefined // Ensure this is a new record
                        };
                        
                        console.log('Creando movimiento inverso:', reverseMovementData);
                        await createCajaMovimiento(reverseMovementData);
                        showAlert('success', 'Éxito', 'Movimiento de transferencia y su contraparte creados correctamente');
                    } catch (error) {
                        console.error('Error al crear el movimiento inverso:', error);
                        // Don't fail the whole operation, just log and show warning
                        showAlert('warning', 'Advertencia', 'El movimiento se creó pero hubo un error al crear el movimiento inverso');
                    }
                } else {
                    showAlert('success', 'Éxito', 'Movimiento de caja creado correctamente');
                }
            }

            if (onSuccess) onSuccess();
            if (closeModal) closeModal();

        } catch (error) {
            console.error('Error al guardar el movimiento de caja:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Detalles del error:', {
                name: error instanceof Error ? error.name : 'No disponible',
                message: errorMessage,
                stack: error instanceof Error ? error.stack : 'No disponible',
                response: (error as any)?.response?.data || 'No disponible'
            });
            showAlert('error', 'Error', `Error al guardar el movimiento de caja: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Add this effect to log form state changes
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // Add this effect to log form submission state
    useEffect(() => {
        console.log('Form submission state changed:', {
            isSubmitting: form.formState.isSubmitting,
            isSubmitted: form.formState.isSubmitted,
            isSubmitSuccessful: form.formState.isSubmitSuccessful,
            errors: form.formState.errors
        });
    }, [form.formState]);

    // Add effect to clear destination caja when operation type changes to non-transfer
    useEffect(() => {
        if (!isTransferencia) {
            form.setValue('id_caja_destino', 0, { shouldValidate: true });
        }
    }, [isTransferencia, form]);

    return (
        <DialogContent className={styles.contentContainer}>
            <EntityForm<CajaMovimiento>
                title={`${isEditing ? 'Editar' : 'Registrar'} movimiento de caja`}
                form={form}
                onSubmit={async (data: CajaMovimiento) => {
                    try {
                        await handleFormSubmit(data);
                    } catch (error) {
                        console.error('Error submitting form:', error);
                        showAlert('error', 'Error', 'Ocurrió un error al procesar el formulario');
                    }
                }}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className={` ${styles.formContainer}`}>
                    <div className={styles.subFormContainer}>
                        {/* Caja Origen */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="id_caja"
                                control={form.control}
                                label="Caja Origen"
                                error={form.formState.errors?.id_caja?.message as string}
                            >
                                {(field: any) => (
                                    <div className="combobox-container">
                                        <Combobox
                                            options={cajas}
                                            selected={field.value?.toString() || ''}
                                            onChange={(value) => {
                                                if (cajaOrigenId) return;
                                                const cajaId = value ? Number(value) : 0;
                                                form.setValue('id_caja', cajaId, { shouldValidate: true });
                                            }}
                                            placeholder="Seleccione caja origen"
                                            emptyMessage="No se encontraron cajas"
                                            disabled={!!cajaOrigenId}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>

                        {/* Tipo de Operación */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="id_tipo_operacion"
                                control={form.control}
                                label="Tipo de Operación"
                                error={form.formState.errors?.id_tipo_operacion?.message as string}
                            >
                                {(field: any) => (
                                    <div className="combobox-container" style={{ height: '42px', position: 'relative', overflow: 'visible' }}>
                                        <Combobox
                                            options={tiposOperacion}
                                            selected={field.value?.toString() || ""}
                                            onChange={(value) => {
                                                form.setValue('id_tipo_operacion', value ? Number(value) : 0, { shouldValidate: true });
                                            }}
                                            placeholder="Seleccionar tipo de operación..."
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    <div className={styles.subFormContainerSplit}>
                        {/* Tipo de Movimiento */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="id_tipo_movimiento"
                                control={form.control}
                                label="Tipo de Movimiento"
                                error={form.formState.errors?.id_tipo_movimiento?.message as string}
                            >
                                {(field: any) => (
                                    <div className="combobox-container" style={{ height: '42px', position: 'relative', overflow: 'visible' }}>
                                        <Combobox
                                            options={tiposMovimiento}
                                            selected={field.value?.toString() || ""}
                                            onChange={(value) => {
                                                const tipoId = value ? Number(value) : undefined;
                                                setSelectedTipoMovimiento(tipoId || null);
                                                form.setValue('id_tipo_movimiento', tipoId || 0, { shouldValidate: true });
                                                if (tipoId !== 10) {
                                                    form.setValue('id_caja_destino', 0);
                                                }
                                            }}
                                            placeholder="Seleccionar tipo de movimiento..."
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>

                        {/* Estado */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="estado"
                                control={form.control}
                                label="Estado"
                                error={form.formState.errors?.estado?.message as string}
                            >
                                {(field: any) => (
                                    <select
                                        {...field}
                                        onChange={(e) => form.setValue('estado', parseInt(e.target.value))}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!isEditing}
                                    >
                                        <option value="1">Aprobado</option>
                                        <option value="0">Pendiente</option>
                                    </select>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    {/* Caja Destino - Solo para transferencias (tipo 10) */}
                    {isTransferencia && (
                        <div className={styles.subFormContainerSplit}>
                            <div className="min-h-[100px] col-span-12">
                                <FormFieldWrapper
                                    name="id_caja_destino"
                                    control={form.control}
                                    label="Caja Destino"
                                    error={form.formState.errors?.id_caja_destino?.message as string}
                                >
                                    {(field: any) => (
                                        <div className="combobox-container" style={{ height: '42px', position: 'relative', overflow: 'visible' }}>
                                            <Combobox
                                                options={filteredCajasDestino}
                                                selected={field.value?.toString() || ""}
                                                onChange={(value) => {
                                                    form.setValue('id_caja_destino', value ? Number(value) : 0, { shouldValidate: true });
                                                }}
                                                placeholder="Seleccionar caja destino..."
                                            />
                                        </div>
                                    )}
                                </FormFieldWrapper>
                            </div>
                        </div>
                    )}

                    <div className={styles.subFormContainerSplit}>
                        {/* Monto */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="monto"
                                control={form.control}
                                label="Monto"
                                error={form.formState.errors?.monto?.message as string}
                            >
                                {(field: any) => (
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 pt-1.5 flex items-center text-gray-500">
                                            S/
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            min={0.01}
                                            step={0.01}
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                field.onChange(isNaN(value) ? 0 : value);
                                            }}
                                            onBlur={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (!isNaN(value)) {
                                                    field.onChange(Number(value.toFixed(2)));
                                                }
                                            }}
                                            className={styles.input}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>

                        {/* Referencia Externa */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="referencia_externa"
                                control={form.control}
                                label="Referencia Externa (Opcional)"
                                error={form.formState.errors?.referencia_externa?.message as string}
                            >
                                {(field: any) => (
                                    <Input 
                                        type="text"
                                        placeholder="Número de referencia o código"
                                        className="h-10"
                                        {...field} 
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    <div className={styles.subFormContainerSplit}>
                        {/* Descripción */}
                        <div className="min-h-[100px] col-span-12">
                            <FormFieldWrapper
                                name="descripcion_movimiento"
                                control={form.control}
                                label="Descripción"
                                error={form.formState.errors?.descripcion_movimiento?.message as string}
                            >
                                {(field: any) => (
                                    <Textarea
                                        placeholder="Ingrese una descripción detallada del movimiento"
                                        className="min-h-[150px] w-full"
                                        {...field}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );
}
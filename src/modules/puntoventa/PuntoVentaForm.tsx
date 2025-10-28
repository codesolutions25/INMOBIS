"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { puntoVentaSchema } from "@/schemas/puntoVentaSchema";
import { createPuntoVenta, updatePuntoVenta } from "@/services/apiPuntoVenta";
import { getEmpresas } from "@/services/apiEmpresa";
import { PuntoVenta } from "@/types/puntoventa";
import { useAlert } from "@/contexts/AlertContext";
import { useEffect, useState } from "react";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { Combobox } from "@/components/ui/combobox";
import { useCompany } from "@/contexts/CompanyContext";
import styles from "./styles/PuntoVentaForm.module.css";

type PuntoVentaFormValues = z.infer<typeof puntoVentaSchema> & {
    empresa_id: number;
}

type PuntoVentaFormProps = {
    puntoVenta?: PuntoVenta;
    onSuccess?: () => void;
    closeModal: () => void;
}

export default function PuntoVentaForm({ puntoVenta, onSuccess, closeModal }: PuntoVentaFormProps) {
    const isEditing = !!puntoVenta;
    const { showAlert } = useAlert();
    const { selectedCompany } = useCompany();
    const [empresas, setEmpresas] = useState<{ value: string, label: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Cargar las empresas al iniciar el componente
    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const data = await getEmpresas(1,1000);
                console.log("data",data);
                console.log("selectedCompany",selectedCompany);
                // Si hay una empresa seleccionada, solo mostramos esa empresa
                if (selectedCompany) {
                    const empresaSeleccionada = data.data.find((e: any) => e.idEmpresa === selectedCompany.idEmpresa);
                    if (empresaSeleccionada) {
                        setEmpresas([{
                            value: empresaSeleccionada.idEmpresa.toString(),
                            label: empresaSeleccionada.razonSocial || `Empresa ${empresaSeleccionada.idEmpresa}`
                        }]);
                    }
                } else {
                    // Si no hay empresa seleccionada, mostramos todas (no debería pasar en el flujo normal)
                    const formattedEmpresas = data.data.map((empresa: any) => ({
                        value: empresa.idEmpresa.toString(),
                        label: empresa.razonSocial || `Empresa ${empresa.idEmpresa}`
                    }));
                    setEmpresas(formattedEmpresas);
                }
            } catch (error) {
                console.error('Error al cargar empresas:', error);
                showAlert('error', 'Error', 'No se pudieron cargar las empresas');
            }
        };
        
        fetchEmpresas();
    }, [showAlert, selectedCompany]);

    // Inicializar el formulario con la empresa seleccionada
    const form = useForm<PuntoVentaFormValues>({
        resolver: zodResolver(puntoVentaSchema),
        defaultValues: {
            empresa_id: selectedCompany?.idEmpresa || 0,
            nombre_punto_venta: '',
            direccion_punto_venta: '',
            telefono_punto_venta: '',
            ...puntoVenta,
        },
    });

    // Actualizar el valor de empresa_id cuando cambia selectedCompany
    useEffect(() => {
        if (selectedCompany) {
            form.setValue('empresa_id', Number(selectedCompany.idEmpresa));
        }
    }, [selectedCompany, form]);

    const handleFormSubmit = async (data: PuntoVentaFormValues) => {
        try {
            setLoading(true);

            if (isEditing && puntoVenta?.id_punto_venta) {
                await updatePuntoVenta(puntoVenta.id_punto_venta, {
                    empresa_id: data.empresa_id,
                    nombre_punto_venta: data.nombre_punto_venta,
                    direccion_punto_venta: data.direccion_punto_venta,
                    telefono_punto_venta: data.telefono_punto_venta
                });
                showAlert('success', 'Éxito', 'Punto de venta actualizado correctamente');
            } else {
                await createPuntoVenta({
                    empresa_id: data.empresa_id,
                    nombre_punto_venta: data.nombre_punto_venta,
                    direccion_punto_venta: data.direccion_punto_venta,
                    telefono_punto_venta: data.telefono_punto_venta
                });
                showAlert('success', 'Éxito', 'Punto de venta creado correctamente');
            }

            if (onSuccess) onSuccess();
            if (closeModal) closeModal();

        } catch (error: any) {
            // Si es un error manejado, mostrarlo sin loguear en consola
            if (error?.__isHandledError) {
                showAlert('error', 'Error', error.message);
                form.setFocus('nombre_punto_venta');
                return Promise.resolve();
            }
            
            // Manejar otros errores
            console.error('Error al guardar punto de venta:', error);
            
            if (error?.message) {
                // Mostrar mensajes de error específicos si están disponibles
                showAlert('error', 'Error', error.message);
            } else {
                // Mensaje de error genérico
                showAlert('error', 'Error', 'Error al guardar el punto de venta. Por favor, intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (data: PuntoVentaFormValues) => {
        return handleFormSubmit(data);
    };

    return (
        <DialogContent className={`${styles.dialogContent} sm:max-w-[350px]`}>
            <EntityForm<PuntoVentaFormValues>
                title={`${isEditing ? 'Editar' : 'Registrar'} Punto de Venta`}
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className={styles.puntoventaFormContainer}>
                    {/* Columna 1 */}
                    <div className={styles.fieldContainer}>
                        <FormFieldWrapper
                            name="empresa_id"
                            control={form.control}
                            label="Empresa"
                            error={form.formState.errors?.empresa_id?.message as string}
                        >
                            {(field: any) => (
                                <div className={`${styles.inputContainer} ${styles.comboboxContainer}`}>
                                    <Combobox
                                        options={empresas}
                                        selected={field.value?.toString() || ""}
                                        onChange={(value) => {
                                            field.onChange(Number(value));
                                        }}
                                        placeholder="Seleccionar empresa..."
                                        emptyMessage="No se encontraron empresas"
                                        disabled={!!selectedCompany || loading || empresas.length === 0}
                                    />
                                </div>
                            )}
                        </FormFieldWrapper>
                    </div>

                    <div className={styles.fieldContainer}>
                        <FormFieldWrapper
                            name="nombre_punto_venta"
                            control={form.control}
                            label="Nombre del Punto de Venta"
                            error={form.formState.errors?.nombre_punto_venta?.message as string}
                        >
                            {(field: any) => (
                                <Input
                                    type="text"
                                    placeholder="Nombre del punto de venta"
                                    className={styles.formInput}
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Columna 2 */}
                    <div className={styles.fieldContainer}>
                        <FormFieldWrapper
                            name="direccion_punto_venta"
                            label="Dirección"
                            control={form.control}
                            error={form.formState.errors?.direccion_punto_venta?.message as string}
                        >
                            {(field: any) => (
                                <Input
                                    type="text"
                                    placeholder="Dirección del punto de venta"
                                    className={`${styles.formInput} ${styles.textAreaInput}`}
                                    {...field}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    <div className={styles.fieldContainer}>
                        <FormFieldWrapper
                            name="telefono_punto_venta"
                            label="Teléfono"
                            control={form.control}
                            error={form.formState.errors?.telefono_punto_venta?.message as string}
                        >
                            {(field: any) => (
                                <Input
                                    type="tel"
                                    placeholder="Teléfono del punto de venta"
                                    className={styles.formInput}
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
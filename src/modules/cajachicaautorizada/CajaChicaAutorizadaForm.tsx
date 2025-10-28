"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cajaChicaAutorizadaSchema, CajaChicaAutorizadaFormValues } from "@/schemas/cajaChicaAutorizadaSchema";
import { createCajaChicaAutorizada, updateCajaChicaAutorizada } from "@/services/apiCajaChicaAutorizada";
import { CajaChicaAutorizada } from "@/types/cajachicaautorizadas";
import { useAlert } from "@/contexts/AlertContext";
import { useEffect, useState } from "react";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { Combobox } from "@/components/ui/combobox";
import { getCajas } from "@/services/apiCajas";
import { getUsuarios } from "@/services/apiUsuarios";


type CajaChicaAutorizadaFormProps = {
    autorizacion?: CajaChicaAutorizada;
    onSuccess?: () => void;
    closeModal: () => void;
}

export default function CajaChicaAutorizadaForm({ 
    autorizacion, 
    onSuccess, 
    closeModal 
}: CajaChicaAutorizadaFormProps) {
    const isEditing = !!autorizacion;
    const { showAlert } = useAlert();
    const [cajas, setCajas] = useState<{ value: string, label: string }[]>([]);
    const [usuarios, setUsuarios] = useState<{ value: string, label: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Cargar las cajas y usuarios al iniciar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener cajas
                const cajasData = await getCajas(1, 100);
                const formattedCajas = cajasData.data.map((caja: any) => ({
                    value: caja.id_caja.toString(),
                    label: caja.nombre_caja || `Caja ${caja.id_caja}`
                }));
                setCajas(formattedCajas);

                // Obtener usuarios
                const usuariosData = await getUsuarios(1, 100);
                const formattedUsuarios = usuariosData.data.map((usuario: any) => ({
                    value: usuario.idUsuario.toString(),
                    label: usuario.username || `Usuario ${usuario.idUsuario}`
                }));
                setUsuarios(formattedUsuarios);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los datos necesarios');
            }
        };
        fetchData();
    }, [showAlert]);

    const form = useForm<CajaChicaAutorizadaFormValues>({
        resolver: zodResolver(cajaChicaAutorizadaSchema) as any, // Type assertion to bypass the type mismatch
        defaultValues: {
            id_caja: autorizacion?.id_caja ? Number(autorizacion.id_caja) : 0,
            id_usuario: autorizacion?.id_usuario ? Number(autorizacion.id_usuario) : 0,
            id_autorizacion: autorizacion?.id_autorizacion,
            fecha_asignacion: autorizacion?.fecha_asignacion,
            fecha_termino: autorizacion?.fecha_termino ?? null
        }
    });

    const handleFormSubmit: SubmitHandler<CajaChicaAutorizadaFormValues> = async (data) => {
        try {
            setLoading(true);
            const payload = {
                id_caja: Number(data.id_caja),
                id_usuario: Number(data.id_usuario),
                fecha_asignacion: isEditing ? autorizacion?.fecha_asignacion : new Date().toISOString(),
                fecha_termino: autorizacion?.fecha_termino || null
            };
    
            if (isEditing && autorizacion?.id_autorizacion) {
                await updateCajaChicaAutorizada(autorizacion.id_autorizacion, payload);
                showAlert('success', 'Éxito', 'Autorización actualizada correctamente');
            } else {
                await createCajaChicaAutorizada(payload);
                showAlert('success', 'Éxito', 'Autorización creada correctamente');
            }
            
            onSuccess?.();
            closeModal();
        } catch (error) {
            console.error('Error al guardar la autorización:', error);
            showAlert('error', 'Error', 'No se pudo guardar la autorización');
        } finally {
            setLoading(false);
        }
    };
    const onSubmit = (data: CajaChicaAutorizadaFormValues) => {
        return handleFormSubmit(data);
    };
    

    return (
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto px-6 pt-5 pb-5">
            <EntityForm<CajaChicaAutorizadaFormValues>
                title={isEditing ? "Editar Autorización" : "Nueva Autorización de Caja Chica"}
                titleClassName="text-xl font-semibold text-center text-[#0C4A6E] mb-6"
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className="grid grid-cols-1 gap-4">
                    <div className="min-h-[85px]">
                        <FormFieldWrapper
                            name="id_caja"
                            control={form.control}
                            label="Caja"
                            error={form.formState.errors?.id_caja?.message as string}
                        >
                            {(field: any) => (
                                <Combobox
                                    options={cajas}
                                    placeholder="Seleccione una caja"
                                    emptyMessage="No se encontraron cajas"
                                    selected={field.value}
                                    onChange={(value) => {
                                        field.onChange(value);
                                    }}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>

                    <div className="min-h-[85px]">
                        <FormFieldWrapper
                            name="id_usuario"
                            control={form.control}
                            label="Usuario"
                            error={form.formState.errors?.id_usuario?.message as string}
                        >
                            {(field: any) => (
                                <Combobox
                                    options={usuarios}
                                    placeholder="Seleccione un usuario"
                                    emptyMessage="No se encontraron usuarios"
                                    selected={field.value}
                                    onChange={(value) => {
                                        field.onChange(value);
                                    }}
                                />
                            )}
                        </FormFieldWrapper>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );
}
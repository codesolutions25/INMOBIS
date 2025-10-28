"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form"
import { useState, useEffect, ReactElement } from "react"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { clientesInmobiliariosSchema } from "@/schemas/clientesInmobiliariosSchema"

import { createClienteInmobiliario, updateClienteInmobiliario } from "@/services/apiClientesInmobiliarios"
import { getPersonas } from "@/services/apiPersona"
import { getEmpresas } from "@/services/apiEmpresa"

import { ClienteInmobiliario } from "@/types/clienteInmobiliario"
import { Persona } from "@/types/persona"
import { Empresa } from "@/types/empresas"
import { useAlert } from "@/contexts/AlertContext"

import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { Combobox } from "@/components/ui/combobox"

type ClienteInmobiliarioFormValues = z.infer<typeof clientesInmobiliariosSchema>

type ClienteInmobiliarioFormProps = {
    clienteInmobiliario?: ClienteInmobiliario;
    onSuccess?: () => void;
    closeModal?: () => void;
}

export default function ClienteInmobiliarioForm({ clienteInmobiliario, onSuccess, closeModal }: ClienteInmobiliarioFormProps): ReactElement {
    
    const isEditing = !!clienteInmobiliario;
    const { showAlert } = useAlert();

    const [personas, setPersonas] = useState<{value: string, label: string}[]>([]);
    const [empresas, setEmpresas] = useState<{value: string, label: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPersonas = async () => {
            try {
                const personasData = await getPersonas();
                const formattedPersonas = personasData.data.map((persona: Persona) => ({
                    value: persona.idPersona.toString(),
                    label: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno} (ID: ${persona.idPersona})`
                }));
                setPersonas(formattedPersonas);
            } catch (error) {
                console.error('Error al cargar personas:', error);
                showAlert('error', 'Error', 'No se pudieron cargar las personas');
            }
        };
        
        fetchPersonas();
    }, [showAlert]);

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const empresasData = await getEmpresas();
                const formattedEmpresas = empresasData.data.map((empresa: Empresa) => ({
                    value: empresa.idEmpresa.toString(),
                    label: `${empresa.razonSocial} (ID: ${empresa.idEmpresa})`
                }));
                setEmpresas(formattedEmpresas);
            } catch (error) {
                console.error('Error al cargar empresas:', error);
                showAlert('error', 'Error', 'No se pudieron cargar las empresas');
            }
        };
        
        fetchEmpresas();
    }, [showAlert]);

    const form = useForm<ClienteInmobiliarioFormValues>({
        resolver: zodResolver(clientesInmobiliariosSchema),
        defaultValues: {
            idPersona: clienteInmobiliario?.idPersona || 0,
            idEmpresa: clienteInmobiliario?.idEmpresa || 0,
            observaciones: clienteInmobiliario?.observaciones || "",
            fechaCreacion: clienteInmobiliario?.fechaCreacion ? new Date(clienteInmobiliario.fechaCreacion) : undefined,
        }
    });

    const handleFormSubmit = async (data: ClienteInmobiliarioFormValues) => {
        try {
            setLoading(true);
            let operacionExitosa = false;

            if (isEditing && clienteInmobiliario?.idClientesInmobiliarios) {
                await updateClienteInmobiliario(clienteInmobiliario.idClientesInmobiliarios, {
                    ...data,
                    fechaCreacion: data.fechaCreacion?.toISOString(),
                });
                showAlert('success', 'Éxito', 'Cliente inmobiliario actualizado correctamente');
                operacionExitosa = true;
            } else {
                await createClienteInmobiliario({
                    ...data,
                    fechaCreacion: data.fechaCreacion?.toISOString(),
                });
                showAlert('success', 'Éxito', 'Cliente inmobiliario creado correctamente');
                operacionExitosa = true;
            }

            if (closeModal) {
                closeModal();
            }

            if (operacionExitosa && onSuccess) {
                setTimeout(() => onSuccess(), 600);
            }
        } catch (error) {
            console.error('Error al guardar cliente inmobiliario:', error);
            showAlert('error', 'Error', 'Error al guardar el cliente inmobiliario');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleFormSubmit);

    return (
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto px-6 pt-5 pb-5">
            <EntityForm<ClienteInmobiliarioFormValues>
                title={isEditing ? "Editar cliente inmobiliario" : "Registrar cliente inmobiliario"}
                titleClassName="text-xl font-semibold text-center text-[#0C4A6E] mb-6"
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex flex-col space-y-6">
                        <div className="min-h-[85px]">
                            <FormFieldWrapper
                                name="idPersona"
                                control={form.control}
                                label="Persona (ID)"
                                error={form.formState.errors?.idPersona?.message as string}
                            >
                                {(field: any) => (
                                    <div className="-mt-1">
                                        <Combobox
                                            options={personas}
                                            placeholder="Seleccionar persona"
                                            emptyMessage="No se encontraron personas"
                                            selected={field.value ? field.value.toString() : ""}
                                            onChange={(value) => {
                                                field.onChange(Number(value));
                                            }}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className="min-h-[85px]">
                            <FormFieldWrapper
                                name="idEmpresa"
                                control={form.control}
                                label="Empresa (ID)"
                                error={form.formState.errors?.idEmpresa?.message as string}
                        >
                                {(field: any) => (
                                    <div className="-mt-1">
                                        <Combobox
                                            options={empresas}
                                            placeholder="Seleccionar empresa..."
                                            emptyMessage="No se encontraron empresas"
                                            selected={field.value ? field.value.toString() : ""}
                                            onChange={(value) => {
                                                field.onChange(Number(value));
                                            }}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-6">
                        <div className="min-h-[85px]">
                            <FormFieldWrapper
                                name="observaciones"
                                control={form.control}
                                label="Observaciones"
                                error={form.formState.errors?.observaciones?.message as string}
                            >
                                {(field: any) => (
                                    <div className="-mt-1">
                                        <Input
                                            type="text"
                                            placeholder="Observaciones"
                                            {...field}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className="min-h-[85px]">
                            <FormFieldWrapper
                                name="fechaCreacion"
                                label="Fecha de creación"
                                control={form.control}
                                error={form.formState.errors?.fechaCreacion?.message as string}
                            >
                                {(field: any) => {
                                    const dateValue = field.value instanceof Date 
                                        ? field.value.toISOString().split('T')[0] 
                                        : '';
                                    
                                    return (
                                        <Input
                                            type="date"
                                            placeholder="Fecha de creación"
                                            value={dateValue}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                                field.onChange(date);
                                            }}
                                        />
                                    );
                                }}
                            </FormFieldWrapper>
                        </div>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    )
}
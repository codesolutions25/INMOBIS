"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form"
import { useEffect, useState, ReactElement } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cajaSchema, CajaFormType } from "@/schemas/cajaSchema"
import { createCaja, updateCaja } from "@/services/apiCajas"
import { Caja } from "@/types/cajas"
import { useAlert } from "@/contexts/AlertContext"
import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { Combobox } from "@/components/ui/combobox"
import { getPuntosVenta } from "@/services/apiPuntoVenta"
import { getTiposCaja } from "@/services/apiTiposCaja"
import { getEstadosCaja } from "@/services/apiEstadosCaja"
import { getEmpresas } from "@/services/apiEmpresa"
import { PuntoVenta } from "@/types/puntoventa"
import { TipoCaja } from "@/types/tiposcaja"
import { EstadoCaja } from "@/types/estadoscaja"
import { Empresa } from "@/types/empresas"
import styles from "./styles/CajaForm.module.css"
import { useCompany } from "@/contexts/CompanyContext";

type CajaFormProps = {
    caja?: Caja;
    onSuccess?: () => void;
    closeModal?: () => void;
    existingCajas?: Caja[];
}

export default function CajaForm({ caja, onSuccess, closeModal, existingCajas = [] }: CajaFormProps): ReactElement {
    const isEditing = !!caja?.id_caja;
    const { showAlert } = useAlert();
    const { selectedCompany } = useCompany();

    // Estados para los combos
    const [puntosVenta, setPuntosVenta] = useState<{ value: string, label: string }[]>([]);
    const [tiposCaja, setTiposCaja] = useState<{ value: string, label: string }[]>([]);
    const [estadosCaja, setEstadosCaja] = useState<{ value: string, label: string }[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [empresasMap, setEmpresasMap] = useState<Record<number, Empresa>>({});
    const [loading, setLoading] = useState(false);
    const [catalogosError, setCatalogosError] = useState(false);

    const form = useForm<CajaFormType>({
        resolver: zodResolver(cajaSchema) as any, // Type assertion to handle the resolver type
        defaultValues: {
            id_caja: caja?.id_caja,
            nombre_caja: caja?.nombre_caja || "",
            id_punto_venta: caja?.id_punto_venta ?? undefined,
            id_tipo_caja: caja?.id_tipo_caja ?? undefined,
            id_estado_caja: caja?.id_estado_caja ?? 3,
            saldo_inicial: caja?.saldo_inicial?.toString() ?? "0"
        },
    });

    // Cargar catálogos al iniciar
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                setLoading(true);

                const [puntosData, tiposData, estadosData, empresasData] = await Promise.all([
                    getPuntosVenta(1, 1000),
                    getTiposCaja(1, 1000),
                    getEstadosCaja(1, 1000),
                    getEmpresas()
                ]);

                // Crear mapa de empresas para búsqueda rápida
                const empMap: Record<number, Empresa> = {};
                empresasData.data.forEach((empresa: Empresa) => {
                    if (empresa.idEmpresa) {
                        empMap[empresa.idEmpresa] = empresa;
                    }
                });
                setEmpresas(empresasData.data);
                setEmpresasMap(empMap);

                // Filtrar puntos de venta por la empresa seleccionada en el contexto
                const puntosVentaFiltrados = selectedCompany 
                    ? puntosData.data.filter((pv: PuntoVenta) => pv.empresa_id === selectedCompany.idEmpresa)
                    : [];

                // Mapear puntos de venta incluyendo el nombre de la empresa
                setPuntosVenta(puntosVentaFiltrados.map((pv: PuntoVenta) => {
                    const empresa = pv.empresa_id ? empMap[pv.empresa_id] : null;
                    const empresaNombre = empresa?.razonSocial || 'Sin empresa';
                    return {
                        value: pv.id_punto_venta.toString(),
                        label: `${pv.nombre_punto_venta} (${empresaNombre})`
                    };
                }));

                setTiposCaja(tiposData.data.map((tc: TipoCaja) => ({
                    value: tc.id_tipo_caja.toString(),
                    label: tc.nombre_tipo_caja || `Tipo ${tc.id_tipo_caja}`
                })));

                setEstadosCaja(estadosData.data.map((ec: EstadoCaja) => ({
                    value: ec.id_estado_caja.toString(),
                    label: ec.nombre_estado_caja || `Estado ${ec.id_estado_caja}`
                })));

                setCatalogosError(false);
            } catch (error) {
                console.error('Error al cargar catálogos:', error);
                setCatalogosError(true);
                showAlert('error', 'Error', 'No se pudieron cargar los catálogos. Por favor, intente nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogos();
    }, [showAlert, selectedCompany]);

    const handleFormSubmit = async (data: CajaFormType) => {
        try {
            setLoading(true);

            const submitData = {
                saldo_inicial: 0, // Always set to 0 as per requirement
                id_punto_venta: Number(data.id_punto_venta),
                id_tipo_caja: Number(data.id_tipo_caja),
                nombre_caja: data.nombre_caja,
                id_estado_caja: Number(data.id_estado_caja)
            };

            // Check if we're creating a new central cash register
            if (!isEditing) {
                // Find the selected tipo_caja to check if it's a central type
                const selectedTipoCaja = tiposCaja.find(tc => tc.value === data.id_tipo_caja?.toString());
                const isCentralType = selectedTipoCaja?.label.toLowerCase().includes('central');
                
                if (isCentralType && data.id_punto_venta) {
                    // Find if there's already an open central cash register in the same punto de venta
                    const openCentralCaja = existingCajas.find((caja:any) => {
                        // Skip if not the same punto de venta
                        if (caja.id_punto_venta?.toString() !== data.id_punto_venta) {
                            return false;
                        }
                        
                        const tipoCaja = tiposCaja.find(tc => tc.value === caja.id_tipo_caja?.toString());
                        const estadoCaja = estadosCaja.find(ec => ec.value === caja.id_estado_caja?.toString());
                        
                        return tipoCaja?.label.toLowerCase().includes('central') && 
                               estadoCaja?.label.toLowerCase().includes('abierta');
                    });

                    if (openCentralCaja) {
                        throw new Error('Ya existe una caja central abierta en este punto de venta. Cierre la caja central actual antes de crear una nueva.');
                    }
                }
            }

            if (isEditing && caja?.id_caja) {
                await updateCaja(caja.id_caja, submitData);
                showAlert('success', 'Éxito', 'Caja actualizada correctamente');
            } else {
                await createCaja(submitData);
                showAlert('success', 'Éxito', 'Caja creada correctamente');
            }

            if (closeModal) {
                closeModal();
            }

            if (onSuccess) {
                setTimeout(() => onSuccess(), 600);
            }
        } catch (error) {
            console.error('Error al guardar caja:', error);
            let errorMessage = 'Error al guardar la caja';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            }
            showAlert('error', 'Error', errorMessage);
            setTimeout(() => {
                if (closeModal) closeModal();
            }, 500);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleFormSubmit);

    if (catalogosError) {
        return (
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
                <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Error al cargar los datos</h3>
                    <p className="text-gray-600 mb-4">No se pudieron cargar los catálogos necesarios.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Reintentar
                    </button>
                </div>
            </DialogContent>
        );
    }

    return (
        <DialogContent className="sm:max-w-[1000px] w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-visible p-0">
            <div className="p-6 w-full">
                <EntityForm<CajaFormType>
                    title={`${isEditing ? 'Editar' : 'Nueva'} Caja`}
                    form={form}
                    onSubmit={onSubmit}
                    isEditing={isEditing}
                    isSubmitting={loading}
                    onCancel={closeModal}
                >
                 <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6">
                        {/* Nombre de la caja */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="nombre_caja"
                                control={form.control}
                                label="Nombre de la caja"
                                error={form.formState.errors?.nombre_caja?.message as string}
                            >
                                {(field: any) => (
                                    <Input 
                                        type="text"
                                        placeholder="Nombre de la caja"
                                        className="h-10 w-full"
                                        {...field}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>

                        {/* Tipo de caja */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="id_tipo_caja"
                                control={form.control}
                                label="Tipo de caja"
                                error={form.formState.errors?.id_tipo_caja?.message as string}
                            >
                                {(field: any) => (
                                    <div className="w-full" style={{ height: '42px' }}>
                                        <Combobox
                                            options={tiposCaja}
                                            selected={field.value?.toString() || ''}
                                            onChange={(value) => field.onChange(Number(value))}
                                            placeholder="Seleccionar tipo..."
                                            
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {/* Punto de venta */}
                        <div className="min-h-[100px] col-span-6">
                            <FormFieldWrapper
                                name="id_punto_venta"
                                control={form.control}
                                label="Punto de Venta"
                                error={form.formState.errors?.id_punto_venta?.message as string}
                            >
                                {(field: any) => (
                                    <div className="w-full" style={{ height: '42px' }}>
                                        <Combobox
                                            options={puntosVenta}
                                            selected={field.value?.toString() || ''}
                                            onChange={(value) => field.onChange(Number(value))}
                                            placeholder="Seleccionar punto de venta..."
                                           
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                   
                </EntityForm>
            </div>
        </DialogContent>
    );
}
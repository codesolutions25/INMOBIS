"use client"

import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCajaUsuario, updateCajaUsuario } from "@/services/apiCajaUsuario";
import { CajaUsuario } from "@/types/cajausuario";
import { useAlert } from "@/contexts/AlertContext";
import { useEffect, useState } from "react";
import EntityForm from "@/components/form/EntityForm";
import FormFieldWrapper from "@/components/form/FormFieldWrapper";
import { DialogContent } from "@/components/ui/dialog";
import { cajaUsuarioSchema } from "@/schemas/cajaUsuario";
import { Combobox } from "@/components/ui/combobox";
import { getCajas } from "@/services/apiCajas";
import { getPersonas } from "@/services/apiPersona";
import { getTiposCaja } from "@/services/apiTiposCaja";
import { getPuntosVenta } from "@/services/apiPuntoVenta";
import { getEmpresas } from "@/services/apiEmpresa";
import { useCompany } from "@/contexts/CompanyContext";
import { getUsuariosEmpresa } from "@/services/apiUsuarioEmpresa";
import { getDetallesUsuario } from "@/services/apiDetalleUsuario";

import { Caja } from "@/types/cajas";
import { Persona } from "@/types/persona";
import { TipoCaja } from "@/types/tiposcaja";
import { PuntoVenta } from "@/types/puntoventa";
import { Empresa } from "@/types/empresas";

type CajaUsuarioFormValues = z.infer<typeof cajaUsuarioSchema>;

interface CajaWithDetails extends Caja {
    value: string;
    label: string;
    id_punto_venta?: number | null;
    punto_venta_nombre?: string | null;
    razon_social?: string | null;
    tipo_caja_nombre?: string | null;
}

type Props = {
    cajaUsuario?: CajaUsuario;
    onSuccess?: () => void;
    closeModal: () => void;
}

export default function CajaUsuarioForm({ cajaUsuario, onSuccess, closeModal }: Props) {
    const { showAlert } = useAlert();
    const { selectedCompany } = useCompany();
    const [isLoading, setIsLoading] = useState(false);
    const [cajas, setCajas] = useState<Caja[]>([]);
    const [filteredCajas, setFilteredCajas] = useState<CajaWithDetails[]>([]);
    const [puntosVenta, setPuntosVenta] = useState<Record<number, PuntoVenta>>({});
    const [empresas, setEmpresas] = useState<Record<number, Empresa>>({});
    const [tiposCaja, setTiposCaja] = useState<Record<number, TipoCaja>>({});
    const [usuarios, setUsuarios] = useState<{ value: string, label: string, personaId?: number, idUsuarioEmpresa?: number }[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<{ value: string, label: string }[]>([]);
    const [personasMap, setPersonasMap] = useState<Record<number, Persona>>({});
    const [puntoVentaUsuarios, setPuntoVentaUsuarios] = useState<Record<number, number[]>>({});
    const [usuariosEmpresaData, setUsuariosEmpresaData] = useState<any>(null);
    const [detallesUsuarioMap, setDetallesUsuarioMap] = useState<Record<number, any>>({});
    const isEditing = Boolean(cajaUsuario?.id_asignacion);

    const form = useForm<CajaUsuarioFormValues>({
        resolver: zodResolver(cajaUsuarioSchema) as any,
        defaultValues: {
            id_asignacion: cajaUsuario?.id_asignacion || undefined,
            id_caja: cajaUsuario?.id_caja ? Number(cajaUsuario.id_caja) : undefined,
            // For existing records, use the existing id_usuario
            // For new records, it will be set when a user is selected
            id_usuario: cajaUsuario?.id_usuario ? Number(cajaUsuario.id_usuario) : undefined,
            fecha_asignacion: cajaUsuario?.fecha_asignacion ? 
                (typeof cajaUsuario.fecha_asignacion === 'string' ? cajaUsuario.fecha_asignacion : cajaUsuario.fecha_asignacion.toISOString()) : 
                new Date().toISOString(),
            fecha_termino: cajaUsuario?.fecha_termino ? 
                (typeof cajaUsuario.fecha_termino === 'string' ? cajaUsuario.fecha_termino : cajaUsuario.fecha_termino.toISOString()) : 
                undefined
        }
    });

    // Fetch cajas and related data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch all required data in parallel
                const [
                    cajasData,
                    puntosVentaData,
                    empresasData,
                    tiposCajaData,
                    personasData
                ] = await Promise.all([
                    getCajas(1, 1000),
                    getPuntosVenta(1, 1000),
                    getEmpresas(),
                    getTiposCaja(1, 1000),
                    getPersonas()
                ]);

                // Create personas map
                const personasMap = personasData.data.reduce((acc: Record<number, Persona>, persona: Persona) => {
                    acc[persona.idPersona] = persona;
                    return acc;
                }, {});
                setPersonasMap(personasMap);

                // Create maps for quick lookup
                const puntosVentaMap = puntosVentaData.data.reduce((acc: Record<number, PuntoVenta>, pv: PuntoVenta) => {
                    acc[pv.id_punto_venta] = pv;
                    return acc;
                }, {});

                const empresasMap = empresasData.data.reduce((acc: Record<number, Empresa>, emp: Empresa) => {
                    acc[emp.idEmpresa] = emp;
                    return acc;
                }, {});

                const tiposCajaMap = tiposCajaData.data.reduce((acc: Record<number, TipoCaja>, tipo: TipoCaja) => {
                    acc[tipo.id_tipo_caja] = tipo;
                    return acc;
                }, {});

                setPuntosVenta(puntosVentaMap);
                setEmpresas(empresasMap);
                setTiposCaja(tiposCajaMap);

                // Format cajas with related data
                const formattedCajas = cajasData.data.map((caja: Caja) => {
                    const puntoVenta = caja.id_punto_venta ? puntosVentaMap[caja.id_punto_venta] : null;
                    const empresa = puntoVenta?.empresa_id ? empresasMap[puntoVenta.empresa_id] : null;
                    const tipoCaja = caja.id_tipo_caja ? tiposCajaMap[caja.id_tipo_caja] : null;
                    const nombreCaja = caja.nombre_caja || `Caja #${caja.id_caja}`;

                    return {
                        ...caja,  // Include all caja properties
                        value: caja.id_caja.toString(),
                        label: nombreCaja,
                        id_caja: caja.id_caja,  // Make sure id_caja is set
                        id_punto_venta: caja.id_punto_venta,
                        punto_venta_nombre: puntoVenta?.nombre_punto_venta || null,
                        razon_social: empresa?.razonSocial || null,
                        tipo_caja_nombre: tipoCaja?.nombre_tipo_caja || null
                    };
                });

                setCajas(formattedCajas);

                // Initial filter based on selected company
                if (selectedCompany) {
                    const puntosVentaEmpresa = Object.values(puntosVentaMap).filter(
                        pv => pv.empresa_id === selectedCompany.idEmpresa
                    );

                    const filtered = formattedCajas.filter(caja =>
                        caja.id_punto_venta &&
                        puntosVentaEmpresa.some(pv => pv.id_punto_venta === caja.id_punto_venta)
                    );
                    setFilteredCajas(filtered);
                } else {
                    setFilteredCajas([]);
                }

                // Fetch all users from usuario-empresa
                const [usuariosEmpresaResponse, detallesUsuarioResponse] = await Promise.all([
                    getUsuariosEmpresa(1, 1000),
                    getDetallesUsuario(1, 1000)
                ]);

                    

                setUsuariosEmpresaData(usuariosEmpresaResponse);

                // Create a map of usuarioId to detalleUsuario
                const detallesMap = detallesUsuarioResponse.data.reduce((acc: Record<number, any>, detalle: any) => {
                    if (detalle.idUsuarioEmpresa) {
                        acc[detalle.idUsuarioEmpresa] = detalle;
                    }
                    return acc;
                }, {});
                setDetallesUsuarioMap(detallesMap);

                // Initial users load will be handled by the effect that depends on selectedCaja

            } catch (error) {
                console.error('Error fetching data:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los datos necesarios');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [showAlert, selectedCompany]);

    // Fetch punto venta usuarios mapping
    useEffect(() => {
        const fetchPuntoVentaUsuarios = async () => {
            try {
                const response = await fetch(`/api/proxy?service=caja&path=puntos-venta-usuario`, {
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Error al cargar asignaciones de puntos de venta');

                const data = await response.json();
                const mapping: Record<number, number[]> = {};

                data.data.forEach((pvu: any) => {
                    if (!pvu.id_punto_venta || !pvu.id_usuario) return;
                    if (!mapping[pvu.id_punto_venta]) {
                        mapping[pvu.id_punto_venta] = [];
                    }
                    mapping[pvu.id_punto_venta].push(pvu.id_usuario);
                });

                setPuntoVentaUsuarios(mapping);
            } catch (error) {
                console.error('Error fetching punto venta usuarios:', error);
            }
        };

        fetchPuntoVentaUsuarios();
    }, []);

    // Update form when editing an existing caja
    useEffect(() => {
        if (cajaUsuario) {
            // Only set the form values if we're in edit mode and have a cajaUsuario
            if (cajaUsuario.id_caja) {
                form.setValue('id_caja', Number(cajaUsuario.id_caja));
                
                // Verify company association if needed
                if (cajas.length > 0) {
                    const caja = cajas.find(c => c.id_caja === cajaUsuario.id_caja);
                    if (caja) {
                        const pv = caja.id_punto_venta ? puntosVenta[caja.id_punto_venta] : null;
                        if (pv?.empresa_id && selectedCompany?.idEmpresa !== pv.empresa_id) {
                            console.warn('Caja belongs to a different company than the selected one');
                        }
                    }
                }
            }
            
            // Set the usuario if it exists
            if (cajaUsuario.id_usuario) {
                form.setValue('id_usuario', Number(cajaUsuario.id_usuario));
            }
        }
    }, [cajaUsuario, cajas, puntosVenta, selectedCompany, form]);

    // Update the form's caja field when filteredCajas changes
    useEffect(() => {
        const currentCajaId = form.getValues('id_caja');
        if (currentCajaId && !filteredCajas.some((c: any) => c.id_caja === currentCajaId)) {
            // Clear the caja selection if it's not in the filtered list
            form.setValue('id_caja', 0);
        }
    }, [filteredCajas, form]);

    // Load users when component mounts or when dependencies change
    useEffect(() => {
        if (!usuariosEmpresaData?.data || !detallesUsuarioMap || !selectedCompany) return;

        // Filter active users that belong to the selected company
        
        const companyUsers = usuariosEmpresaData.data
            .filter((usuarioEmpresa: any) => {
                const detalle = detallesUsuarioMap[usuarioEmpresa.idUsuarioEmpresa];
                const isActive = detalle?.estado === true;
                const belongsToCompany = usuarioEmpresa.idEmpresa === selectedCompany.idEmpresa;
                return isActive && belongsToCompany;
            })
            .map((usuarioEmpresa: any) => {
                const detalle = detallesUsuarioMap[usuarioEmpresa.idUsuarioEmpresa];
                const persona = personasMap[usuarioEmpresa.idPersona];
                const fullName = persona ? `${persona.nombre || ''} ${persona.apellidoPaterno || ''} ${persona.apellidoMaterno || ''}`.trim() : '';

                return {
                    value: usuarioEmpresa.idUsuarioEmpresa.toString(), // Usar idUsuarioEmpresa como valor
                    label: fullName || usuarioEmpresa.username,
                    personaId: usuarioEmpresa.idPersona,
                    username: usuarioEmpresa.username,
                    idUsuarioEmpresa: usuarioEmpresa.idUsuarioEmpresa
                };
            });

        setUsuarios(companyUsers);
        setFilteredUsuarios(companyUsers);
    }, [usuariosEmpresaData, detallesUsuarioMap, personasMap, selectedCompany]);

    const handleFormSubmit = async (formData: CajaUsuarioFormValues) => {
        try {
            setIsLoading(true);
            
            
            
            // Validar que los IDs sean números válidos
            if (!formData.id_caja || isNaN(Number(formData.id_caja))) {
                throw new Error('Por favor seleccione una caja válida');
            }
            
            if (!formData.id_usuario || isNaN(Number(formData.id_usuario))) {
                console.error('Usuario no válido seleccionado');
                throw new Error('Por favor seleccione un usuario válido');
            }
            
            const payload = {
                id_caja: Number(formData.id_caja),
                id_usuario: Number(formData.id_usuario),
                fecha_termino: formData.fecha_termino,
            };
            
            
            
            

            if (isEditing && cajaUsuario?.id_asignacion) {
                await updateCajaUsuario(cajaUsuario.id_asignacion, payload);
                showAlert('success', 'Éxito', 'Asignación de caja actualizada correctamente');
            } else {
                await createCajaUsuario(payload);
                showAlert('success', 'Éxito', 'Asignación de caja creada correctamente');
            }

            if (onSuccess) onSuccess();
            closeModal();

        } catch (error) {
            console.error('Error al guardar asignación de caja:', error);
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

    return (
        <DialogContent className="sm:max-w-[500px] max-h-[100vh] overflow-y-auto overflow-x-visible" >
            <EntityForm<CajaUsuarioFormValues>
                title={`${isEditing ? 'Editar' : 'Nueva'} Asignación de Caja`}
                titleClassName="text-xl font-semibold text-center text-[#0C4A6E] mb-6"
                form={form}
                onSubmit={handleFormSubmit}
                isEditing={isEditing}
                isSubmitting={isLoading}
                onCancel={closeModal}
                submitButtonText={isEditing ? "Actualizar" : "Crear"}
                submitButtonDisabled={!selectedCompany}
                submitTooltip={!selectedCompany ? "Seleccione una empresa primero" : undefined}
            >
                {!selectedCompany && (
                    <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                        Por favor seleccione una empresa para continuar
                    </div>
                )}

                <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6">
                    {/* Caja Field */}
                    <div className="min-h-[100px] col-span-12">
                        <FormFieldWrapper
                            name="id_caja"
                            control={form.control}
                            label="Caja"
                            error={form.formState.errors?.id_caja?.message}
                        >
                            {(field) => (
                                <div>
                                    <Combobox
                                        options={filteredCajas.map(c => ({
                                            value: String(c.id_caja),
                                            label: c.nombre_caja || `Caja #${c.id_caja}`
                                        }))}
                                        selected={field.value ? String(field.value) : ""}
                                        onChange={(value) => {
                                            field.onChange(value ? Number(value) : undefined);
                                        }}
                                        disabled={!selectedCompany || filteredCajas.length === 0}
                                        placeholder={
                                            !selectedCompany
                                                ? "Seleccione una empresa primero"
                                                : filteredCajas.length === 0
                                                ? "No hay cajas disponibles"
                                                : "Seleccionar caja..."
                                        }
                                        emptyMessage={
                                            !selectedCompany
                                                ? "Seleccione una empresa primero"
                                                : "No se encontraron cajas para esta empresa"
                                        }
                                    />
                                </div>
                            )}
                        </FormFieldWrapper>
                    </div>

                    {/* Second Row - Usuario */}
                    <div className="min-h-[100px] col-span-12">
                        <FormFieldWrapper
                            name="id_usuario"
                            control={form.control}
                            label="Usuario"
                            error={form.formState.errors?.id_usuario?.message}
                        >
                            {(field) => (
                                <div>
                                    <Combobox
                                        options={usuarios}
                                        placeholder="Seleccionar usuario..."
                                        emptyMessage={
                                            usuarios.length === 0
                                                ? "No se encontraron usuarios"
                                                : "No hay usuarios disponibles"
                                        }
                                        selected={field.value ? String(field.value) : undefined}
                                        onChange={(value: string) => {
                                            console.log('Selected user value:', value);
                                            if (!value) {
                                                field.onChange(undefined);
                                                return;
                                            }
                                            // Convert to number and update the form field
                                            const numericValue = Number(value);
                                            if (!isNaN(numericValue)) {
                                                field.onChange(numericValue);
                                            } else {
                                                field.onChange(undefined);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </FormFieldWrapper>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    );
}
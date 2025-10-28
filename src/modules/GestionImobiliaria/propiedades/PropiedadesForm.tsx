"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form"
import { useState, useEffect, ReactElement } from "react"
import styles from "./styles/PropiedadesForm.module.css"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { propiedadSchema } from "@/schemas/propiedadSchema"

import { useAlert } from "@/contexts/AlertContext"
import { useCompany } from "@/contexts/CompanyContext";

import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { Combobox } from "@/components/ui/combobox"
import { Proyecto, TipoPropiedad, EstadoPropiedad, Propiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
type PropiedadFormValues = z.infer<typeof propiedadSchema>

type PropiedadFormProps = {
    propiedad?: Propiedad;
    onSuccess?: () => void;
    closeModal?: () => void;
}

export default function PropiedadesForm({ propiedad, onSuccess, closeModal }: PropiedadFormProps): ReactElement {
    const isEditing = !!propiedad;
    const { showAlert } = useAlert();
    const { selectedCompany } = useCompany();
    
    const [proyectos, setProyectos] = useState<{value: string, label: string}[]>([]);
    const [tiposPropiedad, setTiposPropiedad] = useState<{value: string, label: string}[]>([]);
    const [estadosPropiedad, setEstadosPropiedad] = useState<{value: string, label: string}[]>([]);
    const [estadoDisponibleId, setEstadoDisponibleId] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchProyectos = async () => {
            try {
                setLoading(true);
                const proyectosData = await InmobiliariaApi.proyectoController.getProyectoList();
                
                let filteredProyectos = proyectosData?.data || [];
                if (selectedCompany) {
                    filteredProyectos = filteredProyectos.filter(
                        (proyecto: Proyecto) => proyecto.idEmpresa === selectedCompany.idEmpresa
                    );
                }
                
                const formattedProyectos = filteredProyectos.map((proyecto: Proyecto) => ({
                    value: proyecto.idProyectoInmobiliario.toString(),
                    label: proyecto.nombre
                }));
                setProyectos(formattedProyectos || []);
            } catch (error) {
                console.error('Error al cargar proyectos:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los proyectos');
            } finally {
                setLoading(false);
            }
        };

        const fetchTiposPropiedad = async () => {
            try {
                setLoading(true);
                const tiposData = await InmobiliariaApi.tipoPropiedadController.getTipoPropiedadList();
                const formattedTipos = tiposData?.data.map((tipo: TipoPropiedad) => ({
                    value: tipo.idTiposPropiedad.toString(),
                    label: tipo.nombre
                }));
                setTiposPropiedad(formattedTipos || []);
            } catch (error) {
                console.error('Error al cargar tipos de propiedad:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los tipos de propiedad');
            } finally {
                setLoading(false);
            }
        };

        const fetchEstadosPropiedad = async () => {
            try {
                setLoading(true);
                const estadosData = await InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList();
                const formattedEstados = estadosData?.data.map((estado: EstadoPropiedad) => ({
                    value: estado.idEstadoPropiedad.toString(),
                    label: estado.nombre
                }));
                setEstadosPropiedad(formattedEstados || []);
            } catch (error) {
                console.error('Error al cargar estados de propiedad:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los estados de propiedad');
            } finally {
                setLoading(false);
            }
        };
        
        const fetchEstadoDisponible = async () => {
            try {
                const estadoDisponible = await InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList();
                if (estadoDisponible?.data) {
                    const estadoDisponibleData = estadoDisponible.data.find((estado: EstadoPropiedad) => estado.esFinal);
                    if (estadoDisponibleData) {
                        setEstadoDisponibleId(estadoDisponibleData.idEstadoPropiedad);
                        console.log('Estado Disponible ID:', estadoDisponibleData.idEstadoPropiedad);
                    } else {
                        console.error('No se pudo obtener el estado Disponible');
                    }
                } else {
                    console.error('No se pudo obtener el estado Disponible');
                }
            } catch (error) {
                console.error('Error al obtener el estado Disponible:', error);
            }
        };

        fetchProyectos();
        fetchTiposPropiedad();
        fetchEstadosPropiedad();
        fetchEstadoDisponible();
    }, [showAlert, selectedCompany]);
    
    // Configurar el formulario con React Hook Form y Zod
    const form = useForm<PropiedadFormValues>({
        resolver: zodResolver(propiedadSchema),
        defaultValues: {
            idProyectoInmobiliario: propiedad?.idProyectoInmobiliario || 0,
            idTiposPropiedad: propiedad?.idTiposPropiedad || 0,
            // Si estamos editando, usamos el estado existente, si no, usaremos el estado Disponible después
            idEstadoPropiedad: propiedad?.idEstadoPropiedad || 1, // Valor temporal que será reemplazado
            direccion: propiedad?.direccion || "",
            codigoPropiedad: propiedad?.codigoPropiedad || "",
            nombre: propiedad?.nombre || "",
            descripcion: propiedad?.descripcion || "",
            precio: propiedad?.precio || 0,
            areaM2: propiedad?.areaM2 || 0,
            piso: propiedad?.piso || 0,
            numeroHabitaciones: propiedad?.numeroHabitaciones || 0,
            numeroBanos: propiedad?.numeroBanos || 0,
            estacionamiento: propiedad?.estacionamiento || false,
        }
    });
    
    // Manejar envío del formulario
    const handleFormSubmit = async (data: PropiedadFormValues) => {
        try {
            // Crear una variable para almacenar si la operación fue exitosa
            let operacionExitosa = false;
            
            if (isEditing && propiedad?.idPropiedad) {
                // Actualizar propiedad existente
                await InmobiliariaApi.propiedadController.updatePropiedad(propiedad.idPropiedad, data);
                showAlert('success', 'Éxito', 'Propiedad actualizada correctamente');
                operacionExitosa = true;
            } else {
                // Crear nueva propiedad
                let propiedadData = {...data};
                
                // Si tenemos el ID del estado Disponible, lo usamos
                if (estadoDisponibleId > 0) {
                    propiedadData.idEstadoPropiedad = estadoDisponibleId;
                    console.log('Asignando estado Disponible ID:', estadoDisponibleId);
                } else {
                    // Intentamos buscar el estado Disponible entre los estados cargados
                    const estadoDisponible = estadosPropiedad.find(estado => 
                        estado.label.toLowerCase() === 'disponible'
                    );
                    
                    if (estadoDisponible) {
                        propiedadData.idEstadoPropiedad = parseInt(estadoDisponible.value);
                        console.log('Estado Disponible encontrado en la lista:', estadoDisponible.value);
                    } else {
                        // Si no se encuentra, usamos el valor por defecto (que debería ser válido)
                        console.warn('No se pudo encontrar el estado Disponible, usando valor por defecto:', propiedadData.idEstadoPropiedad);
                    }
                }
                
                // Aseguramos que todos los valores numéricos sean números
                propiedadData.idProyectoInmobiliario = Number(propiedadData.idProyectoInmobiliario);
                propiedadData.idTiposPropiedad = Number(propiedadData.idTiposPropiedad);
                propiedadData.idEstadoPropiedad = Number(propiedadData.idEstadoPropiedad);
                propiedadData.precio = Number(propiedadData.precio);
                propiedadData.areaM2 = Number(propiedadData.areaM2);
                propiedadData.piso = Number(propiedadData.piso);
                propiedadData.numeroHabitaciones = Number(propiedadData.numeroHabitaciones);
                propiedadData.numeroBanos = Number(propiedadData.numeroBanos);
                
                console.log('Datos a enviar:', propiedadData);
                await InmobiliariaApi.propiedadController.createPropiedad(propiedadData);
                showAlert('success', 'Éxito', 'Propiedad creada correctamente');
                operacionExitosa = true;
            }
            
            // Primero cerrar el modal
            if (closeModal) {
                closeModal();
            }
            
            // Ejecutar callback de éxito después de un retraso más largo
            // para asegurar que el modal se ha cerrado completamente
            if (operacionExitosa && onSuccess) {
                // Forzar un pequeño retraso para asegurar que el modal se cierre
                setTimeout(() => {
                    onSuccess();
                }, 600);
            }
        } catch (error) {
            console.error('Error al guardar propiedad:', error);
            showAlert('error', 'Error', 'Error al guardar la propiedad');
        }
    };
    
    // Usar form.handleSubmit para validar antes de enviar
    const onSubmit = form.handleSubmit(handleFormSubmit);
    
    return (
        <DialogContent className={styles.dialogContent}>
            <EntityForm<PropiedadFormValues>
                title={`${isEditing ? 'Editar' : 'Registrar'} propiedad`}
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className={`propiedad-form propiedad-form-container ${styles.formContainer}`}>
                    <div className={styles.formRow}>
                        <div className={styles.formCol6}>
                            <FormFieldWrapper
                                name="idProyectoInmobiliario"
                                control={form.control}
                                label="Proyecto inmobiliario"
                                error={form.formState.errors?.idProyectoInmobiliario?.message as string}
                            >
                                {(field: any) => (
                                    <div className={`combobox-container ${styles.comboboxContainer}`}>
                                    <Combobox
                                        options={proyectos}
                                        selected={field.value?.toString() || ''}
                                        onChange={(value) => field.onChange(Number(value))}
                                        placeholder="Seleccionar proyecto..."
                                    />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                  
                        <div className={styles.formCol6}>
                            <FormFieldWrapper
                                name="idTiposPropiedad"
                                control={form.control}
                                label="Tipo de propiedad"
                                error={form.formState.errors?.idTiposPropiedad?.message as string}
                            >
                                {(field: any) => (
                                    <div className={`combobox-container ${styles.comboboxContainer}`}>
                                    <Combobox
                                        options={tiposPropiedad}
                                        selected={field.value?.toString() || ""}
                                        onChange={(value) => field.onChange(Number(value))}
                                        placeholder="Seleccionar tipo..."
                                    />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>


                    
                    <div className={styles.formRow}>
                        <div className={styles.formCol6}>
                                <FormFieldWrapper
                                    name="nombre"
                                    control={form.control}
                                    label="Nombre"
                                    error={form.formState.errors?.nombre?.message as string}
                                >
                                {(field: any) => (
                                    <Input 
                                    type="text"
                                    placeholder="Nombre de la propiedad"
                                    className="h-10"
                                    {...field} />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className={styles.formCol6}>
                            <FormFieldWrapper
                                name="codigoPropiedad"
                                control={form.control}
                                label="Código propiedad"
                                error={form.formState.errors?.codigoPropiedad?.message as string}
                            >
                                {(field: any) => (
                                    <Input 
                                    type="text"
                                    placeholder="Código de la propiedad"
                                    {...field} 
                                    className="h-10"
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                        
                    <div className={styles.formRow}>
                        <div className={styles.formCol12}>
                            <FormFieldWrapper
                                name="direccion"
                                control={form.control}
                                label="Dirección"
                                error={form.formState.errors?.direccion?.message as string}
                            >
                                {(field: any) => (
                                    <Input 
                                        type="text"
                                        placeholder="Dirección de la propiedad"
                                        className={styles.inputField}
                                        {...field} 
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                    
                    <div className={styles.formRow}>
                        {/* Primera fila de campos numéricos */}
                        <div className={styles.formCol4}>
                            <FormFieldWrapper
                                name="areaM2"
                                control={form.control}
                                label="Área m²"
                                error={form.formState.errors?.areaM2?.message as string}
                            >
                                {(field: any) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className={styles.inputField}
                                        {...field}
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className={styles.formCol4}>
                            <FormFieldWrapper
                                name="precio"
                                control={form.control}
                                label="Precio"
                                // error={form.formState.errors?.precio?.message as string}
                            >
                                {(field: any) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className={styles.inputField}
                                        {...field}
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className={styles.formCol4}>
                            <FormFieldWrapper
                                name="piso"
                                control={form.control}
                                label="N° Piso"
                                // error={form.formState.errors?.piso?.message as string}
                            >
                                {(field: any) => (
                                    <Input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    className="h-10"
                                    {...field}
                                    value={field.value?.toString() || ""}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    {/* Segunda fila de campos numéricos */}
                    <div className={styles.formRow}>
                        <div className={styles.formCol4}>
                            <FormFieldWrapper
                                name="numeroHabitaciones"
                                control={form.control}
                                label="N° Habitaciones"
                                // error={form.formState.errors?.numeroHabitaciones?.message as string}
                            >
                                {(field: any) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className={styles.inputField}
                                        {...field}
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className={styles.formCol4}>
                            <FormFieldWrapper
                                name="numeroBanos"
                                control={form.control}
                                label="N° Baños"
                                // error={form.formState.errors?.numeroBanos?.message as string}
                            >
                                {(field: any) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className={styles.inputField}
                                        {...field}
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                        
                        <div className={styles.formCol4}>
                            <FormFieldWrapper
                                name="estacionamiento"
                                control={form.control}
                                label="Estacionamiento"
                            >
                                {(field: any) => (
                                    <div className={styles.switchContainer}>
                                        <div className={styles.switchWrapper}>
                                            <span className={styles.switchLabel}>{field.value ? "Sí" : "No"}</span>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-[#0C4A6E]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formCol12}>
                            <FormFieldWrapper
                                name="descripcion"
                                label="Descripción"
                                control={form.control}
                                error={form.formState.errors?.descripcion?.message as string}
                            >
                                {(field: any) => (
                                    <Textarea
                                        placeholder="Descripción detallada de la propiedad"
                                        className={styles.textareaField}
                                        {...field}
                                    />
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>
                </div>
            </EntityForm>
        </DialogContent>
    )
}

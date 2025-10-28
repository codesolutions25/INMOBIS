"use client"

import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form"
import { useState, useEffect, ReactElement } from "react"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { proyectoSchema } from "@/schemas/proyectoSchema"

import { getEmpresas } from "@/services/apiEmpresa"


// types
import { 
    Proyecto,
    EstadoPropiedad, 
    Departamento, 
    Provincia, 
    Distrito } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"

import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi"

import { useAlert } from "@/contexts/AlertContext"
import { useCompany } from "@/contexts/CompanyContext";

import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { Combobox } from "@/components/ui/combobox"

import styles from "./styles/ProyectosForm.module.css";

type ProyectoFormValues = z.infer<typeof proyectoSchema>

type ProyectoFormProps = {
    proyecto?: Proyecto;
    onSuccess?: () => void;
    closeModal?: () => void;
}

export default function ProyectosForm({ proyecto, onSuccess, closeModal }: ProyectoFormProps): ReactElement {

    const isEditing = !!proyecto;
    const { showAlert } = useAlert();
    const { selectedCompany } = useCompany();
    
    // Estado para almacenar las empresas (solo la seleccionada del contexto)
    const [empresas, setEmpresas] = useState<{value: string, label: string}[]>([]);
    const [estadosPropiedad, setEstadosPropiedad] = useState<{value: string, label: string}[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados para ubicación
    const [departamentos, setDepartamentos] = useState<{ value: string, label: string }[]>([]);
    const [provincias, setProvincias] = useState<{ value: string, label: string }[]>([]);
    const [distritos, setDistritos] = useState<{ value: string, label: string }[]>([]);


    // Estados seleccionados
    const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
    const [selectedProvincia, setSelectedProvincia] = useState<string>("");

    // Al cargar el formulario, cargar todos los datos de ubicación y setear valores iniciales si hay proyecto
    useEffect(() => {
        const fetchAllUbicacionData = async () => {
            try {
                // Cargar todos los datos de ubicación de una vez
                const [departamentosData, provinciasData, distritosData] = await Promise.all([
                    InmobiliariaApi.ubicacionController.getDepartamentoList(),
                    InmobiliariaApi.ubicacionController.getProvinciaList(),
                    InmobiliariaApi.ubicacionController.getDistritoList()
                ]);
                
                // Guardar todos los datos en variables de estado para acceso rápido
                const allDepartamentos = departamentosData?.data.map((dep: Departamento) => ({
                    value: dep.idDepartamento.toString(),
                    label: dep.nombre
                }));
                setDepartamentos(allDepartamentos || []);
                
                // Guardar todas las provincias y distritos en memoria para acceso rápido
                const allProvincias = provinciasData?.data.map((p: Provincia) => ({
                    value: p.idProvincia.toString(),
                    label: p.nombre,
                    idDepartamento: p.idDepartamento
                }));
                setProvincias(allProvincias || []);
                
                const allDistritos = distritosData?.data.map((d: Distrito) => ({
                    value: d.idDistrito.toString(),
                    label: d.nombre,
                    idProvincia: d.idProvincia
                }));
                setDistritos(allDistritos || []);

                // Si estamos editando un proyecto con distrito seleccionado
                if (proyecto?.idDistrito) {
                    const distrito = distritosData?.data.find((d: Distrito) => d.idDistrito === proyecto.idDistrito);
                    if (distrito) {
                        const provincia = provinciasData?.data.find((p: Provincia) => p.idProvincia === distrito.idProvincia);
                        if (provincia) {
                            // Establecer departamento seleccionado
                            const depId = provincia.idDepartamento.toString();
                            setSelectedDepartamento(depId);
                            
                            // Filtrar y establecer provincias del departamento
                            const provinciasDelDepartamento = allProvincias?.filter(p => p.idDepartamento === provincia?.idDepartamento)
                                .map(p => ({ value: p.value, label: p.label }));
                            setProvincias(provinciasDelDepartamento || []);
                            
                            // Establecer provincia seleccionada
                            const provId = provincia.idProvincia.toString();
                            setSelectedProvincia(provId);
                            
                            // Filtrar y establecer distritos de la provincia
                            const distritosDelaProvincia = allDistritos?.filter(d => d.idProvincia === provincia?.idProvincia)
                                .map(d => ({ value: d.value, label: d.label }));
                            setDistritos(distritosDelaProvincia || []);
                        }
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos de ubicación:', error);
                showAlert('error', 'Error', 'No se pudo cargar la información de ubicación');
            }
        };
        fetchAllUbicacionData();
    }, [showAlert, proyecto?.idDistrito]);

    // Cuando se selecciona un departamento, cargar provincias
    useEffect(() => {
        if (!selectedDepartamento) {
            setProvincias([]);
            setSelectedProvincia("");
            setDistritos([]);
            form.setValue("idDistrito", 0);
            return;
        }
        const fetchProvincias = async () => {
            try {
                const provinciasData = await InmobiliariaApi.ubicacionController.getProvinciaList();
                const provinciasFiltered = provinciasData?.data
                    .filter((p: Provincia) => p.idDepartamento === Number(selectedDepartamento))
                    .map((p: Provincia) => ({
                        value: p.idProvincia.toString(),
                        label: p.nombre
                    }));
                setProvincias(provinciasFiltered || []);
                
                // Si estamos en modo edición y ya hay un distrito seleccionado,
                // intentamos mantener la provincia seleccionada si pertenece al departamento
                if (proyecto?.idDistrito) {
                    const distritosData = await InmobiliariaApi.ubicacionController.getDistritoList();
                    const distrito = distritosData?.data.find((d: Distrito) => d.idDistrito === proyecto.idDistrito);
                    if (distrito) {
                        const provinciaDelDistrito = provinciasData?.data.find((p: Provincia) => p.idProvincia === distrito.idProvincia);
                        if (provinciaDelDistrito && provinciaDelDistrito.idDepartamento === Number(selectedDepartamento)) {
                            // La provincia del distrito pertenece al departamento seleccionado
                            setSelectedProvincia(provinciaDelDistrito.idProvincia.toString());
                            
                            // También cargamos los distritos de esta provincia
                            const distritosFiltered = distritosData?.data
                                .filter((d: Distrito) => d.idProvincia === provinciaDelDistrito.idProvincia)
                                .map((d: Distrito) => ({
                                    value: d.idDistrito.toString(),
                                    label: d.nombre
                                }));
                            setDistritos(distritosFiltered || []);
                            return; // Salimos para evitar resetear la provincia
                        }
                    }
                }
                
                // Si no hay coincidencia o no estamos en edición, resetear provincia y distrito
                setSelectedProvincia("");
                setDistritos([]);
                form.setValue("idDistrito", 0);
            } catch (error) {
                console.error('Error al cargar provincias:', error);
                showAlert('error', 'Error', 'No se pudieron cargar las provincias');
            }
        };
        fetchProvincias();
    }, [selectedDepartamento, proyecto?.idDistrito]);

    // Cuando se selecciona una provincia, cargar distritos
    useEffect(() => {
        if (!selectedProvincia) {
            setDistritos([]);
            form.setValue("idDistrito", 0);
            return;
        }

        const fetchDistritos = async () => {
            try {
                const distritosData = await InmobiliariaApi.ubicacionController.getDistritoList();
                const distritosFiltered = distritosData?.data
                    .filter((d: Distrito) => d.idProvincia === Number(selectedProvincia))
                    .map((d: Distrito) => ({
                        value: d.idDistrito.toString(),
                        label: d.nombre
                    }));
                setDistritos(distritosFiltered || []);
                
                // Si estamos en modo edición y ya hay un distrito seleccionado,
                // intentamos mantenerlo si pertenece a la provincia seleccionada
                if (proyecto?.idDistrito) {
                    const distritoActual = distritosData?.data.find((d: Distrito) => d.idDistrito === proyecto.idDistrito);
                    if (distritoActual && distritoActual.idProvincia === Number(selectedProvincia)) {
                        // El distrito pertenece a la provincia seleccionada, lo mantenemos
                        form.setValue("idDistrito", proyecto.idDistrito);
                        return; // Salimos para evitar resetear el distrito
                    }
                }
                
                // Si no hay coincidencia o no estamos en edición, resetear el distrito
                form.setValue("idDistrito", 0);
            } catch (error) {
                console.error('Error al cargar distritos:', error);
                showAlert('error', 'Error', 'No se pudo cargar los distritos');
            }
        };
        fetchDistritos();
    }, [selectedProvincia, proyecto?.idDistrito]);
    
    // Cargar las empresas al iniciar el componente
    useEffect(() => {

        if (selectedCompany) {
            const empresaselect = {
                value: selectedCompany.idEmpresa.toString(),
                label: selectedCompany.razonSocial
            }
            setEmpresas([empresaselect]);
            form.setValue('idEmpresa', selectedCompany.idEmpresa);
        }
        else if (proyecto?.idEmpresa && !selectedCompany){
            const cargaEmpresa = async () => {
                try {
                    const empresa = await getEmpresas(proyecto.idEmpresa);
                    const empresaselect = {
                        value: empresa.data[0].idEmpresa.toString(),
                        label: empresa.data[0].razonSocial
                    }
                    setEmpresas([empresaselect]);
                    form.setValue('idEmpresa', empresa.data[0].idEmpresa);
                } catch (error) {
                    console.error('Error al cargar empresa:', error);
                }
            }
            cargaEmpresa();
        }
        const fetchEstadosPropiedad = async () => {
            try {
                const estadosData = await InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList();
                const formattedEstados = estadosData?.data.map((estado: EstadoPropiedad) => ({
                    value: estado.idEstadoPropiedad.toString(),
                    label: estado.nombre
                }));
                setEstadosPropiedad(formattedEstados || []);
            } catch (error) {
                console.error('Error al cargar estados de propiedad:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los estados de propiedad');
            }
        };
        
        fetchEstadosPropiedad();
    }, [showAlert]);

   

    const form = useForm<ProyectoFormValues>({
        resolver: zodResolver(proyectoSchema),
        defaultValues: {
            idEmpresa: selectedCompany?.idEmpresa || proyecto?.idEmpresa || 0,
            nombre: proyecto?.nombre || "",
            ubicacion: proyecto?.ubicacion || "",
            descripcion: proyecto?.descripcion || "",
            fechaInicio: proyecto?.fechaInicio ? new Date(proyecto.fechaInicio) : undefined,
            fechaFin: proyecto?.fechaFin ? new Date(proyecto.fechaFin) : undefined,
            idEstadoPropiedad: proyecto?.idEstadoPropiedad || 0,
            telefonoContacto: proyecto?.telefonoContacto || "",
            emailContacto: proyecto?.emailContacto || "",
            idDistrito: proyecto?.idDistrito || 0,
        }
    });

     // Sincronizar la empresa seleccionada del contexto con el formulario
     useEffect(() => {
        if (selectedCompany) {
            // Crear un array con solo la empresa seleccionada
            const empresaSeleccionada = {
                value: selectedCompany.idEmpresa.toString(),
                label: selectedCompany.razonSocial
            };
            setEmpresas([empresaSeleccionada]);
            
            // Establecer el valor del formulario con la empresa seleccionada
            form.setValue('idEmpresa', selectedCompany.idEmpresa);
        }
    }, [selectedCompany, form]);
    
    const handleFormSubmit = async (data: ProyectoFormValues) => {
        try {
            setLoading(true);
            let operacionExitosa = false;

            if (isEditing && proyecto?.idProyectoInmobiliario) {
                await InmobiliariaApi.proyectoController.updateProyecto(proyecto.idProyectoInmobiliario, {
                    ...data,
                    fechaInicio: data.fechaInicio?.toISOString(),
                    fechaFin: data.fechaFin?.toISOString()
                });
                showAlert('success', 'Éxito', 'Proyecto actualizado correctamente');
                operacionExitosa = true;
            } else {
                await InmobiliariaApi.proyectoController.createProyecto({
                    ...data,
                    fechaInicio: data.fechaInicio?.toISOString(),
                    fechaFin: data.fechaFin?.toISOString()
                });
                showAlert('success', 'Éxito', 'Proyecto creado correctamente');
                operacionExitosa = true;
            }
            
            if (closeModal) {
                closeModal();
            }
            
            if (operacionExitosa && onSuccess) {
                setTimeout(() => onSuccess(), 600);
            }
        } catch (error) {
            console.error('Error al guardar proyecto:', error);
            showAlert('error', 'Error', 'Error al guardar el proyecto');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = form.handleSubmit(handleFormSubmit as any);

    return (
        <DialogContent className={`sm:max-w-[1000px] ${styles.dialogContent}`}>
            <EntityForm
                title={`${isEditing ? 'Editar' : 'Registrar'} proyecto`}
                form={form}
                onSubmit={onSubmit}
                isEditing={isEditing}
                isSubmitting={loading}
                onCancel={closeModal}
            >
                <div className={`proyecto-form ${styles.proyectoFormContainer}`}>
                    {/* Primera fila - Empresa y Estado */}
                    <div className={styles.formRow}>
                        <div className={`${styles.fieldContainer} col-span-6`}>
                            <FormFieldWrapper
                                name="idEmpresa"
                                control={form.control}
                                label="Empresa"
                                error={form.formState.errors?.idEmpresa?.message as string}
                                
                            >
                                {(field: any) => {
                                    // Filtrar las empresas para incluir solo la empresa seleccionada
                                    const filteredEmpresas = selectedCompany 
                                        ? [{
                                            value: selectedCompany.idEmpresa.toString(),
                                            label: selectedCompany.razonSocial
                                          }]
                                        : [];

                                    return (
                                        <div className={styles.comboboxContainer}>
                                            <Combobox
                                                options={filteredEmpresas}
                                                placeholder={selectedCompany ? "Empresa seleccionada" : "Selecciona una empresa"}
                                                emptyMessage="No hay empresa seleccionada"
                                                selected={selectedCompany?.idEmpresa.toString() || ""}
                                                onChange={(value) => {
                                                    // Solo permitir cambiar a la empresa seleccionada
                                                    if (selectedCompany && value === selectedCompany.idEmpresa.toString()) {
                                                        field.onChange(selectedCompany.idEmpresa);
                                                    }
                                                }}
                                            />
                                            {!selectedCompany && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Selecciona una empresa desde el menú superior
                                                </p>
                                            )}
                                        </div>
                                    );
                                }}
                            </FormFieldWrapper>
                        </div>

                        <div className={`${styles.fieldContainer} col-span-6`}>
                            <FormFieldWrapper
                                name="idEstadoPropiedad"
                                label="Estado del proyecto"
                                control={form.control}
                                error={form.formState.errors?.idEstadoPropiedad?.message as string}
                            >
                                {(field: any) => (
                                    <div className={styles.comboboxContainer}>
                                        <Combobox
                                            options={estadosPropiedad}
                                            selected={field.value?.toString() || ""}
                                            onChange={(value) => field.onChange(Number(value))}
                                            placeholder="Seleccionar estado..."
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    {/* Segunda fila - Nombre */}
                    <div className={styles.formRow}>
                        <div className={`${styles.fieldContainer} col-span-12`}>
                            <FormFieldWrapper
                                name="nombre"
                                control={form.control}
                                label="Nombre"
                                error={form.formState.errors?.nombre?.message as string}
                            >
                                {(field: any) => (
                                    <div className={styles.inputContainer}>
                                        <Input
                                            type="text"
                                            placeholder="Nombre del proyecto"
                                            className="h-10"
                                            {...field}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>



                    {/* Cuarta fila - Fechas */}
                    <div className={styles.formRow}>
                        <div className={`${styles.fieldContainer} col-span-6`}>
                            <FormFieldWrapper
                                name="fechaInicio"
                                label="Fecha de inicio"
                                control={form.control}
                                error={form.formState.errors?.fechaInicio?.message as string}
                            >
                                {(field: any) => {
                                    const dateValue = field.value instanceof Date 
                                        ? field.value.toISOString().split('T')[0] 
                                        : '';
                                    
                                    return (
                                        <div className={styles.inputContainer}>
                                            <Input
                                                type="date"
                                                placeholder="Fecha de inicio"
                                                value={dateValue}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                                    field.onChange(date);
                                                }}
                                                className="h-10"
                                            />
                                        </div>
                                    );
                                }}
                            </FormFieldWrapper>
                        </div>

                        <div className={`${styles.fieldContainer} col-span-6`}>
                            <FormFieldWrapper
                                name="fechaFin"
                                label="Fecha de fin"
                                control={form.control}
                                error={form.formState.errors?.fechaFin?.message as string}
                            >
                                {(field: any) => {
                                    const dateValue = field.value instanceof Date 
                                        ? field.value.toISOString().split('T')[0] 
                                        : '';
                                    
                                    return (
                                        <div className={styles.inputContainer}>
                                            <Input
                                                type="date"
                                                placeholder="Fecha de fin"
                                                value={dateValue}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                                    field.onChange(date);
                                                }}
                                                className="h-10"
                                            />
                                        </div>
                                    );
                                }}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    {/* Quinta fila - Contacto */}
                    <div className={styles.formRow}>
                        <div className={`${styles.fieldContainer} col-span-6`}>
                            <FormFieldWrapper
                                name="telefonoContacto"
                                label="Teléfono de contacto"
                                control={form.control}
                                error={form.formState.errors?.telefonoContacto?.message as string}
                            >
                                {(field: any) => (
                                    <div className={styles.inputContainer}>
                                        <Input
                                            type="text"
                                            placeholder="Teléfono (9 dígitos)"
                                            maxLength={9}
                                            className="h-10"
                                            {...field}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>

                        <div className={`${styles.fieldContainer} col-span-6`}>
                            <FormFieldWrapper
                                name="emailContacto"
                                label="Email de contacto"
                                control={form.control}
                                error={form.formState.errors?.emailContacto?.message as string}
                            >
                                {(field: any) => (
                                    <div className={styles.inputContainer}>
                                        <Input
                                            type="email"
                                            placeholder="Email de contacto"
                                            className="h-10"
                                            {...field}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    {/* Sexta fila - Ubicación jerárquica */}
                    <div className="mb-6">
                        <h3 className={styles.sectionTitle}>Ubicación específica</h3>
                        <div className={styles.ubicacionEspecificaContainer}>
                            <div className={styles.ubicacionContainer}>
                                <div>
                                    <FormFieldWrapper
                                        name="departamento"
                                        label="1. Departamento"
                                        control={form.control}
                                    >
                                        {() => (
                                            <div className={`${styles.comboboxContainer} ${styles.ubicacionCombobox}`}>
                                                <Combobox
                                                    options={departamentos}
                                                    selected={selectedDepartamento}
                                                    onChange={(value) => {
                                                        setSelectedDepartamento(value);
                                                        // Resetear provincia y distrito cuando cambia el departamento
                                                        setSelectedProvincia("");
                                                        form.setValue("idDistrito", 0);
                                                    }}
                                                    placeholder="Seleccionar departamento..."
                                                />
                                            </div>
                                        )}
                                    </FormFieldWrapper>
                                </div>
                                <div>
                                    <FormFieldWrapper
                                        name="provincia"
                                        label="2. Provincia"
                                        control={form.control}
                                    >
                                        {() => (
                                            <div className={`${styles.comboboxContainer} ${styles.ubicacionCombobox} ${!selectedDepartamento ? styles.comboboxDisabled : ""}`}>
                                                <Combobox
                                                    options={provincias}
                                                    selected={selectedProvincia}
                                                    onChange={(value) => {
                                                        setSelectedProvincia(value);
                                                        // Resetear distrito cuando cambia la provincia
                                                        form.setValue("idDistrito", 0);
                                                    }}
                                                    placeholder="Seleccionar provincia..."
                                                />
                                            </div>
                                        )}
                                    </FormFieldWrapper>
                                </div>
                                <div>
                                    <FormFieldWrapper
                                        name="idDistrito"
                                        label="3. Distrito"
                                        control={form.control}
                                        error={form.formState.errors?.idDistrito?.message as string}
                                    >
                                        {(field: any) => (
                                            <div className={`${styles.comboboxContainer} ${styles.ubicacionCombobox} ${!selectedProvincia ? styles.comboboxDisabled : ""}`}>
                                                <Combobox
                                                    options={distritos}
                                                    selected={field.value ? field.value.toString() : ""}
                                                    onChange={(value) => field.onChange(Number(value))}
                                                    placeholder="Seleccionar distrito..."
                                                />
                                            </div>
                                        )}
                                    </FormFieldWrapper>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Campo de dirección (a todo lo ancho) */}
                    <div className={styles.formRow}>
                        <div className={`${styles.fieldContainer} col-span-12`}>
                            <FormFieldWrapper
                                name="ubicacion"
                                label="Dirección"
                                control={form.control}
                                error={form.formState.errors?.ubicacion?.message as string}
                            >
                                {(field: any) => (
                                    <div className={styles.inputContainer}>
                                        <Input
                                            type="text"
                                            placeholder="Dirección detallada"
                                            className="h-10"
                                            {...field}
                                        />
                                    </div>
                                )}
                            </FormFieldWrapper>
                        </div>
                    </div>

                    {/* Quinta fila - Descripción (a todo lo ancho) */}
                    <div className="mb-4">
                        <FormFieldWrapper
                            name="descripcion"
                            label="Descripción"
                            control={form.control}
                            error={form.formState.errors?.descripcion?.message as string}
                        >
                            {(field: any) => (
                                <Textarea
                                    placeholder="Descripción detallada del proyecto"
                                    className={styles.textareaDescription}
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
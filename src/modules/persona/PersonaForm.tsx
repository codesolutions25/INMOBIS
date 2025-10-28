"use client"

import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPersona, updatePersona } from "@/services/apiPersona"
import { Persona } from "@/types/persona"
import { useAlert } from "@/contexts/AlertContext"
import { useState } from "react"
import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { DialogContent } from "@/components/ui/dialog"
import { personaSchema } from "@/schemas/personaSchema"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"

type PersonaFormValues = z.infer<typeof personaSchema>

type TipoGenero = {
  id: number
  nombre: string
}

type TipoDocumento = {
  id: number
  nombre: string
}

type Props = {
  persona?: Persona
  onSuccess?: () => void
  closeModal: () => void
  tiposGenero: TipoGenero[]
  tiposDocumento: TipoDocumento[]
}

export default function PersonaForm({
  persona,
  onSuccess,
  closeModal,
  tiposGenero = [],
  tiposDocumento = []
}: Props) {
  const { showAlert } = useAlert()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = Boolean(persona?.idPersona)

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      idPersona: persona?.idPersona,
      nombre: persona?.nombre || "",
      apellidoPaterno: persona?.apellidoPaterno || "",
      apellidoMaterno: persona?.apellidoMaterno || "",
      idTipoGenero: persona?.idTipoGenero,
      id_tipo_documento: persona?.idTipoDocumento, // Fix field name to match API
      numeroDocumento: persona?.numeroDocumento || "",
      telefonoPrincipal: persona?.telefonoPrincipal || "",
      telefonoSecundario: persona?.telefonoSecundario || "",
      direccion: persona?.direccion || "",
      fechaNacimiento: persona?.fechaNacimiento
        ? persona.fechaNacimiento.split('T')[0] // Format date for input[type="date"]
        : "",
      correoElectronico: persona?.correoElectronico || "",
    }
  });

  const handleFormSubmit = async (data: PersonaFormValues) => {
    try {
      setIsLoading(true);

      // Transform data to match API's expected snake_case format
      const apiData = {
        nombre: data.nombre,
        apellido_paterno: data.apellidoPaterno,
        apellido_materno: data.apellidoMaterno,
        id_tipo_documento: Number(data.id_tipo_documento),
        numero_documento: data.numeroDocumento,
        telefono_principal: data.telefonoPrincipal,
        telefono_secundario: data.telefonoSecundario,
        direccion: data.direccion,
        fecha_nacimiento: data.fechaNacimiento
          ? new Date(data.fechaNacimiento).toISOString()
          : null,
        correo_electronico: data.correoElectronico,
        id_tipo_genero: Number(data.idTipoGenero)
      };

      if (isEditing && persona?.idPersona) {
        await updatePersona(persona.idPersona, apiData);
        showAlert('success', 'Éxito', 'Persona actualizada correctamente');
      } else {
        await createPersona(apiData);
        showAlert('success', 'Éxito', 'Persona creada correctamente');
      }

      if (onSuccess) onSuccess();
      closeModal();
    } catch (error) {
      console.error('Error al guardar persona:', error);
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

  const onSubmit = (data: PersonaFormValues) => {
    return handleFormSubmit(data)
  }

  // Convert arrays to Combobox options format
  // For document types
  const tipoDocumentoOptions = tiposDocumento
    ? Object.entries(tiposDocumento).map(([value, label]) => ({
      value,
      label
    }))
    : [];

  const tipoGeneroOptions = tiposGenero
    ? Object.entries(tiposGenero).map(([value, label]) => ({
      value,
      label
    }))
    : [];

  console.log('Tipos Documento:', tiposDocumento);
  console.log('Tipos Género:', tiposGenero);

  return (
    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
      <EntityForm<PersonaFormValues>
        title={`${isEditing ? 'Editar' : 'Nueva'} Persona`}
        titleClassName="text-xl font-semibold text-center text-[#0C4A6E] mb-6"
        form={form}
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        isEditing={isEditing}
        isSubmitting={isLoading}
        onCancel={closeModal}
        submitButtonText={isEditing ? "Actualizar" : "Crear"}
      >
        <div className="grid grid-cols-12 gap-4">
          {/* First Row - Nombres */}
          <div className="col-span-12 md:col-span-4">
            <FormFieldWrapper
              name="nombre"
              control={form.control}
              label="Nombres"
              error={form.formState.errors?.nombre?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  placeholder="Ingrese nombres"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormFieldWrapper
              name="apellidoPaterno"
              control={form.control}
              label="Apellido Paterno"
              error={form.formState.errors?.apellidoPaterno?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  placeholder="Apellido paterno"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormFieldWrapper
              name="apellidoMaterno"
              control={form.control}
              label="Apellido Materno"
              error={form.formState.errors?.apellidoMaterno?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  placeholder="Apellido materno"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          {/* Second Row - Documento */}
          <div className="col-span-12 md:col-span-6">
            <FormFieldWrapper
              name="id_tipo_documento"
              control={form.control}
              label="Tipo de Documento"
              error={form.formState.errors?.id_tipo_documento?.message}
            >
              {(field) => (
                <Combobox
                  options={tipoDocumentoOptions}
                  selected={field.value?.toString()}
                  onChange={(value) => field.onChange(Number(value))}
                  placeholder="Seleccionar tipo de documento"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          <div className="col-span-12 md:col-span-6 mt-1">
            <FormFieldWrapper
              name="numeroDocumento"
              control={form.control}
              label="Número de Documento"
              error={form.formState.errors?.numeroDocumento?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  placeholder="Número de documento"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          {/* Third Row - Contacto */}
          <div className="col-span-12 md:col-span-6">
            <FormFieldWrapper
              name="telefonoPrincipal"
              control={form.control}
              label="Teléfono Principal"
              error={form.formState.errors?.telefonoPrincipal?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  type="tel"
                  placeholder="Teléfono principal"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          <div className="col-span-12 md:col-span-6">
            <FormFieldWrapper
              name="telefonoSecundario"
              control={form.control}
              label="Teléfono Secundario (Opcional)"
              error={form.formState.errors?.telefonoSecundario?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  type="tel"
                  placeholder="Teléfono secundario"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          <div className="col-span-12">
            <FormFieldWrapper
              name="correoElectronico"
              control={form.control}
              label="Correo Electrónico"
              error={form.formState.errors?.correoElectronico?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          {/* Fourth Row - Fecha Nacimiento y Género */}
          <div className="col-span-12 md:col-span-6  mt-1">
            <FormFieldWrapper
              name="fechaNacimiento"
              control={form.control}
              label="Fecha de Nacimiento"
              error={form.formState.errors?.fechaNacimiento?.message}
            >
              {(field) => (
                <Input
                  type="date"
                  className={cn(
                    "w-full",
                    form.formState.errors?.fechaNacimiento && "border-red-500"
                  )}
                  max={new Date().toISOString().split('T')[0]}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          <div className="col-span-12 md:col-span-6">
            <FormFieldWrapper
              name="idTipoGenero"
              control={form.control}
              label="Género"
              error={form.formState.errors?.idTipoGenero?.message}
            >
              {(field) => (
                <Combobox
                  options={tipoGeneroOptions}
                  selected={field.value?.toString()}
                  onChange={(value) => field.onChange(Number(value))}
                  placeholder="Seleccionar género"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>

          {/* Fifth Row - Dirección */}
          <div className="col-span-12">
            <FormFieldWrapper
              name="direccion"
              control={form.control}
              label="Dirección"
              error={form.formState.errors?.direccion?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  placeholder="Dirección completa"
                  disabled={isLoading}
                />
              )}
            </FormFieldWrapper>
          </div>
        </div>
      </EntityForm>
    </DialogContent>
  )
}
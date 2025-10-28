"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import styles from './styles/ClienteForm.module.css';
import { parseDate } from '@/utils/dateUtils';
import { clienteSchema, ClienteFormValues } from '@/schemas/clienteSchema';
import { useState, useEffect } from 'react';
import { useAlert } from '@/contexts/AlertContext';
import { createPersona, updatePersona } from '@/services/apiPersona';
import { getTiposGenero } from '@/services/apiTipoGenero';
import axios from 'axios';

import { DialogContent } from '@/components/ui/dialog';
import EntityForm from '@/components/form/EntityForm';
import FormFieldWrapper from '@/components/form/FormFieldWrapper';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { TipoGenero } from '@/types/tipoGenero';

interface ClienteFormProps {
  initialData?: any;
  onSuccess?: (updatedClient: any) => void;
  closeModal: () => void;
}

export default function ClienteForm({ initialData, onSuccess, closeModal }: ClienteFormProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [tiposGenero, setTiposGenero] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      numeroDocumento: '',
      telefonoPrincipal: '',
      telefonoSecundario: '',
      direccion: '',
      correoElectronico: '',
      fechaNacimiento: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombre: initialData.nombre,
        apellidoPaterno: initialData.apellidoPaterno,
        apellidoMaterno: initialData.apellidoMaterno,
        id_tipo_documento: Number(initialData.idTipoDocumento),
        numeroDocumento: initialData.numeroDocumento,
        idTipoGenero: Number(initialData.idTipoGenero),
        telefonoPrincipal: initialData.telefonoPrincipal,
        telefonoSecundario: initialData.telefonoSecundario || '',
        correoElectronico: initialData.correoElectronico,
        direccion: initialData.direccion,
        fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : '',
      });
    }
  }, [initialData, form.reset]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialDataLoading(true);
      setLoading(true);
      try {
        const tipoDocumentoUrl = process.env.TIPO_DOCUMENTO_DNI_URL;
        if (tipoDocumentoUrl) {
          const documentoResponse = await axios.get(tipoDocumentoUrl);
          const documentoData = Array.isArray(documentoResponse.data) ? documentoResponse.data : documentoResponse.data.data;
          if (documentoData && documentoData.length > 0) {
            const documento = documentoData[0];
            const tipoDocumentoId = documento.id || documento.idTipoDocumento || documento.id_tipo_documento;
            if (tipoDocumentoId) {
              form.setValue('id_tipo_documento', tipoDocumentoId);
            } else {
              showAlert('error', 'Error de Configuración', "No se encontró un ID para el Tipo de Documento 'DNI'.");
              throw new Error("ID de Tipo Documento no encontrado.");
            }
          } else {
            showAlert('error', 'Error de Configuración', "No se pudo obtener el Tipo de Documento 'DNI'.");
            throw new Error("Respuesta de Tipo Documento vacía.");
          }
        }

        const generosResponse = await getTiposGenero(1, 100);
        const formattedGeneros = generosResponse.data.map((g: TipoGenero) => ({
          value: g.idTipoGenero.toString(),
          label: g.nombre,
        }));
        setTiposGenero(formattedGeneros);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        showAlert('error', 'Error', 'No se pudieron cargar los datos iniciales para el formulario.');
      } finally {
        setInitialDataLoading(false);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [showAlert]);

  const handleFormSubmit = async (data: ClienteFormValues) => {
    setLoading(true);
    try {
      let fechaISO: string | null = null;

      if (data.fechaNacimiento instanceof Date) {
        fechaISO = data.fechaNacimiento.toISOString();
      } else if (typeof data.fechaNacimiento === 'string') {
        fechaISO = parseDate(data.fechaNacimiento);
      }

      if (!fechaISO) {
        showAlert('error', 'Error de Validación', 'La fecha de nacimiento tiene un formato inválido.');
        setLoading(false);
        return;
      }

      const apiData = {
        nombre: data.nombre,
        apellido_paterno: data.apellidoPaterno,
        apellido_materno: data.apellidoMaterno,
        id_tipo_documento: data.id_tipo_documento,
        numero_documento: data.numeroDocumento,
        telefono_principal: data.telefonoPrincipal,
        telefono_secundario: data.telefonoSecundario,
        direccion: data.direccion,
        correo_electronico: data.correoElectronico,
        fecha_nacimiento: fechaISO,
        id_tipo_genero: Number(data.idTipoGenero),
      };

      let response;
      if (initialData) {
        response = await updatePersona(initialData.idPersona, apiData);
        showAlert('success', 'Éxito', 'Cliente actualizado correctamente');
      } else {
        response = await createPersona(apiData);
        showAlert('success', 'Éxito', 'Cliente registrado correctamente');
      }

      if (onSuccess) {
        onSuccess(response);
      }
      closeModal();
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      showAlert('error', 'Error', 'No se pudo registrar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className={styles.dialogContent}>
      <EntityForm
        title={initialData ? "Editar Cliente" : "Registrar Cliente"}
        form={form}
        onSubmit={handleFormSubmit as any}
        isEditing={!!initialData}
        isSubmitting={loading || initialDataLoading}
        onCancel={closeModal}
      >

        <div className={styles.formContainer}>
          {/* Fila 1: Nombre y Apellidos */}
          <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridThird}`}>
              <FormFieldWrapper name="nombre" label="Nombre" control={form.control} error={form.formState.errors.nombre?.message}>
                {(field) => <Input {...field} placeholder="Nombre del cliente" className={styles.inputField} onKeyPress={(e) => { if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key)) e.preventDefault(); }} />}
              </FormFieldWrapper>
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridThird}`}>
              <FormFieldWrapper name="apellidoPaterno" label="Apellido Paterno" control={form.control} error={form.formState.errors.apellidoPaterno?.message}>
                {(field) => <Input {...field} placeholder="Apellido paterno" className={styles.inputField} onKeyPress={(e) => { if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key)) e.preventDefault(); }} />}
              </FormFieldWrapper>
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridThird}`}>
              <FormFieldWrapper name="apellidoMaterno" label="Apellido Materno" control={form.control} error={form.formState.errors.apellidoMaterno?.message}>
                {(field) => <Input {...field} placeholder="Apellido materno" className={styles.inputField} onKeyPress={(e) => { if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key)) e.preventDefault(); }} />}
              </FormFieldWrapper>
            </div>
          </div>

          {/* Fila 2: Documento y Género */}
          <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
              <FormFieldWrapper name="numeroDocumento" label="N° de Documento (DNI)" control={form.control} error={form.formState.errors.numeroDocumento?.message}>
                {(field) => <Input {...field} type="text" placeholder="Número de DNI (8 dígitos)" maxLength={8} className={styles.inputField} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />}
              </FormFieldWrapper>
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
              <FormFieldWrapper name="idTipoGenero" label="Género" control={form.control} error={form.formState.errors.idTipoGenero?.message}>
                  {(field) => (
                      <Combobox
                          options={tiposGenero}
                          selected={field.value?.toString()}
                          onChange={(value) => field.onChange(Number(value))}
                          placeholder="Seleccionar género"
                          disabled={loading}
                      />
                  )}
              </FormFieldWrapper>
            </div>
          </div>

          {/* Fila 3: Teléfonos */}
          <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
              <FormFieldWrapper name="telefonoPrincipal" label="Teléfono Principal" control={form.control} error={form.formState.errors.telefonoPrincipal?.message}>
                {(field) => <Input {...field} type="tel" placeholder="Teléfono (9 dígitos)" maxLength={9} className={styles.inputField} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />}
              </FormFieldWrapper>
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
              <FormFieldWrapper name="telefonoSecundario" label="Teléfono Secundario (Opcional)" control={form.control} error={form.formState.errors.telefonoSecundario?.message}>
                {(field) => <Input {...field} type="tel" placeholder="Teléfono (9 dígitos)" maxLength={9} className={styles.inputField} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />}
              </FormFieldWrapper>
            </div>
          </div>

          {/* Fila 4: Dirección */}
          <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridFull}`}>
              <FormFieldWrapper name="direccion" label="Dirección" control={form.control} error={form.formState.errors.direccion?.message}>
                {(field) => <Input {...field} placeholder="Dirección detallada" className={styles.inputField} />}
              </FormFieldWrapper>
            </div>
          </div>

          {/* Fila 5: Correo y Fecha de Nacimiento */}
          <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
              <FormFieldWrapper name="correoElectronico" label="Email de contacto" control={form.control} error={form.formState.errors.correoElectronico?.message}>
                {(field) => <Input {...field} type="email" placeholder="Email de contacto" className={styles.inputField} />}
              </FormFieldWrapper>
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
              <FormFieldWrapper name="fechaNacimiento" label="Fecha de Nacimiento" control={form.control} error={form.formState.errors.fechaNacimiento?.message as string}>
                {(field) => <Input {...field} type="date" className={styles.inputField} />}
              </FormFieldWrapper>
            </div>
          </div>
        </div>
      </EntityForm>
    </DialogContent>
  );
}

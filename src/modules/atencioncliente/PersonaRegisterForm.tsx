import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getTiposGenero } from '@/services/apiTipoGenero';
import { createPersona, updatePersona } from '@/services/apiPersona';
import { toast } from 'sonner';
import { TipoGenero } from '@/types/tipoGenero';
import { Persona } from '@/types/persona';
import { Combobox } from '@/components/ui/combobox';
import styles from '@/modules/atencioncliente/styles/ClienteForm.module.css';

// Esquema de validación con Zod
export const formSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }),
  apellidoPaterno: z.string().min(1, { message: 'El apellido paterno es requerido' }),
  apellidoMaterno: z.string().min(1, { message: 'El apellido materno es requerido' }),
  numeroDocumento: z.string().min(8, { message: 'El DNI debe tener 8 dígitos' }).max(8, { message: 'El DNI debe tener 8 dígitos' }),
  idTipoDocumento: z.coerce.number({ invalid_type_error: 'El tipo de documento es requerido' }),
  idTipoGenero: z.coerce.number({ invalid_type_error: 'Debe seleccionar un género' }),
  telefonoPrincipal: z.string().min(9, { message: 'El teléfono debe tener 9 dígitos' }).max(9, { message: 'El teléfono debe tener 9 dígitos' }),
  telefonoSecundario: z.string().optional(),
  direccion: z.string().min(1, { message: 'La dirección es requerida' }),
  correoElectronico: z.string().email({ message: 'Email inválido' }),
  fechaNacimiento: z.string().min(1, { message: 'La fecha de nacimiento es requerida' })
});

export type PersonaFormValues = z.infer<typeof formSchema>;

export interface PersonaFormRef {
  submit: () => void;
  resetForm: () => void;
}

interface Props {
  onSuccess: (person: Persona) => void;
  onCancel: () => void;
  initialData?: Persona | null;
  isReadOnly?: boolean;
}

const PersonaRegisterForm = forwardRef<PersonaFormRef, Props>(({ onSuccess, onCancel, initialData, isReadOnly = false }, ref) => {
  const [tiposGenero, setTiposGenero] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      numeroDocumento: '',
      idTipoDocumento: 1,
      idTipoGenero: undefined,
      telefonoPrincipal: '',
      telefonoSecundario: '',
      direccion: '',
      correoElectronico: '',
      fechaNacimiento: '',
    },
  });

  useEffect(() => {
    // Si no hay datos iniciales o estamos en modo crear (initialData === null)
    // reseteamos todos los campos incluyendo género explícitamente
    if (!initialData) {
      const emptyValues = {
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        numeroDocumento: '',
        idTipoDocumento: 1,
        idTipoGenero: undefined, // Explícitamente undefined para resetear Combobox
        telefonoPrincipal: '',
        telefonoSecundario: '',
        direccion: '',
        correoElectronico: '',
        fechaNacimiento: '',
      };
      // Primero vaciamos el campo de género específicamente
      form.setValue('idTipoGenero', null as any); // Usar null como any para evitar error de tipado
      // Luego reseteamos todo el formulario
      form.reset(emptyValues);
    } else {
      // Si hay datos iniciales (modo editar/ver), los utilizamos
      const values = {
        ...initialData,
        idTipoDocumento: initialData.idTipoDocumento ?? 1,
        idTipoGenero: initialData.idTipoGenero ?? undefined,
        fechaNacimiento: initialData.fechaNacimiento ? initialData.fechaNacimiento.split('T')[0] : '',
      };
      form.reset(values);
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchTipos = async () => {
      setLoading(true);
      try {
        const generosResponse = await getTiposGenero(1, 100);
        const generos = generosResponse.data.map((g: TipoGenero) => ({ value: g.idTipoGenero.toString(), label: g.nombre }));
        setTiposGenero(generos);
      } catch (error) {
        console.error('Error al cargar tipos:', error);
        toast.error('No se pudieron cargar las opciones del formulario.');
      } finally {
        setLoading(false);
      }
    };
    fetchTipos();
  }, []);

  const onSubmit = async (values: PersonaFormValues) => {
    setLoading(true);
    try {
      const apiData = {
        nombre: values.nombre,
        apellido_paterno: values.apellidoPaterno,
        apellido_materno: values.apellidoMaterno,
        numero_documento: values.numeroDocumento,
        id_tipo_documento: values.idTipoDocumento,
        id_tipo_genero: values.idTipoGenero,
        telefono_principal: values.telefonoPrincipal,
        telefono_secundario: values.telefonoSecundario,
        direccion: values.direccion,
        correo_electronico: values.correoElectronico,
        fecha_nacimiento: new Date(values.fechaNacimiento).toISOString(),
      };

      let response;
      if (initialData) {
        response = await updatePersona(initialData.idPersona, apiData);
      } else {
        response = await createPersona(apiData);
      }
      onSuccess(response);
    } catch (error) {
      console.error('Error al guardar persona:', error);
      toast.error('Error al guardar la persona');
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Errores de validación:', errors);
    toast.error('Por favor, corrija los errores en el formulario.');
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit, onError)();
    },
    resetForm: () => {
      // Resetear el formulario a valores vacíos
      form.reset({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        numeroDocumento: '',
        idTipoDocumento: 1,
        idTipoGenero: undefined,  // Importante: resetear específicamente este campo
        telefonoPrincipal: '',
        telefonoSecundario: '',
        direccion: '',
        correoElectronico: '',
        fechaNacimiento: '',
      });
    }
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
        <h3 className="text-lg font-medium">{isReadOnly ? 'Detalles de la Persona' : (initialData ? 'Editar Persona' : 'Registrar Nueva Persona')}</h3>
        
        <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridThird}`}>
                <FormField control={form.control} name="nombre" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Nombre" disabled={loading || isReadOnly} onKeyPress={(e) => { if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key)) e.preventDefault(); }} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridThird}`}>
                <FormField control={form.control} name="apellidoPaterno" render={({ field }) => (<FormItem><FormLabel>Apellido Paterno</FormLabel><FormControl><Input {...field} placeholder="Apellido paterno" disabled={loading || isReadOnly} onKeyPress={(e) => { if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key)) e.preventDefault(); }} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridThird}`}>
                <FormField control={form.control} name="apellidoMaterno" render={({ field }) => (<FormItem><FormLabel>Apellido Materno</FormLabel><FormControl><Input {...field} placeholder="Apellido materno" disabled={loading || isReadOnly} onKeyPress={(e) => { if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key)) e.preventDefault(); }} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
                <FormField control={form.control} name="numeroDocumento" render={({ field }) => (<FormItem><FormLabel>N° de Documento (DNI)</FormLabel><FormControl><Input {...field} type="text" placeholder="Número de DNI (8 dígitos)" maxLength={8} disabled={loading || isReadOnly} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
                <FormField control={form.control} name="idTipoGenero" render={({ field }) => (<FormItem><FormLabel>Género</FormLabel><FormControl><Combobox options={tiposGenero} selected={field.value?.toString()} onChange={(value) => field.onChange(Number(value))} placeholder="Seleccionar género" disabled={loading || isReadOnly} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
                <FormField control={form.control} name="telefonoPrincipal" render={({ field }) => (<FormItem><FormLabel>Teléfono Principal</FormLabel><FormControl><Input {...field} type="tel" placeholder="Teléfono (9 dígitos)" maxLength={9} disabled={loading || isReadOnly} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
                <FormField control={form.control} name="telefonoSecundario" render={({ field }) => (<FormItem><FormLabel>Teléfono Secundario (Opcional)</FormLabel><FormControl><Input {...field} type="tel" placeholder="Teléfono (9 dígitos)" maxLength={9} disabled={loading || isReadOnly} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridFull}`}>
                <FormField control={form.control} name="direccion" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} placeholder="Dirección detallada" disabled={loading || isReadOnly} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div className={styles.grid}>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
                <FormField control={form.control} name="correoElectronico" render={({ field }) => (<FormItem><FormLabel>Email de contacto</FormLabel><FormControl><Input {...field} type="email" placeholder="Email de contacto" disabled={loading || isReadOnly} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className={`${styles.fieldContainer} ${styles.gridHalf}`}>
                <FormField control={form.control} name="fechaNacimiento" render={({ field }) => (<FormItem><FormLabel>Fecha de Nacimiento</FormLabel><FormControl><Input {...field} type="date" placeholder="YYYY-MM-DD" disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>


      </form>
    </Form>
  );
});

export default PersonaRegisterForm;

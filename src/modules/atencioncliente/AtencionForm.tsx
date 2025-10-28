"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { useAlert } from '@/contexts/AlertContext';
import { AtencionData, createAtencion, updateAtencion } from '@/services/apiAtencion';
import { getCanalesComunicacion } from '@/services/apiCanalesComunicacion';

// Esquema de validación para el formulario
const formSchema = z.object({
  idPersona: z.number().min(1, "La persona es requerida"),
  idEmpresa: z.number().min(1, "La empresa es requerida"),
  empresaUrl: z.string().optional(),
  idUsuario: z.number().min(1, "El usuario es requerido"),
  idCanal: z.number().min(1, "El canal de comunicación es requerido"),
  idTipoAtencion: z.number().min(1, "El tipo de atención es requerido"),
  idEstadoAtencion: z.number().min(1, "El estado de atención es requerido"),
  observaciones: z.string().min(1, "Las observaciones son requeridas"),
});

type FormValues = z.infer<typeof formSchema>;

interface AtencionFormProps {
  personaId?: number;
  tipoAtencion: 'cotizacion' | 'consulta' | 'reclamo';
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any | null;
}

const AtencionForm = ({ personaId, tipoAtencion, onSuccess, onCancel, initialData = null }: AtencionFormProps) => {
  const { showAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canales, setCanales] = useState<{ value: string; label: string }[]>([]);
  const [tipoAtencionId, setTipoAtencionId] = useState<number | null>(null);
  const [estadoAtencionId, setEstadoAtencionId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  const isEditMode = initialData !== null;

  // Verificar si estamos en la vista de detalles de un cliente
  const isClientSelected = personaId && personaId > 0;

  // Estado para almacenar el ID de la empresa Inmobis
  const [empresaId, setEmpresaId] = useState<number>(0);

  fetch('api/proxy?service=config&path=empresas&page=1&limit=1000')

  // Inicializar el formulario con valores por defecto
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idPersona: personaId,
      idEmpresa: empresaId,
      idUsuario: 1,
      idCanal: 0,
      idTipoAtencion: tipoAtencion === 'cotizacion' ? Number(process.env.TIPO_ATENCION_COTIZACION) : 
                     tipoAtencion === 'consulta' ? Number(process.env.TIPO_ATENCION_CONSULTA) : 
                     Number(process.env.TIPO_ATENCION_RECLAMO),
      idEstadoAtencion: 1,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      form.reset({
        idPersona: initialData.idPersona || personaId,
        idEmpresa: initialData.idEmpresa || empresaId,
        idUsuario: initialData.idUsuario || 1,
        idCanal: initialData.idCanal || initialData.id_canal || 0,
        idTipoAtencion: initialData.idTipoAtencion || initialData.id_tipo_atencion || 
                       (tipoAtencion === 'cotizacion' ? Number(process.env.TIPO_ATENCION_COTIZACION) : 
                        tipoAtencion === 'consulta' ? Number(process.env.TIPO_ATENCION_CONSULTA) : 
                        Number(process.env.TIPO_ATENCION_RECLAMO)),
        idEstadoAtencion: initialData.idEstadoAtencion || initialData.id_estado_atencion,
        observaciones: initialData.observaciones || '',
      });
    }
  }, [isEditMode, initialData, form, personaId, tipoAtencion]);

  // Función para obtener ID desde URL de búsqueda
  const getIdFromSearchUrl = async (searchUrl: string): Promise<number | null> => {
    try {
         
      // Verificar si es una URL de proxy directa
      if (searchUrl.includes('/api/proxy/')) {
        // Extraer el service de la URL
        const service = searchUrl.split('/api/proxy/')[1];
        if (!service) {
          throw new Error('Formato de URL de proxy inválido');
        }
        
        // Hacer la petición al proxy
        const response = await fetch(`/api/proxy/${service}`);
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Extraer los datos de la respuesta
        const data = responseData.data || responseData;
        
        if (Array.isArray(data) && data.length > 0) {
          // Si la respuesta es un array, tomar el primer elemento
          const item = data[0];
          return item.idEstadoAtencion || item.id_estado_atencion || item.id || null;
        } else if (data && typeof data === 'object') {
          // Si la respuesta es un objeto, buscar un array en sus propiedades
          const dataArray = Array.isArray(data.data) ? data.data :
                          Array.isArray(data.items) ? data.items :
                          Array.isArray(data.results) ? data.results : [];
                          
          if (dataArray.length > 0) {
            const item = dataArray[0];
            return item.idEstadoAtencion || item.id_estado_atencion || item.id || null;
          }
        }
        
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener ID desde URL de búsqueda:', error);
      return null;
    }
  };

  // Función para obtener el ID y URL de la empresa
  const fetchEmpresaId = async () => {
    try {
      const response = await axios.get('/api/proxy?service=config&path=empresas');
      let id = null;
      let empresaUrl = '';
      
      // Manejar diferentes formatos de respuesta
      const data = response.data?.data || response.data?.items || response.data?.results || response.data || [];
      
      if (Array.isArray(data) && data.length > 0) {
        const empresa = data[0]; // Tomar la primera empresa
        id = empresa.idEmpresa || empresa.id_empresa || empresa.id;
        empresaUrl = empresa.url || empresa.website || '';
      }
      
      if (id) {
        setEmpresaId(id);
        form.setValue('idEmpresa', id);
        
        // Actualizar la URL de la empresa en el estado si está disponible
        if (empresaUrl) {
          form.setValue('empresaUrl', empresaUrl);
        }
      } else {
        console.warn('No se pudo obtener los datos de la empresa');
      }
    } catch (error) {
      console.error('Error al cargar los datos de la empresa:', error);
    }
  };

  // Probar conexión con el servidor
  const checkServerConnection = async () => {
    try {
      // Intentar una conexión simple para verificar que el servidor está disponible
      await axios.head(process.env.ATENCION_SERVICE_URL || '');
    } catch (error) {
      if (isMounted) {
        showAlert('warning', 'Advertencia', 'No se pudo conectar con el servidor. Es posible que los datos no se guarden correctamente.');
      }
    }
  };

  // Función para obtener el ID del canal presencial
  const fetchCanalPresencial = async (): Promise<number | null> => {
    try {
      const canalUrl = 'api/proxy?service=canales_comunicacion_presencial_url';
      if (!canalUrl) {
        console.error('URL de canal presencial no definida');
        return null;
      }
      
      const response = await axios.get(canalUrl);
      let id = null;
      
      if (response.data && Array.isArray(response.data)) {
        // Si la respuesta es un array
        if (response.data.length > 0) {
          const item = response.data[0];
          id = item.idCanal || item.id_canal || item.id;
        }
      } else if (response.data && typeof response.data === 'object') {
        // Si la respuesta es un objeto con una propiedad data que es un array
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          const item = response.data.data[0];
          id = item.idCanal || item.id_canal || item.id;
        }
      }
      
      if (id) {
        console.log('ID de canal presencial cargado:', id);
        return id;
      } else {
        console.warn('No se pudo obtener el ID del canal presencial');
        return null;
      }
    } catch (error) {
      console.error('Error al cargar el ID del canal presencial:', error);
      return null;
    }
  };

  // Cargar los canales de comunicación
  useEffect(() => {
    setIsMounted(true);
    fetchEmpresaId(); // Cargar el ID de la empresa
    checkServerConnection(); // Verificar conexión con el servidor
    
    // Si es cotización, cargar el canal presencial
    if (tipoAtencion === 'cotizacion') {
      const setCanalPresencial = async () => {
        const canalId = await fetchCanalPresencial();
        if (canalId) {
          form.setValue('idCanal', canalId);
        }
      };
      setCanalPresencial();
    }
    
    const fetchCanales = async () => {
      try {
        const response = await getCanalesComunicacion();
        if (response && Array.isArray(response.data)) {
          const options = response.data.map((canal: any) => ({
            value: String(canal.idCanal),
            label: canal.nombre || 'Canal sin nombre',
          }));
          setCanales(options);
        } else {
          // Datos de ejemplo en caso de error
          setCanales([
            { value: "1", label: "Teléfono" },
            { value: "2", label: "Email" },
            { value: "3", label: "Presencial" },
            { value: "4", label: "WhatsApp" },
          ]);
        }
      } catch (error) {
        if (isMounted && !errorShown) {
          showAlert('error', 'Error', 'No se pudieron cargar los canales de comunicación');
          setErrorShown(true);
        }
        // Datos de ejemplo en caso de error
        setCanales([
          { value: "1", label: "Teléfono" },
          { value: "2", label: "Email" },
          { value: "3", label: "Presencial" },
          { value: "4", label: "WhatsApp" },
        ]);
      }
    };

    const fetchTipoAtencion = async () => {
      try {
        // Determinar qué endpoint del proxy usar según el tipo de atención
        let proxyEndpoint = '';
        
        if (tipoAtencion === 'cotizacion') {
          proxyEndpoint = 'tipo_atencion_cotizacion_url';
        } else if (tipoAtencion === 'consulta') {
          proxyEndpoint = 'tipo_atencion_consulta_url';
        } else {
          proxyEndpoint = 'tipo_atencion_reclamo_url';
        }
        
        // Hacer la petición al endpoint del proxy
        const response = await axios.get(`/api/proxy?service=${proxyEndpoint}`);
        
        // Verificar si se recibió una respuesta válida
        if (!response || !response.data) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        // Procesar la respuesta para obtener el ID del tipo de atención
        let id = null;
        
        if (response.data && Array.isArray(response.data)) {
          // Si la respuesta es un array
          if (response.data.length > 0) {
            const item = response.data[0];
            id = item.idTipoAtencion || item.id_tipo_atencion || item.id;
          }
        } else if (response.data && typeof response.data === 'object') {
          // Si la respuesta es un objeto con una propiedad data que es un array
          if (Array.isArray(response.data.data) && response.data.data.length > 0) {
            const item = response.data.data[0];
            id = item.idTipoAtencion || item.id_tipo_atencion || item.id;
          }
        }
        
        if (id) {
          setTipoAtencionId(id);
          form.setValue('idTipoAtencion', id);
        } else {
          // Valores por defecto en caso de error
          let defaultId;
          if (tipoAtencion === 'cotizacion') {
            defaultId = 1; // ID por defecto para cotización
          } else if (tipoAtencion === 'consulta') {
            defaultId = 2; // ID por defecto para consulta
          } else {
            defaultId = 3; // ID por defecto para reclamo
          }
          
          console.warn(`No se pudo obtener ID para tipo de atención '${tipoAtencion}', usando valor por defecto:`, defaultId);
          setTipoAtencionId(defaultId);
          form.setValue('idTipoAtencion', defaultId);
        }
      } catch (error) {
        console.error(`Error al cargar el tipo de atención '${tipoAtencion}':`, error);
        
        // Valores por defecto en caso de error
        let defaultId;
        if (tipoAtencion === 'cotizacion') {
          defaultId = 1; // ID por defecto para cotización
        } else if (tipoAtencion === 'consulta') {
          defaultId = 2; // ID por defecto para consulta
        } else {
          defaultId = 3; // ID por defecto para reclamo
        }
        
        console.warn(`Usando valor por defecto para tipo de atención '${tipoAtencion}':`, defaultId);
        setTipoAtencionId(defaultId);
        form.setValue('idTipoAtencion', defaultId);
      }
    };

    const fetchEstadoAtencion = async () => {
      try {
        // Obtener el ID del estado de atención según el tipo
        let searchUrl;
        
        if (tipoAtencion === 'cotizacion') {
          searchUrl = '/api/proxy?service=estado_atencion_en_curso_url';
        } else if (tipoAtencion === 'consulta') {
          searchUrl = '/api/proxy?service=estado_atencion_consulta_url';
        } else {
          searchUrl = '/api/proxy?service=estado_atencion_reclamo_url';
        }
        
        if (!searchUrl) {
          console.error('URL de búsqueda no definida para el estado de atención');
          return;
        }

        const id = await getIdFromSearchUrl(searchUrl);
        if (id) {
          setEstadoAtencionId(id);
          form.setValue('idEstadoAtencion', id);
        }
      } catch (error) {
        console.error('Error al cargar el estado de atención:', error);
      }
    };

    checkServerConnection();
    fetchCanales();
    fetchTipoAtencion();
    fetchEstadoAtencion();

    return () => {
      setIsMounted(false);
    };
  }, [tipoAtencion]);

  const onSubmit = async (data: FormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const tipoId = tipoAtencionId || form.getValues('idTipoAtencion');
      const estadoId = estadoAtencionId || form.getValues('idEstadoAtencion');

      if (!tipoId) {
        showAlert('error', 'Error', 'El tipo de atención no se ha cargado correctamente.');
        setIsSubmitting(false);
        return;
      }

      if (!estadoId) {
        showAlert('error', 'Error', 'El estado de atención no se ha cargado correctamente.');
        setIsSubmitting(false);
        return;
      }

      const formData: AtencionData = {
        ...data,
        idTipoAtencion: Number(tipoId),
        idEstadoAtencion: Number(estadoId),
      };

      if (isEditMode) {
        const atencionId = initialData?.idAtencion || initialData?.id_atencion;
        if (!atencionId) {
          showAlert('error', 'Error', 'No se encontró el ID de la atención para actualizar.');
          setIsSubmitting(false);
          return;
        }
        const updatedValues = {
          id_persona: formData.idPersona,
          id_empresa: formData.idEmpresa,
          id_usuario: formData.idUsuario,
          id_canal: formData.idCanal,
          id_tipo_atencion: formData.idTipoAtencion,
          id_estado_atencion: formData.idEstadoAtencion,
          observaciones: formData.observaciones
        };
        await updateAtencion(atencionId, updatedValues);
      } else {
        await createAtencion(formData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error al enviar el formulario:', error);
      showAlert('error', 'Error', error.message || 'Ocurrió un error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isEditMode 
          ? `Editar ${tipoAtencion === 'cotizacion' ? 'Cotización' : tipoAtencion === 'consulta' ? 'Consulta' : 'Reclamo'}` 
          : `Nueva ${tipoAtencion === 'cotizacion' ? 'Cotización' : tipoAtencion === 'consulta' ? 'Consulta' : 'Reclamo'}`}
      </h2>
      
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            form.handleSubmit((data) => {
              onSubmit(data);
            })(e);
          }} 
          className="space-y-6"
        >
          {/* Mostrar selector de canal solo si NO es cotización */}
          {tipoAtencion !== 'cotizacion' && (
            <div className="w-full">
              <FormField
                control={form.control}
                name="idCanal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal de Comunicación</FormLabel>
                    <FormControl>
                      <Combobox
                        options={canales}
                        selected={field.value ? field.value.toString() : ""}
                        onChange={(value) => {
                          field.onChange(Number(value));
                        }}
                        placeholder="Seleccione un canal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingrese las observaciones de la atención" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              disabled={isSubmitting}
              onClick={() => {
                
                // Verificar campos requeridos manualmente
                const values = form.getValues();
                let hasError = false;
                console.log(values);
                if (!values.idCanal || values.idCanal === 0) {
                  form.setError('idCanal', { type: 'manual', message: 'Debe seleccionar un canal' });
                  hasError = true;
                }
                
                if (hasError) {
                  showAlert('error', 'Error', 'Por favor complete todos los campos requeridos');
                  return;
                }
                
                // Si no hay errores, enviar el formulario manualmente
                form.handleSubmit(onSubmit)();
              }}
            >
              {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Guardar')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AtencionForm;

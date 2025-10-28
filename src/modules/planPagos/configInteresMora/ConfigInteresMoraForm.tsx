"use client"

import { useForm, FormProvider, SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAlert } from "@/contexts/AlertContext"
import { Combobox } from "@/components/ui/combobox"
import { ConfigInteresMora } from "@/modules/planPagos/models/planPagosModels"
import { configInteresMoraSchema } from "@/schemas/ConfigInteresMoraSchema"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { DialogContent, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import PlanPagosApi from "@/modules/planPagos/services/PlanPagosApi"
import { useCompany } from "@/contexts/CompanyContext"

// Define the form values type
type ConfigInteresMoraFormValues = {
  idConfigInteresMora?: number;
  idEmpresa: number;
  montoFijo: string; // string for form handling
  aplicaDesdeDia: string;
  aplicaHastaDia: string;
}

type Empresa = {
  id: number;
  nombre: string;
}

type ConfigInteresMoraFormProps = {
  configuracion?: ConfigInteresMora
  onSuccess?: () => void
  closeModal?: () => void
  empresas: Empresa[]
  tiposConfiguracion: Array<{ id: number; nombre: string }>
}

export default function ConfigInteresMoraForm({ configuracion, onSuccess, closeModal, empresas, tiposConfiguracion }: ConfigInteresMoraFormProps) {
  const isEditing = !!configuracion
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  
  console.log('Empresas en el form:', empresas);
  console.log('Configuración actual:', configuracion);

  const { selectedCompany } = useCompany();
  
  // Asegurarse de que la empresa seleccionada existe en la lista de empresas
  const getValidCompanyId = () => {
    // Si estamos editando y hay una configuración con empresa, usamos ese ID
    if (configuracion?.idEmpresa) {
      const empresaExists = empresas.some(e => e.id === configuracion.idEmpresa);
      if (empresaExists) {
        return configuracion.idEmpresa;
      }
    }
    
    // Si hay una empresa seleccionada en el contexto, la usamos
    if (selectedCompany?.idEmpresa) {
      const empresaExists = empresas.some(e => e.id === selectedCompany.idEmpresa);
      if (empresaExists) {
        return selectedCompany.idEmpresa;
      }
    }
    
    // Si no hay empresa válida, devolvemos undefined
    return undefined;
  };

  // Get valid company ID
  const initialCompanyId = getValidCompanyId();
  console.log('ID de empresa inicial:', initialCompanyId);
  
  // Set initial values
  const initialValues = {
    idEmpresa: initialCompanyId,
    montoFijo: configuracion?.montoFijo?.toString() || '0',
    aplicaDesdeDia: configuracion?.aplicaDesdeDia ? configuracion.aplicaDesdeDia.split('T')[0] : '',
    aplicaHastaDia: configuracion?.aplicaHastaDia ? configuracion.aplicaHastaDia.split('T')[0] : '',
    ...(configuracion?.idConfigInteresMora && { idConfigInteresMora: configuracion.idConfigInteresMora })
  };
  
  console.log('=== Initial Form Values ===', initialValues);
  console.log('Empresas disponibles:', empresas);
  
  const form = useForm<ConfigInteresMoraFormValues>({
    resolver: zodResolver(configInteresMoraSchema as any),
    defaultValues: initialValues,
    mode: 'onChange',
    reValidateMode: 'onChange'
  });
  
  // Log form values when they change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.group('=== Form Value Changed ===');
      console.log('Campo modificado:', name);
      console.log('Nuevo valor:', value);
      console.log('Tipo de cambio:', type);
      console.log('Valor actual de idEmpresa:', form.getValues('idEmpresa'));
      console.groupEnd();
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const formValuesToDto = (values: ConfigInteresMoraFormValues): Omit<ConfigInteresMora, 'idConfigInteresMora'> => {
    console.group('=== formValuesToDto ===');
    try {
      console.log('Valores del formulario:', values);
      
      // Obtener el valor actual del formulario para depuración
      const formState = form.getValues();
      console.log('Estado actual del formulario:', formState);
      
      // Validar que existe idEmpresa
      if (values.idEmpresa === undefined || values.idEmpresa === null) {
        throw new Error('No se ha seleccionado ninguna empresa');
      }
      
      // Convertir idEmpresa a número
      const idEmpresa = Number(values.idEmpresa);
      if (isNaN(idEmpresa) || idEmpresa <= 0) {
        throw new Error('El ID de la empresa no es válido');
      }
      
      // Validar fechas
      const fechaDesde = new Date(values.aplicaDesdeDia);
      const fechaHasta = new Date(values.aplicaHastaDia);
      
      if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
        throw new Error('Las fechas ingresadas no son válidas');
      }
      
      // Validar que la fecha de inicio sea menor o igual a la fecha de fin
      if (fechaDesde > fechaHasta) {
        throw new Error('La fecha de inicio debe ser menor o igual a la fecha de fin');
      }
      
      // Convertir monto a número
      const montoFijo = parseFloat(values.montoFijo) || 0;
      
      console.log('Datos validados:', {
        idEmpresa,
        montoFijo,
        fechaDesde: fechaDesde.toISOString(),
        fechaHasta: fechaHasta.toISOString()
      });
      
      // Crear el objeto DTO con los nombres de campos que espera el backend
      const dto = {
        idEmpresa,
        idTipoConfigFinanciera: 1, // Valor fijo para el tipo de configuración
        montoFijo,
        aplicaDesdeDia: fechaDesde.toISOString(),
        aplicaHastaDia: fechaHasta.toISOString()
      };
      
      console.log('DTO a enviar al servidor:', dto);
      return dto;
      
    } catch (error) {
      console.error('Error en formValuesToDto:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  const onSubmit: SubmitHandler<ConfigInteresMoraFormValues> = async (formData) => {
    console.group('=== onSubmit ===');
    try {
      setLoading(true);
      
      console.log('1. Datos del formulario recibidos:', formData);
      console.log('2. Valores actuales del formulario:', form.getValues());
      console.log('3. Errores del formulario:', form.formState.errors);
      
      // Validar que las fechas sean válidas
      const fechaDesde = new Date(formData.aplicaDesdeDia);
      const fechaHasta = new Date(formData.aplicaHastaDia);
      
      console.log('4. Fechas procesadas:', { fechaDesde, fechaHasta });
      
      if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
        console.error('Error: Fechas inválidas', { fechaDesde, fechaHasta });
        throw new Error('Las fechas ingresadas no son válidas');
      }
      
      if (fechaDesde > fechaHasta) {
        console.error('Error: Fecha inicio mayor que fecha fin', { fechaDesde, fechaHasta });
        throw new Error('La fecha de inicio debe ser menor o igual a la fecha de fin');
      }
      
      console.log('5. Llamando a formValuesToDto...');
      const dto = formValuesToDto(formData);
      console.log('6. DTO generado:', dto);
      
      if (isEditing && configuracion?.idConfigInteresMora) {
        console.log('7. Actualizando configuración existente con ID:', configuracion.idConfigInteresMora);
        console.log('8. DTO a enviar a la API:', dto);
        await PlanPagosApi.configInteresMoraController.updateConfigInteresMora(
          configuracion.idConfigInteresMora,
          dto
        );
        console.log('5. Configuración actualizada exitosamente');
        showAlert("success", "Éxito", "Configuración actualizada correctamente");
      } else {
        console.log('4. Creando nueva configuración...');
        await PlanPagosApi.configInteresMoraController.createConfigInteresMora(dto);
        console.log('5. Configuración creada exitosamente');
        showAlert("success", "Éxito", "Configuración creada correctamente");
      }
      
      onSuccess?.();
      closeModal?.();
      console.groupEnd();
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      showAlert("error", "Error", "No se pudo guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogTitle>{isEditing ? 'Editar' : 'Nueva'} Configuración de Interés por Mora</DialogTitle>
      <DialogDesc>
        {isEditing ? 'Modifica los campos necesarios' : 'Completa los campos para crear una nueva configuración'}
      </DialogDesc>

      <div className="space-y-4">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="idEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    {isEditing ? (
                      <div className="flex h-10 items-center px-3 py-2 text-sm border rounded-md bg-muted/50">
                        {empresas.find(e => e.id === field.value)?.nombre || 'Empresa no encontrada'}
                      </div>
                    ) : (
                      <div>
                        <div className="space-y-2">
                          
                          
                          <Combobox
                            options={empresas.map(empresa => {
                                 return {
                                label: empresa.nombre,
                                value: empresa.id.toString()
                              };
                            })}
                            placeholder="Seleccione una empresa"
                            selected={field.value ? field.value.toString() : ''}
                            onChange={async (value) => {
                              console.group('=== Combobox onChange ===');
                              try {
                                console.log('Valor seleccionado (string):', value);
                                
                                // Convertir a número (si hay valor) o mantener como 0 (será manejado por la validación)
                                const newValue = value === '' ? 0 : Number(value);
                                console.log('Nuevo valor a establecer (convertido a número):', newValue);
                                
                                // Actualizar el valor del campo
                                field.onChange(newValue);
                                
                                // Actualizar también el valor en el formulario para asegurar consistencia
                                form.setValue('idEmpresa', newValue, { shouldValidate: true, shouldDirty: true });
                                
                                // Forzar validación del campo
                                await form.trigger('idEmpresa');
                                
                                // Verificar el valor después de la actualización
                                const currentValue = form.getValues('idEmpresa');
                                console.log('Valor actual en el formulario (después de setValue):', currentValue);
                                
                                // Verificar si el valor se estableció correctamente
                                if (!currentValue || currentValue === 0) {
                                  console.warn('El valor de idEmpresa no es válido después de la actualización');
                                }
                                
                                // Verificar el estado del formulario completo
                                console.log('Estado completo del formulario después de actualizar:', form.getValues());
                              } catch (error) {
                                console.error('Error en onChange del Combobox:', error);
                              } finally {
                                console.groupEnd();
                              }
                            }}
                          />
                          
                          {!field.value && (
                            <p className="text-xs text-red-500">
                              Debe seleccionar una empresa
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="montoFijo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Fijo (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aplicaDesdeDia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aplicaHastaDia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </DialogContent>
  )
}
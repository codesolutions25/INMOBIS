# Guía de Implementación de Módulos CRUD

Esta guía explica cómo implementar nuevos módulos CRUD utilizando los componentes estandarizados desarrollados para el proyecto Inmobis.

## Índice

1. [Estructura de Carpetas](#estructura-de-carpetas)
2. [Componentes Reutilizables](#componentes-reutilizables)
3. [Implementación de un Nuevo Módulo](#implementación-de-un-nuevo-módulo)
4. [Ejemplo Práctico: Módulo de Propiedades](#ejemplo-práctico-módulo-de-propiedades)
5. [Mejores Prácticas](#mejores-prácticas)

## Estructura de Carpetas

Para cada nuevo módulo, se recomienda seguir esta estructura de carpetas:

```
src/modules/[nombre-modulo]/
  ├── [NombreModulo]List.tsx      # Componente principal que muestra la tabla
  ├── [NombreModulo]Form.tsx      # Formulario para crear/editar
  ├── [NombreModulo]Detalle.tsx   # Vista detallada
  ├── columns.tsx                 # Definición de columnas para la tabla
  └── api.ts                      # Funciones para interactuar con la API
```

## Componentes Reutilizables

### 1. ModalContainer

Este componente permite gestionar modales de forma eficiente, evitando renderizados innecesarios.

**Ubicación:** `src/components/modal/ModalContainer.tsx`

**Uso básico:**

```tsx
import { useModalContainer } from "@/components/modal/ModalContainer";

export default function MiComponente() {
  // Obtener funciones y componente del hook
  const {
    openModal,     // Función para abrir el modal y establecer su contenido en una operación
    closeModal,    // Función para cerrar el modal
    ModalContainer // Componente que debe incluirse en el JSX
  } = useModalContainer();
  
  // Abrir modal con contenido
  const handleOpenModal = () => {
    openModal(
      <MiFormulario 
        onSuccess={handleSuccess} 
        closeModal={closeModal}
      />
    );
  };
  
  return (
    <>
      <button onClick={handleOpenModal}>Abrir Modal</button>
      
      {/* Importante: incluir el componente ModalContainer */}
      <ModalContainer />
    </>
  );
}
```

### 2. EntityDetailView

Este componente permite crear vistas detalladas con un diseño estandarizado.

**Ubicación:** `src/components/detail/EntityDetailView.tsx`

**Uso básico:**

```tsx
import EntityDetailView from "@/components/detail/EntityDetailView";
import { IconName } from 'lucide-react';

// Definir información principal
const mainInfoItems = [
  {
    icon: <IconName className="h-4 w-4 text-gray-500" />,
    label: "Campo",
    value: entidad.campo
  },
  // Más campos...
];

// Definir secciones
const sections = [
  {
    title: "Título Sección",
    icon: <IconName className="h-5 w-5 text-primary" />,
    content: <div>Contenido personalizado...</div>
  },
  // Más secciones...
];

// Usar el componente
return (
  <EntityDetailView
    title="Título del Detalle"
    titleIcon={<IconName className="h-5 w-5 text-primary" />}
    mainInfoItems={mainInfoItems}
    sections={sections}
  />
);
```

### 2. EntityForm

Este componente permite crear formularios con un diseño estandarizado.

**Ubicación:** `src/components/form/EntityForm.tsx`

**Uso básico:**

```tsx
import EntityForm from "@/components/form/EntityForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Esquema de validación
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  // Más campos...
});

type FormValues = z.infer<typeof formSchema>;

// Configurar formulario
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    nombre: entidad?.nombre || "",
    // Más campos...
  },
});

// Función de envío
const handleSubmit = async () => {
  // Lógica para guardar datos
};

// Usar el componente
return (
  <EntityForm
    title="Crear Entidad"
    form={form}
    onSubmit={handleSubmit}
    isEditing={false}
    onCancel={() => setShowModalContainer(false)}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="nombre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Más campos... */}
    </div>
  </EntityForm>
);
```

### 3. Formateadores para columnas

Conjunto de funciones para formatear datos en las columnas de las tablas.

**Ubicación:** `src/components/table/createEntityColumns.tsx`

**Formateadores disponibles:**

```tsx
import { formatters } from "@/components/table/createEntityColumns";

// Ejemplos de uso:
formatters.currency(1000);       // Formatea como S/ 1,000.00
formatters.area(100);            // Formatea como "100 m²"
formatters.boolean(true);        // Formatea como "Sí" con fondo verde
formatters.date("2023-01-01");   // Formatea como fecha localizada
formatters.status("activo", {    // Formatea como estado con color
  activo: { label: "Activo", color: "green" },
  inactivo: { label: "Inactivo", color: "red" }
});
```

## Implementación de un Nuevo Módulo

### Paso 1: Crear el componente de lista

1. Crea un archivo `[NombreModulo]List.tsx` que contenga:
   - Estado para los datos y funciones para cargarlos
   - Funciones para manejar acciones (ver, editar, eliminar)
   - Componente `Datatable` con las columnas definidas
   - Modal para formularios y detalles

```tsx
"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import Datatable from "@/components/table/datatable";
import { Button } from '@/components/ui/button';
import { useAlert } from "@/contexts/AlertContext";
import { getEntidades, deleteEntidad } from "@/services/apiEntidades";
import { getEntidadesColumns } from "./columns";
import EntidadForm from "./EntidadForm";
import EntidadDetalle from "./EntidadDetalle";
import { Entidad } from "@/types/entidades";

export default function EntidadesList() {
  // Modal - Usar las nuevas funciones optimizadas
  const { 
    openModal,
    closeModal,
    ModalContainer 
  } = useModalContainer();
  
  // Alertas
  const { showAlert } = useAlert();
  
  // Estado
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Cargar datos
  useEffect(() => {
    const fetchEntidades = async () => {
      try {
        const data = await getEntidades();
        setEntidades(data);
      } catch (error) {
        console.error('Error al cargar entidades:', error);
        showAlert('error', 'Error', 'Error al cargar la lista de entidades');
      }
    };
    
    fetchEntidades();
  }, [refreshTrigger, showAlert]);
  
  // Función para refrescar la lista
  const refreshList = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Acciones de fila
  const onView = useCallback((entidad: Entidad) => {
    // Usar openModal para abrir el modal y establecer su contenido en una sola operación
    openModal(<EntidadDetalle entidad={entidad} />);
  }, [openModal]);
  
  const onEdit = useCallback((entidad: Entidad) => {
    // Usar openModal para abrir el modal y establecer su contenido en una sola operación
    openModal(
      <EntidadForm 
        entidad={entidad}
        onSuccess={refreshList}
        closeModal={closeModal} // Pasar la función closeModal en lugar de setShowModalContainer
      />
    );
  }, [openModal, closeModal, refreshList]);
  
  const onDelete = useCallback((entidad: Entidad) => {
    // Implementar confirmación y eliminación
  }, []);
  
  // Columnas
  const columns = useMemo(() => getEntidadesColumns({ onView, onEdit, onDelete }), [onView, onEdit, onDelete]);
  
  return (
    <>
      <AdminCardLayout>
        <AdminCardLayout.Title>
          <div className="flex justify-between">
            Lista de entidades
            <Button
              onClick={() => {
                setModalContent(
                  <EntidadForm 
                    onSuccess={refreshList} 
                    setShowModalContainer={setShowModalContainer}
                  />
                );
                setShowModalContainer(true);
              }}
              variant="default"
            >
              Registrar
            </Button>
          </div>
        </AdminCardLayout.Title>
        <AdminCardLayout.Content>
          <Datatable data={entidades} columns={columns} />
        </AdminCardLayout.Content>
      </AdminCardLayout>
      
      <ModalContainer />
    </>
  );
}
```

### Paso 2: Definir las columnas

Crea un archivo `columns.tsx` que defina las columnas para la tabla:

```tsx
"use client"

import { ColumnDef } from "@tanstack/react-table";
import { Entidad } from "@/types/entidades";
import DatatableRowActions from "@/components/table/row-actions";
import { formatters } from "@/components/table/createEntityColumns";

export interface EntidadActionsProps {
  onView?: (entidad: Entidad) => void;
  onEdit?: (entidad: Entidad) => void;
  onDelete?: (entidad: Entidad) => void;
}

export const getEntidadesColumns = ({
  onView,
  onEdit,
  onDelete,
}: EntidadActionsProps): ColumnDef<Entidad>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  // Más columnas...
  {
    accessorKey: "precio",
    header: "Precio",
    cell: ({ row }) => formatters.currency(parseFloat(row.getValue("precio"))),
  },
  // Columna de acciones
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <DatatableRowActions
        row={row}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
];
```

### Paso 3: Crear el componente de detalle

Crea un archivo `[NombreModulo]Detalle.tsx` utilizando el componente `EntityDetailView`:

```tsx
"use client"

import { Entidad } from "@/types/entidades";
import EntityDetailView from "@/components/detail/EntityDetailView";
import { Home, Tag, MapPin, DollarSign } from 'lucide-react';

type EntidadDetalleProps = {
  entidad: Entidad;
};

export default function EntidadDetalle({ entidad }: EntidadDetalleProps) {
  // Información principal
  const mainInfoItems = [
    {
      icon: <Tag className="h-4 w-4 text-gray-500" />,
      label: "ID",
      value: entidad.id
    },
    {
      icon: <Home className="h-4 w-4 text-gray-500" />,
      label: "Nombre",
      value: <span className="font-medium text-blue-700">{entidad.nombre}</span>
    },
    // Más campos...
  ];
  
  // Secciones
  const sections = [
    {
      title: "Características",
      icon: <Home className="h-5 w-5 text-primary" />,
      content: (
        <div className="space-y-3">
          {/* Contenido de características */}
        </div>
      )
    },
    {
      title: "Información Financiera",
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      content: (
        <div>
          {/* Contenido financiero */}
        </div>
      )
    },
    // Más secciones...
  ];
  
  return (
    <EntityDetailView
      title="Detalles de la Entidad"
      titleIcon={<Home className="h-5 w-5 text-primary" />}
      mainInfoItems={mainInfoItems}
      sections={sections}
    />
  );
}
```

### Paso 4: Crear el formulario

Crea un archivo `[NombreModulo]Form.tsx` para crear/editar registros utilizando el componente `EntityForm`:

```tsx
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/contexts/AlertContext";
import { createEntidad, updateEntidad } from "@/services/apiEntidades";
import { Entidad } from "@/types/entidades";
import EntityForm from "@/components/form/EntityForm";

// Esquema de validación
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  // Más campos...
});

type FormValues = z.infer<typeof formSchema>;

type EntidadFormProps = {
  entidad?: Entidad;
  onSuccess?: () => void;
  setShowModalContainer?: (show: boolean) => void; // Para compatibilidad con código existente
  closeModal?: () => void; // Método preferido para cerrar el modal
};

export default function EntidadForm({ entidad, onSuccess, setShowModalContainer }: EntidadFormProps) {
  const isEditing = !!entidad;
  const { showAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Configurar formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: entidad?.nombre || "",
      // Más campos...
    },
  });
  
  // Manejar envío
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const values = form.getValues();
      
      const payload = {
        // Convertir valores si es necesario
        nombre: values.nombre,
        // Más campos...
      };
      
      if (isEditing && entidad?.id) {
        await updateEntidad(entidad.id, payload);
        showAlert("success", "Éxito", "Entidad actualizada correctamente");
      } else {
        await createEntidad(payload);
        showAlert("success", "Éxito", "Entidad creada correctamente");
      }
      
      if (onSuccess) onSuccess();
      // Cerrar el modal usando closeModal si está disponible, o setShowModalContainer para compatibilidad
      if (closeModal) closeModal();
      else if (setShowModalContainer) setShowModalContainer(false);
    } catch (error) {
      console.error("Error:", error);
      showAlert("error", "Error", `Error al ${isEditing ? "actualizar" : "crear"} la entidad`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <EntityForm
      title={`${isEditing ? "Editar" : "Crear"} Entidad`}
      form={form}
      onSubmit={handleSubmit}
      isEditing={isEditing}
      onCancel={() => closeModal ? closeModal() : setShowModalContainer && setShowModalContainer(false)}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Más campos... */}
      </div>
    </EntityForm>
  );
}
```

## Ejemplo Práctico: Módulo de Propiedades

El módulo de Propiedades implementa todos estos conceptos:

1. **PropiedadesList.tsx**: Componente principal que muestra la tabla y maneja las acciones
2. **PropiedadesForm.tsx**: Formulario para crear/editar propiedades
3. **PropiedadDetalle.tsx**: Vista detallada usando EntityDetailView
4. **columns.tsx**: Definición de columnas con formateadores

### Características implementadas:

- **Cierre automático** del formulario después de crear/editar
- **Alertas** para notificar al usuario sobre el resultado de las operaciones
- **Vista detallada** con diseño organizado y atractivo
- **Tabla optimizada** que muestra solo los campos más relevantes
- **Formato de moneda** en soles peruanos (PEN)
- **Indicadores visuales** para campos booleanos (estacionamiento)

## Mejores Prácticas

1. **Consistencia visual**: Usa los mismos estilos y patrones en todos los módulos
2. **Campos relevantes**: Muestra solo los campos más importantes en la tabla
3. **Detalles completos**: Incluye toda la información en la vista detallada
4. **Validación**: Usa Zod para validar formularios
5. **Alertas**: Usa el contexto de alertas para notificaciones
6. **Manejo eficiente de modales**: Usa `openModal` y `closeModal` del hook `useModalContainer` para evitar renderizados innecesarios
7. **Cierre automático**: Asegúrate de cerrar los modales tras completar acciones
8. **Iconos**: Usa iconos de Lucide React para mejorar la experiencia visual
9. **Responsive**: Asegúrate de que todos los componentes sean responsivos

---

Esta guía fue creada para estandarizar el desarrollo de módulos CRUD en la aplicación Inmobis. Si tienes preguntas o sugerencias, contacta al equipo de desarrollo.

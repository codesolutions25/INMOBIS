"use client"

import { ColumnDef } from "@tanstack/react-table"
import DatatableRowActions from "@/components/table/row-actions"

// Tipo genérico para las acciones de fila
export interface EntityActionsProps<T> {
  onView?: (entity: T) => void
  onEdit?: (entity: T) => void
  onDelete?: (entity: T) => void
}

// Tipo para definir una columna personalizada
export interface CustomColumnDef<T> {
  accessorKey: string;
  header: string;
  cell?: (props: { row: any }) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

/**
 * Función genérica para crear columnas de entidades
 * @param columns - Definiciones de columnas personalizadas
 * @param actions - Acciones de fila (ver, editar, eliminar)
 * @returns Definición de columnas para la tabla
 */
export function createEntityColumns<T>({ 
  columns, 
  actions 
}: { 
  columns: CustomColumnDef<T>[], 
  actions: EntityActionsProps<T> 
}): ColumnDef<T>[] {
  // Convertir las columnas personalizadas al formato ColumnDef
  const columnDefs: ColumnDef<T>[] = columns.map(column => ({
    accessorKey: column.accessorKey,
    header: column.header,
    cell: column.cell,
    enableSorting: column.enableSorting !== undefined ? column.enableSorting : true,
    enableFiltering: column.enableFiltering !== undefined ? column.enableFiltering : true,
  }));

  // Añadir la columna de acciones si se proporcionan acciones
  if (actions.onView || actions.onEdit || actions.onDelete) {
    columnDefs.push({
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <DatatableRowActions 
          row={row}
          onView={actions.onView} 
          onEdit={actions.onEdit} 
          onDelete={actions.onDelete}
        />
      )
    });
  }

  return columnDefs;
}

// Funciones de formato comunes
export const formatters = {
  // Formatear como moneda peruana (PEN)
  currency: (value: number) => {
    return (
      <span className="font-medium text-green-600">
        {new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: 'PEN',
          minimumFractionDigits: 2
        }).format(value)}
      </span>
    );
  },
  
  // Formatear como área con unidad de medida
  area: (value: number) => {
    return (
      <span>
        {value} m²
      </span>
    );
  },
  
  // Formatear como booleano (Sí/No)
  boolean: (value: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {value ? "Sí" : "No"}
      </span>
    );
  },
  
  // Formatear como fecha
  date: (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('es-PE');
  },
  
  // Formatear como estado con color
  status: (value: string, statusMap: Record<string, { label: string, color: string }>) => {
    const status = statusMap[value] || { label: value, color: "gray" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${status.color}-100 text-${status.color}-800`}>
        {status.label}
      </span>
    );
  }
};

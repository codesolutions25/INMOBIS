"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { EstadoCaja } from "@/types/estadoscaja"

interface EstadoCajaColumnsProps {
  onEdit: (estadoCaja: EstadoCaja) => void
  onDelete: (estadoCaja: EstadoCaja) => void
  canEdit: boolean
  canDelete: boolean
}

export const getEstadoCajaColumns = ({ 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}: EstadoCajaColumnsProps): ColumnDef<EstadoCaja>[] => [
  {
    id: "rowNumber",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "created_at",
    header: "Fecha de creacion",
    cell: ({ row }) => {
      const fechaValue = row.getValue("created_at") as string;
      if (!fechaValue) {
        return null;
      }
      try {
        const dateObj = new Date(fechaValue);
        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date value for created_at: ${fechaValue}`);
          return fechaValue;
        }
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:00`;
      } catch (error) {
        console.error(`Error formatting date for created_at: ${fechaValue}`, error);
        return fechaValue;
      }
    },
  },
  {
    accessorKey: "nombre_estado_caja",
    header: "Nombre",
  },
  {
    accessorKey: "descripcion_estado_caja",
    header: "Descripcion",
  },
  {
    id: "acciones",
    cell: ({ row }) => (
      <DatatableRowActions
        row={row}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canDelete ? onDelete : undefined}
      />
    )
  },
]
"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { TipoCaja } from "@/types/tiposcaja"

interface TipoCajaColumnsProps {
  onEdit: (tipoCaja: TipoCaja) => void
  onDelete: (tipoCaja: TipoCaja) => void
  canEdit?: boolean
  canDelete?: boolean
}

export const getTipoCajaColumns = ({ 
  onEdit, 
  onDelete,
  // canEdit = true,
  // canDelete = true 
}: TipoCajaColumnsProps): ColumnDef<TipoCaja>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "created_at",
    header: "Fecha de creación",
    cell: ({ row }) => {
      const fechaValue = row.getValue("created_at") as string;
      if (!fechaValue) {
        return '-';
      }
      try {
        const dateObj = new Date(fechaValue);
        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date value for created_at: ${fechaValue}`);
          return fechaValue;
        }
        return dateObj.toLocaleDateString();
      } catch (error) {
        console.error('Error formatting date:', error);
        return fechaValue;
      }
    },
  },
  {
    accessorKey: "nombre_tipo_caja",
    header: "Nombre del Tipo de Caja",
  },
  {
    accessorKey: "descripcion_tipo_caja",
    header: "Descripción",
    cell: ({ row }) => {
      const descripcion = row.getValue("descripcion_tipo_caja") as string;
      return descripcion || '-';
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DatatableRowActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
]
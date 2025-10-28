"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { TipoOperacion } from "@/types/tiposoperacion"

interface TiposOperacionColumnsProps {
  onEdit: (tipoOperacion: TipoOperacion) => void
  onDelete: (tipoOperacion: TipoOperacion) => void
  canEdit?: boolean
  canDelete?: boolean
}

export const getTiposOperacionColumns = ({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}: TiposOperacionColumnsProps): ColumnDef<TipoOperacion>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de creación",
    cell: ({ row }) => {
      const fechaValue = row.getValue("createdAt") as string;
      if (!fechaValue) {
        return '-';
      }
      try {
        const dateObj = new Date(fechaValue);
        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date value for createdAt: ${fechaValue}`);
          return '-';
        }
        return dateObj.toLocaleDateString();
      } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
      }
    },
    size: 150,
  },
  {
    accessorKey: "nombreTipoOperacion",
    header: "Nombre del Tipo de Operación",
  },
  {
    accessorKey: "descripcionTipoOperacion",
    header: "Descripción",
    cell: ({ row }) => {
      const descripcion = row.getValue("descripcionTipoOperacion") as string;
      return descripcion || '-';
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <DatatableRowActions
        row={row}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canDelete ? onDelete : undefined}
      />
    )
  },
]
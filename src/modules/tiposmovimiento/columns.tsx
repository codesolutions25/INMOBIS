"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { TipoMovimiento } from "@/types/tiposmovimiento"
import { formatDate } from "@/utils/dateUtils"

interface TiposMovimientoColumnsProps {
  onEdit: (tipoMovimiento: TipoMovimiento) => void
  onDelete: (tipoMovimiento: TipoMovimiento) => void
  canEdit?: boolean
  canDelete?: boolean
}

export const getTiposMovimientoColumns = ({ 
  onEdit, 
  onDelete,
  canEdit = true,
  canDelete = true
}: TiposMovimientoColumnsProps): ColumnDef<TipoMovimiento>[] => {
  return [
    {
      id: "#",
      header: "Item",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "created_at",
      header: "Fecha de Creación",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return date ? formatDate(new Date(date)) : '-'
      },
      size: 180,
    },
    {
      accessorKey: "nombre_tipo_movimiento",
      header: "Nombre del Tipo de Movimiento",
    },
    {
      accessorKey: "descripcion_tipo_movimiento",
      header: "Descripción",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DatatableRowActions
          row={row}
          onEdit={canEdit ? onEdit : undefined}
          onDelete={canDelete ? onDelete : undefined}
        />
      ),
    },
  ]
}
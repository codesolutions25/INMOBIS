"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { TipoPago } from "@/types/tipospago"

interface TipoPagoColumnsProps {
  onEdit: (tipoPago: TipoPago) => void
  onDelete: (tipoPago: TipoPago) => void
  canEdit?: boolean
  canDelete?: boolean
}

export const getTipoPagoColumns = ({ 
  onEdit, 
  onDelete,
  canEdit = true,
  canDelete = true 
}: TipoPagoColumnsProps): ColumnDef<TipoPago>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "nombre",
    header: "Tipo de Pago",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <DatatableRowActions 
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
];
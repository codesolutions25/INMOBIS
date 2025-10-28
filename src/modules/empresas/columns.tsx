"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Empresa } from "@/types/empresas"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"

interface EmpresasColumnsProps {
  onEdit: (empresa: Empresa) => void
  onDelete: (empresa: Empresa) => void
  onView: (empresa: Empresa) => void
}

export const getEmpresasColumns = ({ onEdit, onDelete, onView }: EmpresasColumnsProps): ColumnDef<Empresa>[] => [
  {
    id: "rowNumber",
    header: "N°",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "ruc",
    header: "RUC",
  },
  {
    accessorKey: "razonSocial",
    header: "Razón social",
  },
 
  {
    accessorKey: "direccion",
    header: "Dirección",
  },
  {
    accessorKey: "esActiva",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.getValue("esActiva");
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {isActive ? "Activo" : "Inactivo"}
        </span>
      )
    }
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex justify-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(row.original)}
          title="Ver detalles"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          title="Editar"
          className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original)}
          title="Eliminar"
          className="text-red-600 hover:text-red-800 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  },
]
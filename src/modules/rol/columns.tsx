"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Rol } from "@/types/roles"
import { Badge } from "@/components/ui/badge"

interface RolColumnsProps {
  onEdit: (rol: Rol) => void
  onDelete: (rol: Rol) => void
  canEdit?: boolean
  canDelete?: boolean
}

export const getRolColumns = ({ 
  onEdit, 
  onDelete,
  canEdit = true,
  canDelete = true 
}: RolColumnsProps): ColumnDef<Rol>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "nombre",
    header: "Nombre del Rol",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    accessorKey: "es_global",
    header: "Es Global",
    cell: ({ row }) => {
      const esGlobal = row.getValue("es_global") as boolean;
      return (
        <Badge variant={esGlobal ? "default" : "secondary"}>
          {esGlobal ? "Sí" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de Creación",
    cell: ({ row }) => {
      const fechaValue = row.getValue("createdAt") as string;
      if (!fechaValue) return '-';
      try {
        const dateObj = new Date(fechaValue);
        return dateObj.toLocaleDateString();
      } catch (error) {
        return fechaValue;
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rol = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(rol)}
            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 p-1 rounded hover:bg-blue-50 disabled:bg-transparent"
            disabled={!canEdit}
            title="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(rol)}
            className="text-red-600 hover:text-red-800 disabled:text-gray-400 p-1 rounded hover:bg-red-50 disabled:bg-transparent"
            disabled={!canDelete}
            title="Eliminar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      );
    },
  },
];
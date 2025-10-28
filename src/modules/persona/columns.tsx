"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { Persona } from "@/types/persona"
import { formatDate } from "@/utils/dateUtils"

interface PersonaColumnsProps {
  onEdit: (persona: Persona) => void
  onDelete: (persona: Persona) => void
  tiposGeneroMap: Record<number, string>
  tiposDocumentoMap: Record<number, string>
  // Permisos
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
}

export const getPersonaColumns = ({ 
  onEdit, 
  onDelete,
  tiposGeneroMap,
  tiposDocumentoMap,
  canEdit = false,
  canDelete = false,
  canView = true
}: PersonaColumnsProps): ColumnDef<Persona>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
    size: 60,
  },
  {
    accessorKey: "nombreCompleto",
    header: "Nombre Completo",
    cell: ({ row }) => {
      const persona = row.original
      return `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}`.trim()
    },
    size: 250,
  },
  {
    accessorKey: "idTipoDocumento",
    header: "Tipo Documento",
    cell: ({ row }) => {
      const tipoDocumentoId = row.original.idTipoDocumento;
      const result = tipoDocumentoId ? tiposDocumentoMap[tipoDocumentoId] || 'N/A' : 'N/A';
      return result;
    },
    size: 150,
  },
  {
    accessorKey: "numeroDocumento",
    header: "N° Documento",
    size: 150,
  },
  {
    accessorKey: "telefonoPrincipal",
    header: "Teléfono",
    size: 140,
  },
  {
    accessorKey: "correoElectronico",
    header: "Correo",
    cell: ({ row }) => {
      const correo = row.getValue("correoElectronico") as string
      return correo || '-'
    },
    size: 200,
  },
  {
    accessorKey: "fechaNacimiento",
    header: "F. Nacimiento",
    cell: ({ row }) => {
      const fechaValue = row.getValue("fechaNacimiento") as string;
      return fechaValue ? formatDate(fechaValue) : '-';
    },
    size: 120,
  },
  {
    accessorKey: "idTipoGenero",
    header: "Género",
    cell: ({ row }) => {
      const generoId = row.original.idTipoGenero
      return generoId ? tiposGeneroMap[generoId] || 'N/A' : 'N/A'
    },
    size: 120,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <DatatableRowActions
        row={row}
        onEdit={canEdit ? () => onEdit(row.original) : undefined}
        onDelete={canDelete ? () => onDelete(row.original) : undefined}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    ),
    size: 100,
  },
]
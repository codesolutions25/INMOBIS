"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { Usuario } from "@/types/usuarios"
import { formatDate } from "@/utils/dateUtils"
import { useEffect, useState } from "react"
import { getPersona } from "@/services/apiPersona"

interface UsuarioColumnsProps {
  onEdit: (usuario: Usuario) => void
  onDelete: (usuario: Usuario) => void
  canEdit?: boolean
  canDelete?: boolean
}

// Component to display persona name
const PersonaName = ({ idPersona }: { idPersona: number }) => {
  const [nombreCompleto, setNombreCompleto] = useState<string>('Cargando...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPersona = async () => {
      if (!idPersona) {
        setNombreCompleto('Sin persona asignada');
        return;
      }

      try {
        const persona = await getPersona(idPersona);
        if (persona) {
          const nombre = persona.nombre || '';
          const apellidoPaterno = persona.apellidoPaterno || '';
          const apellidoMaterno = persona.apellidoMaterno || '';
          setNombreCompleto(`${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim());
        } else {
          setNombreCompleto(`ID: ${idPersona}`);
        }
      } catch (err) {
        console.error('Error loading persona data:', err);
        setError('Error al cargar');
        setNombreCompleto(`ID: ${idPersona}`);
      }
    };

    fetchPersona();
  }, [idPersona]);

  if (error) {
    return <span className="text-orange-500">{error}</span>;
  }

  return <span>{nombreCompleto}</span>;
};

export const getUsuarioColumns = ({ 
  onEdit, 
  onDelete,
  canEdit = true,
  canDelete = true 
}: UsuarioColumnsProps): ColumnDef<Usuario>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
    size: 60,
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de Creación",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string
      return date ? formatDate(new Date(date)) : '-'
    },
    size: 150,
  },
  {
    accessorKey: "username",
    header: "Nombre de Usuario",
    size: 150,
  },
  {
    accessorKey: "persona",
    header: "Persona Asociada",
    cell: ({ row }) => {
      const idPersona = row.original.idPersona
      return idPersona ? <PersonaName idPersona={idPersona} /> : 'No asignada'
    },
    size: 200,
  },
  {
    accessorKey: "esSuperAdmin",
    header: "Super Administrador",
    cell: ({ row }) => {
      const esSuperAdmin = row.getValue("esSuperAdmin") as boolean
      return esSuperAdmin ? "Sí" : "No"
    },
    size: 100,
  },
  {
    accessorKey: "estaActivo",
    header: "Estado",
    cell: ({ row }) => {
      const estaActivo = row.getValue("estaActivo") as boolean
      return (
        <span className={`px-2 py-1 rounded-full text-xs ${
          estaActivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {estaActivo ? "Activo" : "Inactivo"}
        </span>
      )
    },
    size: 100,
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
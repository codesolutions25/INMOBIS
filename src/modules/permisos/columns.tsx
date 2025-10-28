"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { Usuario } from "@/types/usuarios"
import { formatDate } from "@/utils/dateUtils"
import { useEffect, useState } from "react"
import { getPersona } from "@/services/apiPersona"
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";

interface UsuarioColumnsProps {
  onEdit: (usuario: Usuario) => void
  onDelete: (usuario: Usuario) => void
  onPermissions: (usuario: Usuario) => void
}

// Componente para mostrar el nombre de la persona
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
        console.log(`Fetching persona with ID: ${idPersona}`);
        const persona = await getPersona(idPersona);
       
        // Verificar si la respuesta tiene los campos esperados
        if (persona && (persona.nombre || persona.idPersona)) {
          const nombre = persona.nombre || 'Sin nombre';
          const apellidoPaterno = persona.apellidoPaterno || '';
          const apellidoMaterno = persona.apellidoMaterno || '';
          setNombreCompleto(`${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim());
        } else {
          console.warn('Formato de respuesta inesperado:', persona);
          setNombreCompleto(`ID: ${idPersona}`);
        }
      } catch (err) {
        console.error('Error al cargar datos de la persona:', err);
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
  onPermissions
}: UsuarioColumnsProps): ColumnDef<Usuario & { esUsuarioEmpresa?: boolean }>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
    size: 60,
  },
  {
    accessorKey: "username",
    header: "Nombre de Usuario",
    size: 150,
  },
  {
    accessorKey: "tipo",
    header: "Tipo de Usuario",
    cell: ({ row }) => {
      const esUsuarioEmpresa = row.original.esUsuarioEmpresa;
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          esUsuarioEmpresa ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {esUsuarioEmpresa ? 'Empresa' : 'Sistema'}
        </span>
      );
    },
    size: 120,
  },
  {
    accessorKey: "persona",
    header: "Persona",
    cell: ({ row }) => {
      const idPersona = row.original.idPersona;
      return idPersona ? <PersonaName idPersona={idPersona} /> : 'No asignado';
    },
    size: 200,
  },
  {
    accessorKey: "esSuperAdmin",
    header: "Super Admin",
    cell: ({ row }) => {
      const esSuperAdmin = row.getValue("esSuperAdmin") as boolean;
      return esSuperAdmin ? "Sí" : "No";
    },
    size: 100,
  },
  {
    accessorKey: "estaActivo",
    header: "Estado",
    cell: ({ row }) => {
      const estaActivo = row.getValue("estaActivo") as boolean;
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          estaActivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {estaActivo ? "Activo" : "Inactivo"}
        </span>
      );
    },
    size: 100,
  },
 
]
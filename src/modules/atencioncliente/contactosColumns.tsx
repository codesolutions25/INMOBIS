"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash } from "lucide-react"

interface ContactoEmergencia {
  idContactoEmergencia: number;
  persona: {
    idPersona: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
    telefonoPrincipal: string;
  };
}

export interface ContactosColumnsProps {
  onEdit: (contacto: any) => void;
  onDelete: (id: number) => void;
}

export const getContactosEmergenciaColumns = ({ onEdit, onDelete }: Omit<ContactosColumnsProps, 'currentPage' | 'itemsPerPage'>): ColumnDef<any>[] => [
  {
    id: "index",
    header: "N°",
    cell: ({ row }) => {
      return <span>{row.index + 1}</span>;
    },
    size: 60,
  },
  {
    accessorKey: "nombre",
    header: () => <div>Nombre</div>,
    cell: ({ row }) => {
      const contacto = row.original;
      return <div>{contacto?.persona?.nombre || contacto?.nombre || ''}</div>;
    },
    size: 150,
  },
  {
    accessorKey: "apellidoPaterno",
    header: () => <div>Ap. Paterno</div>,
    cell: ({ row }) => {
      const contacto = row.original;
      return <div>{contacto?.persona?.apellidoPaterno || contacto?.apellidoPaterno || ''}</div>;
    },
    size: 150,
  },
  {
    accessorKey: "apellidoMaterno",
    header: () => <div>Ap. Materno</div>,
    cell: ({ row }) => {
      const contacto = row.original;
      return <div>{contacto?.persona?.apellidoMaterno || contacto?.apellidoMaterno || ''}</div>;
    },
    size: 150,
  },
  {
    accessorKey: "numeroDocumento",
    header: () => <div>DNI</div>,
    cell: ({ row }) => {
      const contacto = row.original;
      return <div>{contacto?.persona?.numeroDocumento || contacto?.numeroDocumento || ''}</div>;
    },
    size: 120,
  },
  {
    accessorKey: "telefonoPrincipal",
    header: () => <div>Teléfono</div>,
    cell: ({ row }) => {
      const contacto = row.original;
      return <div>{contacto?.persona?.telefonoPrincipal || contacto?.telefonoPrincipal || ''}</div>;
    },
    size: 130,
  },
  {
    id: "acciones",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="flex justify-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
          title="Editar contacto"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original?.idAtencionContactoEmergencia)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
          title="Eliminar contacto"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
    size: 100,
  },
];

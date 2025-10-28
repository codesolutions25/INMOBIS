"use client"

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from '@/components/ui/button';

export interface MedioCaptacionProps {
  onEdit: (medioCaptacion: any) => void;
  onDelete: (idPersonaMedioCaptacion: number) => void;
}

export const getMediosCaptacionColumns = ({ onDelete, onEdit }: MedioCaptacionProps): ColumnDef<any>[] => [
    {
      id: "index",
      header: "N°",
      cell: ({ row }) => {
        return <span>{row.index + 1}</span>;
      },
      size: 60,
    },
    {
      accessorKey: "medioCaptacionNombre",
      header: "Medio de Captación",
      size: 150,
    },
    {
      accessorKey: "detalleMedioCaptacionNombre",
      header: "Detalle",
      size: 150,
    },
    {
      id: "acciones",
      header: () => <div className="text-center">Acciones</div>,
      cell: ({ row }) => (
          <div className="flex justify-center space-x-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(row.original)}
                className="h-8 w-8 p-0  text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
                title="Editar Medio de Captación"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={() => onDelete(row.original.idPersonaMedioCaptacion)}
                title="Eliminar Medio de Captación"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      size: 100,
    },
];

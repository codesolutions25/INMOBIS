"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { PuntoVenta } from "@/types/puntoventa"
import { Empresa } from "@/types/empresas"

interface PuntoVentaColumnsProps {
  onEdit: (puntoVenta: PuntoVenta) => void
  onDelete: (puntoVenta: PuntoVenta) => void
  empresaMap: Record<number, Empresa>
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
}

export const getPuntoVentaColumns = ({ 
  onEdit, 
  onDelete, 
  empresaMap,
  canEdit = false,
  canDelete = false,
  canView = true
}: PuntoVentaColumnsProps): ColumnDef<PuntoVenta>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "empresa_id",
    header: "Empresa",
    cell: ({ row }) => {
      const empresaId = row.original.empresa_id;
      return empresaMap[empresaId]?.razonSocial || "Sin empresa";
    }
  },
  {
    accessorKey: "nombre_punto_venta",
    header: "Nombre",
  },
  {
    accessorKey: "direccion_punto_venta",
    header: "Dirección",
  },
  {
    accessorKey: "telefono_punto_venta",
    header: "Teléfono",
  },
  {
    accessorKey: "fecha_creacion",
    header: "Fecha de creación",
    cell: ({ row }) => {
      const fechaValue = row.getValue("fecha_creacion") as string;
      if (!fechaValue) {
        return '-';
      }
      try {
        const dateObj = new Date(fechaValue);
        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date value for fecha_creacion: ${fechaValue}`);
          return fechaValue;
        }
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:00`;
      } catch (error) {
        console.error(`Error formatting date for fecha_creacion: ${fechaValue}`, error);
        return fechaValue;
      }
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
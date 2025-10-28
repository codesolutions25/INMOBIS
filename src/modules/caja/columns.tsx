"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import { Caja } from "@/types/cajas"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"
import { EstadoCaja } from "@/types/estadoscaja"
import { PuntoVenta } from "@/types/puntoventa"
import { TipoCaja } from "@/types/tiposcaja"
import { Empresa } from "@/types/empresas"
import { formatters } from "@/components/table/createEntityColumns"
import { format } from "path";
import caja from "@/pages/caja";
import { useState } from "react";
import { CajaRowActions } from "./CajaRowActions";
import { Badge } from "lucide-react";

const ESTADO_CAJA_ABIERTA = process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA || 'Abierta';
const ESTADO_CAJA_CERRADA = process.env.NEXT_PUBLIC_ESTADO_CAJA_CERRADA || 'Cerrada';


interface CajaColumnsProps {
  onEdit: (caja: Caja) => void
  onDelete: (caja: Caja) => void
  onOpenCaja: (caja: Caja) => void
  onCloseCaja: (caja: Caja) => void
  puntoVentaMap: Record<number, PuntoVenta>
  tiposCajaMap: Record<number, TipoCaja>
  estadosCajaMap: Record<number, EstadoCaja>
  empresasMap: Record<number, Empresa>
  canEdit?: boolean
  canDelete?: boolean
}

export const getCajaColumns = ({
  onEdit,
  onDelete,
  puntoVentaMap,
  tiposCajaMap,
  estadosCajaMap,
  empresasMap,
  canEdit,
  canDelete,
}: CajaColumnsProps): ColumnDef<Caja>[] => [
    {
      id: "#",
      header: "Item",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "fecha_apertura",
      header: "Fecha Apertura",
      cell: ({ row }) => {
        const fechaValue = row.getValue("fecha_apertura") as string | null;
        return formatDate(fechaValue);
      },
    },
    {
      accessorKey: "fecha_cierre",
      header: "Fecha Cierre",
      cell: ({ row }) => {
        const fechaValue = row.getValue("fecha_cierre") as string | null;
        return formatDate(fechaValue);
      },
    },
    {
      accessorKey: "empresa",
      header: "Empresa",
      cell: ({ row }) => {
        const puntoVentaId = row.original.id_punto_venta;
        if (puntoVentaId === null || puntoVentaId === undefined) return 'Sin empresa';

        const puntoVenta = puntoVentaMap[puntoVentaId];
        if (!puntoVenta) return 'Empresa no encontrada';
        const empresa = puntoVenta.empresa_id ? empresasMap[puntoVenta.empresa_id] : null;
        return empresa?.razonSocial || 'Sin empresa';
      },
    },
    {
      accessorKey: "id_punto_venta",
      header: "Punto de Venta",
      cell: ({ row }) => {
        const puntoVentaId = row.original.id_punto_venta;
        return puntoVentaId !== null && puntoVentaId !== undefined
          ? (puntoVentaMap[puntoVentaId]?.nombre_punto_venta || "Sin punto de venta")
          : "Sin punto de venta";
      },
    },
    {
      accessorKey: "nombre_caja",
      header: "Nombre de Caja",
      cell: ({ row }) => {
        const nombreCaja = row.original.nombre_caja;
        return nombreCaja !== null && nombreCaja !== undefined
          ? nombreCaja
          : "Sin nombre de caja";
      },
    },
    {
      accessorKey: "id_tipo_caja",
      header: "Tipo de Caja",
      cell: ({ row }) => {
        const tipoCajaId = row.original.id_tipo_caja;
        return tipoCajaId !== null && tipoCajaId !== undefined
          ? (tiposCajaMap[tipoCajaId]?.nombre_tipo_caja || "Sin tipo de caja")
          : "Sin tipo de caja";
      },
    },
   


    {
      accessorKey: "id_estado_caja",
      header: "Estado",
      cell: ({ row }) => {
        const estadoCajaId = row.original.id_estado_caja;
        const estadoNombre = estadoCajaId !== null && estadoCajaId !== undefined
          ? (estadosCajaMap[estadoCajaId]?.nombre_estado_caja || "Sin estado de caja")
          : "Sin estado de caja";
    
        const estadoLower = estadoNombre.toLowerCase();
        const isOpen = estadoLower === ESTADO_CAJA_ABIERTA.toLowerCase();
        const isClosed = estadoLower === ESTADO_CAJA_CERRADA.toLowerCase();
        
        // Determinar el color del círculo
        let circleColor = 'bg-gray-400'; // Color gris por defecto
        if (isOpen) circleColor = 'bg-green-500';
        else if (isClosed) circleColor = 'bg-red-500';
        
        return (
          <div className="flex items-center gap-2">
            <span 
              className={`inline-block w-3 h-3 rounded-full ${circleColor}`}
              title={estadoNombre}
            />
            <span>{estadoNombre}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "saldo_inicial",
      header: "Saldo Inicial",
      cell: ({ row }) => {
        const saldo = row.getValue("saldo_inicial") as number | null;
        return saldo !== null ? formatters.currency(saldo) : '-';
      },
    },

    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const caja = row.original;
        const isOpen = caja.fecha_apertura && !caja.fecha_cierre;
        const isClosed = caja.fecha_cierre;

        return (
          <CajaRowActions
            row={row}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        );
      }
    },
  ]

// Helper function to format dates
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date value: ${dateString}`);
      return '-';
    }

    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return '-';
  }
}
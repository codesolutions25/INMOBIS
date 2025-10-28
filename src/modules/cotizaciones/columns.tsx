"use client"
import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import { Cotizacion } from "@/types/cotizaciones"
import { formatDate } from "@/utils/dateUtils"

interface CotizacionesColumnsProps {
    onView: (cotizacion: Cotizacion) => void
    onEdit: (cotizacion: Cotizacion) => void
    onDelete: (cotizacion: Cotizacion) => void
}

export const getCotizacionesColumns = ({ onView, onEdit, onDelete }: CotizacionesColumnsProps): ColumnDef<Cotizacion>[] => [
    {
        accessorKey: "idCotizaciones",
        header: "ID",
    },
    {
        accessorKey: "fechaCotizacion",
        header: "Fecha de cotización",
        cell: ({ row }) => formatDate(row.original.fechaCotizacion)
    },
    {
        accessorKey: "idClienteInmobiliario",
        header: "Cliente",
    },
    {
        accessorKey: "idPropiedad",
        header: "Propiedad",
    },
    {
        accessorKey: "idEstadoCotizacion",
        header: "Estado",
    },
    {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
            <DatatableRowActions
                row={row}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        )
    }
]
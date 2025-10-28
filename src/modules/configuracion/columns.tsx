"use client"

import { ColumnDef } from "@tanstack/react-table"
import { TipoPropiedad } from "@/types/tiposPropiedad"
import { EstadoPropiedad } from "@/types/estadosPropiedad"
import DatatableRowActions from "@/components/table/row-actions"
import { formatters } from "@/components/table/createEntityColumns"

export interface TiposPropiedadActionsProps {
    onView?: (tipoPropiedad: TipoPropiedad) => void
    onEdit?: (tipoPropiedad: TipoPropiedad) => void
    onDelete?: (tipoPropiedad: TipoPropiedad) => void
}

export const getTiposPropiedadColumns = ({
    onView,
    onEdit,
    onDelete,
}: TiposPropiedadActionsProps): ColumnDef<TipoPropiedad>[] => [
    {
        accessorKey: "idTipoPropiedad",
        header: "ID",
    },
    {
        accessorKey: "nombre",
        header: "Nombre",
    },
    {
        accessorKey: "descripcion",
        header: "Descripción",
    },
    {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
            <DatatableRowActions
                row={row}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        ),
    },
]

export interface EstadosPropiedadColumnsProps {
    onView?: (estadoPropiedad: EstadoPropiedad) => void
    onEdit?: (estadoPropiedad: EstadoPropiedad) => void
    onDelete?: (estadoPropiedad: EstadoPropiedad) => void
}

export const getEstadosPropiedadColumns = ({
    onView,
    onEdit,
    onDelete,
}: EstadosPropiedadColumnsProps): ColumnDef<EstadoPropiedad>[] => [
    {
        accessorKey: "idEstadoPropiedad",
        header: "ID",
    },
    {
        accessorKey: "nombre",
        header: "Nombre",
    },
    {
        accessorKey: "descripcion",
        header: "Descripción",
    },
    {
        accessorKey: "esFinal",
        header: "Final",
        cell: ({ row }) => formatters.boolean(row.getValue("esFinal")),
    },
    {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
            <DatatableRowActions
                row={row}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        ),
    },
]
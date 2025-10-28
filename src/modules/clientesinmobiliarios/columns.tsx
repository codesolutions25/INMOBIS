"use client"
import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import { ClienteInmobiliario } from "@/types/clienteInmobiliario"
import { formatDate } from "@/utils/dateUtils"

interface ClientesInmobiliariosColumnsProps {
    onView: (clienteInmobiliario: ClienteInmobiliario) => void
    onEdit: (clienteInmobiliario: ClienteInmobiliario) => void
    onDelete: (clienteInmobiliario: ClienteInmobiliario) => void
}

export const getClienteInmobiliariosColumns = ({ onView, onEdit, onDelete }: ClientesInmobiliariosColumnsProps ): ColumnDef<ClienteInmobiliario>[] => [
    {
        accessorKey: "idClientesInmobiliarios",
        header: "ID",
    },
    {
        accessorKey: "nombrePersona",
        header: "Persona (ID)",
        cell: ({ row }) => {
            const nombre = row.original.nombrePersona || 'Persona desconocida';
            const id = row.original.idPersona ? row.original.idPersona : '';
            return `${nombre} (${id})`;
        }
    },
    {
        accessorKey: "nombreEmpresa",
        header: "Empresa (ID)",
        cell: ({ row }) => {
            const nombre = row.original.nombreEmpresa || 'Empresa desconocida';
            const id = row.original.idEmpresa ? row.original.idEmpresa : '';
            return `${nombre} (${id})`;
        }
    },
    {
        accessorKey: "fechaCreacion",
        header: "Fecha de creación",
        cell: ({ row }) => formatDate(row.original.fechaCreacion)
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
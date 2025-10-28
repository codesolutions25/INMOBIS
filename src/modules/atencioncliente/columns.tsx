"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Persona } from "@/types/persona"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import styles from './styles/columns.module.css';

export interface AtencionColumnsProps {
    currentPage: number;
    itemsPerPage: number;
    onView?: (persona: Persona) => void;
}

export const getPersonasColumns = ({
    currentPage,
    itemsPerPage,
    onView
}: AtencionColumnsProps): ColumnDef<Persona>[] => [
    {
        id: "index",
        header: () => <div className={styles.indexCell}>N°</div>,
        cell: ({ row }) => (
            <div className={styles.indexCell}>
                {(currentPage - 1) * itemsPerPage + row.index + 1}
            </div>
        ),
        size: 30,
    },
    {
        accessorKey: "nombre",
        header: () => <div className={styles.textAlignLeft}>Nombre</div>,
        cell: ({ row }) => {
            const nombre = row.getValue("nombre") as string;
            return <div className={styles.textAlignLeft} title={nombre}>{nombre}</div>;
        },
        size: 80,
    },
    {
        id: "apellidos",
        header: () => <div className={styles.textAlignLeft}>Apellidos</div>,
        cell: ({ row }) => {
            const apellidos = `${row.original.apellidoPaterno || ''} ${row.original.apellidoMaterno || ''}`.trim();
            return <div className={styles.textAlignLeft} title={apellidos}>{apellidos}</div>;
        },
        size: 120,
    },
    {
        accessorKey: "numeroDocumento",
        header: () => <div className={styles.textAlignLeft}>DNI</div>,
        cell: ({ row }) => {
            const numeroDocumento = row.getValue("numeroDocumento") as string;
            return <div className={styles.textAlignLeft} title={numeroDocumento}>{numeroDocumento}</div>;
        },
        size: 50,
    },
    {
        accessorKey: "telefonoPrincipal",
        header: () => <div className={styles.textAlignLeft}>Teléfono</div>,
        cell: ({ row }) => {
            const telefono = row.original.telefonoPrincipal || '-';
            return <div className={styles.textAlignLeft} title={telefono}>{telefono}</div>;
        },
        size: 75,
    },
    {
        accessorKey: "correoElectronico",
        header: () => <div className={styles.textAlignLeft}>Correo</div>,
        cell: ({ row }) => {
            const email = row.original.correoElectronico || '-';
            return <div className={styles.textAlignLeft} title={email}>{email}</div>;
        },
        size: 110,
    },
    {
        id: "acciones",
        header: () => <div className={styles.accionesCell}>Acciones</div>,
        cell: ({ row }) => (
            <div className={styles.actionsContainer}>
                {onView && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(row.original)}
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                        title="Ver detalles"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </div>
        ),
        size: 60,
    },
]
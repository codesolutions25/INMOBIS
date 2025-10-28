"use client"

import { ColumnDef } from "@tanstack/react-table"
import { TipoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import { Button } from "@/components/ui/button"
import { Pencil, Trash } from "lucide-react"
import styles from './styles/columns.module.css';

interface TiposPropiedadColumnsProps {
    onEdit: (tipo: TipoPropiedad) => void
    onDelete: (idTiposPropiedad: number) => void
    canEdit?: boolean
    canDelete?: boolean
    currentPage: number
    itemsPerPage: number
}

export const getTiposPropiedadColumns = ({
    onEdit,
    onDelete,
    currentPage,
    itemsPerPage,
    canEdit = true,
    canDelete = true
}: TiposPropiedadColumnsProps): ColumnDef<TipoPropiedad>[] => [
    {
        id: "index",
        header: () => <div className={styles.indexCell}>N°</div>,
        cell: ({ row }) => (
            <div className={styles.indexCell}>
                {(currentPage - 1) * itemsPerPage + row.index + 1}
            </div>
        ),
    },
    {
        accessorKey: "nombre",
        header: () => <div className={styles.nombreCell}>Nombre</div>,
        cell: ({ row }) => (
            <div className={styles.nombreCell}>
                {row.getValue("nombre")}
            </div>
        ),
    },
    {
        accessorKey: "descripcion",
        header: () => <div className={styles.descripcionCell}>Descripción</div>,
        cell: ({ row }) => (
            <div className={styles.descripcionCell}>
                {row.getValue("descripcion") || '-'}
            </div>
        ),
    },
    {
        id: "actions",
        header: () => <div className={styles.actionsCell}>Acciones</div>,
        cell: ({ row }) => {
            const tipo = row.original;
            return (
                <div className={styles.actionsCell}>
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(tipo)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                        >
                            <Pencil className="h-4 w-4 text-yellow-500" />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(tipo.idTiposPropiedad)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                        >
                            <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                </div>
            );
        },
    },
];
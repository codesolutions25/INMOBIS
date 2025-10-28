"use client"

import { ColumnDef } from "@tanstack/react-table"
import { FeriadosGlobales } from "@/modules/planPagos/models/planPagosModels"
import { Button } from "@/components/ui/button";
import styles from './styles/columns.module.css';
import { Pencil, Trash } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface FeriadosGlobalesColumnsProps {
    onEdit: (feriadosGlobales: FeriadosGlobales) => void
    onDelete: (feriadosGlobales: FeriadosGlobales) => void
    canEdit?: boolean
    canDelete?: boolean
    currentPage: number
    itemsPerPage: number
}

export const getFeriadoGlobalColumns = ({
    onEdit,
    onDelete,
    currentPage,
    itemsPerPage,
    canEdit = true,
    canDelete = true
}: FeriadosGlobalesColumnsProps): ColumnDef<FeriadosGlobales>[] => [
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
        accessorKey: "fecha",
        header: () => <div className={`${styles.textAlignLeft} ${styles.dateCell}`}>Fecha</div>,
        cell: ({ row }) => {
            const fechaValue = row.getValue("fecha") as string;
            const fechaFormateada = formatDate(fechaValue);
            return <div className={`${styles.textAlignLeft} ${styles.dateCell}`} title={fechaFormateada}>{fechaFormateada}</div>;
        }
    },
    {
        accessorKey: "descripcion",
        header: () => <div className={`${styles.textAlignLeft} ${styles.descriptionCell}`}>Descripción</div>,
        cell: ({ row }) => {
            const descripcion = row.getValue("descripcion") as string;
            return (
                <div className={`${styles.textAlignLeft} ${styles.descriptionCell}`} title={descripcion}>
                    {descripcion}
                </div>
            );
        },
    },
    {
        id: "acciones",
        header: () => <div className={`${styles.actionsCell}`}>Acciones</div>,
        cell: ({ row }) => {

            if (!canEdit && !canDelete) return null;

            return (
                <div className={styles.actionsContainer}>
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row.original)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Editar Feriado"
                        >
                            <Pencil className={styles.icon} />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row.original)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Eliminar Feriado"
                        >
                            <Trash className={styles.icon} />
                        </Button>
                    )}
                </div>
            );
        },
    },
]


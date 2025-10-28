"use client"
import { ColumnDef } from "@tanstack/react-table"
import { CatalogoCaracteristica } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import { formatters } from "@/components/table/createEntityColumns"
import { Button } from "@/components/ui/button";
import styles from './styles/columns.module.css';
import { Pencil, Trash } from "lucide-react";

export interface CatalogoCaracteristicasColumnsProps {
    onEdit?: (caracteristica: CatalogoCaracteristica) => void;
    onDelete?: (caracteristica: CatalogoCaracteristica) => void;
    currentPage: number;
    itemsPerPage: number;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const getCatalogoCaracteristicasColumns = ({
    onEdit,
    onDelete,
    currentPage,
    itemsPerPage,
    canEdit = true,
    canDelete = true,
}: CatalogoCaracteristicasColumnsProps): ColumnDef<CatalogoCaracteristica>[] => [
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
        header: () => <div className={`${styles.textAlignLeft} ${styles.nameCell}`}>Nombre</div>,
        cell: ({ row }) => {
            const nombre = row.getValue("nombre") as string;
            return <div className={`${styles.textAlignLeft} ${styles.nameCell}`} title={nombre}>{nombre}</div>;
        },
    },
    {
        accessorKey: "descripcion",
        header: () => <div className={styles.textAlignLeft}>Descripción</div>,
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
        accessorKey: "activo",
        header: () => <div className={styles.activeCell}>Activo</div>,
        cell: ({ row }) => <div className={styles.activeCell}>{formatters.boolean(row.original.activo)}</div>,
    },
    {
        id: "acciones",
        header: () => <div className={styles.actionsCell}>Acciones</div>,
        cell: ({ row }) => {
            // Only show actions if at least one action is enabled
            if (!canEdit && !canDelete) return null;
            
            return (
                <div className={styles.actionsContainer}>
                    {canEdit && onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row.original)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Editar característica"
                        >
                            <Pencil className={styles.icon} />
                        </Button>
                    )}
                    {canDelete && onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row.original)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Eliminar característica"
                        >
                            <Trash className={styles.icon} />
                        </Button>
                    )}
                </div>
            );
        }
    }
]
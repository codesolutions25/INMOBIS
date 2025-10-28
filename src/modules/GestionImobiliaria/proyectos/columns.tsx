"use client"
import { ColumnDef } from "@tanstack/react-table"
import { Proyecto } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import { formatDate } from "@/utils/dateUtils"
import { Button } from "@/components/ui/button"
import { ImageIcon, Eye, Pencil, Trash } from "lucide-react"
import styles from './styles/columns.module.css';

export interface ProyectosColumnsProps {
  onView: (proyecto: Proyecto) => void
  onEdit: (proyecto: Proyecto) => void
  onDelete: (proyecto: Proyecto) => void
  onUploadImage: (proyecto: Proyecto) => void
  currentPage: number;
  itemsPerPage: number;
  estadosPropiedad?: { idEstadoPropiedad: number; nombre: string }[]
  canEdit?: boolean
  canDelete?: boolean
  canUploadImage?: boolean
}

export const getProyectosColumns = ({ 
  onView, 
  onEdit, 
  onDelete, 
  onUploadImage, 
  currentPage,
  itemsPerPage,
  estadosPropiedad = [],
  canEdit = false,
  canDelete = false,
  canUploadImage = false
}: ProyectosColumnsProps): ColumnDef<Proyecto>[] => [
  {
    id: "index",
    header: () => <div className={styles.indexCell}>N°</div>,
    cell: ({ row }) => <div className={styles.indexCell}>{(currentPage - 1) * itemsPerPage + row.index + 1}</div>,
  },
  {
    accessorKey: "nombre",
    header: () => <div className={`${styles.nombreCell} ${styles.textAlignLeft}`}>Nombre</div>,
    cell: ({ row }) => (
      <div title={row.getValue("nombre")} className={`${styles.nombreCell} ${styles.textAlignLeft}`}>
        {row.getValue("nombre")}
      </div>
    ),
  },
  {
    accessorKey: "ubicacion",
    header: () => <div className={`${styles.ubicacionCell} ${styles.textAlignLeft}`}>Ubicación</div>,
    cell: ({ row }) => (
      <div title={row.getValue("ubicacion")} className={`${styles.ubicacionCell} ${styles.textAlignLeft}`}>
        {row.getValue("ubicacion")}
      </div>
    ),
  },
  {
    accessorKey: "fechaInicio",
    header: () => <div className={styles.fechaInicioCell}>Fecha de Inicio</div>,
    cell: ({ row }) => <div className={styles.fechaInicioCell}>{formatDate(row.original.fechaInicio)}</div>
  },
  {
    accessorKey: "fechaFin",
    header: () => <div className={styles.fechaFinCell}>Fecha de Fin</div>,
    cell: ({ row }) => <div className={styles.fechaFinCell}>{formatDate(row.original.fechaFin)}</div>
  },
  {
    accessorKey: "idEstadoPropiedad",
    header: () => <div className={styles.estadoCell}>Estado</div>,
    cell: ({ row }) => {
      const estado = estadosPropiedad.find(e => e.idEstadoPropiedad === row.original.idEstadoPropiedad);
      return <div className={styles.estadoCell}>{estado ? estado.nombre : row.original.idEstadoPropiedad}</div>;
    }
  },
  {
    id: "acciones",
    header: () => <div className={styles.accionesCell}>Acciones</div>,
    cell: ({ row }) => (
      <div className={styles.actionsContainer}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(row.original)}
          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
          title="Ver detalles"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
            title="Editar proyecto"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {canUploadImage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onUploadImage(row.original);
            }}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            title="Subir imágenes"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.original);
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
            title="Eliminar proyecto"
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
    ),
  },
];
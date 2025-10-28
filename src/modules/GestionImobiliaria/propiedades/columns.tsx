"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Propiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels"
import { formatters } from "@/components/table/createEntityColumns"
import { Button } from "@/components/ui/button"
import { Eye, ImageIcon, Pencil, Trash, ListChecks } from "lucide-react"
import styles from './styles/columns.module.css';

export interface PropiedadesActionsProps {
  onView: (propiedad: Propiedad) => void
  onEdit?: (propiedad: Propiedad) => void
  onDelete?: (propiedad: Propiedad) => void
  onUploadImage?: (propiedad: Propiedad) => void
  onManageCharacteristics?: (propiedad: Propiedad) => void
  currentPage: number;
  itemsPerPage: number;
  canEdit?: boolean
  canDelete?: boolean
  canUploadImages?: boolean
  canManageCharacteristics?: boolean
}

export const getPropiedadesColumns = ({
  onView,
  onEdit,
  onDelete,
  onUploadImage,
  onManageCharacteristics,
  currentPage,
  itemsPerPage,
  canEdit = false,
  canDelete = false,
}: PropiedadesActionsProps): ColumnDef<Propiedad>[] => [
  {
    id: "index",
    header: () => <div className={styles.indexCell}>N°</div>,
    cell: ({ row }) => <div className={styles.indexCell}>{(currentPage - 1) * itemsPerPage + row.index + 1}</div>,
  },
  {
    accessorKey: "nombre",
    header: () => <div className={styles.nombreCell}>Nombre</div>,
    cell: ({ row }) => <div title={row.getValue("nombre")} className={styles.nombreCell}>{row.getValue("nombre")}</div>,
  },
  {
    accessorKey: "codigoPropiedad",
    header: () => <div className={styles.codigoCell}>Código</div>,
    cell: ({ row }) => <div className={styles.codigoCell}>{row.getValue("codigoPropiedad")}</div>,
  },
  {
    accessorKey: "direccion",
    header: () => <div className={styles.direccionCell}>Dirección</div>,
    cell: ({ row }) => <div title={row.getValue("direccion")} className={styles.direccionCell}>{row.getValue("direccion")}</div>,
  },
  {
    accessorKey: "precio",
    header: () => <div className={styles.precioCell}>Precio</div>,
    cell: ({ row }) => <div className={styles.precioCell}>{formatters.currency(parseFloat(row.getValue("precio")))}</div>,
  },
  {
    accessorKey: "areaM2",
    header: () => <div className={styles.areaCell}>Área</div>,
    cell: ({ row }) => <div className={styles.areaCell}>{formatters.area(parseFloat(row.getValue("areaM2")))}</div>,
  },
  {
    accessorKey: "numeroHabitaciones",
    header: () => <div className={styles.habitacionesCell}>Habitaciones</div>,
    cell: ({ row }) => <div className={styles.habitacionesCell}>{row.getValue("numeroHabitaciones")}</div>,
  },
  {
    accessorKey: "numeroBanos",
    header: () => <div className={styles.banosCell}>Baños</div>,
    cell: ({ row }) => <div className={styles.banosCell}>{row.getValue("numeroBanos")}</div>,
  },
  {
    accessorKey: "estacionamiento",
    header: () => <div className={styles.estacionamientoCell}>Estacionamiento</div>,
    cell: ({ row }) => <div className={styles.estacionamientoCell}>{formatters.boolean(row.getValue("estacionamiento"))}</div>,
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
        {canEdit && onEdit && (
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
        {canEdit && onUploadImage && (
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
        {canEdit && onManageCharacteristics && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onManageCharacteristics(row.original);
            }}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
            title="Gestionar características"
          >
            <ListChecks className="h-4 w-4" />
          </Button>
        )}
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
            title="Eliminar proyecto"
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
    ),
  },
]
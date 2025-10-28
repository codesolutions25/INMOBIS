import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Lock, LockOpen } from "lucide-react"

interface CajaRowActionsProps<TData> {
  row: Row<TData>
  onEdit?: (value: TData) => void
  onDelete?: (value: TData) => void
  onOpenCaja?: (value: TData) => void
  onCloseCaja?: (value: TData) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function CajaRowActions<TData>({ 
  row, 
  onEdit, 
  onDelete,
  onOpenCaja,
  onCloseCaja,
  canEdit = false,
  canDelete = false,
}: CajaRowActionsProps<TData>) {
  // Handle edit action
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(row.original);
  };

  // Handle delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(row.original);
  };

  

  return (
    <div className="flex items-center space-x-2">
      {/* Edit Button */}
      {canEdit && onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          title="Editar"
        >
          <Pencil className="h-4 w-4 text-yellow-500" />
        </Button>
      )}

      {/* Delete Button */}
      {canDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          title="Eliminar"
        >
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      )}

     
    </div>
  )
}
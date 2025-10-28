import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash } from "lucide-react"

interface DatatableRowActionsProps<TData>{
  row: Row<TData>
  onView?: (value: TData) => void
  onEdit?: (value: TData) => void
  onDelete?: (value: TData) => void
}

const DatatableRowActions = <TData,>({ row, onView, onEdit, onDelete }: DatatableRowActionsProps<TData>) => {
  return(
    <>
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(row.original)}
        >
          <Eye className="text-blue-500" />
        </Button>
      )}
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="text-yellow-500" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original)}
        >
          <Trash className="text-red-500" />
        </Button>
      )}
    </>
  )
}

export default DatatableRowActions

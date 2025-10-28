import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Trash, CalendarX, Pencil } from "lucide-react"
import type { CajaUsuario } from "@/types/cajausuario";

interface CajaUsuarioRowActionsProps<TData> {
  row: Row<TData>;
  onEdit?: (value: TData) => void;
  onDelete?: (value: TData) => void;
  onFinalize?: (value: TData) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
  canFinalize?: boolean;
}

export function CajaUsuarioRowActions<TData>({ 
  row, 
  onEdit,
  onDelete,
  onFinalize,
  canEdit,
  canDelete,
  canFinalize
}: CajaUsuarioRowActionsProps<TData>) {
  const cajaUsuario = row.original as unknown as CajaUsuario;
  const isFinalized = !!cajaUsuario.fecha_termino;

  return (
    <div className="flex items-center space-x-2">
      {canEdit && onEdit && !isFinalized && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          title="Editar"
        >
          <Pencil className="h-4 w-4 text-blue-500" />
        </Button>
      )}

      {canEdit && !isFinalized && onFinalize && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onFinalize(row.original)}
          className="text-amber-600"
          title="Finalizar asignación"
        >
          <CalendarX className="h-4 w-4" />
        </Button>
      )}

      {canDelete && onDelete && !isFinalized && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original)}
          className="text-red-500"
          title="Eliminar"
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

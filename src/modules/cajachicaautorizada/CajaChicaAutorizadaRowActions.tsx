import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, CalendarX } from "lucide-react"
import { CajaChicaAutorizada } from "@/types/cajachicaautorizadas";

interface CajaChicaAutorizadaRowActionsProps<TData> {
  row: Row<TData>;
  onEdit?: (value: TData) => void;
  onDelete?: (value: TData) => void;
  onFinalize?: (value: TData) => Promise<void>;
}

export function CajaChicaAutorizadaRowActions<TData>({ 
  row, 
  onEdit, 
  onDelete,
  onFinalize
}: CajaChicaAutorizadaRowActionsProps<TData>) {
  const cajaChica = row.original as CajaChicaAutorizada;
  const isFinalized = !!cajaChica.fecha_termino;

  return (
    <div className="flex items-center space-x-2">
      {!isFinalized && onFinalize && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFinalize(row.original)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          title="Finalizar autorización"
        >
          <CalendarX className="h-4 w-4 mr-1" />
        
        </Button>
      )}

      {onEdit && !isFinalized && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          title="Editar"
        >
          <Pencil className="h-4 w-4 text-yellow-500" />
        </Button>
      )}

      {onDelete && !isFinalized && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original)}
          title="Eliminar"
        >
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      )}
    </div>
  );
}
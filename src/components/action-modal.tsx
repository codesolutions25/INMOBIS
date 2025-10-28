import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";

interface ActionModalProps {
  isOpen: boolean;
  action: "view" | "edit" | "delete" | null;
  data: any;
  onClose: () => void;
}

export function ActionModal({ isOpen, action, data, onClose }: ActionModalProps) {
  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "view" && "Ver detalle"}
            {action === "edit" && "Editar registro"}
            {action === "delete" && "Confirmar eliminación"}
          </DialogTitle>
        </DialogHeader>

        {/* Contenido dinámico */}
        {action === "view" && <div>Detalles: {JSON.stringify(data)}</div>}
        {action === "edit" && <div>Formulario de edición para: {JSON.stringify(data)}</div>}
        {action === "delete" && (
          <div>
            ¿Estás seguro que deseas eliminar <strong>{data?.nombre || data?.id}</strong>?
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

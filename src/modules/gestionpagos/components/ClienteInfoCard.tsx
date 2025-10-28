import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cliente } from "../types";
import { User, CreditCard, Phone, Mail } from "lucide-react";

interface ClienteInfoCardProps {
  cliente: Cliente | null;
}

export function ClienteInfoCard({ cliente }: ClienteInfoCardProps) {
  if (!cliente) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-2">
            <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">Nombre</p>
              <p className="text-base">{cliente.nombre}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CreditCard className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">Documento</p>
              <p className="text-base">{cliente.documento}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">Teléfono</p>
              <p className="text-base">{cliente.telefono}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">Email</p>
              <p className="text-base">{cliente.email}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

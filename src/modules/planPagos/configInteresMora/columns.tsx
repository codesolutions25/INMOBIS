import { ColumnDef } from "@tanstack/react-table";
import { ConfigInteresMora } from "@/modules/planPagos/models/planPagosModels";
import { formatDate } from "@/utils/dateUtils";
import { formatters } from "@/components/table/createEntityColumns"
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

type ConfigInteresMoraColumnsProps = {
  onEdit?: (config: ConfigInteresMora) => void;
  onDelete?: (id: number) => void;
  empresas: Array<{id: number, nombre: string}>;
  tiposConfiguracion: Array<{id: number, nombre: string}>;
};

export const getConfigInteresMoraColumns = ({
  onEdit,
  onDelete,
  empresas,
  tiposConfiguracion,
}: ConfigInteresMoraColumnsProps): ColumnDef<ConfigInteresMora>[] => [
  {
    accessorKey: "idEmpresa",
    header: "Empresa",
    cell: ({ row }) => {
      const empresaId = row.getValue("idEmpresa") as number;
      const empresa = empresas.find(e => e.id === empresaId);
      return empresa?.nombre || `Empresa ${empresaId}`;
    },
  },
  {
    accessorKey: "idTipoConfigFinanciera",
    header: "Tipo de Mora",
    cell: () => {
      return <div>Monto Fijo</div>;
    },
  },
  {
    accessorKey: "montoFijo",
    header: () => <div className="text-center">Mora</div>,
    cell: ({ row }) => {
      return <div className="text-center ">{formatters.currency(parseFloat(row.getValue("montoFijo")))}</div>
    },
  },
  {
    accessorKey: "aplicaDesdeDia",
    header: "Fecha Inicio",
    cell: ({ row }) => {
      const fechaInicio = row.getValue("aplicaDesdeDia") as string;
      return fechaInicio ? formatDate(fechaInicio) : 'No aplica';
    },
  },
  {
    accessorKey: "aplicaHastaDia",
    header: "Fecha Fin",
    cell: ({ row }) => {
      const fechaFin = row.getValue("aplicaHastaDia") as string;
      return fechaFin ? formatDate(fechaFin) : 'No aplica';
    },
  },

  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const config = row.original;
      
      return (
        <div className="flex space-x-2 ">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(config)}
              className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && config.idConfigInteresMora && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(config.idConfigInteresMora!)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];

export default getConfigInteresMoraColumns;

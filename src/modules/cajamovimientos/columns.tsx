"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import type { CajaMovimiento } from "@/types/cajamovimientos"
import { TipoMovimiento } from "@/types/tiposmovimiento"
import { TipoOperacion } from "@/types/tiposoperacion"
import { Caja } from "@/types/cajas"
import { CheckCircle2, XCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CajaMovimientoColumnsProps {
  onEdit: (movimiento: CajaMovimiento) => void
  onDelete: (movimiento: CajaMovimiento) => void
  onApprove: (movimiento: CajaMovimiento) => void
  tiposMovimientoMap: Record<number, TipoMovimiento>
  tiposOperacionMap: Record<number, TipoOperacion>
  cajas: Caja[]
  canEdit?: boolean
  canDelete?: boolean
}

export const getCajaMovimientoColumns = ({
  onEdit,
  onDelete,
  onApprove,
  tiposMovimientoMap = {},
  tiposOperacionMap = {},
  cajas,
  canEdit = false,
  canDelete = false,
}: CajaMovimientoColumnsProps): ColumnDef<CajaMovimiento>[] => [
    {
      id: "#",
      header: "Item",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "fecha_movimiento",
      header: "Fecha Movimiento",
      cell: ({ row }) => {
        const fechaValue = row.original.fecha_movimiento;
        if (!fechaValue) return '-';

        try {
          const date = new Date(fechaValue);
          return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date);
        } catch (error) {
          console.error('Error formateando fecha:', error);
          return '-';
        }
      },
    },
    {
      accessorKey: "id_caja",
      header: "Caja Origen",
      cell: ({ row }) => {
        const cajaId = row.original.id_caja;
        const caja = Array.isArray(cajas) ? cajas.find(caja => caja.id_caja === cajaId) : undefined;
        return caja ? caja.nombre_caja : `Caja ${cajaId}`;
      },
    },
    {
      accessorKey: "id_caja_destino",
      header: "Caja Destino",
      cell: ({ row }) => {
        const cajaId = row.original.id_caja_destino;
        if (!cajaId) return '-';
        const caja = Array.isArray(cajas) ? cajas.find(caja => caja.id_caja === cajaId) : undefined;
        return caja ? caja.nombre_caja : `Caja ${cajaId}`;
      },
    },

    {
      accessorKey: "descripcion_movimiento",
      header: "Descripción",
    },
    {
      accessorKey: "id_tipo_movimiento",
      header: "Tipo Movimiento",
      cell: ({ row }) => {
        const tipoId = row.original.id_tipo_movimiento;
        const tipoMovimiento = tiposMovimientoMap[tipoId];
        return tipoMovimiento?.nombre_tipo_movimiento || `Tipo ${tipoId}`;
      },
    },
    {
      accessorKey: "id_tipo_operacion",
      header: "Tipo Operación",
      cell: ({ row }) => {
        const tipoId = row.original.id_tipo_operacion;
        const tipoOperacion = tiposOperacionMap[tipoId];

        if (!tipoOperacion) {
          console.warn(`No se encontró el tipo de operación con ID: ${tipoId}`);
          return <span>Desconocido ({tipoId})</span>;
        }

        const tipoIngreso = process.env.NEXT_PUBLIC_TIPO_MOVIMIENTO_INGRESO || 'ingreso';
        const tipoEgreso = process.env.NEXT_PUBLIC_TIPO_MOVIMIENTO_EGRESO || 'egreso';

        // Convertir a minúsculas para hacer la comparación insensible a mayúsculas
        const nombreTipo = tipoOperacion.nombreTipoOperacion.toLowerCase();

        const isIngreso = nombreTipo === tipoIngreso.toLowerCase();
        const isEgreso = nombreTipo === tipoEgreso.toLowerCase();

        const color = isIngreso ? 'green' : isEgreso ? 'red' : 'inherit';

        return (
          <span style={{ color, fontWeight: 500 }}>
            {tipoOperacion.nombreTipoOperacion}
          </span>
        );
      },
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => {
        const monto = row.original.monto;
        const tipoId = row.original.id_tipo_operacion;
        const tipoOperacion = tiposOperacionMap[tipoId];
        const isIngreso = tipoOperacion?.nombreTipoOperacion === 'Ingreso';
        const isEgreso = tipoOperacion?.nombreTipoOperacion === 'Egreso';

        let color = 'inherit'; // default color
        if (isIngreso) color = 'green';
        else if (isEgreso) color = 'red';

        return (
          <span style={{ color, fontWeight: 500 }}>
            {new Intl.NumberFormat('es-PE', {
              style: 'currency',
              currency: 'PEN',
            }).format(monto)}
          </span>
        );
      },
    },

    {
      accessorKey: "referencia_externa",
      header: "Referencia",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = String(row.original.estado || '').toLowerCase().trim();

        // Get status values from environment variables with fallbacks
        const ESTADO_APROBADO = (process.env.ESTADO_APROBADO || 'aprobado').toLowerCase();
        const ESTADO_PENDIENTE = (process.env.ESTADO_PENDIENTE || 'pendiente').toLowerCase();

        // Check if the status matches approved status (case insensitive)
        const esAprobado =
          estado === ESTADO_APROBADO ||
          estado === 'aprobado' ||
          estado === '1' ||
          estado === 'true';

        return (
          <div className="flex items-center gap-2">
            {esAprobado ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Aprobado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-yellow-500" />
                <span>Pendiente</span>
              </>
            )}
          </div>
        );
      },
    },


    {
      id: "actions",
      cell: ({ row }) => {
        const movimiento = row.original;
        const estado = String(movimiento.estado || '').toLowerCase().trim();
        const esAprobado =
          estado === (process.env.ESTADO_APROBADO || 'aprobado').toLowerCase() ||
          estado === '1' ||
          estado === 'true';

        return (
          <div className="flex items-center gap-2">
          
            {/* Edit button - only if canEdit and not approved */}
            {canEdit && !esAprobado && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(movimiento);
                }}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {/* Delete button - only if canDelete and not approved */}
            {canDelete && !esAprobado && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(movimiento);
                }}
                title="Eliminar"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Approve button - only if canApprove and not approved */}
            {canEdit && !esAprobado && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(movimiento);
                }}
                title="Aprobar"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}

            {/* Status indicator */}
            {esAprobado && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Aprobado
              </span>
            )}
          </div>
        );
      },
    }
  ];
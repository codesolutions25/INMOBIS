"use client"

import DatatableRowActions from "@/components/table/row-actions"
import { ColumnDef } from "@tanstack/react-table"
import { TipoOperacion } from "@/types/tiposoperacion"
import { Caja } from "@/types/cajas"
import { TransaccionUnificada } from "@/services/apiCajaOperaciones"

interface CajaOperacionColumnsProps {
  tiposOperacionMap: Record<number, TipoOperacion>
  cajas: Caja[]
}

export const getCajaOperacionColumns = ({ 
  tiposOperacionMap = {},
  cajas
}: CajaOperacionColumnsProps): ColumnDef<TransaccionUnificada>[] => [
  {
    id: "#",
    header: "Item",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "fecha",
    header: "Fecha Operación",
    cell: ({ row }) => {
      const fechaValue = row.getValue("fecha") as string;
      if (!fechaValue) return null;
      
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
        return fechaValue;
      }
    },
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    accessorKey: "id_caja",
    header: "Caja",
    cell: ({ row }) => {
      const cajaId = row.original.id_caja;
      
      if (cajaId === null || cajaId === undefined) return 'Sin caja asignada';
      
      const foundCaja = Array.isArray(cajas) ? cajas.find(c => {
        return c.id_caja === cajaId;
      }) : undefined;
      
      return foundCaja ? foundCaja.nombre_caja : `Caja ID: ${cajaId} (no encontrada)`;
    },
  },
  {
    accessorKey: "id_tipo_operacion",
    header: "Tipo Operación",
    cell: ({ row }) => {
      const tipoId = row.original.id_tipo_operacion; 
      if (tipoId === null || tipoId === undefined) return 'Sin tipo';
      
      const tipoOperacion = tiposOperacionMap[tipoId];
      const tipoNombre = tipoOperacion?.nombreTipoOperacion || `Tipo ${tipoId}`;
      
      // Determine if it's an income or expense based on the name (you might need to adjust this logic)
      const isIngreso = tipoNombre.toLowerCase().includes('ingreso');
      const isEgreso = tipoNombre.toLowerCase().includes('egreso');
      
      const color = isIngreso ? 'green' : isEgreso ? 'red' : 'inherit';
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {tipoNombre}
        </span>
      );
    },
  },
  {
    accessorKey: "monto",
    header: "Monto",
    cell: ({ row }) => {
      const monto = parseFloat(row.getValue("monto") as string);
      const tipoId = row.original.id_tipo_operacion;
      const tipoOperacion = tipoId != null ? tiposOperacionMap[tipoId] : undefined;
      const tipoNombre = tipoOperacion?.nombreTipoOperacion || '';
      
      // Determine if it's an income or expense based on the name
      const isIngreso = tipoNombre.toLowerCase().includes('ingreso');
      const isEgreso = tipoNombre.toLowerCase().includes('egreso');
      
      let color = 'inherit';
      if (isIngreso) color = 'green';
      else if (isEgreso) color = 'red';
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {isEgreso ? '-' : ''}
          {new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
          }).format(monto)}
        </span>
      );
    },
  },
  {
    accessorKey: "referencia",
    header: "Referencia",
    cell: ({ row }) => row.original.referencia || '-',
  },
  {
    id: "tipo",
    header: "Tipo de Transacción",
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      return tipo === 'operacion' ? 'Operación' : 'Movimiento';
    },
  },
 
 
]
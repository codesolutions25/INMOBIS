"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CajaChicaAutorizada } from "@/types/cajachicaautorizadas"
import { Usuario } from "@/types/usuarios"
import { Caja } from "@/types/cajas"
import { CajaChicaAutorizadaRowActions } from "./CajaChicaAutorizadaRowActions"

interface CajaChicaAutorizadaColumnsProps {
  onEdit: (cajaChica: CajaChicaAutorizada) => void
  onDelete: (cajaChica: CajaChicaAutorizada) => void
  onFinalize: (cajaChica: CajaChicaAutorizada) => Promise<void>
  usuariosMap: Record<number, Usuario>
  cajasMap: Record<number, Caja>
}

export const getCajaChicaAutorizadaColumns = ({ 
  onEdit, 
  onDelete,
  onFinalize,
  usuariosMap,
  cajasMap
}: CajaChicaAutorizadaColumnsProps): ColumnDef<CajaChicaAutorizada>[] => [
  {
    accessorKey: "id_autorizacion",
    header: "ID",
  },
  {
    accessorKey: "id_caja",
    header: "Caja",
    cell: ({ row }) => {
      const cajaId = row.original.id_caja;
      const caja = cajaId ? cajasMap[cajaId] : null;
      return caja ? `Caja #${caja.id_caja}`  : 'Caja no encontrada';
    },
  },
  {
    accessorKey: "id_usuario",
    header: "Usuario",
    cell: ({ row }) => {
      const usuarioId = row.original.id_usuario;
      const usuario = usuarioId ? usuariosMap[usuarioId] : null;
      
      if (!usuario) return 'Usuario no encontrado';
      
      const username = usuario.username || 'Sin nombre';
      const status = usuario.estaActivo === false ? ' (Inactivo)' : '';
      
      return `${username}${status}`;
    },
  },
  {
    accessorKey: "fecha_asignacion",
    header: "Fecha de Asignación",
    cell: ({ row }) => {
      const fecha = row.original.fecha_asignacion;
      console.log(fecha);
      return fecha ? formatDate(fecha) : '-sda';
    },
  },
  {
    accessorKey: "fecha_termino",
    header: "Fecha de Término",
    cell: ({ row }) => {
      const fecha = row.original.fecha_termino;
      return fecha ? formatDate(fecha) : '-';
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <CajaChicaAutorizadaRowActions 
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onFinalize={onFinalize}
      />
    )
  },
]

// Helper function to format dates consistently
function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date value: ${dateString}`);
      return '-';
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return '-';
  }
}
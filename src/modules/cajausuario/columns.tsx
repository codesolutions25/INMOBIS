"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { CajaUsuario } from "@/types/cajausuario"
import { UsuarioConEmpresa } from "@/types/usuarioConEmpresa"
import { Persona } from "@/types/persona"
import { Caja } from "@/types/cajas"
import { TipoCaja } from "@/schemas/tipoCajaSchema"
import { PuntoVenta } from "@/types/puntoventa"
import { Empresa } from "@/types/empresas"
import { CajaUsuarioRowActions } from "./CajaUsuarioRowActions"

interface CajaUsuarioColumnsProps {
  onEdit: (cajaUsuario: CajaUsuario) => void
  onDelete: (cajaUsuario: CajaUsuario) => void
  onFinalize: (cajaUsuario: CajaUsuario) => Promise<void>
  usuariosMap: Record<number, UsuarioConEmpresa>
  personasMap: Record<number, Persona>
  cajasMap: Record<number, Caja>
  tiposCajaMap: Record<number, TipoCaja>
  puntosVentaMap: Record<number, PuntoVenta>
  empresasMap: Record<number, Empresa>
  canEdit: boolean
  canDelete: boolean
  canFinalize: boolean
}

export const getCajaUsuarioColumns = ({
  onEdit,
  onDelete,
  onFinalize,
  usuariosMap,
  personasMap,
  cajasMap,
  tiposCajaMap,
  puntosVentaMap,
  empresasMap,
  canEdit,
  canDelete,
  canFinalize
}: CajaUsuarioColumnsProps): ColumnDef<CajaUsuario>[] => [
    {
      id: "#",
      header: "Item",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "fecha_asignacion",
      header: "Fecha de Asignación",
      cell: ({ row }) => {
        const fechaValue = row.getValue("fecha_asignacion") as string;
        return formatDate(fechaValue);
      },
    },
    {
      accessorKey: "fecha_termino",
      header: "Fecha de Término",
      cell: ({ row }) => {
        const fechaValue = row.getValue("fecha_termino") as string;
        const cajaUsuario = row.original;
        return cajaUsuario.fecha_termino ? formatDate(fechaValue) : "-";
      },
    },
    {
      accessorKey: "id_usuario",
      header: "Usuario",
      cell: ({ row }) => {
      
        const usuarioId = row.original.id_usuario;
       
        
        // Find the usuario first
        const usuario = usuarioId ? usuariosMap[usuarioId] : null;
       
        
        if (!usuario) return 'Usuario no encontrado';
        
        // Get persona data if available
        const personaId = usuario.id_persona;
        const persona = personaId ? personasMap[personaId] : null;
        
        // Build display name with null checks
        const nombreCompleto = persona 
            ? `${persona.nombre || ''} ${persona.apellidoPaterno || ''} ${persona.apellidoMaterno || ''}`.trim()
            : '';
        
        // If we found a usuario with username, use it as fallback
        if (!nombreCompleto && usuario?.username) {
            return usuario.username;
        }
        
        return nombreCompleto || 'Usuario sin nombre';
      },
    },
    {
      accessorKey: "nombre_caja",
      header: "Caja",
      cell: ({ row }) => {
        const cajaId = row.original.id_caja;
        const caja = cajaId ? cajasMap[cajaId] : null;

        return caja?.nombre_caja || 'Sin caja';
      },
    },
    {
      accessorKey: "tipo_caja",
      header: "Tipo de Caja",
      cell: ({ row }) => {
        const cajaId = row.original.id_caja;
        const caja = cajaId ? cajasMap[cajaId] : null;
        const tipoCaja = caja?.id_tipo_caja ? tiposCajaMap[caja.id_tipo_caja] : null;

        return tipoCaja?.nombre_tipo_caja || 'Sin tipo';
      },
    },
   

    
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <CajaUsuarioRowActions
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
          onFinalize={onFinalize}
          canEdit={canEdit}
          canDelete={canDelete}
          canFinalize={canFinalize}
        />
      ),
    },
  ]

// Helper function to format dates consistently
function formatDate(dateString?: string): string {
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
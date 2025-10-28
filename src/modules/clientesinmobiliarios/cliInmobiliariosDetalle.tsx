"use client"

import { ClienteInmobiliario } from "@/types/clienteInmobiliario";
import { Home, Users, MapPin, Tag, CalendarCheck2, CalendarMinus, Building2, FileText, Phone, Mail } from 'lucide-react';
import EntityDetailView from "@/components/detail/EntityDetailView";
import { formatDate } from "@/utils/dateUtils";

type ClienteInmobiliarioDetalleProps = {
    clienteInmobiliario: ClienteInmobiliario;
}

export default function ClienteInmobiliarioDetalle({ clienteInmobiliario }: ClienteInmobiliarioDetalleProps) {
    const mainInfoItems = [
        {
            icon: <Tag className="h-4 w-4 text-gray-500" />,
            label: "Id",
            value: clienteInmobiliario.idClientesInmobiliarios
        },
        {
            icon: <CalendarCheck2 className="h-4 w-4 text-gray-500" />,
            label: "Fecha Creación",
            value: formatDate(clienteInmobiliario.fechaCreacion)
        }
    ];

    const caracteristicasContent = (
        <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Persona (ID) :</span>
                <span className="text-sm font-semibold"> {clienteInmobiliario.nombrePersona} ({clienteInmobiliario.idPersona})</span>
            </div>
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Empresa (ID) :</span>
                <span className="text-sm font-semibold"> {clienteInmobiliario.nombreEmpresa} ({clienteInmobiliario.idEmpresa})</span>
            </div>
        </div>
    )

    const observacionesContent = (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Observaciones
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{clienteInmobiliario.observaciones || "Sin observaciones disponibles"}</p>
        </div>
    )

    const sections = [
        {
            title: "Características",
            icon: <Tag className="h-5 w-5 text-primary" />,
            content: caracteristicasContent
        },
        {
            title: "Observaciones",
            icon: <FileText className="h-5 w-5 text-primary" />,
            content: observacionesContent
        }
    ]

    return (
        <EntityDetailView
            title="Cliente Inmobiliario"
            titleIcon={<Home className="h-5 w-5 text-primary" />}
            mainInfoItems={mainInfoItems}
            sections={sections}
        />
    )
}
"use client"

import { Cotizacion } from "@/types/cotizaciones"
import { NotebookPen,BadgePercent,PiggyBank, Home, Receipt, Tag, CalendarCheck2, Building2} from 'lucide-react';
import EntityDetailView from "@/components/detail/EntityDetailView";
import { formatDate } from "@/utils/dateUtils";

type CotizacionDetalleProps = {
    cotizacion: Cotizacion;
}

export default function CotizacionDetalle({ cotizacion }: CotizacionDetalleProps) {
    const mainInfoItems = [
        {
            icon: <Home className="h-4 w-4 text-gray-500" />,
            label: "ID",
            value: cotizacion.idCotizaciones
        },
        {
            icon: <CalendarCheck2 className="h-4 w-4 text-gray-500" />,
            label: "Fecha de cotización",
            value: formatDate(cotizacion.fechaCotizacion)
        },
        {
            icon: <PiggyBank className="h-4 w-4 text-gray-500" />,
            label: "Moneda",
            value: cotizacion.moneda
        },
        {
            icon: <Receipt className="h-4 w-4 text-gray-500" />,
            label: "Precio final",
            value: cotizacion.precioFinal
        }
    ]

    const caracteristicasContent = (
        <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                <NotebookPen className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">ID Cliente Inmobiliario:</span>
                <span className="text-sm font-semibold">{cotizacion.idClienteInmobiliario}</span>
            </div>
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                <NotebookPen className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">ID Estado Cotización:</span>
                <span className="text-sm font-semibold">{cotizacion.idEstadoCotizacion}</span>
            </div>
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                <NotebookPen className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">ID Propiedad:</span>
                <span className="text-sm font-semibold">{cotizacion.idPropiedad}</span>
            </div>
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                <BadgePercent className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Descuento:</span>
                <span className="text-sm font-semibold">{cotizacion.descuento}</span>
            </div>
        </div>
    )

    const InformacionContent = (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Observaciones:</span>
                    <span className="font-semibold text-base">{cotizacion.observaciones}</span>
                </div>
            </div>
        </div>
    )

    const sections = [
        {
            title: "Información",
            icon: <Building2 className="h-5 w-5 text-primary" />,
            content: InformacionContent
        },
        {
            title: "Características",
            icon: <NotebookPen className="h-5 w-5 text-primary" />,
            content: caracteristicasContent
        }
    ]

    return (
        <EntityDetailView
            title="Observaciones"
            titleIcon={<Home className="h-5 w-5 text-primary" />}
            mainInfoItems={mainInfoItems}
            sections={sections}
        />
    );
}


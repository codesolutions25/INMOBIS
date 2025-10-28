"use client"

import { DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { useState, useEffect, ReactElement } from "react"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cotizacionSchema } from "@/schemas/cotizacionesSchema"

import { createCotizacion, updateCotizacion } from "@/services/apiCotizaciones"
import { getCotizaciones } from "@/services/apiCotizaciones"

import { Cotizacion } from "@/types/cotizaciones"
import { useAlert } from "@/contexts/AlertContext"

import EntityForm from "@/components/form/EntityForm"
import FormFieldWrapper from "@/components/form/FormFieldWrapper"
import { Combobox } from "@/components/ui/combobox"
import { ClienteInmobiliario } from "@/types/clienteInmobiliario"

type CotizacionFormValues = z.infer<typeof cotizacionSchema>

type CotizacionFormProps = {
    cotizacion?: Cotizacion;
    onSuccess?: () => void;
    closeModal?: () => void;
}

export default function CotizacionesForm({ cotizacion, onSuccess, closeModal }: CotizacionFormProps): ReactElement {
    
    const isEditing = !!cotizacion;
    const { showAlert } = useAlert();
    
    const [clientesInmobiliarios, setClientesInmobiliarios] = useState<{value: string, label: string}[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchClientesInmobiliarios = async () => {
            try {
                const clientesInmobiliariosData = await getCotizaciones();
                const formattedClientesInmobiliarios = clientesInmobiliariosData.data.map((clienteInmobiliario: ClienteInmobiliario) => ({
                    value: clienteInmobiliario.idClientesInmobiliarios.toString(),
                    label: `${clienteInmobiliario.idPersona} (ID: ${clienteInmobiliario.idClientesInmobiliarios})`
                }));
                setClientesInmobiliarios(formattedClientesInmobiliarios);
            } catch (error) {
                console.error('Error al cargar clientes inmobiliarios:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los clientes inmobiliarios');
            }
        };
        
        fetchClientesInmobiliarios();
    }, [showAlert]);
}

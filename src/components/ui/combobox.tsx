"use client"

import * as React from "react"
import { DropdownList } from "react-widgets"
import "react-widgets/styles.css"

export interface ComboboxOption {
    label: string
    value: string | number
}

interface ComboboxProps {
    options: ComboboxOption[]
    placeholder?: string
    emptyMessage?: string
    selected?: string | number
    onChange?: (value: string) => void
    disabled?: boolean
}

export function Combobox({
    options,
    placeholder = "Seleccionar opción...",
    emptyMessage = "No se encontraron resultados.",
    selected,
    onChange,
    disabled,
}: ComboboxProps) {
    // Estado interno para el valor seleccionado
    const [currentValue, setCurrentValue] = React.useState<string | number | undefined>(
        selected !== undefined ? String(selected) : undefined
    )
    
    // Sincronizar el estado interno cuando cambia la prop selected
    React.useEffect(() => {
        setCurrentValue(selected !== undefined ? String(selected) : undefined)
    }, [selected])
    
    // Transformar las opciones al formato que espera react-widgets
    const transformedOptions = React.useMemo(() => {
        return options.map(option => ({
            value: String(option.value),
            text: option.label
        }))
    }, [options])
    
    // Encontrar la opción seleccionada para mostrar su etiqueta
    const selectedOption = React.useMemo(() => {
        return transformedOptions.find(option => option.value === currentValue)
    }, [transformedOptions, currentValue])
    
    // Manejar el cambio de selección
        const handleChange = (value: { value: string } | null) => {
        const newValue = value?.value
        setCurrentValue(newValue)
        if (onChange && newValue !== undefined) {
            onChange(newValue)
        }
    }
    
    return (
        <div className="relative w-full mt-2">
            <DropdownList
                data={transformedOptions}
                value={selectedOption}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder}
                textField="text"
                dataKey="value"
                messages={{
                    emptyFilter: emptyMessage,
                    emptyList: emptyMessage
                }}
                filter="contains"
            />
        </div>
    )
}
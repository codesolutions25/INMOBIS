"use client"

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { Info } from 'lucide-react';

type DetailSection = {
    title: string;
    icon?: ReactNode;
    content: ReactNode;
    className?: string;
}

type MainInfoItem = {
    icon?: ReactNode;
    label: string;
    value: string | number | ReactNode;
}

type EntityDetailViewProps = {
    title: string;
    titleIcon?: ReactNode;
    mainInfoItems: MainInfoItem[];
    sections: DetailSection[];
    footerContent?: ReactNode;
    fullWidthContent?: ReactNode; // Contenido que ocupará todo el ancho
}

export default function EntityDetailView({ 
    title, 
    titleIcon, 
    mainInfoItems, 
    sections,
    footerContent,
    fullWidthContent
}: EntityDetailViewProps) {
    return (
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[80vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
                    {titleIcon}
                    {title}
                </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col space-y-6">
                {/* Información principal - Arriba (solo se muestra si hay elementos) */}
                {mainInfoItems.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 shadow-sm">
                        <h2 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Info className="h-5 w-5" /> Información Principal
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                            {mainInfoItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    {item.icon}
                                    <span className="text-sm font-medium">{item.label}:</span>
                                    <span className={typeof item.value === 'string' || typeof item.value === 'number' ? "text-sm" : ""}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Secciones dinámicas - Imágenes y detalles organizados */}
                <div className="flex flex-col gap-6">
                    {/* Layout de dos columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-start">
                        {/* Columna Izquierda (Contenido Principal) */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {sections
                                .filter(s => s.className?.includes('lg:col-span-2'))
                                .map((section, index) => (
                                    <div key={`left-${section.title}-${index}`} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col">
                                        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            {section.icon}
                                            {section.title}
                                        </h2>
                                        <div className="flex-grow">
                                            {section.content}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Columna Derecha (Stack de Tarjetas) */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            {sections
                                .filter(s => 
                                    !s.className?.includes('lg:col-span-2') && 
                                    !s.className?.includes('lg:col-span-3')
                                )
                                .map((section, index) => (
                                    <div key={`right-${section.title}-${index}`} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            {section.icon}
                                            {section.title}
                                        </h2>
                                        {section.content}
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Secciones de Ancho Completo */}
                    <div className="flex flex-col gap-6">
                        {sections
                            .filter(s => s.className?.includes('lg:col-span-3'))
                            .map((section, index) => (
                                <div key={`full-${section.title}-${index}`} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col">
                                    <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        {section.icon}
                                        {section.title}
                                    </h2>
                                    <div className="flex-grow">
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
                
                {fullWidthContent && (
                    <div className="w-full">
                        {fullWidthContent}
                    </div>
                )}
            </div>
            
        </DialogContent>
    );
}

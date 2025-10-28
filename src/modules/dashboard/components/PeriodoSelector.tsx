"use client"

import { Periodo as PeriodoType } from '../types/dashboard.types';
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PeriodoSelectorProps {
  value: PeriodoType;
  onChange: (value: PeriodoType) => void;
  year: number;
  onYearChange: (year: number) => void;
  className?: string;
}

const periodos = [
  { value: 'mes_actual', label: 'Mes Actual' },
  { value: 'mes_anterior', label: 'Mes Anterior' },
  { value: 'ultimos_3_meses', label: 'Últimos 3 Meses' },
  { value: 'ultimos_6_meses', label: 'Últimos 6 Meses' },
  { value: 'este_año', label: 'Este Año' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
  value: (currentYear - i).toString(),
  label: (currentYear - i).toString()
}));

export function PeriodoSelector({ 
  value, 
  onChange, 
  year,
  onYearChange,
  className 
}: PeriodoSelectorProps) {
  return (
    <div className={cn("flex flex-col space-y-2 md:flex-row md:items-center md:space-x-4 md:space-y-0 w-full", className)}>
      <div className="flex items-center justify-between w-full md:w-auto">
        <span className="text-sm font-medium whitespace-nowrap mr-2">Año:</span>
        <Select
          value={year.toString()}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          options={years}
          className="w-full md:w-[100px]"
        />
      </div>
      <div className="flex items-center justify-between w-full md:w-auto">
        <span className="text-sm font-medium whitespace-nowrap mr-2">Período:</span>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value as PeriodoType)}
          options={periodos}
          className="w-full md:w-[180px]"
        />
      </div>
    </div>
  );
}

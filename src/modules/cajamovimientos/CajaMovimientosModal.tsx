"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CajaMovimiento } from "@/types/cajamovimientos"
import { TipoOperacion } from "@/types/tiposoperacion"

interface CajaMovimientosModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  filteredMovimientos: CajaMovimiento[]
  tiposOperacionMap: Array<{
    value?: number | string
    label?: string
    idTipoOperacion?: number
    nombreTipoOperacion?: string
  }>
  isLoading?: boolean
}

export function CajaMovimientosModal({
  isOpen,
  onOpenChange,
  onConfirm,
  filteredMovimientos,
  tiposOperacionMap,
  isLoading = false
}: CajaMovimientosModalProps) {
  // Format number with 2 decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // Calculate totals
  const calculateTotals = () => {
    let ingresos = 0;
    let egresos = 0;
    
    filteredMovimientos.forEach(movimiento => {
      const tipoOperacion = tiposOperacionMap.find(t => 
        (t as any).idTipoOperacion === movimiento.id_tipo_operacion || 
        t.value === movimiento.id_tipo_operacion
      );
      const amount = Number(movimiento.monto || 0);
      const tipoNombre = getTipoOperacionName(tipoOperacion).toLowerCase();
      
      if (tipoNombre === 'ingreso') {
        ingresos += amount;
      } else if (tipoNombre === 'egreso') {
        egresos += amount;
      }
    });

    return {
      ingresos,
      egresos,
      saldo: ingresos - egresos
    };
  };

  // Helper function to get tipo operacion name safely
  const getTipoOperacionName = (tipo: any): string => {
    if (!tipo) return 'Desconocido';
    return tipo.nombreTipoOperacion || tipo.label || 'Desconocido';
  };

  const { ingresos, egresos, saldo } = calculateTotals();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro de cerrar la caja?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Esta acción es irreversible. Una vez cerrada, no podrá reabrir la caja.</p>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {/* Total Balance */}
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="text-sm font-medium text-gray-500">Saldo Actual</div>
                <div className="text-sm font-bold">
                  S/ {formatCurrency(saldo)}
                </div>
              </div>

              {/* Total Ingresos */}
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="text-sm font-medium text-gray-500">Total Ingresos</div>
                <div className="text-sm font-semibold text-green-600">
                  + S/ {formatCurrency(ingresos)}
                </div>
              </div>

              {/* Total Egresos */}
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                <div className="text-sm font-medium text-gray-500">Total Egresos</div>
                <div className="text-sm font-semibold text-red-600">
                  - S/ {formatCurrency(egresos)}
                </div>
              </div>
            </div>
            
            <p>¿Desea continuar con el cierre de la caja?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Cerrando...' : 'Cerrar Caja'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

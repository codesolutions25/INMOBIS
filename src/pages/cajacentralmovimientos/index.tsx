import { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import CajaMovimientosList from '@/modules/cajamovimientos/CajaMovimientosList';
import { getTiposCaja } from '@/services/apiTiposCaja';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Componente interno que usa el hook useAlert
function CajaCentralMovimientosContent() {
    const [tipoCajaId, setTipoCajaId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showAlert } = useAlert();

    useEffect(() => {
        const fetchTipoCajaId = async () => {
            try {
                const response = await getTiposCaja(1, 100);
                const tiposCaja = response.data;

                // Buscar el tipo de caja que coincida con el nombre en las variables de entorno
                const tipoCajaCentral = tiposCaja.find(
                    tipo => tipo.nombre_tipo_caja === process.env.NEXT_PUBLIC_TIPO_CAJA_CENTRAL
                );

                if (tipoCajaCentral) {
                    setTipoCajaId(tipoCajaCentral.id_tipo_caja);
                } else {
                    console.error('No se encontró el tipo de caja central en la base de datos');
                    showAlert('error', 'Error', 'No se pudo cargar la configuración de tipos de caja');
                }
            } catch (error) {
                console.error('Error al obtener los tipos de caja:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los tipos de caja');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTipoCajaId();
    }, [showAlert]);

    if (isLoading) {
        return (
            <ProtectedRoute>
                <AdminLayout moduleName='Movimientos de Caja Central'>
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4A6E]"></div>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        );
    }

    if (!tipoCajaId) {
        return (
            <ProtectedRoute>
                <AdminLayout moduleName='Movimientos de Caja Central'>
                    <div className="text-center py-8 text-red-500">
                        No se pudo cargar la configuración de la caja central
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Movimientos de Caja Central'>
                <CajaMovimientosList tipoCajaId={tipoCajaId} cajaType="central" />
            </AdminLayout>
        </ProtectedRoute>
    );
}

// Componente principal que envuelve con AlertProvider
export default function CajaCentralMovimientosPage() {
    return (
        <AlertProvider>
            <CajaCentralMovimientosContent />
        </AlertProvider>
    );
}

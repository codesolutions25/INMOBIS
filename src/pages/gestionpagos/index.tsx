import AdminLayout from '@/layouts/AdminLayout';
import GestionPagosList from '@/modules/gestionpagos/GestionPagosList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function GestionPagosPage() {
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Gestion de pagos'>
                <GestionPagosList />
            </AdminLayout>
        </ProtectedRoute>
    )
}
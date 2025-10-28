import AdminLayout from '@/layouts/AdminLayout';
import FeriadosGlobalesList from '@/modules/planPagos/feriadosGlobales/FeriadosGlobalesList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function FeriadosGlobalesPage() {
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Feriados'>
                <FeriadosGlobalesList />
            </AdminLayout>
        </ProtectedRoute>
    )
}
import AdminLayout from '@/layouts/AdminLayout';
import TiposCajaList from '@/modules/tiposcaja/TiposCajaList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TiposCajaPage() {
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Tipos de caja'>
                <TiposCajaList />
            </AdminLayout>
        </ProtectedRoute>
    )
}
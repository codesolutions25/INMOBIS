import AdminLayout from '@/layouts/AdminLayout';
import EstadosCajaList from '@/modules/estadoscaja/EstadosCajaList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EstadosCajaPage() {
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Estados de caja'>
                <EstadosCajaList />
            </AdminLayout>
        </ProtectedRoute>
    )
}
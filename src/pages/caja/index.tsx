import AdminLayout from '@/layouts/AdminLayout';
import CajaList from '@/modules/caja/CajaList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CajaPage(){
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Caja'>
                <CajaList />
            </AdminLayout>
        </ProtectedRoute>
    )
}
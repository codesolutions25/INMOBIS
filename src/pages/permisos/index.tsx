import AdminLayout from "@/layouts/AdminLayout";
import PermisoList from '@/modules/permisos/PermisoList'
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PermisoPage(){
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Permisos'>
                <PermisoList />
            </AdminLayout>
        </ProtectedRoute>
    );
}
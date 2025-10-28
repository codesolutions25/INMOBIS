import AdminLayout from '@/layouts/AdminLayout';
import CajaUsuarioList from '@/modules/cajausuario/CajaUsuarioList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CajaUsuarioPage() {
    return (
        <ProtectedRoute requiredPermission={5}>
            <AdminLayout moduleName="CajaUsuario">
                <CajaUsuarioList />
            </AdminLayout>
        </ProtectedRoute>
    )
}


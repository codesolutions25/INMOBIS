import AdminLayout from '@/layouts/AdminLayout';
import UsuarioList from '@/modules/usuario/UsuarioList';

export default function UsuarioPage() {
    return (
        <AdminLayout moduleName='Usuario'>
            <UsuarioList />
        </AdminLayout>
    )
}
import AdminLayout from '@/layouts/AdminLayout';
import TiposOperacionList from '@/modules/tiposoperacion/TiposOperacionList';

export default function TiposOperacionPage() {
    return (
        <AdminLayout moduleName='Tipos de Operación'>
            <TiposOperacionList />
        </AdminLayout>
    )
}
import AdminLayout from '@/layouts/AdminLayout';
import CajasOperacionesList from '@/modules/cajaoperaciones/CajasOperacionesList';

export default function CajaOperacionesPage() {
    return (
        <AdminLayout moduleName='Caja Operaciones'>
            <CajasOperacionesList />
        </AdminLayout>
    )
}

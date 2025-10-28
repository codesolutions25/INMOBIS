import AdminLayout from '@/layouts/AdminLayout';
import CajaMovimientosList from '@/modules/cajamovimientos/CajaMovimientosList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CajaChicaAutorizadaPage() {
    const tipoCajaIdChica = 3;

    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Caja Chica Autorizadas'>
                <CajaMovimientosList cajaType="chica" tipoCajaId={tipoCajaIdChica} />
            </AdminLayout>
        </ProtectedRoute>
    )
}
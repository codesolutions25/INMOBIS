import AdminLayout from '@/layouts/AdminLayout';
import TipoPagoList from '@/modules/tipopago/TipoPagoList';

export default function TipoPagoPage() {
    return (
        <AdminLayout moduleName='Tipos de Pago'>
            <TipoPagoList />
        </AdminLayout>
    )
}
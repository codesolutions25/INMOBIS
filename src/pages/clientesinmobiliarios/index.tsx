import AdminLayout from '@/layouts/AdminLayout';
import ClienteInmobiliarioList from '@/modules/clientesinmobiliarios/cliInmobiliariosList';

export default function ClientesInmobiliariosPage() {
    return (
        <AdminLayout moduleName='Clientes Inmobiliarios'>
            <ClienteInmobiliarioList />
        </AdminLayout>
    )
}

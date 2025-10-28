import AdminLayout from '@/layouts/AdminLayout';
import PuntoVentaList from '@/modules/puntoventa/PuntoVentaList';

export default function PuntoVentaPage(){
    return (
        <AdminLayout moduleName='Punto Venta'>
            <PuntoVentaList />
        </AdminLayout>
    )
}
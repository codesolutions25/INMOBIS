import AdminLayout from '@/layouts/AdminLayout';
import TiposMovimientoList from '@/modules/tiposmovimiento/TipoMovimientoList';

export default function TiposMovimientosPage() {
    return (
        <AdminLayout moduleName='Tipos de Movimientos'>
            <TiposMovimientoList />
        </AdminLayout>
    )
}
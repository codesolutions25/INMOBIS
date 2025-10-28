import AdminLayout from '@/layouts/AdminLayout';
import CaracteristicasInmobiliariosList from '@/modules/GestionImobiliaria/caracteristicasinmobiliarios/CaracteristicasInmobiliariosList';

export default function CaracteristicasInmobiliariosPage() {
    return (
        <AdminLayout moduleName='Características Inmobiliarias'>
            <CaracteristicasInmobiliariosList />
        </AdminLayout>
    )
}

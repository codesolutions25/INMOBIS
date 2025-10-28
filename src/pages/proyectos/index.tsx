import AdminLayout from '@/layouts/AdminLayout';
import ProyectosList from '@/modules/GestionImobiliaria/proyectos/ProyectosList';


export default function ProyectosPage(){
    return (
        <AdminLayout moduleName='Proyectos'>
            <ProyectosList />
        </AdminLayout>
    )
}
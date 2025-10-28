import AdminLayout from '@/layouts/AdminLayout';
import EmpresasList from '@/modules/empresas/EmpresasList';

export default function PropertiesPage(){
    return (
        <AdminLayout moduleName='Empresas'>
            <EmpresasList />
        </AdminLayout>
    )
}
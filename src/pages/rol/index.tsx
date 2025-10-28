import AdminLayout from '@/layouts/AdminLayout';
import RolList from '@/modules/rol/RolList';

export default function RolesPage() {
    return (
        <AdminLayout moduleName='Roles'>
            <RolList />
        </AdminLayout>
    )
}
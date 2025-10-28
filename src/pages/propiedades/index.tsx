import AdminLayout from "@/layouts/AdminLayout";
import PropiedadesList from '@/modules/GestionImobiliaria/propiedades/PropiedadesList'

export default function PropiedadesPage() {
    return (
        <AdminLayout moduleName='Propiedades'>
            <PropiedadesList />
        </AdminLayout>
    );
}
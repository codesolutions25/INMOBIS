import AdminLayout from "@/layouts/AdminLayout";
import PersonaList from '@/modules/persona/PersonaList'

export default function PersonaPage(){
    return (
        <AdminLayout moduleName='Persona'>
            <PersonaList />
        </AdminLayout>
    );
}
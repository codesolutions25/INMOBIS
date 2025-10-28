import AdminLayout from "@/layouts/AdminLayout";
import ConfigInteresMoraList from "@/modules/planPagos/configInteresMora/ConfigInteresMoraList";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ConfigInteresMoraPage() {
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Configuración de Moras'>
                <ConfigInteresMoraList />
            </AdminLayout>
        </ProtectedRoute>
    )
}

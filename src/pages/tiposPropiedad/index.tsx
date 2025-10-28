import AdminLayout from "@/layouts/AdminLayout";
import TiposPropiedadList from "@/modules/tiposPropiedad/tiposPropiedadList";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TiposPropiedadPage() {
    return (
        <ProtectedRoute>
            <AdminLayout moduleName='Tipos de Propiedad'>
                <TiposPropiedadList />
            </AdminLayout>
        </ProtectedRoute>
    )
}

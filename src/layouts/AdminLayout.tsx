import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Combobox } from "@/components/ui/combobox"
import Link from "next/link"
import { NavUser } from "@/components/ui/nav-user"
import { AlertProvider } from "@/contexts/AlertContext"
import { Toaster } from "sonner"
import { getEmpresas } from "@/services/apiEmpresa"
import { useState, useCallback, useEffect } from "react"
import { useCompany } from "@/contexts/CompanyContext";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { Empresa } from "@/types/empresas";

interface AdminLayoutProps {
  children: React.ReactNode
  moduleName: string
}

export default function AdminLayout({ children, moduleName }: AdminLayoutProps) {
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<{ value: string; label: string }[]>([]);
  const [empresasData, setEmpresasData] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname() || '';
  const isUserPage = pathname?.startsWith('/usuario') || false;
  const isPermissionPage = pathname?.startsWith('/permisos') || false;
  const isPersonaPage = pathname?.startsWith('/persona') || false;

  // Usar datos de persona del usuario directamente (sin cargar externos)
  const userData = user ? {
    id: user.id,
    idPersona: user.idPersona,
    nombre: user.persona?.nombre || user.nombre || '',
    apellidoPaterno: user.persona?.apellido_paterno || user.apellidoPaterno || '',
    apellidoMaterno: user.persona?.apellido_materno || user.apellidoMaterno || '',
    username: user.username,
    email: user.email,
    telefonoPrincipal: user.persona?.telefono_principal || user.telefono || '',
    telefonoSecundario: user.persona?.telefono_secundario || '',
    direccion: user.persona?.direccion || '',
    numeroDocumento: user.persona?.numero_documento || '',
    genero: user.persona?.id_tipo_genero?.toString() || '',
    fechaNacimiento: user.persona?.fecha_nacimiento || '',
    tipo_usuario: user.tipo_usuario,
    avatar: "/avatars/shadcn.jpg",
    type: user.tipo_usuario === 'company' ? 'company' as const : 'system' as const,
    // Incluir id_empresa para usuarios de compañía
    ...(user.tipo_usuario === 'company' && user.id_empresa ? { 
      idEmpresa: user.id_empresa,
      id_empresa: user.id_empresa
    } : {})
  } as any : null;

  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getEmpresas(1, 1000)
      let empresasData = response.data || [];

      // Filter for active companies
      empresasData = empresasData.filter((empresa: Empresa) => empresa.esActiva);

      if (!user) {
        return;
      }
      // Handle company filtering based on user type
      if (user.tipo_usuario === 'company' && user.id_empresa) {
        // For company users, only show their company
        const userCompanyId = user.id_empresa;

        const filteredEmpresas = empresasData.filter((empresa: Empresa) => {
          const empresaId = empresa.idEmpresa;
          return empresaId === userCompanyId;
        });

        // Auto-select the company for company users
        if (filteredEmpresas.length > 0 && !selectedCompany) {
          setSelectedCompany(filteredEmpresas[0]);
        }

        // Update the empresasData with filtered results
        empresasData = filteredEmpresas;
      } else if (user.tipo_usuario === 'regular' && empresasData.length > 0 && !selectedCompany) {
        // For regular users, auto-select the first company
        setSelectedCompany(empresasData[0]);
      }

      setEmpresasData(empresasData);

      const formattedEmpresas = empresasData.map((empresa: Empresa) => ({
        value: empresa.idEmpresa.toString(),
        label: empresa.razonSocial || `Empresa ${empresa.idEmpresa}`
      }))

      setEmpresas(formattedEmpresas);

      // Auto-select the company if there's only one
      if (empresasData.length === 1 && !selectedCompany) {
        setSelectedCompany(empresasData[0]);
      } else if (selectedCompany) {
        // Make sure the selected company still exists in the filtered list
        const companyStillExists = empresasData.some(
          e => e.idEmpresa === selectedCompany.idEmpresa
        );
        if (!companyStillExists && empresasData.length > 0) {
          setSelectedCompany(empresasData[0]);
        }
      }
    } catch (error) {
      // Error silencioso - el contexto ya maneja los errores
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, setSelectedCompany, user])

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const handleEmpresaChange = (value: string) => {
    const selected = empresas.find(e => e.value === value);
    if (selected) {
      // Buscar la empresa completa en los datos originales
      const empresaCompleta = empresasData?.find(e => e.idEmpresa.toString() === value);
      if (empresaCompleta) {
        setSelectedCompany(empresaCompleta);
      } else {
        console.warn(`No se encontró la empresa con id ${value}`);
      }
    }
  }
  
  return (
    <AlertProvider>
      <SidebarProvider>
        <AppSidebar moduleName={moduleName} />
        <SidebarInset className="flex flex-col min-h-screen">
          <header className="flex items-center gap-4 p-4 border-b h-16">
            <SidebarTrigger className="md:hidden" />
            {/* <div className="flex items-center gap-4">
              {!isUserPage && !isPermissionPage && !isPersonaPage && (
                <div className="md:w-[30vw] sd:w-[20vw] xl:w-[30vw]">
                  <Combobox
                    options={empresas}
                    selected={selectedCompany?.idEmpresa?.toString() || ''}
                    onChange={handleEmpresaChange}
                    placeholder={loading ? "Cargando..." : "Seleccionar empresa"}
                    disabled={loading || empresas.length <= 1 || user?.tipo_usuario === 'company'}
                    emptyMessage={loading ? "Cargando empresas..." : "No se encontraron empresas"}
                  />
                </div>
              )}
            </div> */}
            <div className="ml-auto">
              {userData && <NavUser user={userData} persona={user?.persona || undefined} />}
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-2 md:p-7">
            {children}
          </div>
        </SidebarInset>
        <Toaster position="bottom-center" richColors />
      </SidebarProvider>
    </AlertProvider>
  )
}

import { Geist, Geist_Mono } from "next/font/google";
import AdminLayout from "@/layouts/AdminLayout";
import DashboardList from "@/modules/dashboard/DashboardList";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { hasCompletedCompanySelection, hasCompletedModuleSelection } = useCompany();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasCompletedCompanySelection) {
        router.push('/seleccionEmpresa');
        return;
      }

      if (!hasCompletedModuleSelection) {
        router.push('/seleccionModulos');
        return;
      }
    }
  }, [isAuthenticated, hasCompletedCompanySelection, hasCompletedModuleSelection, router]);

  if (!hasCompletedCompanySelection || !hasCompletedModuleSelection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AdminLayout moduleName='Dashboard'>
      <DashboardList />
    </AdminLayout>
  );
}

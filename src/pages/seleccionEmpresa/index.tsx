"use client"

import EmpresaSelect from "./EmpresaSelect";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Empresa } from "@/types/empresas";
import { useCompany } from "@/contexts/CompanyContext";
import { useRouter } from "next/navigation";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function SeleccionEmpresa() {
  const { setSelectedCompany } = useCompany();
  const router = useRouter();

  const handleSelectEmpresa = (empresa: Empresa) => {
    console.log('Empresa seleccionada:', empresa);
    setSelectedCompany(empresa);
    router.push('/seleccionModulos');
  };

  return (
    <GoogleReCaptchaProvider
    reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
    scriptProps={{
      async: true,
      appendTo: "body",  
      nonce: undefined
    }}
  >
    <ProtectedRoute>
      <EmpresaSelect onClose={() => {}} onSelectEmpresa={handleSelectEmpresa} />
    </ProtectedRoute>
    </GoogleReCaptchaProvider>
  );
}

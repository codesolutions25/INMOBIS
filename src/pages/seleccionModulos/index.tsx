"use client"

import PanelSeleccion from "@/pages/seleccionModulos/PanelSeleccion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

export default function SeleccionModulos() {
  return (
    <GoogleReCaptchaProvider
    reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
    scriptProps={{
      async: true,
      defer: true,
      appendTo: "body",  
      nonce: undefined
    }}
  >
    <ProtectedRoute>
      <PanelSeleccion />
    </ProtectedRoute>
    </GoogleReCaptchaProvider>
  );
}
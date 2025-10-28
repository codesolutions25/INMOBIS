import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PermissionProvider } from "@/contexts/PermissionContext";
import ModalContainerProvider from '@/components/modal/ModalContainer';
import { AlertProvider } from "@/contexts/AlertContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useUserDetails } from '@/hooks/useUserDetails';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getDetallesByUsuarioId, getDetallesByUsuarioEmpresaId } from '@/services/apiDetalleUsuario';

function AppWithAuth({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (authLoading) {
        return;
      }
      if (!user) {
        if (router.pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      try {
        setLoading(true);
        
        if (user.tipo_usuario   === 'regular') {
          const detalles = await getDetallesByUsuarioId(user.id);
          const detalleActivo = detalles.find(d => d.estado);
          if (detalleActivo) {
            setUserId(detalleActivo.id);
          } else {
            setError('No se encontró un detalle activo para el usuario del sistema');
          }
        } else if (user.tipo_usuario === 'company') {
          const detalles = await getDetallesByUsuarioEmpresaId(user.id);
          const detalleActivo = detalles.find(d => d.estado);
          if (detalleActivo) {
            setUserId(detalleActivo.id);
          } else {
            setError('No se encontró un detalle activo para el usuario de empresa');
          }
        }
      } catch (err) {
        setError('Error al cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user, authLoading]);

  

  // Mostrar un loader solo si estamos cargando la autenticación inicial
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay usuario y estamos en login, mostrar el componente de login
  if (!user) {
    if (router.pathname !== '/login') {
      router.push('/login');
      return null; // Evitar renderizado innecesario
    }
    
    return (
      <AlertProvider>
        <ModalContainerProvider>
          <Component {...pageProps} />
        </ModalContainerProvider>
      </AlertProvider>
    );
  }

  // Mostrar error si hay alguno
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  

  // Asegurarse de que el componente no se renderice hasta que tengamos el userId o sepamos que no hay usuario
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AlertProvider>
      <ModalContainerProvider>
        <PermissionProvider userId={userId ?? undefined}>
          <CompanyProvider>
            <Component {...pageProps} />
          </CompanyProvider>
        </PermissionProvider>
      </ModalContainerProvider>
    </AlertProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppWithAuth {...props} />
    </AuthProvider>
  );
}
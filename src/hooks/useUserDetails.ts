import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsuarioById } from '@/services/apiUsuarios';
import { getUsuarioEmpresaByPersonaId } from '@/services/apiUsuarioEmpresa';
import { getDetallesByUsuarioId, getDetallesByUsuarioEmpresaId } from '@/services/apiDetalleUsuario';
import { Usuario } from '@/types/usuarios';
import { UsuarioEmpresa } from '@/types/usuarioEmpresa';
import { DetalleUsuario } from '@/types/detalleUsuario';

interface UserDetailsState {
  userInfo: Usuario | UsuarioEmpresa | null;
  userDetails: DetalleUsuario[];
  loading: boolean;
  error: Error | null;
}

export function useUserDetails(): UserDetailsState {
  const { user } = useAuth();
  const [state, setState] = useState<UserDetailsState>({
    userInfo: null,
    userDetails: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        let userInfo: Usuario | UsuarioEmpresa | null = null;
        let userDetails: DetalleUsuario[] = [];

        // Determine user type and fetch appropriate data
        if (user.tipo_usuario === 'sistema') {
          // For system users
          const userData = await getUsuarioById(user.id);
          if (userData) {
            userInfo = userData as Usuario;
            userDetails = await getDetallesByUsuarioId(userData.idUsuario);
          }
        } else if (user.tipo_usuario === 'empresa') {
          // For company users
          const userData = await getUsuarioEmpresaByPersonaId(user.id);
          if (userData) {
            userInfo = userData as UsuarioEmpresa;
            userDetails = await getDetallesByUsuarioEmpresaId(userData.id);
          }
        }

        setState({
          userInfo,
          userDetails,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching user details:', error);
        setState({
          userInfo: null,
          userDetails: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch user details'),
        });
      }
    };

    fetchUserDetails();
  }, [user]);

  return state;
}

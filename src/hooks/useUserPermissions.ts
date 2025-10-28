import { useEffect, useState, useCallback } from 'react';
import { getUsuarioOpciones } from '@/services/apiUsuarioOpciones';

type PermissionType = {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  finalizar: boolean;
};

// En useUserPermissions.ts
// src/hooks/useUserPermissions.ts
export function useUserPermissions(userId?: number) {
  const [permissions, setPermissions] = useState<Record<number, PermissionType>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
   
    
    const fetchData = async () => {
      // Limpiar permisos anteriores cuando el userId cambia
      setPermissions({});
      
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {

        const response = await getUsuarioOpciones(userId, undefined, 1, 1000);

        if (!response || !response.data || !Array.isArray(response.data)) {
          setError('Formato de respuesta inválido');
          setLoading(false);
          return;
        }
       
        // Mapear los permisos usando idEmpresaModuloOpcion como clave
        const permsMap = response.data.reduce((acc: Record<number, any>, perm: any) => {
          if (!perm || typeof perm.idEmpresaModuloOpcion === 'undefined') {
            return acc;
          }
          
          acc[perm.idEmpresaModuloOpcion] = {
            ver: Boolean(perm.puedeVer),
            crear: Boolean(perm.puedeCrear),
            editar: Boolean(perm.puedeEditar),
            eliminar: Boolean(perm.puedeEliminar),
            finalizar: Boolean(perm.puedeEditar) // Por defecto, usamos el mismo valor que editar
          };
          return acc;
        }, {});

   
        setPermissions(permsMap);
      } catch (error) {
        setError('Error al cargar los permisos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]); // Asegurarse de que el efecto se ejecute cuando userId cambie

  const hasPermission = useCallback((optionId: number, action: keyof PermissionType): boolean => {
    if (!optionId) {
      return false;
    }
    
    const perm = permissions[optionId];
    
    if (!perm) {
     
      return false;
    }
    
    const hasPerm = Boolean(perm[action]);
   
    return hasPerm;
  }, [permissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
  };
}

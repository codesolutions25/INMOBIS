// src/contexts/PermissionContext.tsx
import { createContext, useContext, useCallback } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCurrentOptionId } from '@/hooks/useCurrentOptionId';

type PermissionContextType = ReturnType<typeof useUserPermissions> & {
  hasPermission: (optionId: number, action: 'ver' | 'crear' | 'editar' | 'eliminar' | 'finalizar') => boolean;
};

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: number | undefined;
}) {
  const { permissions, loading, error, hasPermission: checkPermission } = useUserPermissions(userId);
  
 
  const hasPermission = useCallback(
    (optionId: number, action: 'ver' | 'crear' | 'editar' | 'eliminar' | 'finalizar'): boolean => {
      if (!optionId || !userId) {
        return false;
      }
      const result = checkPermission(optionId, action);
      return result;
    },
    [checkPermission, userId]
  );

  return (
    <PermissionContext.Provider value={{ permissions, loading, error, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions debe usarse dentro de un PermissionProvider');
  }
  return context;
}

export function useCheckPermission(optionId?: number) {
  const { hasPermission, permissions } = usePermissions();
  const resolvedOptionId = useCurrentOptionId();
  const finalOptionId = optionId ?? resolvedOptionId;

  const checkPermission = useCallback(
    (action: 'ver' | 'crear' | 'editar' | 'eliminar' | 'finalizar') => {
      if (!finalOptionId) {
        return false;
      }
      
      const result = hasPermission(finalOptionId, action);
      return result;
    },
    [finalOptionId, hasPermission, permissions]
  );

  return checkPermission;
}

// src/components/ProtectedRoute.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCheckPermission } from '@/contexts/PermissionContext';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: number;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission 
}: ProtectedRouteProps) {
  const router = useRouter();
  const checkPermission = useCheckPermission(requiredPermission);
  const [showDenied, setShowDenied] = useState<boolean | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const verifyAccess = async () => {
      // If no required permission, allow access
      if (!requiredPermission) {
        setShowDenied(false);
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If not authenticated, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      // Check permissions
      const hasAccess = checkPermission('ver');
      
      if (!hasAccess) {
        // Wait 500ms before showing access denied to prevent flash
        timeoutId = setTimeout(() => {
          setShowDenied(true);
        }, 500);
      } else {
        setShowDenied(false);
      }
    };

    verifyAccess();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, checkPermission, requiredPermission, authLoading, user]);

  // Show loading state while checking permissions
  if (authLoading || showDenied === null) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show access denied if user doesn't have permission
  if (showDenied) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        textAlign="center"
        p={3}
      >
        <Typography variant="h4" gutterBottom>
          Acceso denegado
        </Typography>
        <Typography variant="body1" paragraph>
          No tienes permiso para acceder a esta sección.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Volver al inicio
        </Button>
      </Box>
    );
  }

  // Show the protected content if user has permission
  return <>{children}</>;
}
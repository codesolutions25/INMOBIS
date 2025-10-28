import { useState, useEffect, useCallback } from 'react';
import { DashboardData, Periodo } from '@/modules/dashboard/types/dashboard.types';
import { dashboardService } from '@/modules/dashboard/services/apiDashboard';

// In useDashboard.ts
export const useDashboard = (periodo: Periodo, companyId?: string) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dashboardService.obtenerDatosDashboard(periodo);
      setData(result);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Error al cargar los datos del dashboard'));
    } finally {
      setLoading(false);
    }
  }, [periodo, companyId]); // Add companyId to dependencies

  // ... rest of the hook remains the same

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refetch = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { 
    data, 
    loading, 
    error, 
    refetch 
  };
};

export default useDashboard;

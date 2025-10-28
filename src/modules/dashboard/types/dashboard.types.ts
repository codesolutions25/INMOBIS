// Tipos para el dashboard
export type Periodo = 'mes_actual' | 'mes_anterior' | 'ultimos_3_meses' | 'ultimos_6_meses' | 'este_año' | 'año_especifico' | 'filtrado';

export interface DashboardMetrics {
  totalVentas: number;
  clientesActivos: number;
  propiedadesDisponibles: number;
  crecimiento: number; // Mantener para compatibilidad
  crecimientoVentas: number; // Crecimiento de ventas vs período anterior
  crecimientoClientes: number; // Crecimiento de clientes vs período anterior
}

export interface VentasMensuales {
  mes: string;
  ventas: number;
}

export interface CrecimientoClientes {
  mes: string;
  totalClientes: number;
  crecimiento?: number; // Porcentaje de crecimiento respecto al mes anterior
}

export interface TopPropiedades {
  id: number;
  ventas: number;
}

export interface DashboardFilters {
  periodo: Periodo;
  año?: number;
  moduloId?: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  ventasMensuales: VentasMensuales[];
  crecimientoClientes: CrecimientoClientes[];
  proyectosInmobiliarios: any[];
  propiedadesDisponibles: any[];
  filters?: DashboardFilters;
}

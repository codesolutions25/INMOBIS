"use client"

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, BarChart3, TrendingUp, Banknote, HouseIcon } from "lucide-react"
import { Bar, Line } from "react-chartjs-2"
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js"
import { useDashboard } from '../../hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from './services/apiDashboard';
import { PeriodoSelector } from './components/PeriodoSelector';
import type { Periodo } from './types/dashboard.types';
import { useCompany } from "@/contexts/CompanyContext";
import { Venta } from '@/types/venta';
import { DashboardData } from './types/dashboard.types';
import { homedir } from 'os';

// Register Chart.js components
ChartJS.register(
  BarElement, 
  CategoryScale, 
  LinearScale, 
  Title, 
  PointElement, 
  LineElement, 
  ArcElement, 
  Tooltip, 
  Legend
);

export default function DashboardList({ periodo: periodoInicial = 'mes_actual' }: { periodo?: Periodo }) {
  const [allDashboardData, setAllDashboardData] = useState<DashboardData | null>(null);
  const [filteredDashboardData, setFilteredDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial);
  const [año, setAño] = useState<number>(new Date().getFullYear());
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  
  // Obtener la empresa seleccionada del contexto
  const { selectedCompany, selectedModule } = useCompany();

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany?.idEmpresa) return;

      setIsLoading(true);
      try {
        const result = await dashboardService.obtenerDatosDashboard(
          periodo,
          selectedCompany.idEmpresa,
          año
        );
        setAllDashboardData(result);
        setFilteredDashboardData(result);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [periodo, selectedCompany, año, selectedModule]);

  // 3. Actualizar total de páginas cuando cambian los datos filtrados
  useEffect(() => {
    if (filteredDashboardData?.ventasMensuales) {
      const total = Math.ceil(filteredDashboardData.ventasMensuales.length / itemsPerPage) || 1;
      setTotalPages(total);
    }
  }, [filteredDashboardData, itemsPerPage]);
  
  // 4. Datos para la tabla/grid actual (paginación)
  const paginatedData = useMemo(() => {
    if (!filteredDashboardData?.ventasMensuales?.length) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDashboardData.ventasMensuales.slice(
      startIndex, 
      startIndex + itemsPerPage
    );
  }, [filteredDashboardData, currentPage, itemsPerPage]);
  
  // 5. Datos para las tarjetas de métricas
  const metrics = [
    {
      title: "Ventas Totales del Mes",
      value: filteredDashboardData ? `S/ ${filteredDashboardData.metrics.totalVentas.toLocaleString()}` : 'S/ 0',
      change: filteredDashboardData ? `${filteredDashboardData.metrics.crecimiento >= 0 ? '+' : ''}${filteredDashboardData.metrics.crecimiento}%` : '0%',
      icon: () => <span className="font-bold">S/.</span>,
      loading: isLoading,
      isPositive: filteredDashboardData ? filteredDashboardData.metrics.crecimiento >= 0 : true,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: "Nuevos Clientes Activos",
      value: filteredDashboardData?.metrics?.clientesActivos?.toLocaleString() ?? '0',
      change: filteredDashboardData?.crecimientoClientes?.length 
        ? `${(filteredDashboardData.crecimientoClientes[filteredDashboardData.crecimientoClientes.length - 1]?.crecimiento ?? 0) >= 0 ? '+' : ''}${filteredDashboardData.crecimientoClientes[filteredDashboardData.crecimientoClientes.length - 1]?.crecimiento ?? 0}%`
        : '0%',
      icon: Users,
      loading: isLoading,
      isPositive: (filteredDashboardData?.crecimientoClientes?.[filteredDashboardData.crecimientoClientes.length - 1]?.crecimiento ?? 0) >= 0,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: "Propiedades Disponibles",
      value: filteredDashboardData ? filteredDashboardData.metrics.propiedadesDisponibles.toString() : '0',
      change: " ",
      icon: HouseIcon,
      loading: isLoading,
      isPositive: true,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: "Crecimiento en Ventas",
      value: filteredDashboardData ? `${filteredDashboardData.metrics.crecimiento >= 0 ? '+' : ''}${filteredDashboardData.metrics.crecimiento}%` : '0%',
      change: 'vs mes anterior',
      icon: TrendingUp,
      loading: isLoading,
      isPositive: filteredDashboardData ? filteredDashboardData.metrics.crecimiento >= 0 : true,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-amber-600 dark:text-amber-600',
    },
  ];
  

  // Datos para el gráfico de ventas mensuales
  const chartData = {
    labels: filteredDashboardData?.ventasMensuales.map(item => item.mes) || [],
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: filteredDashboardData?.ventasMensuales.map(item => item.ventas) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 0.5,
      },
    ],
  };

  // Opciones para el gráfico de ventas mensuales
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución de Ventas Mensuales',
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `S/ ${context.raw.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 14,
          },
          color: 'rgba(75, 85, 99, 1)',
          callback: (value: number | string) => `S/ ${value}`
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 13,
          },
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
    elements: {
      bar: {
        hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
      },
    },
  };

  // Datos para el gráfico de crecimiento de clientes
  const lineChartData = {
    labels: filteredDashboardData?.crecimientoClientes.map(item => item.mes) || [],
    datasets: [
      {
        label: 'Crecimiento de Clientes (%)',
        data: filteredDashboardData?.crecimientoClientes.map(item => item.crecimiento) || [],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: (context: any) => {
          const bgColor = [
            'rgba(16, 185, 129, 0.1)',
            'rgba(16, 185, 129, 0.2)',
          ];
          if (!context.chart.chartArea) return;
          const { ctx, data, chartArea: { top, bottom } } = context.chart;
          const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
          gradientBg.addColorStop(0, bgColor[0]);
          gradientBg.addColorStop(1, bgColor[1]);
          return gradientBg;
        },
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: 'white',
        pointBorderColor: 'rgba(16, 185, 129, 1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'white',
        pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  };

  // Opciones para el gráfico de crecimiento de clientes
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Crecimiento de Clientes',
        font: {
          size: 14,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 13,
          },
          color: 'rgba(75, 85, 99, 1)',
          callback: (value: number | string) => `${value}%`
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <h2 className="text-2xl font-bold tracking-tight">Panel de Control</h2>
        <PeriodoSelector
          year={año}
          onYearChange={setAño} 
          value={periodo} 
          onChange={setPeriodo} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className={`${metric.bgColor} border-0 shadow-sm transition-all hover:shadow-md`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-full ${metric.iconColor} flex items-center justify-center`}>
                <metric.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              {metric.loading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{metric.value}</div>
              )}
              <p className={`text-xs ${metric.isPositive ? 'text-green-500' : 'text-red-500'}`}>{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
        <Card className="lg:col-span-4 h-full">
          <CardHeader className="pb-2">
            <CardTitle>Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] p-4 pt-0">
            {isLoading ? (
              <div className="h-full w-full flex flex-col space-y-4">
                <Skeleton className="h-6 w-88" />
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <Bar 
                  data={chartData} 
                  options={chartOptions}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-4 h-full">
          <CardHeader className="pb-2">
            <CardTitle>Crecimiento de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] p-4 pt-0">
            {isLoading ? (
              <div className="h-full w-full flex flex-col space-y-4">
                <Skeleton className="h-6 w-88" />
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <Line 
                  data={lineChartData} 
                  options={lineChartOptions}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
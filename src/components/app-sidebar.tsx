'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { getOpcionesDeModulo } from '@/services/apiOpcionesPorModulo';
import { iconMap } from './iconMap';
import { Settings, LayoutDashboard } from 'lucide-react';

import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function AppSidebar(props: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { selectedModule } = useCompany();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  const loadModules = useCallback(async () => {
    if (!mounted) return;

    setIsLoading(true);
    try {
      const modulosParaMostrar: any[] = [];

      // 1. Siempre incluir el módulo Dashboard
      const dashboardModule = {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'LayoutDashboard',

        orden: -1, // Prioridad máxima
        items: [
          {
            id: 'dashboard-main',
            title: 'Panel Principal',
            url: '/',
          }
        ]
      };
      modulosParaMostrar.push(dashboardModule);

      // 2. Si hay un módulo seleccionado, obtener sus opciones
      if (selectedModule && selectedModule.modulos_id) {
        const opcionesDelModulo = await getOpcionesDeModulo(selectedModule.modulos_id);

        if (opcionesDelModulo.length > 0) {
          const moduloConOpciones = {
            id: selectedModule.modulos_id,
            title: selectedModule.nombre,
            icon: selectedModule.icono,
            orden: selectedModule.orden || 0,
            items: opcionesDelModulo.map(opcion => ({
              id: opcion.idOpcion,
              title: opcion.nombreAlias,
              url: opcion.ruta,
              icon: opcion.icono || null,
            }))
          };

          modulosParaMostrar.push(moduloConOpciones);
        }
      }

      // 3. Ordenar módulos por prioridad (orden)
      modulosParaMostrar.sort((a, b) => a.orden - b.orden);

      setModules(modulosParaMostrar);

      // Expandir todos los módulos por defecto
      const expanded: Record<string | number, boolean> = {};
      modulosParaMostrar.forEach((mod: any) => {
        expanded[mod.id] = true;
      });
      setExpandedModules(expanded);
      setError(null);

    } catch (error) {
      console.error('Error loading modules and options', error);
      if (mounted) {
        setError('Error al cargar el menú. Por favor, intente recargar la página.');
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  }, [mounted, selectedModule]);

  // Efecto adicional para recargar módulos cuando cambie el módulo seleccionado
  useEffect(() => {
    if (mounted && selectedModule) {
      loadModules();
    }
  }, [selectedModule, mounted, loadModules]);

  // Función para cambiar de módulo
  const handleModuleChange = useCallback(() => {
    router.push('/seleccionModulos');
  }, [router]);

  // Función para alternar la expansión de los módulos
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  return (
    <Sidebar {...props} className="z-50">
      {permissionsLoading ? (
        <div className="flex items-center justify-center p-4">
          <span className="text-sm text-gray-500">Cargando permisos...</span>
        </div>
      ) : (
        <>
          <SidebarHeader className="flex justify-center items-center p-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="logo" width={200} height={80} priority />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="flex items-center justify-center h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  <p>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Recargar página
                  </button>
                </div>
              ) : modules.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="mb-2">No hay módulos disponibles</p>
                  <p className="text-sm mb-4">
                    {selectedModule
                      ? `Módulo seleccionado: ${selectedModule.nombre} (sin opciones disponibles)`
                      : 'No hay módulo seleccionado'
                    }
                  </p>
                  <button
                    onClick={loadModules}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Recargar módulos
                  </button>
                </div>
                
              ) : (
                modules.map((module) => {
                  const ModuleIcon = iconMap[module.icon] || iconMap['default'];
                  const isExpanded = expandedModules[module.id] || false;

                  return (
                    <div key={module.id} className="mb-1">
                      <SidebarMenuButton
                        onClick={() => toggleModule(module.id)}
                        className={`w-full flex justify-between items-center p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}
                      >
                        <div className="flex items-center">
                          {ModuleIcon && <ModuleIcon className="h-5 w-5 mr-3" />}
                          <span>{module.title}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </SidebarMenuButton>
                      <div
                        className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-120' : 'max-h-0'}`}
                      >
                        {module.items.map((item: any) => {
                          const ItemIcon = item.icon ? iconMap[item.icon] : null;
                          const isActive = pathname === item.url || (pathname && pathname.startsWith(`${item.url}/`));

                          return (
                            <SidebarMenuItem
                              key={item.id}
                              className={isActive ? 'bg-primary-100 dark:bg-primary-900/80 rounded-md mx-2' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-md mx-2'}
                            >
                              <SidebarMenuButton asChild>
                                <Link
                                  href={item.url}
                                  className={`flex items-center gap-2 pl-4 py-2 text-sm ${isActive ? 'text-primary-700 dark:text-primary-200 font-semibold' : ''}`}
                                >
                                  {ItemIcon && <ItemIcon className="h-4 w-4" />}
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter />
        </>
      )}
    </Sidebar>
  );
}

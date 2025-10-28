"use client"
//Modal Principal
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Dot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard from '@/components/ModuleCard';
import UserActionsPanel from '@/pages/seleccionModulos/components/OpcionesPanel';
import { useRouter } from 'next/navigation';
import { getModulos } from '@/services/apiModulos';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PanelSeleccion() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [modulos, setModulos] = useState<any[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedCompany, setHasCompletedModuleSelection, setSelectedModule } = useCompany();
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();
  const router = useRouter();

  //Protección específica del componente PanelSeleccion
  useEffect(() => {
    if (isAuthenticated && !selectedCompany) {
      // Si no hay empresa seleccionada, redirigir a selección de empresa
      router.push('/seleccionEmpresa');
      return;
    }
  }, [isAuthenticated, selectedCompany, router]);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const data = await getModulos();
        const modulosActivos = data.data.filter((m: any) => m.es_activo);
        setModulos(modulosActivos);
        setError(null);
      } catch (error) {
        console.error('Error al cargar modulos:', error);
        setError('Error al cargar modulos. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && selectedCompany) {
      fetchModulos();
    }
  }, [isAuthenticated, selectedCompany]);

  const colors = [
    'from-[#0C4A6E] to-[#00B1B9]', // base principal
    'from-[#0F5D75] to-[#00A7B3]', // azul petróleo oscuro → cian profundo
    'from-[#125E8A] to-[#2BC4AD]', // azul medio → turquesa
    'from-[#0C4A6E] to-[#2EC4B6]', // azul oscuro → turquesa pastel
    'from-[#17627A] to-[#23BFB8]', // azul marino suave → cian
    'from-[#0D3B66] to-[#3FB8AF]', // azul navy → verde agua
    'from-[#085F63] to-[#49BEAA]', // verde azulado oscuro → verde pastel
    'from-[#0E7490] to-[#38BDF8]', // azul fuerte → azul cielo claro
    'from-[#1D4ED8] to-[#0EA5E9]', // azul vibrante → azul cian
    'from-[#2C7DA0] to-[#76C7E4]', // azul medio → azul claro
    'from-[#1E6091] to-[#3AB4F2]', // azul clásico → celeste moderno
    'from-[#014F86] to-[#2C7DA0]', // azul oscuro → azul acero
  ];

  const dinamicModules = useMemo(() => {
    if (!modulos.length) return [];
    return modulos.map((modulo, index) => ({
      id: modulo.modulos_id.toString(),
      title: modulo.nombre,
      description: modulo.descripcion,
      icon: modulo.icono,
      orden: modulo.orden,
      es_activo: modulo.es_activo,
      color: colors[index % colors.length],
    })).sort((a, b) => a.orden - b.orden);
  }, [modulos, colors]);

  const duplicatedModules = useMemo(() => {
    return [...dinamicModules, ...dinamicModules, ...dinamicModules];
  }, [dinamicModules]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || modulos.length === 0) return;

    const scrollToMiddle = () => {
      scrollContainer.scrollLeft = scrollContainer.scrollWidth / 3;
    };

    scrollToMiddle();

    const handleScroll = () => {
      const maxScroll = scrollContainer.scrollWidth;
      const currentScroll = scrollContainer.scrollLeft;
      const third = maxScroll / 3;

      if (currentScroll < third / 2) {
        scrollContainer.scrollLeft += third;
      }
      if (currentScroll > third * 1.5) {
        scrollContainer.scrollLeft -= third;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [modulos]);

  const handleWheel = (e: React.WheelEvent) => {
   // e.preventDefault();
    const scrollerElement = scrollRef.current;
    if (scrollerElement) {
      scrollerElement.scrollBy({ left: e.deltaY * 3, behavior: 'smooth' });
    }
  };

  const handleModuleSelect = (modulo: any) => {
    setSelectedModulo(modulo);
    setIsUserPanelOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(/background.png)` }}
      />
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 bg-white rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0C4A6E] to-[#00B1B9] text-white p-6">
          <div className="flex items-center justify-between">             
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold">Inmobis - Sistema Inmobiliario</h1>
              <p className="text-white/80 text-sm">Selecciona el módulo con el que deseas trabajar</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className="text-sm flex items-center">
                <Dot className='w-10 h-10 text-green-400 rounded-full ' /> {user?.username}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-10" style={{ overflowY: 'auto', overflowX: 'scroll' }}>
          {modulos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 text-center"
            >
              <div className="text-gray-400 text-6xl mb-4">⚙️</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">No hay módulos activos disponibles</h2>
              <p className="text-gray-600 mb-4">
                No se encontraron módulos habilitados para mostrar.
              </p>
              <Button
                onClick={() => router.push('/seleccionEmpresa')}
                className="bg-[#0C4A6E] hover:bg-[#00B1B9] text-white"
              >
                Cambiar Empresa
              </Button>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-5"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Módulos Activos del Sistema</h2>
                <p className="text-gray-600">
                  Selecciona el módulo con la que deseas trabajar
                </p>
              </motion.div>

              {/* Flecha izquierda */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md z-20 cursor-pointer">
                <button
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                    }
                  }}
                >
                  <ArrowLeft className="text-[#0C4A6E] hover:text-[#00B1B9] cursor-pointer" />
                </button>
              </div>

              {/* Module Scroller */}
              <div ref={scrollRef} className="media-scroller" onWheel={handleWheel} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <motion.div className="media-scroller-content flex gap-0.6 p-1 m-1">
                  {duplicatedModules.map((module, index) => (
                    <div key={index} className="media-element">
                      <ModuleCard
                        module={module}
                        onClick={() => handleModuleSelect(module)}
                      />
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Flecha derecha */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md z-30 cursor-pointer">
                <button
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                    }
                  }}
                >
                  <ArrowRight className="text-[#0C4A6E] hover:text-[#00B1B9] cursor-pointer" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Sistema Inmobiliario
          </div>
          <div className="text-sm text-gray-600">
            Empresa Seleccionada:
            <span className="px-3 py-2 rounded-full text-xs font-semibold bg-green-100 text-green-800 ml-2">
              {selectedCompany?.razonSocial}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/seleccionEmpresa')}
              className="border-gray-300 hover:bg-[#0C4A6E] hover:text-white cursor-pointer"
            >
              Volver a seleccionar empresa
            </Button>
          </div>
        </div>
      </motion.div>

      {/* User Actions Panel */}
      <AnimatePresence>
        {isUserPanelOpen && selectedModulo && (
          <UserActionsPanel
            onClose={() => setIsUserPanelOpen(false)}
            selectedModule={selectedModulo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empresa } from "@/types/empresas";
import { getEmpresas } from "@/services/apiEmpresa";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Dot} from 'lucide-react';
import EmpresaSelectDetailsModal from "./components/EmpresaSelectDetailsModal";
import { useAuth } from "@/contexts/AuthContext";
import router from 'next/router';

interface EmpresaSelectProps {
  onClose: () => void;
  onSelectEmpresa: (empresa: Empresa) => void;
}

export default function EmpresaSelect({ onClose, onSelectEmpresa }: EmpresaSelectProps) {
  const { logout } = useAuth();
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(user ? true : false);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const data = await getEmpresas();
        let empresasFiltradas = data.data;
        console.log("datos de usuario: ", user);
        console.log("todas las empresas: ", empresasFiltradas);
        if(user?.tipo_usuario === "company" && user?.id_empresa){ //el error no afecta el filtro
          empresasFiltradas = empresasFiltradas.filter((empresa: Empresa) => empresa.idEmpresa === Number(user.id_empresa));
          console.log("filro aplicado solo empresas activas del usuario: ", empresasFiltradas);
        }else if(user?.tipo_usuario === "regular"){
          empresasFiltradas = empresasFiltradas.filter((empresa: Empresa) => empresa.esActiva);
          console.log("filro aplicado solo empresas activas: ", empresasFiltradas);
        }else{
          console.log("sin filtro. mostrando todas las empresas")
        }
        console.log("empresas filtradas: ", empresasFiltradas);
        setEmpresas(empresasFiltradas);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        setError('Error al cargar empresas. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmpresas();
  }, [user]);

  //manejo de scrooll
  useEffect(() => {
    const scrollContainer = scrollRef.current;

    if (!scrollContainer || empresas.length === 0) return;

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
  }, [empresas]);

  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const scrollerElement = scrollRef.current;
      if (scrollerElement) {
        scrollerElement.scrollBy({ left: e.deltaY * 3, behavior: 'smooth' }); //sensibilidad del scroll
      }
    };

  // Función helper para obtener el nombre completo del usuario
  const getUserDisplayName = () => {
    // Estructura correcta según los logs: los datos están en user.persona
    if (user?.persona?.nombre) {
      const nombre = user.persona.nombre;
      const apellidoPaterno = user.persona.apellido_paterno || '';
      const apellidoMaterno = user.persona.apellido_materno || '';

      if (apellidoPaterno || apellidoMaterno) {
        return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
      }
      return nombre;
    }

    // Fallback: intentar otras ubicaciones
    if (user?.nombre) {
      return user.nombre;
    }

    return 'Usuario';
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const duplicatedEmpresas = useMemo(() => {
    return [...empresas, ...empresas, ...empresas];
  }, [empresas]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      // Error silencioso - el contexto ya maneja los errores
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          className="bg-blue-50 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0C4A6E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando empresas...</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 bg-black/5"
      style={{ backgroundImage: `url(/background.png)` }}
    >
      {/* Caja de Bienvenida Arriba */}
      {showWelcomeModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-t from-[#00B1B9]/90 to-[#0C4A6E] p-6 shadow-xl mb-12 w-full max-w-md animate-rgb-shadow"
          style={{borderRadius: '2px 40px', overflow: 'hidden'}}
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#ffffff] mb-2">🎉¡Bienvenido <span className="font-semibold">{getUserDisplayName()}</span>!</h3>
            <p className="text-[#ffffff] mb-4">Selecciona tu empresa para continuar.</p>
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2 }}
        className='bg-white rounded-3xl shadow-2xl p-6 w-full max-w-5xl overflow-hidden'
      >
        <div className="bg-gradient-to-b from-[#0C4A6E] to-[#00B1B9] text-white p-6 -mt-6 -mx-6 drop-shadow-lg">
          <div className="flex items-center justify-between gap-4">             
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold">Empresas Disponibles</h1>
              <p className="text-white/80 text-sm">Selecciona la empresa con la que deseas trabajar</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm"
            >
              <div className="text-sm flex items-center">
                <Dot className='w-10 h-10 text-green-400 rounded-full ' /> {user?.username}
              </div>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-7 mb-2">
          <div className="mb-2">
            <p className="text-gray-600">Selecciona tu empresa para continuar</p>
          </div>
        </div>

        {empresas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">No hay empresas disponibles</h3>
            <p className="text-gray-500 mb-4">No se encontraron empresas para mostrar.</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#0C4A6E] hover:bg-[#00B1B9] text-white"
            >
              Recargar página
            </Button>
          </div>
        ) : (
        <div className="relative w-full">
          {/* Flecha izquierda */}
          <div>
            <button
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md z-30"
            >
              <ArrowLeft />
            </button>
          </div>
          {/* Empresas Scroll */}
          <div className="overflow-x-auto scrollbar-hide w-full px-6" ref={scrollRef} onWheel={handleWheel} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex space-x-3 pb-2 pt-2 m-1">
              {duplicatedEmpresas.map((empresa, index) => (
                <motion.div
                  key={`${empresa.idEmpresa}-${index}`}
                  layoutId={`empresa-card-${empresa.idEmpresa}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedEmpresa(empresa)}
                >
                  <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-[#00B1B9] transition-all duration-300 shadow-lg hover:shadow-xl w-80 md:w-66 lg:w-76 h-72 md:h-60 lg:h-40 flex flex-col">
                    {empresa.logoUrl && (
                      <img
                        src={empresa.logoUrl}
                        alt={empresa.razonSocial}
                        className="w-full h-full object-cover opacity-25 absolute inset-0 z-0"
                      />
                    )}
                    <CardHeader className="text-center relative z-10">
                      <h3 className="text-xl font-semibold text-[#0C4A6E] relative z-10">{empresa.razonSocial}</h3>
                    </CardHeader>
                    <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#0C4A6E] to-[#00B1B9] animate-rgb-shadow`} />
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Flecha derecha */}
          <div>
            <button
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md z-30"
              aria-label="true"
            >
              <ArrowRight />
            </button>
          </div>
        </div>
        )}

        {/* Modal de Detalles */}
        {selectedEmpresa && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-80 bg-black/50 flex items-center justify-center"
            onClick={() => setSelectedEmpresa(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-lg p-6 shadow-xl w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <EmpresaSelectDetailsModal
                empresa={selectedEmpresa}
                isOpen={!!selectedEmpresa}
                onClose={() => setSelectedEmpresa(null)}
                onSelectEmpresa={onSelectEmpresa}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="border-t pt-4 flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-[#0C4A6E] hover:bg-[#0C4A6E] hover:text-white cursor-pointer"
          >
            Volver al Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

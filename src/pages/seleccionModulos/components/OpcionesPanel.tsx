"use client"
//Panel de acciones específicas del módulo seleccionado
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Shield, Settings, Home, ShoppingCart, CreditCard, Phone, Building, Store, SquareArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getOpcionesDeModulo, OpcionConModulo } from '@/services/apiOpcionesPorModulo';
import { useCompany } from '@/contexts/CompanyContext';
import { Modulo } from '@/types/modulos';

interface OpcionesPanelProps {
  onClose: () => void;
  selectedModule?: any;
}

export default function OpcionesPanel({ onClose, selectedModule }: OpcionesPanelProps) {
  const router = useRouter();
  const { setSelectedModule, setHasCompletedModuleSelection } = useCompany();
  const [opciones, setOpciones] = useState<OpcionConModulo[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para convertir íconos de strings a componentes React
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'UserRound': SquareArrowRight,
      'BriefcaseBusiness': Building,
      'House': Home,
      'ShoppingCart': ShoppingCart,
      'MapPin': Store,
      'CircleDollarSign': CreditCard,
      'Headset': Phone,
      'Settings': Settings,
      'Shield': Shield,
    };
    return iconMap[iconName] || SquareArrowRight;
  };

  const gradientColors = [
    'from-[#00B1B9] to-[#0C4A6E]',
    'from-[#76C7E4] to-[#0C4A6E]',
    'from-[#007F91] to-[#00B1B9]',
    'from-[#33B1A6] to-[#0C4A6E]',
    'from-[#0C4A6E] to-[#33B1A6]',
    'from-[#00B1B9] to-[#76C7E4]',
    'from-[#0C4A6E] to-[#007F91]',
  ];  

  useEffect(() => {
    const cargarOpciones = async () => {
      if (!selectedModule) return;

      setLoading(true);
      try {
        const opcionesDelModulo = await getOpcionesDeModulo(parseInt(selectedModule.id));
        setOpciones(opcionesDelModulo);
      } catch (error) {
        console.error('Error al cargar opciones del módulo:', error);
        setOpciones([]);
      } finally {
        setLoading(false);
      }
    };

    cargarOpciones();
  }, [selectedModule]);

  const handleNavigatetoModule = (ruta: string) => {
    if (ruta && ruta !== '/') {
      router.push(ruta);
    } else {
    }
    onClose();
  };

  const handleSeleccionarModulo = () => {
    // Normalizar el módulo para asegurar estructura correcta
    if (selectedModule) {
      const moduloNormalizado: Modulo = {
        modulos_id: parseInt(selectedModule.id || selectedModule.modulos_id),
        nombre: selectedModule.title || selectedModule.nombre,
        descripcion: selectedModule.descripcion || 'Módulo seleccionado',
        orden: selectedModule.orden || 0,
        icono: selectedModule.icon || selectedModule.icono || 'default',
        es_activo: true,
        created_at: selectedModule.created_at || new Date().toISOString(),
        updated_at: selectedModule.updated_at || new Date().toISOString()
      };

      setSelectedModule(moduloNormalizado);
      setHasCompletedModuleSelection(true);
    }

    // Navegar al dashboard con una pequeña demora para asegurar que el contexto se actualice
    setTimeout(() => {
      router.push('/');
    }, 1);

    onClose();
  };

  if (!selectedModule) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white rounded-2xl shadow-2xl p-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0C4A6E] to-[#00B1B9] text-white p-6 -mt-4 -mx-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-right gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-2 right-2 text-white hover:bg-white/20 hover:text-black hover:scale-110 transition-all duration-300 cursor-pointer items-right justify-right"
                >
                  <X className="h-5 w-5" />
                </Button>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-white">{selectedModule.title}</h2>
                  <p className="text-white/80 text-sm">Opciones disponibles del módulo</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4A6E] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando opciones del módulo...</p>
              </div>
            ) : opciones.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">⚙️</div>
                <p className="text-gray-600">No hay opciones disponibles para este módulo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opciones.map((opcion, index) => {
                  const IconComponent = getIconComponent(opcion.icono);
                  return (
                    <motion.div
                      key={opcion.idOpcion}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`relative overflow-hidden bg-gradient-to-br from-[#${((index * 47 + 100) % 255).toString(16).padStart(2, '0')}${( (index * 73 + 150) % 255).toString(16).padStart(2, '0')}${( (index * 137 + 200) % 255).toString(16).padStart(2, '0')}] to-[#0C4A6E] rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
                        <div className="flex items-start gap-3">
                          <motion.div
                            className="flex-shrink-0"
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.3 }}
                          >
                            <IconComponent className="h-8 w-8 text-white" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm mb-1">{opcion.nombreAlias}</h3>
                            <p className="text-white/80 text-xs leading-relaxed line-clamp-2">{opcion.descripcion}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-4 -mb-4 -mx-4 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="color-[#0C4A6E] hover:bg-[#0C4A6E] hover:text-white cursor-pointer"
              >
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={handleSeleccionarModulo}
                className="color-[#0C4A6E] hover:bg-[#0C4A6E] hover:text-white cursor-pointer"
              >
                Seleccionar
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

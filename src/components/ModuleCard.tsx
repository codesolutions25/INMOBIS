"use client"
//Componente de tarjeta de módulo con múltiples diseños
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Home, ShoppingCart, Store, CreditCard, Phone, Settings, LayoutDashboard } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  image?: string;
}

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
  model?: number; // 1, 2, 3, o 4
}

export default function ModuleCard({ module, onClick, model = 1 }: ModuleCardProps) {
  // Función para convertir string a componente React
  const getIconComponent = (icon: any) => {
    if (typeof icon === 'string') {
      const iconMap: { [key: string]: any } = {
        'LayoutDashboard': LayoutDashboard,
        'UserRound': User,
        'BriefcaseBusiness': Building,
        'House': Home,
        'ShoppingCart': ShoppingCart,
        'MapPin': Store,
        'CircleDollarSign': CreditCard,
        'Headset': Phone,
        'Settings': Settings,
      };
      return iconMap[icon] || User;
    }
    return icon;
  };

  const IconComponent = getIconComponent(module.icon);

  // Función para generar un placeholder único basado en el ID del módulo
  const getPlaceholderImage = (moduleId: string) => {
    const placeholders = {
      '1': '📊', // Dashboard
      '2': '👥', // Usuarios
      '3': '🏢', // Empresas
      '5': '🏠', // Gestión inmobiliario
      '8': '💰', // Ventas
      '9': '🛒', // Punto de venta
      '10': '💳', // Caja
      '11': '📞', // Atención al cliente
      '12': '⚙️', // Configuración
    };
    return placeholders[moduleId as keyof typeof placeholders] || '📦';
  };

  // Renderizar el modelo seleccionado
  const renderModel = () => {
    switch (model) {
      case 1:
        return <Model1 module={module} IconComponent={IconComponent} getPlaceholderImage={getPlaceholderImage} onClick={onClick} />;
      default:
        return <Model1 module={module} IconComponent={IconComponent} getPlaceholderImage={getPlaceholderImage} onClick={onClick} />;
    }
  };

  return renderModel();
}

// Modelo 1: Imagen centralizada entre título y descripción
function Model1({ module, IconComponent, getPlaceholderImage, onClick }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-[#00B1B9] transition-all duration-300 shadow-lg hover:shadow-xl w-80 md:w-96 lg:w-96 h-72 md:h-80 lg:h-80 flex flex-col">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${module.color}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-4">
            <motion.div
              className={`p-3 rounded-xl bg-gradient-to-r ${module.color} text-white shadow-lg`}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <IconComponent className="h-6 w-6" />
            </motion.div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-[#00B1B9] transition-colors">
                {module.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 flex-1">
          <div className={`relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br ${module.color} shadow-inner mb-4`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-6xl filter drop-shadow-lg"
                initial={{ scale: 0.8, rotate: -5 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                {getPlaceholderImage(module.id)}
              </motion.div>
            </div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 translate-y-10" />
              <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full translate-x-6 -translate-y-6" />
            </div>
            <div className="absolute inset-0 bg-black/10" />
          </div>
          <CardDescription className="text-gray-600 text-sm leading-relaxed">
            {module.description}
          </CardDescription>
        </CardContent>

        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#00B1B9]/5 to-[#76C7E4]/5 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}
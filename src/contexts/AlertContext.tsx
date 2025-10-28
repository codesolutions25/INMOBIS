"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'critical-error';

interface AlertMessage {
  id: string;
  type: AlertType;
  title: string;
  message: string;
}

interface AlertContextType {
  alerts: AlertMessage[];
  showAlert: (type: AlertType, title: string, message: string) => void;
  dismissAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const showAlert = (type: AlertType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissAlert(id);
    }, 5000);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // Agregar estilos para la animación de pulso
  React.useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.03); }
        100% { transform: scale(1); }
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    // Agregar el elemento de estilo al head del documento
    document.head.appendChild(styleElement);

    // Limpiar el elemento de estilo cuando el componente se desmonte
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, showAlert, dismissAlert }}>
      {children}
      <div className="fixed top-4 right-4 z-60 flex flex-col gap-3 max-w-md w-full">
        {alerts.map((alert) => {
          // Determinar el icono según el tipo de alerta
          let Icon = CheckCircle2;
          let iconColor = "text-green-500";
          let bgColor = "bg-white";
          let borderColor = "border-green-500";
          // Definir el tipo para el estilo de alerta
          let alertStyle: { animation?: string; boxShadow?: string } = {};
          
          if (alert.type === 'error') {
            Icon = AlertCircle;
            iconColor = "text-red-500";
            borderColor = "border-red-500";
          } else if (alert.type === 'critical-error') {
            Icon = AlertCircle;
            iconColor = "text-white";
            borderColor = "border-red-700";
            bgColor = "bg-red-600";
            alertStyle = {
              animation: 'slideIn 0.3s ease-out, pulse 2s infinite',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
            };
          } else if (alert.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = "text-amber-500";
            borderColor = "border-amber-500";
          } else if (alert.type === 'info') {
            Icon = Info;
            iconColor = "text-blue-500";
            borderColor = "border-blue-500";
          }
          
          return (
            <div 
              key={alert.id}
              className={`rounded-lg shadow-lg border-l-4 ${borderColor} ${bgColor} p-4 min-w-[350px] transition-all`}
              style={{
                animation: alertStyle.animation ?? 'slideIn 0.3s ease-out',
                boxShadow: alertStyle.boxShadow ?? '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex items-start">
                <div className={`mr-3 ${iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${alert.type === 'critical-error' ? 'text-white' : 'text-gray-800'} mb-1`}>{alert.title}</h4>
                  <p className={`${alert.type === 'critical-error' ? 'text-white text-opacity-90' : 'text-gray-600'} text-sm`}>{alert.message}</p>
                </div>
                <button 
                  onClick={() => dismissAlert(alert.id)}
                  className={`ml-4 p-1 rounded-full ${alert.type === 'critical-error' ? 'hover:bg-red-700 text-white text-opacity-80 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

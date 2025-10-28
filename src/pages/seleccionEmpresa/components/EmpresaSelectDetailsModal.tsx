"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Empresa } from "@/types/empresas";
import { Button } from "@/components/ui/button";

interface EmpresaSelectDetailsModalProps {
  empresa: Empresa | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectEmpresa: (empresa: Empresa) => void;
}

export default function EmpresaSelectDetailsModal({empresa, isOpen, onClose, onSelectEmpresa}: EmpresaSelectDetailsModalProps) {
  if (!empresa || !isOpen) return null;

  return (
    <AnimatePresence>
        {isOpen && empresa && (
        <>
            {/* Fondo oscuro */}
            <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40  "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            >
                {/* Contenedor del modal */}
                <motion.div
                key="modal"
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                    layoutId={`empresa-card-${empresa.idEmpresa}`}
                    className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9,y: 30 }}
                    animate={{ opacity: 1, scale: 1,y: 0 }}
                    exit={{ opacity: 0, scale: 0.9,y: 30 }}
                    transition={{ layout:{duration: 0.3}, default:{duration: 0.25}}}
                    onClick={(e) => e.stopPropagation()} // evita cierre al hacer click dentro del modal
                    >
                        <div className="p-6">
                            {/* Logo */}
                            {empresa.logoUrl && (
                            <img
                                src={empresa.logoUrl}
                                alt={empresa.razonSocial}
                                className="w-20 h-20 mx-auto rounded-full mb-4"
                                
                            />
                            )}
                            <motion.h3
                            className='text-2xl font-bold mb-4 text-[#0C4A6E]'
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            >
                                {empresa.razonSocial}
                            </motion.h3>

                            {/* Información de empresa */}
                            <motion.div
                            className="space-y-2 text-gray-700"
                            initial={{ opacity: 0}}
                            animate={{ opacity: 1}}
                            transition={{ delay: 0.3}}
                            >
                            <p><strong>RUC:</strong> {empresa.ruc}</p>
                            <p><strong>Dirección:</strong> {empresa.direccion}</p>
                            <p><strong>Teléfono:</strong> {empresa.telefono}</p>
                            <p><strong>Correo:</strong> {empresa.correo}</p>
                            <p><strong>Estado:</strong> {empresa.esActiva ? 'Activa' : 'Inactiva'}</p>
                            </motion.div>

                            {/* Botón de acción */}
                            <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4}}
                            >
                            <Button
                            className="mt-2 bg-[#0C4A6E] hover:bg-[#00B1B9] text-white w-full"
                            onClick={() => onSelectEmpresa(empresa)}
                            >
                            Seleccionar Empresa
                            </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

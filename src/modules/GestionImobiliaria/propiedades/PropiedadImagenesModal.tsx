"use client"

import { useState, useEffect } from 'react';
import * as React from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Propiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import PropiedadImageUpload from './PropiedadImageUpload';
import PropiedadImagenesList from './PropiedadImagenesList';
import { Upload, List } from "lucide-react";
import styles from './styles/PropiedadImagenesModal.module.css';

interface PropiedadImagenesModalProps {
  propiedad: Propiedad;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  closeModal?: () => void;
}

export default function PropiedadImagenesModal({ propiedad, trigger, onSuccess, closeModal }: PropiedadImagenesModalProps) {
  // Estado para controlar si el modal está abierto
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'upload'>('list');
  
  // Detectar si el trigger es un elemento invisible (para apertura automática)
  const isAutoTrigger = React.useMemo(() => {
    if (!trigger || !React.isValidElement(trigger)) return false;
    
    // Verificar si es un div con display:none
    const props = trigger.props as Record<string, any>;
    return props.style && typeof props.style === 'object' && props.style.display === 'none';
  }, [trigger]);
  
  // Abrir automáticamente si es un trigger invisible
  React.useEffect(() => {
    if (isAutoTrigger) {
      setIsOpen(true);
    }
  }, [isAutoTrigger]);

  const handleUploadSuccess = () => {
    // Después de una subida exitosa, cambiar a la vista de lista
    setActiveView('list');
    
    // Llamar al callback onSuccess si existe
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Resetear a la vista de lista cuando se cierra el modal
    setActiveView('list');
    
    // Llamar al callback closeModal si existe
    if (closeModal) {
      closeModal();
    }
  };

  return (
    <Dialog 
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Resetear a la vista de lista cuando se cierra el modal
          setActiveView('list');
          if (closeModal) {
            closeModal();
          }
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={styles.botonSubirImagen}>
            <Upload className={styles.botonIcon} />
            <span>Subir imagen</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className={styles.dialogContent}>
        <>
        <div className={styles.header}>
          <h2 className={styles.tittle}>
            Gestión de imágenes: {propiedad.nombre}
          </h2>
          <div className={styles.buttonsContainer}>
            <Button 
              variant={activeView === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('upload')}
              className={styles.button1}
            >
              <Upload className={styles.buttonTitle1} />
              <span>Subir imagen</span>
            </Button>
            <Button 
              variant={activeView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('list')}
              className={styles.button2}
            >
              <List className={styles.buttonTitle2} />
              <span>Ver imágenes</span>
            </Button>
          </div>
        </div>

        <div className={styles.listOption}>
          {activeView === 'list' ? (
            <PropiedadImagenesList 
              propiedad={propiedad} 
              onRefresh={() => {
                setActiveView('list');
                if (onSuccess) onSuccess();
              }}
            />
          ) : (
            <PropiedadImageUpload 
              propiedad={propiedad} 
              onSuccess={handleUploadSuccess}
              closeModal={handleClose}
            />
          )}
        </div>
      </>
      </DialogContent>
    </Dialog>
  );
}

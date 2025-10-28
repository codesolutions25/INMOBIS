"use client"

import React, { Dispatch, SetStateAction, useState, useRef, useEffect, ReactNode } from "react";
import {
    Dialog,
} from "@/components/ui/dialog"

type ModalContainerProps = {
    children?: ReactNode;
    showModalContainer?: boolean;
    setShowModalContainer?: Dispatch<SetStateAction<boolean>>;
    onClose?: () => void;
};

const ModalContainer: React.FC<React.PropsWithChildren<ModalContainerProps>> = ({
    children,
    showModalContainer,
    setShowModalContainer,
    onClose
}) => {
    // Efecto para limpiar el contenido cuando el modal se cierra completamente
    const handleOpenChange = (open: boolean) => {
        if (setShowModalContainer) setShowModalContainer(open);
        if (!open && typeof onClose === 'function') onClose();
    };

    const visible = typeof showModalContainer === "boolean" ? showModalContainer : true;

    return(
        <Dialog open={visible} onOpenChange={handleOpenChange}>
            {children}
        </Dialog>
    )
}

export { ModalContainer };
export default ModalContainer;

export function useModalContainer(){
    const [showModalContainer, setShowModalContainer] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null);
    const [isClosing, setIsClosing] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Limpiar el timeout al desmontar el componente
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Efecto para limpiar el contenido cuando el modal se cierra
    useEffect(() => {
        if (!showModalContainer && isClosing) {
            // Esperar a que termine la animación de cierre antes de limpiar el contenido
            timeoutRef.current = setTimeout(() => {
                setModalContent(null);
                setIsClosing(false);
            }, 300); // Tiempo aproximado de la animación de cierre
        }
    }, [showModalContainer, isClosing]);

    // Función para abrir el modal y establecer su contenido en una sola operación
    const openModal = (content: ReactNode) => {

        // No abrir un nuevo modal si uno está en proceso de cierre
        if (isClosing) return;
        
        // Limpiar cualquier timeout pendiente
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        setModalContent(content);
        setShowModalContainer(true);
    };

    // Función para cerrar el modal
    const closeModal = () => {
        setIsClosing(true);
        setShowModalContainer(false);
    };

    // Función segura para manejar cambios en el estado del modal
    const safeSetShowModalContainer: Dispatch<SetStateAction<boolean>> = (value) => {
        // Si es una función, ejecutarla con el estado actual
        if (typeof value === 'function') {
            setShowModalContainer(currentValue => {
                const newValue = value(currentValue);
                if (!newValue) setIsClosing(true);
                return newValue;
            });
        } else {
            // Si es un valor directo
            if (!value) setIsClosing(true);
            setShowModalContainer(value);
        }
    };

    const ModalContainerComponent: React.FC<React.PropsWithChildren<{ onClose?: () => void }>> = ({ children, onClose }) => {
    return (
        <ModalContainer
            showModalContainer={showModalContainer}
            setShowModalContainer={safeSetShowModalContainer}
            onClose={onClose}
        >
            {children ?? modalContent}
        </ModalContainer>
    );
};

    return{
        showModalContainer,
        setShowModalContainer: safeSetShowModalContainer,
        modalContent,
        setModalContent,
        openModal,
        closeModal,
        safeSetShowModalContainer,
        ModalContainer: ModalContainer as React.FC<ModalContainerProps>
    }
}
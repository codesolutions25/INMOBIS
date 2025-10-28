import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ImageIcon, ChevronLeft, ChevronRight, X, Maximize } from "lucide-react";
import { getProyectoImagenes, ProyectoImagen } from '@/services/apiProyectoImagenes';
import { getPropiedadImagenes, PropiedadImagen } from '@/services/apiPropiedadImagenes';
import { FILES_API_URL } from "@/config/constants";
import styles from './styles/GaleriaSimplificada.module.css';

type TipoGaleria = 'proyecto' | 'propiedad';

interface GaleriaSimplificadaProps {
  idProyecto?: number;
  idPropiedad?: number;
  tipo?: TipoGaleria;
}

// Tipo unión para manejar ambos tipos de imágenes
type ImagenUnion = ProyectoImagen | PropiedadImagen;

// Función para normalizar las imágenes a un formato común
const normalizarImagen = (imagen: ImagenUnion, tipo: TipoGaleria) => {
  if (tipo === 'proyecto') {
    const proyectoImagen = imagen as ProyectoImagen;
    return {
      id: proyectoImagen.idProyectosImagenes,
      url: proyectoImagen.urlImagen,
      descripcion: proyectoImagen.descripcion,
      fechaCreacion: proyectoImagen.createdAt
    };
  } else {
    const propiedadImagen = imagen as PropiedadImagen;
    return {
      id: propiedadImagen.idPropiedadImagenes,
      url: propiedadImagen.urlImagen,
      descripcion: propiedadImagen.descripcion,
      fechaCreacion: propiedadImagen.createdAt
    };
  }
};

// Función para validar URLs de imágenes
const getCorrectImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Si la URL ya es completa y parece válida, usarla directamente
  if (url.startsWith('http')) {
    return url;
  }
  
  // Si la URL es relativa, convertirla a absoluta
  if (url.startsWith('/')) {
    // Extraer la base URL sin '/api' al final
    const baseUrl = FILES_API_URL.replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  }
  
  // Si todo lo demás falla, devolver la URL original
  return url;
};

export default function GaleriaSimplificada({ idProyecto, idPropiedad, tipo = 'proyecto' }: GaleriaSimplificadaProps) {
  const [imagenes, setImagenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);
  
  // Determinar el ID y tipo a usar
  const tipoActual: TipoGaleria = tipo;
  const entityId = tipoActual === 'proyecto' ? idProyecto : idPropiedad;

  useEffect(() => {
    const cargarImagenes = async () => {

      try {
        setLoading(true);
        setError(null);
        
        if (!entityId) {
          setError(`ID de ${tipoActual} no proporcionado`);
          setImagenes([]);
          return;
        }
        
        console.log(`Cargando imágenes para ${tipoActual} ${entityId}`);
        
        let response;
        if (tipoActual === 'proyecto') {
          // Obtener hasta 100 imágenes para asegurar que obtenemos todas
          response = await getProyectoImagenes(entityId, 1, 100);
        } else {
          // Obtener hasta 100 imágenes para asegurar que obtenemos todas
          response = await getPropiedadImagenes(entityId, 1, 100);
        }
        
        if (response && response.data) {
          console.log(`Imágenes de ${tipoActual} obtenidas:`, response.data);
          console.log(`Metadatos de paginación:`, response.meta);
          
          if (response.meta) {
            console.log(`Total de imágenes disponibles: ${response.meta.total}`);
            console.log(`Imágenes obtenidas en esta página: ${response.data.length}`);
            console.log(`Página actual: ${response.meta.page} de ${response.meta.pages}`);
          }
          
          // Normalizar las imágenes para tener un formato consistente
          const imagenesNormalizadas = response.data.map((img: ImagenUnion) => {
            const normalizada = normalizarImagen(img, tipoActual);
            return normalizada;
          });
          console.log(`Total de imágenes normalizadas: ${imagenesNormalizadas.length}`);
          setImagenes(imagenesNormalizadas);
        } else {
          console.log(`No se encontraron imágenes para ${tipoActual} o respuesta vacía`);
          setImagenes([]);
        }
      } catch (error: any) {
        console.error(`Error al cargar imágenes de ${tipoActual}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Error desconocido al cargar imágenes de ${tipoActual}`;
        setError(errorMessage);
        setImagenes([]);
      } finally {
        setLoading(false);
      }
    };

    cargarImagenes();
  }, [entityId, tipoActual]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagenes.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  if (loading) {
    return (
      <div className={styles.gallery__loader}>
        <Loader2 className={styles.gallery__loaderIcon} />
        <p>Cargando imágenes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gallery__error}>
        <div className="text-red-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  if (imagenes.length === 0) {
    return (
      <div className={styles.gallery__empty}>
        <ImageIcon size={48} strokeWidth={1.5} />
        <p>No hay imágenes disponibles</p>
        <p className={styles.gallery__emptySubtext}>Las imágenes se mostrarán aquí cuando estén disponibles</p>
      </div>
    );
  }

  // Obtener la imagen actual
  const currentImage = imagenes[currentImageIndex];
  
  // Función para abrir la imagen en tamaño completo
  const toggleFullDetails = () => {
    setShowFullDetails(!showFullDetails);
  };

  return (
    <div className={styles.gallery}>
      {/* Área de imagen principal con altura fija */}
      <div className={styles.gallery__imageSection}>
        <div className={styles.gallery__imageWrapper}>
          <button 
            onClick={prevImage} 
            className={styles.gallery__navButton}
            disabled={imagenes.length <= 1}
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className={styles.gallery__imageContainer}>
            <img 
              ref={mainImageRef}
              src={getCorrectImageUrl(currentImage?.url)} 
              alt={currentImage?.descripcion || "Imagen"} 
              className={styles.gallery__mainImage}
              onClick={toggleFullDetails}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder-image.png';
              }}
            />
            <button 
              onClick={toggleFullDetails} 
              className={styles.gallery__zoomButton}
              aria-label="Ver detalles"
            >
              <Maximize size={18} />
            </button>
            
            {/* Contador de imágenes dentro de la imagen */}
            <div className={styles.gallery__counter}>
              {currentImageIndex + 1} / {imagenes.length}
            </div>
          </div>
          
          <button 
            onClick={nextImage} 
            className={styles.gallery__navButton}
            disabled={imagenes.length <= 1}
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      
      {/* Área de miniaturas separada con altura fija */}
      {imagenes.length > 0 && (
        <div className={styles.gallery__thumbnailsSection}>
          <div className={styles.gallery__thumbnails}>
            {imagenes.map((imagen, index) => (
              <div 
                key={imagen.id} 
                className={`${styles.gallery__thumbnail} ${index === currentImageIndex ? styles.gallery__thumbnailActive : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                title={imagen.descripcion || `Imagen ${index + 1}`}
              >
                <img 
                  src={getCorrectImageUrl(imagen.url)} 
                  alt={`Miniatura ${index + 1}`}
                  className={styles.gallery__thumbnailImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-image.png';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de imagen completa sin detalles */}
      {showFullDetails && (
        <div className={styles.gallery__modal} onClick={toggleFullDetails}>
          <div className={styles.gallery__modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.gallery__modalClose} onClick={toggleFullDetails} aria-label="Cerrar">
              <X size={18} />
            </button>
            <img 
              src={getCorrectImageUrl(currentImage?.url)} 
              alt={currentImage?.descripcion || "Imagen"} 
              className={styles.gallery__modalImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

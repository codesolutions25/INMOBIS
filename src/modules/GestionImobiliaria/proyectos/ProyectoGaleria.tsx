"use client"

import { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { ProyectoImagen, getProyectoImagenes } from '@/services/apiProyectoImagenes';
import { FILES_API_URL } from "@/config/constants";
import { Loader2, ImageIcon } from "lucide-react";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import styles from './styles/ProyectoGaleria.module.css';

interface ProyectoGaleriaProps {
  idProyecto: number;
}

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

export default function ProyectoGaleria({ idProyecto }: ProyectoGaleriaProps) {
  const [imagenes, setImagenes] = useState<ProyectoImagen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  useEffect(() => {
    const loadImagenes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getProyectoImagenes(idProyecto, 1, 20); // Cargar más imágenes para la galería
        
        if (response && response.data && Array.isArray(response.data)) {
          setImagenes(response.data);
        } else {
          setError('Formato de respuesta inesperado');
        }
      } catch (err) {
        console.error('Error al cargar imágenes:', err);
        setError('Error al cargar las imágenes del proyecto');
      } finally {
        setLoading(false);
      }
    };

    loadImagenes();
  }, [idProyecto]);
  
  // Efecto para reinicializar el Swiper cuando cambien las imágenes
  useEffect(() => {
    if (swiperInstance && imagenes.length > 0) {
      // Dar tiempo para que las imágenes se carguen
      const timer = setTimeout(() => {
        swiperInstance.update();
        if(swiperInstance.navigation?.update){
          swiperInstance.navigation.update();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imagenes, swiperInstance]);

  if (loading) {
    return (
      <div className={styles.gallery__loader}>
        <Loader2 className={styles.gallery__loaderIcon} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gallery__error}>
        <p>{error}</p>
      </div>
    );
  }

  if (imagenes.length === 0) {
    return (
      <div className={styles.gallery__empty}>
        <ImageIcon className={styles.gallery__emptyIcon} />
        <p className={styles.gallery__emptyText}>No hay imágenes disponibles para este proyecto</p>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.gallery__div}>
        {/* Main Swiper with full-size images */}
        <Swiper
          spaceBetween={10}
          navigation={true}
          loop={true}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          modules={[FreeMode, Navigation, Thumbs]}
          className={styles.swiper}
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => {
            const realIndex = swiper.realIndex;
            setActiveIndex(realIndex);
          }}
        >
          {imagenes.map((imagen) => (
            <SwiperSlide key={imagen.idProyectosImagenes}>
              <div className={styles.gallery__mainImageWrapper}>
                <img 
                  src={getCorrectImageUrl(imagen.urlImagen)} 
                  alt={imagen.descripcion || "Imagen del proyecto"} 
                  className={styles.gallery__mainImage}
                  loading="lazy"
                  onLoad={() => {
                    // Actualizar el Swiper cuando la imagen se carga
                    if (swiperInstance) {
                      setTimeout(() => swiperInstance.update(), 50);
                    }
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-image.png';
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Thumbnail Swiper */}
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          loop={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="thumbs-gallery"
        >
          {imagenes.map((imagen) => (
            <SwiperSlide key={`thumb-${imagen.idProyectosImagenes}`}>
              <div className={styles.gallery__thumbnail}>
                <img 
                  src={getCorrectImageUrl(imagen.urlImagen)} 
                  alt={imagen.descripcion || "Miniatura"} 
                  className={styles.gallery__thumbnailImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-image.png';
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Información adicional sobre las imágenes */}
        <div className={styles.gallery__info}>
          {/* Descripción de la imagen actual */}
          {imagenes.length > 0 && (
            <div className={styles.gallery__infoDescription}>
              <p className={styles.gallery__infoText}>
                {imagenes[activeIndex]?.descripcion || "Imagen del proyecto"}
              </p>
            </div>
          )}
          
          {/* Contador e información */}
          <div className={styles.gallery__infoFooter}>
            <div className={styles.gallery__infoCounter}>
              <span className={styles.gallery__infoCounter__bold}>{imagenes.length}</span> imágenes disponibles | Imagen {(activeIndex % imagenes.length) + 1} de {imagenes.length}
            </div>
            <div className={styles.gallery__infoActions}>
              <button 
                className={styles.gallery__infoButton}
                onClick={() => window.open(imagenes.length > 0 ? getCorrectImageUrl(imagenes[activeIndex].urlImagen) : '#', '_blank')}
                disabled={imagenes.length === 0}
              >
                Ver a tamaño completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

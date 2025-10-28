"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAlert } from "@/contexts/AlertContext";
import { Propiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { PropiedadImagen, getPropiedadImagenes, deletePropiedadImagenFromPropiedad } from '@/services/apiPropiedadImagenes';
import { deleteArchivo } from '@/services/apiArchivos';
import { Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { FILES_API_URL } from "@/config/constants";
import styles from './styles/PropiedadImageList.module.css';

interface PropiedadImagenesListProps {
  propiedad: Propiedad;
  onRefresh?: () => void;
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

export default function PropiedadImagenesList({ propiedad, onRefresh }: PropiedadImagenesListProps) {
  const [imagenes, setImagenes] = useState<PropiedadImagen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { showAlert } = useAlert();
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagenToDelete, setImagenToDelete] = useState<{id: number, url: string} | null>(null);

  const loadImagenes = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Cargando imágenes para la propiedad:', propiedad.idPropiedad);
      const response = await getPropiedadImagenes(propiedad.idPropiedad, page, limit);
      
      console.log('Respuesta de la API:', response);
      
      // Verificar la estructura de los datos recibidos
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Imágenes recibidas:', response.data);
        
        // Verificar las propiedades de cada imagen
        if (response.data.length > 0) {
          const primeraImagen = response.data[0];
          console.log('ID de la primera imagen:', primeraImagen.idPropiedadImagenes);
          console.log('URL de la primera imagen:', primeraImagen.urlImagen);
          console.log('URL corregida:', getCorrectImageUrl(primeraImagen.urlImagen));
        }
        
        setImagenes(response.data);
        setTotalPages(response.meta?.pages || 1);
        setTotalImages(response.meta?.total || response.data.length);
      } else {
        console.error('La respuesta no contiene un array de imágenes:', response);
        setError('Formato de respuesta inesperado');
      }
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      setError('Error al cargar las imágenes de la propiedad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImagenes();
  }, [propiedad.idPropiedad, page, limit]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Mostrar el diálogo de confirmación para eliminar una imagen
  const handleDeleteImageConfirmation = (idImagen: number, urlImagen: string) => {
    setImagenToDelete({ id: idImagen, url: urlImagen });
    setDeleteDialogOpen(true);
  };

  // Ejecutar la eliminación después de la confirmación
  const handleConfirmDelete = async () => {
    if (!imagenToDelete) return;
    
    const { id: idImagen, url: urlImagen } = imagenToDelete;
    setIsDeleting(idImagen);
    setDeleteDialogOpen(false);
    
    try {
      // 1. Eliminar la relación en la base de datos
      await deletePropiedadImagenFromPropiedad(propiedad.idPropiedad, idImagen);
      
      // 2. Intentar eliminar el archivo físico (esto podría fallar si el archivo ya no existe)
      try {
        // Extraer el nombre del archivo de la URL
        const fileName = urlImagen.split('/').pop();
        if (fileName) {
          await deleteArchivo(fileName);
        }
      } catch (fileErr) {
        console.error('No se pudo eliminar el archivo físico:', fileErr);
        // Continuamos aunque falle la eliminación del archivo físico
      }
      
      loadImagenes(page);
      showAlert('success', 'Éxito', 'Imagen eliminada correctamente');
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error al eliminar la imagen:', err);
      showAlert('error', 'Error', 'No se pudo eliminar la imagen');
    } finally {
      setIsDeleting(null);
      setImagenToDelete(null);
    }
  };

  const handleUploadSuccess = () => {
    loadImagenes();
    showAlert('success', 'Éxito', 'Imagen subida correctamente');
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
      <div className={styles.imageList}>
        {loading ? (
          <div className={styles.imageList__loader}>
            <Loader2 className={styles.imageList__loaderIcon} />
          </div>
        ) : error ? (
          <div className={styles.imageList__error}>{error}</div>
        ) : imagenes.length === 0 ? (
          <div className={styles.imageList__empty}>
            No hay imágenes para este proyecto
          </div>
        ) : (
          <>
            <div className={styles.imageList__grid}>
              {imagenes.map(imagen => (
                <div key={imagen.idPropiedadImagenes} className={styles.imageItem}>
                  <div className={styles.imageItem__preview}>
                    {imagen.urlImagen ? (
                      <img 
                        src={getCorrectImageUrl(imagen.urlImagen)} 
                        alt={imagen.descripcion || 'Imagen del proyecto'} 
                        className={styles.imageItem__img}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder-image.png';
                        }}
                      />
                    ) : (
                      <div className={styles.imageItem__placeholder}>
                        <ImageIcon className={styles.imageItem__placeholderIcon} />
                      </div>
                    )}
                  </div>
                  <div className={styles.imageItem__description}>
                    <p className={styles.imageItem__descriptionText}>{imagen.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className={styles.imageItem__actions}>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isDeleting !== null}
                      onClick={() => handleDeleteImageConfirmation(imagen.idPropiedadImagenes, imagen.urlImagen)}
                      className={styles.imageItem__deleteButton}
                    >
                      {isDeleting === imagen.idPropiedadImagenes ? (
                        <Loader2 className={styles.imageItem__deleteButtonSpinner} />
                      ) : (
                        <Trash2 className={styles.imageItem__deleteButtonIcon} />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          
          </>
        )}
        
        {/* Diálogo de confirmación para eliminar imágenes */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar esta imagen?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la imagen tanto de este proyecto como del servidor de archivos.
                {imagenToDelete && (
                  <div className={styles.deleteDialog}>
                    <div className={styles.deleteDialog__preview}>
                      <div className={styles.deleteDialog__previewContainer}>
                        <img 
                          src={getCorrectImageUrl(imagenToDelete.url)} 
                          alt="Imagen a eliminar" 
                          className={styles.deleteDialog__previewImg}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder-image.png';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className={styles.deleteDialog__action}
              >
                <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
}

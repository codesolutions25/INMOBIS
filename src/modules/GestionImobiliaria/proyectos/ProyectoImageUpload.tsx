"use client"

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { Proyecto } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { createProyectoImagen } from "@/services/apiProyectoImagenes";
import { FILES_API_URL, FETCH_OPTIONS } from "@/config/constants";
import styles from './styles/ProyectoImageUpload.module.css';

interface ProyectoImageUploadProps {
  proyecto: Proyecto;
  onSuccess?: () => void;
  closeModal?: () => void;
}

export default function ProyectoImageUpload({ proyecto, onSuccess, closeModal }: ProyectoImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();

  // Manejar la selección de archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  // Validar el archivo (tipo y tamaño)
  const validateFile = (file: File): boolean => {
    // Verificar el tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Error', 'Solo se permiten archivos de imagen');
      return false;
    }

    // Verificar el tamaño del archivo (máximo 5MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      showAlert('error', 'Error', 'El archivo es demasiado grande. El tamaño máximo es 20MB');
      return false;
    }

    return true;
  };

  // Manejar el evento de arrastrar sobre la zona
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Manejar el evento de salir de la zona de arrastre
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Manejar el evento de soltar el archivo
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(droppedFile);
      }
    }
  };

  // Manejar el clic en el área de arrastrar y soltar
  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Manejar el éxito de la subida
  const handleUploadSuccess = () => {
    // Limpiar el estado del formulario
    setFile(null);
    setPreview(null);
    setDescripcion("");
    
    // Notificar al componente padre
    if (onSuccess) {
      onSuccess();
    }
  };

  // Manejar la subida de la imagen
  const handleUpload = async () => {
    if (!file) {
      showAlert('error', 'Error', 'Por favor seleccione una imagen');
      return;
    }

    if (!descripcion.trim()) {
      showAlert('error', 'Error', 'Por favor ingrese una descripción');
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Primero subimos la imagen al microservicio de archivos
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('FILES_API_URL:', FILES_API_URL);
      let imageResponse;
      try {
        imageResponse = await fetch(`/api/proxy?service=files&path=imagenes/upload`, {
          method: 'POST',
          body: formData,
          ...FETCH_OPTIONS
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error('Error al subir la imagen:', errorText);
          showAlert('error', 'Error de servidor', 'El servidor de archivos respondió con un error. Por favor, inténtelo más tarde.');
          return;
        }
      } catch (uploadError) {
        console.error('Error en la conexión con el microservicio de archivos:', uploadError);
        showAlert('error', 'Error de conexión', 'No se pudo conectar con el servicio de archivos. Por favor, inténtelo más tarde.');
        return;
      }
      
      let imageData;
      try {
        imageData = await imageResponse.json();
        console.log('Respuesta del microservicio de archivos:', JSON.stringify(imageData, null, 2));
      } catch (parseError) {
        console.error('Error al procesar la respuesta del servidor:', parseError);
        showAlert('error', 'Error de formato', 'La respuesta del servidor no tiene el formato esperado.');
        return;
      }
      
      // Extraemos la ruta de la imagen de la respuesta
      // La API puede devolver la ruta directamente o dentro de un objeto
      // Exploramos diferentes estructuras posibles de la respuesta
      let rutaImagen = null;
      
      if (imageData.ruta) {
        // Formato 1: { ruta: '/path/to/image.jpg' }
        rutaImagen = imageData.ruta;
        console.log('Ruta encontrada en imageData.ruta:', rutaImagen);
      } else if (imageData.data && imageData.data.ruta) {
        // Formato 2: { data: { ruta: '/path/to/image.jpg' } }
        rutaImagen = imageData.data.ruta;
        console.log('Ruta encontrada en imageData.data.ruta:', rutaImagen);
      } else if (imageData.url) {
        // Formato 3: { url: '/path/to/image.jpg' }
        rutaImagen = imageData.url;
        console.log('Ruta encontrada en imageData.url:', rutaImagen);
      } else if (imageData.data && imageData.data.url) {
        // Formato 4: { data: { url: '/path/to/image.jpg' } }
        rutaImagen = imageData.data.url;
        console.log('Ruta encontrada en imageData.data.url:', rutaImagen);
      } else if (imageData.path) {
        // Formato 5: { path: '/path/to/image.jpg' }
        rutaImagen = imageData.path;
        console.log('Ruta encontrada en imageData.path:', rutaImagen);
      } else if (imageData.data && imageData.data.path) {
        // Formato 6: { data: { path: '/path/to/image.jpg' } }
        rutaImagen = imageData.data.path;
        console.log('Ruta encontrada en imageData.data.path:', rutaImagen);
      } else {
        // Si no encontramos la ruta en ninguno de los formatos conocidos, mostramos la estructura completa
        console.error('Estructura de respuesta desconocida:', imageData);
      }
      
      if (!rutaImagen) {
        console.error('No se pudo obtener la ruta de la imagen de la respuesta:', imageData);
        showAlert('error', 'Error de datos', 'No se pudo obtener la ruta de la imagen subida.');
        return;
      }
      
      // 2. Luego registramos la imagen en el microservicio de proyectos
    
    // Asegurarnos de que la URL de la imagen sea absoluta
    let urlCompleta = rutaImagen;
    
    // Si la ruta no comienza con http, construimos la URL completa
    if (rutaImagen && !rutaImagen.startsWith('http')) {
      // Si la ruta comienza con /, usamos la URL base directamente
      if (rutaImagen.startsWith('/')) {
        urlCompleta = `${FILES_API_URL.replace(/\/api$/, '')}${rutaImagen}`;
      } else {
        // Si no comienza con /, añadimos / entre la URL base y la ruta
        urlCompleta = `${FILES_API_URL.replace(/\/api$/, '')}/${rutaImagen}`;
      }
    }
    
    console.log('URL completa de la imagen:', urlCompleta);
    
    // Mantenemos camelCase para la interfaz TypeScript
    const proyectoImagenData = {
      idProyectoInmobiliario: proyecto.idProyectoInmobiliario,
      urlImagen: urlCompleta, // URL absoluta completa
      descripcion: descripcion
      // Nota: ya no se usa es_principal en la nueva estructura
    };
    
    console.log('Datos a enviar al microservicio de proyectos:', proyectoImagenData);
      
      // Usamos el servicio para crear la imagen del proyecto
      try {
        const resultado = await createProyectoImagen(proyectoImagenData);
        console.log('Respuesta exitosa al crear imagen en proyecto:', resultado);
        
        showAlert('success', 'Éxito', 'Imagen subida y registrada correctamente');
        // Si todo salió bien, cambiar a la vista de lista
        handleUploadSuccess();
      } catch (registroError: any) {
        console.error('Error al registrar la imagen en el proyecto:', registroError);
        
        // Mostrar detalles específicos del error si están disponibles
        if (registroError.response) {
          console.error('Detalles del error:', {
            status: registroError.response.status,
            data: registroError.response.data
          });
          
          // Mostrar mensaje de error más específico
          const errorMessage = registroError.response.data?.message || 
                              'La imagen se subió correctamente, pero no se pudo registrar en el proyecto.';
          showAlert('error', `Error ${registroError.response.status}`, errorMessage);
        } else {
          showAlert('error', 'Error de registro', 'La imagen se subió correctamente, pero no se pudo registrar en el proyecto. Por favor, inténtelo más tarde.');
        }
      }
      
    } catch (error) {
      console.error('Error general en el proceso de subida:', error);
      showAlert('error', 'Error', 'Ocurrió un error al procesar la imagen. Por favor, inténtelo más tarde.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Área de arrastrar y soltar */}
        <div
          className={`${isDragging ? styles.dropzoneActive : styles.dropzone} transition-all`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropzoneClick}
        >
            {preview ? (
              <div className={styles.previewContainer}>
                <img
                  src={preview}
                  alt="Vista previa"
                  className={styles.previewImage}
                />
                <p className={styles.previewFilename}>{file?.name}</p>
              </div>
            ) : (
              <div className={styles.dropzonePlaceholder}>
                <svg
                  className={styles.dropzoneIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className={styles.dropzonePrompt}>Arrastra y suelta una imagen aquí o haz clic para seleccionar</p>
                <p className={styles.dropzoneHint}>Formatos permitidos: JPG, PNG, GIF (máx. 20MB)</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          {/* Campo de descripción */}
          <div className={styles.descriptionContainer}>
            <label htmlFor="descripcion" className={styles.descriptionLabel}>
              Descripción
            </label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescripcion(e.target.value)}
              placeholder="Descripción detallada de la imagen"
              className={styles.descriptionTextarea}
            />
          </div>
          
          {/* Botones de acción */}
          <div className={styles.footer}>
            <div className={styles.actions}>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading || !descripcion.trim()}
              className={styles.uploadButton}
            >
              {isUploading ? (
                <div className={styles.loader}>
                  <Loader2 className={styles.loaderIcon} />
                  Subiendo...
                </div>
              ) : (
                "Subir imagen"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

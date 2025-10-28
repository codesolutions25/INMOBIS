import { useEffect, useState } from 'react';
import { getOpciones } from '@/services/apiOpciones';

interface OpcionRuta {
  id: number;
  ruta: string;
  nombre: string;
}

export const useOpcionesRutas = () => {
  const [rutasMapeadas, setRutasMapeadas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        setLoading(true);
        // Cargar todas las opciones (ajusta el número de elementos por página según sea necesario)
        const response = await getOpciones(1, 1000);
        
        // Crear un mapeo de rutas a IDs
        const mapeo: Record<string, number> = {};
        
        response.data.forEach((opcion: any) => {
          if (opcion.ruta) {
            // Asegurarse de que la ruta empiece con /
            const rutaNormalizada = opcion.ruta.startsWith('/') 
              ? opcion.ruta 
              : `/${opcion.ruta}`;
            mapeo[rutaNormalizada] = opcion.id;
          }
        });
        
        setRutasMapeadas(mapeo);
        setError(null);
      } catch (err) {
        console.error('Error al cargar las opciones de ruta:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    cargarOpciones();
  }, []);

  return { rutasMapeadas, loading, error };
};

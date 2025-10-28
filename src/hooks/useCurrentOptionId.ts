import { usePathname } from 'next/navigation';
import { usePermissions } from '@/contexts/PermissionContext';
import { useEffect, useState } from 'react';
import { getEmpresaModuloOpciones } from '@/services/apiEmpresaModuloOpcion';

type Permiso = {
  idEmpresaModuloOpcion: number;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeVer: boolean;
  [key: string]: any;
};

export const useCurrentOptionId = (): number | null => {
  const { permissions } = usePermissions();
  const pathname = usePathname()?.toLowerCase().trim() || '';
  const [rutasMapeadas, setRutasMapeadas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        // Cargar las opciones de empresa módulo
        const response = await getEmpresaModuloOpciones(1, 1000);
        
        const mapeo: Record<string, number> = {};
        
        response.data.forEach((opcion: any) => {
          if (opcion.ruta) {
            const rutaNormalizada = opcion.ruta.startsWith('/') 
              ? opcion.ruta 
              : `/${opcion.ruta}`;
            mapeo[rutaNormalizada] = opcion.idEmpresaModuloOpcion;
          }
        });

        setRutasMapeadas(mapeo);
      } catch (error) {
        console.error('Error al cargar las opciones de empresa módulo:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarOpciones();
  }, []);

  if (!permissions || loading) {
    return null;
  }

  // Map PermissionType to Permiso interface
  const permisosArray = Object.entries(permissions).map(([idEmpresaModuloOpcion, perm]) => ({
    idEmpresaModuloOpcion: parseInt(idEmpresaModuloOpcion, 10),
    puedeCrear: perm.crear,
    puedeEditar: perm.editar,
    puedeEliminar: perm.eliminar,
    puedeVer: perm.ver
  }));
  
  if (permisosArray.length === 0) {
    console.warn('El objeto de permisos está vacío');
    return null;
  }

  // Si solo hay un permiso, lo usamos directamente
  if (permisosArray.length === 1) {
    return permisosArray[0].idEmpresaModuloOpcion;
  }

  // Buscar por ruta exacta
  if (rutasMapeadas[pathname]) {
    return rutasMapeadas[pathname];
  }

  // Buscar por coincidencia parcial
  const rutaEncontrada = Object.keys(rutasMapeadas).find(ruta => 
    pathname.startsWith(ruta) || 
    pathname.endsWith(ruta) || 
    pathname.includes(ruta)
  );

  if (rutaEncontrada) {
    return rutasMapeadas[rutaEncontrada];
  }

  // Como último recurso, devolver el primer permiso con permiso de ver
  const permisoConPermisoVer = permisosArray.find(p => p.puedeVer);
  return permisoConPermisoVer?.idEmpresaModuloOpcion || permisosArray[0]?.idEmpresaModuloOpcion || 0;
};
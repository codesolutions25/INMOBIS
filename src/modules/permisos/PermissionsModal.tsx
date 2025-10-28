import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2, Save, X, Check, Square } from "lucide-react";
import { getModulos } from "@/services/apiModulos";
import { getEmpresaModuloOpciones } from "@/services/apiEmpresaModuloOpcion";
import { getUsuarioOpcion, updateUsuarioOpcion, createUsuarioOpcion } from "@/services/apiUsuarioOpciones";
import { getEmpresaSistemaModulos } from "@/services/apiEmpresaSistemaModulo";
import { useAlert } from "@/contexts/AlertContext";

interface PermisoEstado {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

interface PermisosState {
  [key: number]: PermisoEstado;
}

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: number;
  tipoUsuario: 'sistema' | 'empresa';
}

export function PermissionsModal({ isOpen, onClose, usuarioId, tipoUsuario }: PermissionsModalProps) {
  const [modulos, setModulos] = useState<any[]>([]);
  const [permisos, setPermisos] = useState<PermisosState>({});
  const [pendingChanges, setPendingChanges] = useState<PermisosState>({});
  const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert } = useAlert();

  // Filtrar módulos y opciones basado en el término de búsqueda
  const filteredModulos = useMemo(() => {
    // Primero filtramos los módulos activos
    const modulosActivos = modulos.filter(modulo => modulo.es_activo !== false);
    
    // Si no hay término de búsqueda, retornamos los módulos activos
    if (!searchTerm.trim()) return modulosActivos;
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return modulosActivos
      .map(modulo => {
        const opcionesFiltradas = modulo.opciones.filter((opcion: any) => {
          // Buscar en nombreAlias y ruta de la opción
          const nombreAlias = String(opcion.nombreAlias || '').toLowerCase();
          const ruta = String(opcion.ruta || '').toLowerCase();
          
          // También buscar en el nombre del módulo si está disponible
          const moduloNombre = String(
            modulo.nombre_modulo || 
            modulo.nombreModulo || 
            modulo.nombre || 
            ''
          ).toLowerCase();
          
          // Buscar coincidencias en cualquiera de los campos
          return (
            nombreAlias.includes(searchLower) ||
            ruta.includes(searchLower) ||
            moduloNombre.includes(searchLower)
          );
        });
        
        return {
          ...modulo,
          opciones: opcionesFiltradas
        };
      })
      .filter(modulo => modulo.opciones.length > 0);
  }, [modulos, searchTerm]);

  // Cargar módulos y permisos
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        
        const detalleResponse = await fetch(`/api/proxy?service=auth&path=detalle-usuario`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!detalleResponse.ok) {
          throw new Error('Error al obtener los detalles del usuario');
        }

        const detalleData = await detalleResponse.json();
        const detalles = detalleData.data || [];
        
        
        // Buscar el detalle específico según el tipo de usuario
        const detalleUsuario = detalles.find((d: any) => {
          const id = tipoUsuario === 'sistema' ? d.idUsuario : d.idUsuarioEmpresa;
          return id != null && id.toString() === usuarioId.toString();
        });

        if (!detalleUsuario) {
          throw new Error('No se encontró el detalle del usuario');
        }

        const detalleUsuarioId = detalleUsuario.id_detalle_usuario || detalleUsuario.id;
       

        // 2. Obtener todos los módulos
        const modulosResponse = await getModulos(1, 100);

        // 3. Obtener todos los registros de empresa_sistema_modulo
        const empresaSistemaModulosResponse = await getEmpresaSistemaModulos(1, 1000);

        // 4. Obtener todas las opciones de módulo de empresa
        const empresaModuloOpcionesResponse = await getEmpresaModuloOpciones(1, 1000);

        // 5. Crear un mapa de moduleId a empresaSistemaModulo
        const moduloToEmpresaSistemaModulo = empresaSistemaModulosResponse.data.reduce((acc: Record<number, any>, esm: any) => {
          if (esm.idModulo) {
            acc[esm.idModulo] = esm;
          }
          return acc;
        }, {});

        // 6. Crear un mapa de empresaSistemaModuloId a sus opciones
        const empresaSistemaModuloOpciones = empresaModuloOpcionesResponse.data.reduce((acc: Record<number, any[]>, emo: any) => {
          const esmId = emo.idEmpresaSistemaModulo;
          if (!acc[esmId]) {
            acc[esmId] = [];
          }
          acc[esmId].push(emo);
          return acc;
        }, {} as Record<number, any[]>);

        // 7. Combinar módulos con sus opciones
        const modulosConOpciones = modulosResponse.data.map((modulo: any) => {
          const esm = moduloToEmpresaSistemaModulo[modulo.modulos_id];
          let opciones: any[] = [];

          if (esm) {
            opciones = empresaSistemaModuloOpciones[esm.idEmpresaSistemaModulo] || [];
          }

          return {
            ...modulo,
            opciones: opciones.map(opcion => ({
              ...opcion,
              idEmpresaSistemaModulo: esm?.idEmpresaSistemaModulo
            }))
          };
        });

        // 8. Inicializar el estado de permisos
        const permisosIniciales: PermisosState = {};

        // 9. Para cada opción, obtener los permisos específicos del usuario usando el detalleUsuarioId
        for (const modulo of modulosConOpciones) {
          for (const opcion of modulo.opciones) {
            try {
              try {
                const permiso = await getUsuarioOpcion(detalleUsuarioId, opcion.idEmpresaModuloOpcion);
               
                // Si no existe el permiso, inicializar todos en false
                if (!permiso) {
                  permisosIniciales[opcion.idEmpresaModuloOpcion] = {
                    ver: false,
                    crear: false,
                    editar: false,
                    eliminar: false
                  };
                } else {
                  permisosIniciales[opcion.idEmpresaModuloOpcion] = {
                    ver: permiso.puedeVer || false,
                    crear: permiso.puedeCrear || false,
                    editar: permiso.puedeEditar || false,
                    eliminar: permiso.puedeEliminar || false
                  };
                }
              } catch (error) {
                console.error(`Error al cargar permiso para opción ${opcion.idEmpresaModuloOpcion}:`, error);
                // Inicializar en false si hay un error
                permisosIniciales[opcion.idEmpresaModuloOpcion] = {
                  ver: false,
                  crear: false,
                  editar: false,
                  eliminar: false
                };
              }
            } catch (error) {
              console.error(`Error cargando permiso para opción ${opcion.idEmpresaModuloOpcion}:`, error);
              permisosIniciales[opcion.idEmpresaModuloOpcion] = {
                ver: false,
                crear: false,
                editar: false,
                eliminar: false
              };
            }
          }
        }

        setModulos(modulosConOpciones);
        setPermisos(permisosIniciales);

        const initialExpanded: Record<number, boolean> = {};
        modulosResponse.data.forEach((modulo: any) => {
          initialExpanded[modulo.idModulo] = true;
        });
        setExpandedModules(initialExpanded);

      } catch (err) {
        console.error("Error al cargar los permisos:", err);
        setError("No se pudieron cargar los permisos. Intente nuevamente.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, usuarioId]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleAllPermissions = (moduleId: number, moduleOpciones: any[]) => {
    // Check if all permissions are already selected
    const allSelected = moduleOpciones.every(opcion => {
      const permisosOpcion = pendingChanges[opcion.idEmpresaModuloOpcion] || permisos[opcion.idEmpresaModuloOpcion];
      return permisosOpcion?.ver && permisosOpcion?.crear && permisosOpcion?.editar && permisosOpcion?.eliminar;
    });

    // Create new permissions state
    const newPermisos: PermisosState = { ...pendingChanges };
    
    // Toggle all permissions for this module
    moduleOpciones.forEach(opcion => {
      newPermisos[opcion.idEmpresaModuloOpcion] = {
        ver: !allSelected,
        crear: !allSelected,
        editar: !allSelected,
        eliminar: !allSelected
      };
    });

    setPendingChanges(newPermisos);
    setHasChanges(true);
  };

  const handlePermissionChange = (
    opcionId: number | string,
    permiso: 'ver' | 'crear' | 'editar' | 'eliminar',
    value: boolean
  ) => {
    const numericOpcionId = Number(opcionId);
    
    setPendingChanges(prev => {
      // Get the current permissions for this option (from pending changes or saved permissions)
      const currentPermisos = prev[numericOpcionId] || 
                            permisos[numericOpcionId] || 
                            { ver: false, crear: false, editar: false, eliminar: false };
      
      // Create a new state with the updated permission
      const newState = {
        ...prev,
        [numericOpcionId]: {
          ...currentPermisos,
          [permiso]: value
        }
      };
      
     
      
      return newState;
    });
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!usuarioId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Determinar si es un usuario del sistema (no empresa)
      const esSistema = tipoUsuario === 'sistema';

      // Usar el mismo ID para ambos casos, pero el backend lo interpretará según el tipo
      const idUsuario = usuarioId;
      console.log('ID del usuario:', idUsuario, 'Tipo:', tipoUsuario);
      // Verificar/crear detalle de usuario
      let detalleUsuarioId;
      try {
        // Endpoint base con límite alto para obtener todos los registros
        
        // 1. Obtenemos todos los detalles de usuario
        const detalleResponse = await fetch('/api/proxy?service=auth&path=detalle-usuario&page=1&limit=1000', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!detalleResponse.ok) {
          throw new Error('Error al obtener los detalles de usuario');
        }

        const responseData = await detalleResponse.json();
        console.log('Respuesta del servidor:', responseData);
        
        // Extraer el array de datos de la respuesta paginada
        const detalles = responseData.data || [];
        
        // Buscamos el detalle específico en el array
        const detalleEncontrado = detalles.find((d: any) => {
          const id = esSistema ? d.idUsuario : d.idUsuarioEmpresa;
          return id != null && id.toString() === idUsuario.toString();
        });
          
        console.log('Detalle encontrado:', detalleEncontrado);
        
        const detalleData = detalleEncontrado || null;
        
        try {
          // Verificar si la respuesta es exitosa pero no hay datos
          if (!detalleResponse.ok) {
            throw new Error('Error en la respuesta del servidor');
          }

          // Verificar si se encontró algún detalle
          if (!detalleData || (Array.isArray(detalleData) && detalleData.length === 0)) {
            // 2. Si no existe, creamos un nuevo detalle
            console.log('Creando nuevo detalle para:', esSistema ? 'usuario del sistema' : 'usuario empresa', idUsuario);
            
            const createBody = esSistema 
              ? {
                  idUsuario: idUsuario,
                  idUsuarioEmpresa: null,
                  fechaInicio: new Date().toISOString(),
                  fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                  estado: true
                }
              : {
                  idUsuario: null,
                  idUsuarioEmpresa: idUsuario,
                  fechaInicio: new Date().toISOString(),
                  fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                  estado: true
                };

            const createResponse = await fetch('/api/proxy?service=auth&path=detalle-usuario', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(createBody),
            });

            if (!createResponse.ok) {
              const errorData = await createResponse.json().catch(() => ({}));
              throw new Error(errorData.message || 'No se pudo crear el detalle del usuario');
            }

            const newDetalleData = await createResponse.json();
            detalleUsuarioId = newDetalleData.id;
            console.log('Nuevo detalle de usuario creado:', newDetalleData);
          } else {
            // Si el detalle ya existe, obtenemos su ID del primer elemento del array
            const detalle = Array.isArray(detalleData) ? detalleData[0] : detalleData;
            detalleUsuarioId = detalle?.id_detalle_usuario || detalle?.id;
            console.log('Detalle de usuario encontrado:', detalle);
            
            if (!detalleUsuarioId) {
              console.error('No se pudo obtener el ID del detalle de usuario. Respuesta completa:', detalleData);
              throw new Error('No se pudo obtener el ID del detalle de usuario');
            }
          }
        } catch (error) {
          console.error('Error al procesar la respuesta del servidor:', error);
          throw new Error('Error al procesar la respuesta del servidor');
        }
      } catch (error) {
        console.error('Error al verificar/crear detalle de usuario:', error);
        throw new Error('No se pudo verificar o crear el detalle del usuario');
      }

      // Validar que detalleUsuarioId sea un número válido
      const detalleUsuarioIdNum = Number(detalleUsuarioId);
      if (isNaN(detalleUsuarioIdNum)) {
        throw new Error(`ID de detalle de usuario inválido: ${detalleUsuarioId}`);
      }

      // Procesar los permisos con el detalle de usuario correcto
      const updatePromises = Object.entries(pendingChanges).map(async ([opcionId, permisos]) => {
        const idEmpresaModuloOpcion = Number(opcionId);
        
        try {
          console.log('Buscando permiso existente con:', {
            detalleUsuarioId: detalleUsuarioIdNum,
            idEmpresaModuloOpcion,
            tipoUsuario
          });
          
          // Intentar obtener el permiso existente
          const permisoExistente = await getUsuarioOpcion(detalleUsuarioIdNum, idEmpresaModuloOpcion);
          
          if (permisoExistente) {
            // Actualizar permiso existente
            return await updateUsuarioOpcion(detalleUsuarioIdNum, idEmpresaModuloOpcion, {
              puedeVer: Boolean(permisos.ver),
              puedeCrear: Boolean(permisos.crear),
              puedeEditar: Boolean(permisos.editar),
              puedeEliminar: Boolean(permisos.eliminar),
              asignadoPor: 1 // TODO: Reemplazar con el ID del usuario autenticado
            });
          } else {
            console.log('Creando nuevo permiso para opción:', idEmpresaModuloOpcion, detalleUsuarioId);
            // Crear nuevo permiso
            return await createUsuarioOpcion({
              idDetalleUsuario: detalleUsuarioId,
              idEmpresaModuloOpcion,
              puedeVer: Boolean(permisos.ver),
              puedeCrear: Boolean(permisos.crear),
              puedeEditar: Boolean(permisos.editar),
              puedeEliminar: Boolean(permisos.eliminar),
              asignadoPor: 1 // TODO: Reemplazar con el ID del usuario autenticado
            });
          }
        } catch (error) {
          console.error(`Error procesando permiso para opción ${idEmpresaModuloOpcion}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      
      // Actualizar el estado local
      setPermisos(prev => ({
        ...prev,
        ...pendingChanges
      }));
      
      showAlert('success', 'Éxito', 'Permisos actualizados correctamente');
      setPendingChanges({});
      
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar los permisos';
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargando permisos...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto overflow-x-visible" >
        <DialogHeader>
          <DialogTitle>Gestión de Permisos</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full p-2 pl-10 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {filteredModulos.map((modulo) => (
            <Collapsible
              key={modulo.idModulo}
              open={expandedModules[modulo.idModulo]}
              onOpenChange={() => toggleModule(modulo.idModulo)}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">Módulo {modulo.nombre}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAllPermissions(modulo.idModulo, modulo.opciones);
                      }}
                    >
                      {modulo.opciones.every((opcion: any) => {
                        const permisosOpcion = pendingChanges[opcion.idEmpresaModuloOpcion] || permisos[opcion.idEmpresaModuloOpcion];
                        return permisosOpcion?.ver && permisosOpcion?.crear && permisosOpcion?.editar && permisosOpcion?.eliminar;
                      }) ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Square className="h-3.5 w-3.5 mr-1 border rounded-sm" />
                      )}
                      {modulo.opciones.every((opcion: any) => {
                        const permisosOpcion = pendingChanges[opcion.idEmpresaModuloOpcion] || permisos[opcion.idEmpresaModuloOpcion];
                        return permisosOpcion?.ver && permisosOpcion?.crear && permisosOpcion?.editar && permisosOpcion?.eliminar;
                      }) ? 'Desmarcar todo' : 'Marcar todo'}
                    </Button>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${expandedModules[modulo.idModulo] ? 'rotate-180' : ''}`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opción
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ver
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crear
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Editar
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eliminar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modulo.opciones.map((opcion: any) => {
                      // Usar cambios pendientes si existen, de lo contrario usar los permisos guardados
                      const permisosOpcion = pendingChanges[opcion.idEmpresaModuloOpcion] ||
                        permisos[opcion.idEmpresaModuloOpcion] ||
                        { ver: false, crear: false, editar: false, eliminar: false };

                      return (
                        <tr key={opcion.idEmpresaModuloOpcion}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {opcion.nombre || opcion.nombreAlias || `Opción ${opcion.idEmpresaModuloOpcion}`}
                          </td>
                          {['ver', 'crear', 'editar', 'eliminar'].map((permiso) => (
                            <td key={`${opcion.idEmpresaModuloOpcion}-${permiso}`} className="px-6 py-4 whitespace-nowrap text-center">
                              <Checkbox
                                checked={Boolean(permisosOpcion[permiso as keyof PermisoEstado])}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    opcion.idEmpresaModuloOpcion,
                                    permiso as keyof PermisoEstado,
                                    checked === true
                                  )
                                }
                                className="h-5 w-5"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isSaving ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </div>
            ) : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PermissionsModal;
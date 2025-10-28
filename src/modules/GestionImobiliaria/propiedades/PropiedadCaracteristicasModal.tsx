import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Box, CircularProgress, Tooltip } from "@mui/material";
import { Plus, Trash, Pencil, Eye } from "lucide-react";
import MuiPagination from '@/components/ui/pagination';
import { CatalogoCaracteristica, CaracteristicaPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import Datatable from '@/components/table/datatable';
import { ColumnDef } from '@tanstack/react-table';
import styles from './styles/PropiedadCaracteristicasModal.module.css';
import PropiedadAgregarCaracteristicasModal from './PropiedadAgregarCaracteristicasModal';
import InmobiliariaApi from '../services/InmobiliariaApi';

interface PropiedadCaracteristicasModalProps {
  propiedadId: number;
  open: boolean;
  onClose: () => void;
}

// Modal robusto para gestión de características de propiedad
export default function PropiedadCaracteristicasModal({ propiedadId, open, onClose }: PropiedadCaracteristicasModalProps) {
  // Los estilos personalizados para el modal ahora están en el CSS module
  const [loading, setLoading] = useState(false);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaPropiedad[]>([]);
  const [catalogoModalOpen, setCatalogoModalOpen] = useState(false);
  const [catalogoModalJustClosed, setCatalogoModalJustClosed] = useState(false);
  const [catalogo, setCatalogo] = useState<CatalogoCaracteristica[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Estado para el modal de edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [caracteristicaToEdit, setCaracteristicaToEdit] = useState<CaracteristicaPropiedad | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  // Estado para el modal de detalles
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [caracteristicaToView, setCaracteristicaToView] = useState<CaracteristicaPropiedad | null>(null);
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [caracteristicaToDelete, setCaracteristicaToDelete] = useState<CaracteristicaPropiedad | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  
  // Función para eliminar una característica
  const handleDelete = async () => {
    if (!caracteristicaToDelete || !isMounted.current) return;
    
    setDeleteDialogOpen(false);
    setLoading(true);
    
    try {
      console.log(`Eliminando característica ${caracteristicaToDelete.idCatalogoCaracteristicas} de propiedad ${propiedadId}`);
      
      // Guardar la página actual antes de actualizar
      const prevPage = currentPage;
      
      // Contar cuántos elementos hay en la página actual antes de eliminar
      const startIdx = (prevPage - 1) * itemsPerPage;
      const itemsInCurrentPageBefore = caracteristicas.slice(startIdx, startIdx + itemsPerPage).length;
      console.log(`Items en la página ${prevPage} antes de eliminar: ${itemsInCurrentPageBefore}`);
      
      // Si solo queda un elemento en la página actual y no es la primera página, prepararse para retroceder
      const shouldAdjustPage = itemsInCurrentPageBefore === 1 && prevPage > 1;
      
      await InmobiliariaApi.caracteristicasPropiedadController.delete(caracteristicaToDelete.idCatalogoCaracteristicas, propiedadId);
      console.log('Característica eliminada correctamente');

      if (isMounted.current) {
        // Refetch para actualizar la lista de características
        await fetchCaracteristicas();
        
        // Calcular el nuevo total de páginas
        const newTotalItems = caracteristicas.length;
        const newTotalPages = Math.max(1, Math.ceil(newTotalItems / itemsPerPage));
        
        // Si estamos en una página que ya no existe o era el último elemento de la página
        if (prevPage > newTotalPages || shouldAdjustPage) {
          const newPage = shouldAdjustPage ? prevPage - 1 : Math.max(1, newTotalPages);
          console.log(`Ajustando página de ${prevPage} a ${newPage} porque la página actual quedó vacía`);
          setCurrentPage(newPage);
        }
      }
    } catch (error) {
      console.error('Error al eliminar característica:', error);

      if (isMounted.current) {
        // Mostrar mensaje de error
        alert("Error al eliminar la característica: " + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }

    if (isMounted.current) {
      setLoading(false);
    }
  };

  // Ref para controlar si el componente está montado
  const isMounted = useRef(true);

  // Control de montaje/desmontaje del componente
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && propiedadId) {
      console.log(`Modal abierto para propiedad ${propiedadId}, obteniendo datos...`);
      setLoading(true);
      
      // Cargar datos en paralelo para mayor velocidad
      Promise.all([
        fetchCatalogo(),
        fetchCaracteristicas()
      ]).then(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
    }
  }, [open, propiedadId]);

  // Efecto para recargar catálogo cuando se cierra el modal de catálogo
  useEffect(() => {
    if (!catalogoModalOpen && catalogoModalJustClosed && isMounted.current) {
      fetchCatalogo();
      setCatalogoModalJustClosed(false);
    }
  }, [catalogoModalOpen, catalogoModalJustClosed]);

  const fetchCaracteristicas = async () => {
    if (!isMounted.current) return;

    try {
      console.log(`Obteniendo características para propiedad ID: ${propiedadId}`);
      const relaciones = await InmobiliariaApi.caracteristicasPropiedadController.getByPropiedadId(propiedadId);
      console.log('Características obtenidas:', relaciones);

      if (isMounted.current) {
        setCaracteristicas(relaciones);
      }
    } catch (error) {
      console.error('Error al obtener características:', error);

      if (isMounted.current) {
        setCaracteristicas([]);
      }
    }
  };

  const fetchCatalogo = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      console.log('Obteniendo catálogo completo de características...');
      
      // Obtener todas las características (activas e inactivas) para poder mapear los nombres
      const response = await InmobiliariaApi.catalogoCaracteristicaController.getCatalogoCaracteristicaList(); // Sin filtro de 'activo'
      if (isMounted.current) {
        setCatalogo(response?.data || []);
        console.log("Catálogo completo de características cargado:", response?.data);
      }
    } catch (error) {
      console.error("Error al obtener el catálogo de características:", error);
    }
  }, []);

  // Helpers
  const catalogoAsignadoIds = caracteristicas?.map(c => c.idCatalogoCaracteristicas) || [];
  const catalogoNoAsignado = useMemo(() => {
    const asignadosIds = new Set(caracteristicas.map(c => c.idCatalogoCaracteristicas));
    return catalogo.filter(c => c.activo && !asignadosIds.has(c.idCatalogoCaracteristicas));
  }, [caracteristicas, catalogo]);

  // Paginación
  const totalPages = Math.ceil(caracteristicas.length / itemsPerPage);
  
  const paginatedCaracteristicas = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return caracteristicas.slice(startIdx, startIdx + itemsPerPage);
  }, [caracteristicas, currentPage, itemsPerPage]);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  console.log('IDs de características asignadas:', catalogoAsignadoIds);
  console.log('Características no asignadas:', catalogoNoAsignado);

  // Definición de columnas para el Datatable con anchos fijos y estilos consistentes
  const columns: ColumnDef<CaracteristicaPropiedad>[] = [
    {
      id: "index",
      header: () => <div className="text-center font-bold" style={{ width: '80px' }}>N°</div>,
      cell: ({ row }) => {
        // Calcular el índice real basado en la página actual
        const realIndex = (currentPage - 1) * itemsPerPage + row.index + 1;
        return <div className="text-center" style={{ width: '80px' }}>{realIndex}</div>;
      },
      size: 80, // Ancho fijo en pixeles
      minSize: 80, // Ancho mínimo
      maxSize: 80, // Ancho máximo
      enableResizing: false // Deshabilitar el redimensionamiento
    },
    {
      accessorKey: "nombre",
      header: () => <div className="text-left font-bold" style={{ width: '250px' }}>Característica</div>,
      cell: ({ row }) => {
        const caracteristicaId = row.original.idCatalogoCaracteristicas;
        const catalogoItem = catalogo.find(item => item.idCatalogoCaracteristicas === caracteristicaId);
        return <div className="text-left" style={{ width: '250px' }}>{catalogoItem ? catalogoItem.nombre : 'Característica no encontrada'}</div>;
      },
      size: 250, // Ancho fijo en pixeles
      minSize: 250, // Ancho mínimo
      maxSize: 250, // Ancho máximo
      enableResizing: false // Deshabilitar el redimensionamiento
    },
    {
      accessorKey: "valor",
      header: () => <div className="text-center font-bold" style={{ width: '550px' }}>Valor</div>,
      cell: ({ row }) => {
        // Mostrar el valor con truncamiento si es muy largo
        const valor = row.original.valor || '';
        const displayValue = valor.length > 80 ? `${valor.substring(0, 80)}...` : valor;
        
        // Aplicar estilos consistentes para la celda de valor
        return (
          <div 
            className="text-left" 
            title={valor.length > 80 ? valor : ''}
            style={{ 
              width: '550px',
              padding: '8px',
              boxSizing: 'border-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayValue}
          </div>
        );
      },
      size: 550, // Ancho fijo en pixeles
      minSize: 550, // Ancho mínimo
      maxSize: 550, // Ancho máximo
      enableResizing: false // Deshabilitar el redimensionamiento
    },
    {
      id: "acciones",
      header: () => <div className="text-center font-bold" style={{ width: '150px' }}>Acciones</div>,
      cell: ({ row }) => {
        return (
          <div className="flex justify-center space-x-1">
            <Tooltip title="Ver detalles">
              <Button
                onClick={() => viewDetails(row.original)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip title="Editar">
              <Button
                onClick={() => startEditRow(row.original)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip title="Eliminar">
              <Button
                onClick={() => handleConfirmDelete(row.original)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                title="Eliminar"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        );
      },size: 100
    },
  ];

  // Ver detalles
  function viewDetails(row: CaracteristicaPropiedad) {
    setCaracteristicaToView(row);
    setDetailsDialogOpen(true);
  }
  
  // Editar valor
  function startEditRow(row: CaracteristicaPropiedad) {
    setCaracteristicaToEdit(row);
    setEditValue(row.valor || "");
    setEditDialogOpen(true);
  }
  
  async function handleEditSave() {
    if (!caracteristicaToEdit) return;
    if (editValue === caracteristicaToEdit.valor) {
      setEditDialogOpen(false);
      setCaracteristicaToEdit(null);
      setEditValue("");
      return;
    }

    if (!isMounted.current) return;
    setLoading(true);

    try {
      console.log(`Actualizando característica ${caracteristicaToEdit.idCatalogoCaracteristicas} de propiedad ${propiedadId} con valor: ${editValue}`);
      await InmobiliariaApi.caracteristicasPropiedadController.update(caracteristicaToEdit.idCatalogoCaracteristicas, propiedadId, editValue);
      console.log('Característica actualizada correctamente');

      if (isMounted.current) {
        setEditDialogOpen(false);
        setCaracteristicaToEdit(null);
        setEditValue("");
        // Refetch
        await fetchCaracteristicas();
      }
    } catch (error) {
      console.error('Error al actualizar característica:', error);

      if (isMounted.current) {
        alert("Error al actualizar la característica: " + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }

    if (isMounted.current) {
      setLoading(false);
    }
  }

  // Mostrar diálogo de confirmación para eliminar
  const handleConfirmDelete = (row: CaracteristicaPropiedad) => {
    setCaracteristicaToDelete(row);
    setDeleteDialogOpen(true);
  };
  


  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        Características de la Propiedad
      </DialogTitle>
      <DialogContent className={styles.dialogContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <CircularProgress />
          </div>
        ) : (
          <>
            <div className="w-full mt-2 mb-1">
              {/* Contenedor con altura fija para la tabla */}
              <div className={styles.tableContainer}>
                {caracteristicas.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                      </svg>
                    </div>
                    <p className={styles.emptyStateTitle}>No hay características asignadas a esta propiedad</p>
                    <p className={styles.emptyStateText}>Haga clic en "Agregar Característica" para comenzar</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Contenedor de tabla con altura fija */}
                      <Datatable 
                        data={paginatedCaracteristicas} 
                        columns={columns} 
                      />
                      {/* Espacio para mantener altura consistente cuando hay menos de 10 filas */}
                      {paginatedCaracteristicas.length < 10 && (
                        <div style={{ height: `${(10 - paginatedCaracteristicas.length) * 40}px` }}></div>
                      )}
                  </div>
                )}
              </div>
              
              {/* Contenedor fijo para la paginación */}
              <div className={styles.paginationContainer}>
                {caracteristicas.length > 0 && (
                  <div className={styles.paginationWrapper}>
                    <MuiPagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event: React.ChangeEvent<unknown>, page: number) => handlePageChange(page)}
                      showFirstButton
                      showLastButton
                      className={styles.paginationContent}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <DialogActions className={styles.dialogActions}>
        <Box>
          
          <MuiButton 
            variant="contained" 
            onClick={() => setAddDialogOpen(true)}
            className={styles.addButton}
            startIcon={<Plus size={16} />}
          >
            Agregar característica
          </MuiButton>
        </Box>
        <MuiButton 
          variant="contained" 
          onClick={onClose}
          className={styles.closeButton}
        >
          CERRAR
        </MuiButton>
      </DialogActions>

      {/* Modal para agregar características */}
      <PropiedadAgregarCaracteristicasModal
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        propiedadId={propiedadId}
        catalogoNoAsignado={catalogoNoAsignado}
        loading={loading}
        setLoading={setLoading}
        onSuccess={fetchCaracteristicas}
        isMounted={isMounted}
      />
      
      {/* Modal para editar características */}
      <Dialog 
      open={editDialogOpen} 
      onClose={() => setEditDialogOpen(false)} 
      maxWidth="md" 
      fullWidth>
        <DialogTitle className={styles.editDialogTitle}>
          Editar Característica
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3, px: 3 }}>
          {loading ? (
            <Box className={styles.loadingBox}>
              <CircularProgress />
            </Box>
          ) : caracteristicaToEdit && (
            <Box sx={{ mt: 2 }}>
              <h3 className="text-lg font-semibold mb-2">
                {catalogo.find(item => item.idCatalogoCaracteristicas === caracteristicaToEdit.idCatalogoCaracteristicas)?.nombre || 'Característica'}
              </h3>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <Textarea
                id="valor"
                value={editValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditValue(e.target.value)}
                placeholder="Ingrese el valor de la característica"
                className={`w-full ${styles.textarea}`}
                autoFocus
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setEditDialogOpen(false)} 
            variant="outlined"
            className={styles.cancelButton}
          >
            Cancelar
          </MuiButton>
          <MuiButton
            onClick={handleEditSave}
            variant="contained"
            disabled={loading || !caracteristicaToEdit}
            className={styles.saveButton}
          >
            Guardar
          </MuiButton>
        </DialogActions>
      </Dialog>
      
      {/* Modal para ver detalles de características */}
      <Dialog 
      open={detailsDialogOpen} 
      onClose={() => setDetailsDialogOpen(false)} 
      maxWidth="md" 
      fullWidth>
        <DialogTitle className={styles.detailsDialogTitle}>
          Detalles de Característica
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3, px: 3 }}>
          {caracteristicaToView && (
            <Box sx={{ mt: 2 }}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {catalogo.find(item => item.idCatalogoCaracteristicas === caracteristicaToView.idCatalogoCaracteristicas)?.nombre || 'Característica'}
                  </h3>
                  <div className={styles.detailsValue}>
                    {caracteristicaToView.valor || <span className="text-gray-500 italic">Sin valor</span>}
                  </div>
                </div>
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setDetailsDialogOpen(false)} 
            variant="contained"
            style={{ backgroundColor: '#00b1b9', color: 'white' }}
          >
            Cerrar
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación para eliminar característica */}
      <Dialog 
      open={deleteDialogOpen} 
      onClose={() => setDeleteDialogOpen(false)} 
      maxWidth="sm" 
      fullWidth>
        <DialogTitle className={styles.deleteDialogTitle}>
          ¿Está seguro de eliminar esta característica?
        </DialogTitle>
        <DialogContent className={styles.deleteDialogContent}>
          <div className="py-2 flex items-start">
            <div className={styles.deleteWarningIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <p>Esta acción no se puede deshacer. Se eliminará permanentemente la característica.</p>
              {caracteristicaToDelete && (
                <div className={styles.deleteWarningBox}>
                  <h3 className="font-semibold">
                    {caracteristicaToDelete && catalogo.find(item => item.idCatalogoCaracteristicas === caracteristicaToDelete.idCatalogoCaracteristicas)?.nombre || 'Característica'}
                  </h3>
                  <p className="text-gray-600 mt-1">{caracteristicaToDelete && caracteristicaToDelete.valor || "Sin valor"}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            style={{ color: '#00b1b9', borderColor: '#00b1b9' }}
          >
            Cancelar
          </MuiButton>
          <MuiButton
            onClick={handleDelete}
            variant="contained"
            className={styles.deleteButton}
          >
            Eliminar
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

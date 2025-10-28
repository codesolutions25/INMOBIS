"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import PuntoVentaForm from "./PuntoVentaForm";
import { PuntoVenta } from "@/types/puntoventa";
import { Empresa } from "@/types/empresas";
import Datatable from "@/components/table/datatable";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPuntoVentaColumns } from "./columns";
import { getEmpresas } from "@/services/apiEmpresa";
import { getPuntosVenta, deletePuntoVenta } from "@/services/apiPuntoVenta";
import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCompany } from "@/contexts/CompanyContext";
import MuiPagination from "@/components/ui/pagination";
import styles from './styles/PuntoVentaList.module.css';


const ITEMS_PER_PAGE = 10;

export default function PuntoVentaList() {
  // MODAL
  const {
    setShowModalContainer,
    closeModal: closeModalFromHook,
    ModalContainer
  } = useModalContainer();

  // Permisos
  const optionId = useCurrentOptionId();
  const canCreate = useCheckPermission(optionId ?? 0)('crear');
  const canEdit = useCheckPermission(optionId ?? 0)('editar');
  const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

  // Estado para controlar el formulario persistente
  const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
  const [puntoVentaEdit, setPuntoVentaEdit] = useState<PuntoVenta | undefined>(undefined);
  const [empresaMap, setEmpresaMap] = useState<Record<number, Empresa>>({});

  const { showAlert } = useAlert();

  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [puntoVentaToDelete, setPuntoVentaToDelete] = useState<PuntoVenta | null>(null);

  // Referencias para optimizar re-renders
  const isInitialMount = useRef(true);
  const previousRefreshTrigger = useRef(refreshTrigger);
  const previousSearchTerm = useRef(searchTerm);
  const previousCurrentPage = useRef(currentPage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [allPuntosVenta, setAllPuntosVenta] = useState<PuntoVenta[]>([]);

  // Get the selected company from context
  const { selectedCompany } = useCompany();

  useEffect(() => {
    const total = Math.ceil(allPuntosVenta.length / itemsPerPage) || 1;
    setTotalPages(total);
  }, [allPuntosVenta.length, itemsPerPage]);

  // Usamos useMemo para evitar recálculos innecesarios
  const paginatedPuntosVenta = useMemo(() => {
    // Si no hay datos, retornar array vacío
    if (allPuntosVenta.length === 0) return [];
    
    // Calcular índices para la paginación
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    
    // Retornar solo los elementos de la página actual
    return allPuntosVenta.slice(startIdx, endIdx);
  }, [allPuntosVenta, currentPage, itemsPerPage]);

  // Funciones optimizadas
  const fetchPuntosVenta = useCallback(async (page: number = 1, search?: string) => {
    if (isLoading) return;

        
    setIsLoading(true);
    try {
      const empresas = await getEmpresas();
      const empresasMap = empresas.data.reduce((acc, empresa) => {
        acc[empresa.idEmpresa] = empresa;
        return acc;
      }, {} as Record<number, Empresa>);

      setEmpresaMap(empresasMap);

      // Obtener los puntos de venta
      const response = await getPuntosVenta(1, 1000, search);
      
      // Aplicar filtro por empresa si hay una seleccionada
      let filteredData = response.data;
      
      if (selectedCompany) {
        filteredData = filteredData.filter((pv: PuntoVenta) => pv.empresa_id === selectedCompany.idEmpresa);
      }

      // Aplicar filtro de búsqueda si existe
      if (search && search.trim() !== '') {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter((pv: PuntoVenta) => 
          (pv.nombre_punto_venta?.toLowerCase().includes(searchLower) ||
          (pv.empresa_id && empresasMap[pv.empresa_id]?.razonSocial?.toLowerCase().includes(searchLower)))
        );
      }

      // Guardar todos los datos filtrados
      setAllPuntosVenta(filteredData);
      
      // Calcular la paginación
      const total = filteredData.length;
      const totalPages = Math.ceil(total / itemsPerPage);
      
      // Obtener solo los elementos de la página actual
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      // Actualizar el estado
      setPuntosVenta(paginatedData);
      setTotalItems(total);
      setTotalPages(totalPages);
      setCurrentPage(page > totalPages && totalPages > 0 ? totalPages : page);
      
    } catch (error) {
      console.error('Error fetching puntos de venta:', error);
      showAlert('error', 'Error', 'Error al cargar los puntos de venta');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, itemsPerPage, showAlert, selectedCompany?.idEmpresa]);

  // Efecto para manejar cambios en la empresa seleccionada
  useEffect(() => {
    // Resetear el estado cuando cambia la empresa
    setCurrentPage(1);
    setSearchTerm('');
    setInputValue('');
    
    // Forzar una recarga de los datos
    if (selectedCompany) {
      console.log('Empresa seleccionada cambiada a:', selectedCompany.idEmpresa);
      fetchPuntosVenta(1, '');
    }
  }, [selectedCompany?.idEmpresa]);

  // Efecto optimizado para búsqueda y paginación
  useEffect(() => {
    // Don't fetch if no company is selected
    if (!selectedCompany) {
      console.log('Esperando a que se cargue la empresa seleccionada...');
      return;
    }

    const loadData = async () => {
      console.log('Cargando datos para la empresa:', selectedCompany.idEmpresa);
      await fetchPuntosVenta(1, searchTerm);
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadData();
      return;
    }

    const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
    const searchChanged = previousSearchTerm.current !== searchTerm;
    const pageChanged = previousCurrentPage.current !== currentPage;

    if (refreshChanged || searchChanged || pageChanged) {
      previousRefreshTrigger.current = refreshTrigger;
      previousSearchTerm.current = searchTerm;
      previousCurrentPage.current = currentPage;
      
      // Always reset to first page when filters change
      const newPage = (searchChanged || refreshChanged) ? 1 : currentPage;
      fetchPuntosVenta(newPage, searchTerm);
    }
  }, [fetchPuntosVenta, refreshTrigger, searchTerm, currentPage]);

  // 3. Add search change handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  }, []);

  useEffect(() => {
    const filtro = inputValue.trim().toLowerCase();
    if (filtro) {
      const filtered = allPuntosVenta.filter(punto =>
        (punto.nombre_punto_venta && punto.nombre_punto_venta.toLowerCase().includes(filtro)) ||
        (punto.direccion_punto_venta && punto.direccion_punto_venta.toLowerCase().includes(filtro)) ||        
        (punto.telefono_punto_venta && punto.telefono_punto_venta.toLowerCase().includes(filtro))
      );
      setPuntosVenta(filtered);
      setTotalItems(filtered.length);
      setCurrentPage(1);
    } else {
      setPuntosVenta(allPuntosVenta);
      setTotalItems(allPuntosVenta.length);
    }
  }, [inputValue, allPuntosVenta]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue);
      if (inputValue !== searchTerm) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [inputValue, searchTerm]);

  const isRefreshing = useRef(false);

  const refreshList = useCallback(() => {
    if (isRefreshing.current) return;

    isRefreshing.current = true;

    setTimeout(() => {
      setRefreshTrigger((prev) => prev + 1);
      setCurrentPage(1);
      setTimeout(() => {
        isRefreshing.current = false;
      }, 500);
    }, 500);
  }, []);

  const handleOpenRegisterModal = useCallback(() => {
    setPuntoVentaEdit(undefined);
    setModalType("register");
    setShowModalContainer(true);
  }, [setShowModalContainer]);

  const handleOpenEditModal = useCallback((puntoVenta: PuntoVenta) => {
    setPuntoVentaEdit(puntoVenta);
    setModalType("edit");
    setShowModalContainer(true);
  }, [setShowModalContainer]);

  const onEdit = handleOpenEditModal;

  const onDelete = useCallback(
    (puntoVenta: PuntoVenta) => {
      setPuntoVentaToDelete(puntoVenta);
      setDeleteDialogOpen(true);
    },
    []
  );

  const columns = useMemo(() => getPuntoVentaColumns({
    onEdit,
    onDelete,
    empresaMap,
    canEdit,
    canDelete,
  }), [onEdit, empresaMap, canEdit, canDelete]);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setPuntoVentaEdit(undefined);
    setShowModalContainer(false);
  }, [setShowModalContainer]);

  const handleConfirmDelete = async () => {
    if (puntoVentaToDelete) {
      try {
        await deletePuntoVenta(puntoVentaToDelete.id_punto_venta);
        showAlert('success', 'Éxito', 'Punto de venta eliminado exitosamente');
        refreshList();
      } catch (error) {
        console.error('Error al eliminar punto de venta:', error);
        showAlert('error', 'Error', `Error al eliminar punto de venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setDeleteDialogOpen(false);
        setPuntoVentaToDelete(null);
      }
    }
  };

  return (
    <>
      <AdminCardLayout>
        <AdminCardLayout.Title>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>Lista de puntos de venta</h2>
            
            <div className={styles.searchContainer}>
              <div className={styles.searchInputContainer}>
                <div className={styles.searchIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o dirección..."
                  value={inputValue}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  name="search-puntoventa-no-autocomplete"
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                />
              </div>
            </div>
            {canCreate && (
              <Button
                onClick={handleOpenRegisterModal}
                variant="default"
                disabled={isModalOpen}
              >
                Registrar
              </Button>
            )}
          </div>
        </AdminCardLayout.Title>
        <AdminCardLayout.Header>
          <div className="-mt-4"></div>
        </AdminCardLayout.Header>
        <AdminCardLayout.Content>
          {isLoading ? (
            <div className={styles.loadingSpinnerContainer}>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : allPuntosVenta.length === 0 ? (
            <div className={styles.noResults}>
              {searchTerm ? 'No se encontraron puntos de venta que coincidan con tu búsqueda' : 'No hay puntos de venta disponibles'}
            </div>
          ) : (
            <Datatable data={paginatedPuntosVenta} columns={columns} />
          )}
          {allPuntosVenta.length > 0 && !isLoading && (
            <div className={styles.paginationContainer}>
              <MuiPagination
                count={totalPages}
                page={currentPage}
                onChange={(_, value: number) => handlePageChange(value)}
                showFirstButton
                showLastButton
                className={styles.paginationContent}
              />
            </div>
          )}
        </AdminCardLayout.Content>
      </AdminCardLayout>

      {/* Modal para crear/editar punto de venta */}
      <ModalContainerComponent onClose={handleCloseModal}>
        {(modalType === "register" || modalType === "edit") && (
          <PuntoVentaForm
            puntoVenta={modalType === "edit" ? puntoVentaEdit : undefined}
            onSuccess={() => {
              handleCloseModal();
              refreshList();
            }}
            closeModal={handleCloseModal}
          />
        )}
      </ModalContainerComponent>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este punto de venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el punto de venta
           
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
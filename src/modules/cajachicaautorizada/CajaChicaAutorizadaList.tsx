"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import CajaChicaAutorizadaForm from "./CajaChicaAutorizadaForm";
import { CajaChicaAutorizada } from "@/types/cajachicaautorizadas";
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
import { getCajaChicaAutorizadaColumns } from "./columns";
import {
  getCajasChicaAutorizadas,
  deleteCajaChicaAutorizada,
  updateCajaChicaAutorizada
} from "@/services/apiCajaChicaAutorizada";
import { useAlert } from "@/contexts/AlertContext";
import { getUsuarios } from "@/services/apiUsuarios";
import { getCajas } from "@/services/apiCajas";
import { Usuario } from "@/types/usuarios";
import { Caja } from "@/types/cajas";
import MuiPagination from "@/components/ui/pagination";

export default function CajaChicaAutorizadaList() {
  // MODAL
  const {
    setShowModalContainer,
    closeModal: closeModalFromHook,
    ModalContainer
  } = useModalContainer();

  // Modal state
  const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
  const [cajaChicaEdit, setCajaChicaEdit] = useState<CajaChicaAutorizada | undefined>(undefined);
  const { showAlert } = useAlert();

  // Data state
  const [cajasChica, setCajasChica] = useState<CajaChicaAutorizada[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage] = useState<number>(10);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cajaToDelete, setCajaToDelete] = useState<CajaChicaAutorizada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [cajaToFinalize, setCajaToFinalize] = useState<CajaChicaAutorizada | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Refs for optimization
  const isInitialMount = useRef(true);
  const previousRefreshTrigger = useRef(refreshTrigger);
  const previousSearchTerm = useRef(searchTerm);
  const previousCurrentPage = useRef(currentPage);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);

  // Fetch data
  const fetchCajasChica = useCallback(async (page: number = 1, search?: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      

      // Fetch users and cajas in parallel
      const [usuariosResponse, cajasResponse, response] = await Promise.all([
        getUsuarios(1, 1000),
        getCajas(1, 1000),
        getCajasChicaAutorizadas(page, itemsPerPage, search)
      ]);

      setUsuarios(usuariosResponse.data);
      setCajas(cajasResponse.data);
      setCajasChica(response.data);

      const lastPage = Math.max(1, response.meta.lastPage);
      setTotalPages(lastPage);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.currentPage);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('error', 'Error', 'Error al cargar las autorizaciones de caja chica');
      setCajasChica([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, itemsPerPage, isLoading]);

  // Effect for data fetching
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchCajasChica(currentPage, searchTerm);
      return;
    }

    const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
    const searchChanged = previousSearchTerm.current !== searchTerm;
    const pageChanged = previousCurrentPage.current !== currentPage;

    previousRefreshTrigger.current = refreshTrigger;
    previousSearchTerm.current = searchTerm;
    previousCurrentPage.current = currentPage;

    if (refreshChanged || searchChanged || pageChanged) {
      fetchCajasChica(currentPage, searchTerm);
    }
  }, [fetchCajasChica, refreshTrigger, searchTerm, currentPage]);

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  }, []);

  // Debounced search
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

  // Modal handlers
  const handleOpenRegisterModal = useCallback(() => {
    setCajaChicaEdit(undefined);
    setModalType("register");
    setShowModalContainer(true);
  }, [setShowModalContainer]);

  const handleOpenEditModal = useCallback((cajaChica: CajaChicaAutorizada) => {
    console.log('Datos al editar (handleOpenEditModal):', cajaChica);
    setCajaChicaEdit(cajaChica);
    setModalType("edit");
    setShowModalContainer(true);
  }, [setShowModalContainer]);

  const onEdit = handleOpenEditModal;

  const onDelete = useCallback(
    (cajaChica: CajaChicaAutorizada) => {
      setCajaToDelete(cajaChica);
      setDeleteDialogOpen(true);
    },
    []
  );

  // In CajaChicaAutorizadaList.tsx
  const handleFinalize = async (caja: CajaChicaAutorizada) => {
    try {
      setCajaToFinalize(caja);

      // Show confirmation dialog first
      setFinalizeDialogOpen(true);
    } catch (error) {
      console.error('Error al preparar la finalización:', error);
      showAlert('error', 'Error', 'No se pudo preparar la finalización');
    }
  };

  const handleConfirmFinalize = useCallback(async () => {
    if (!cajaToFinalize) return;
  
    setIsFinalizing(true);
    try {
      // Send only the fecha_termino field in snake_case
      await updateCajaChicaAutorizada(cajaToFinalize.id_autorizacion, {
        fecha_termino: new Date().toISOString() // Changed to snake_case
      });
  
      showAlert('success', 'Éxito', 'Autorización finalizada correctamente');
      refreshList();
    } catch (error) {
      console.error('Error al finalizar la autorización:', error);
      showAlert('error', 'Error', 'No se pudo finalizar la autorización');
    } finally {
      setIsFinalizing(false);
      setFinalizeDialogOpen(false);
      setCajaToFinalize(null);
    }
  }, [cajaToFinalize, refreshList, showAlert]);

  // Create maps for quick lookup
  const usuariosMap = useMemo(() =>
    usuarios.reduce<Record<number, Usuario>>((acc, user) => {
      if (user?.idUsuario) {
        acc[user.idUsuario] = user;
      }
      return acc;
    }, {}),
    [usuarios]
  );

  const cajasMap = useMemo(() =>
    cajas.reduce<Record<number, Caja>>((acc, caja) => {
      if (caja?.id_caja) {
        acc[caja.id_caja] = caja;
      }
      return acc;
    }, {}),
    [cajas]
  );

  const columns = useMemo(() => getCajaChicaAutorizadaColumns({
    onEdit: onEdit,
    onDelete: onDelete,
    onFinalize: handleFinalize,
    usuariosMap,
    cajasMap,
  }), [onEdit, onDelete, handleFinalize, usuariosMap, cajasMap]);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setCajaChicaEdit(undefined);
    setShowModalContainer(false);
  }, [setShowModalContainer]);

  const handleConfirmDelete = async () => {
    if (cajaToDelete?.id_autorizacion) {
      try {
        await deleteCajaChicaAutorizada(cajaToDelete.id_autorizacion);
        showAlert('success', 'Éxito', 'Autorización de caja chica eliminada exitosamente');
        refreshList();
      } catch (error) {
        console.error('Error al eliminar autorización de caja chica:', error);
        showAlert('error', 'Error', `Error al eliminar autorización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setDeleteDialogOpen(false);
        setCajaToDelete(null);
      }
    }
  };

  return (
    <>
      <AdminCardLayout>
        <AdminCardLayout.Title>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Autorizaciones de Caja Chica</h2>
            <div className="flex-1 mx-4 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por ID de caja o usuario..."
                  value={inputValue}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  name="search-cajachica-no-autocomplete"
                  disabled={isModalOpen}
                  className={`w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm ${isModalOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
            <Button
              onClick={handleOpenRegisterModal}
              variant="default"
              disabled={isModalOpen}
            >
              Nueva Autorización
            </Button>
          </div>
        </AdminCardLayout.Title>
        <AdminCardLayout.Header>
          <div className="-mt-4"></div>
        </AdminCardLayout.Header>
        <AdminCardLayout.Content>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4A6E]"></div>
            </div>
          ) : cajasChica.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron autorizaciones que coincidan con tu búsqueda' : 'No hay autorizaciones de caja chica disponibles'}
            </div>
          ) : (
            <Datatable data={cajasChica} columns={columns} />
          )}
          {cajasChica.length > 0 && !isLoading && (
            <div className="mt-6 flex justify-center">
              <MuiPagination
                count={totalPages}
                page={currentPage}
                onChange={(_, value) => handlePageChange(value)}
                showFirstButton
                showLastButton
                className="paginationContent"
              />
            </div>
          )}
        </AdminCardLayout.Content>
      </AdminCardLayout>

      {/* Modal para crear/editar autorización de caja chica */}
      <ModalContainerComponent onClose={handleCloseModal}>
        {(modalType === "register" || modalType === "edit") && (
          <CajaChicaAutorizadaForm
            autorizacion={modalType === "edit" ? cajaChicaEdit : undefined}
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
            <AlertDialogTitle>¿Está seguro de eliminar esta autorización de caja chica?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la autorización de caja chica
             
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

      {/* Finalize Confirmation Dialog */}
      <AlertDialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar autorización?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas finalizar esta autorización? Se registrará la fecha de término actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinalizing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFinalize}
              disabled={isFinalizing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isFinalizing ? 'Finalizando...' : 'Sí, finalizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
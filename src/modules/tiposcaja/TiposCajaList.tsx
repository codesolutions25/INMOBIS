"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import TiposCajaForm from "./TiposCajaForm";
import { TipoCaja } from "@/types/tiposcaja";
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
import { getTiposCaja, deleteTipoCaja } from "@/services/apiTiposCaja";
import { getTipoCajaColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import MuiPagination from "@/components/ui/pagination";

export default function TiposCajaList() {
    // Modal state
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

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [tipoCajaEdit, setTipoCajaEdit] = useState<TipoCaja | undefined>(undefined);
    const { showAlert } = useAlert();
    const [tiposCaja, setTiposCaja] = useState<TipoCaja[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tipoCajaToDelete, setTipoCajaToDelete] = useState<TipoCaja | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTiposCaja, setAllTiposCaja] = useState<TipoCaja[]>([]);

    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    // Fetch tipos de caja
    const fetchTiposMateriales = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;
    
        setIsLoading(true);
        try {
            const response = await getTiposCaja(page, itemsPerPage, search);
            setTiposCaja(response.data);
            setTotalItems(response.meta.total);
            setTotalPages(response.meta.lastPage);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error al cargar tipos de caja:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de tipos de caja');
            setTiposCaja([]);
            setTotalPages(1);
            setTotalItems(0);
            setCurrentPage(1);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, showAlert, itemsPerPage]);

    // Effect for data fetching
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchTiposMateriales(currentPage, searchTerm);
            return;
        }

        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;

        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;

        if (refreshChanged || searchChanged || pageChanged) {
            fetchTiposMateriales(currentPage, searchTerm);
        }
    }, [fetchTiposMateriales, refreshTrigger, searchTerm, currentPage]);

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

    useEffect(() => {
        const filtro = inputValue.trim().toLowerCase();
        if (filtro) {
            const filtered = allTiposCaja.filter(tipo =>
                (tipo.nombre_tipo_caja && tipo.nombre_tipo_caja.toLowerCase().includes(filtro)) ||
                (tipo.descripcion_tipo_caja && tipo.descripcion_tipo_caja.toLowerCase().includes(filtro))
            );
            setTiposCaja(filtered);
            setTotalItems(filtered.length);
            setCurrentPage(1);
        } else {
            setTiposCaja(allTiposCaja);
            setTotalItems(allTiposCaja.length);
        }
    }, [inputValue, allTiposCaja]);

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
        setTipoCajaEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
      
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((tipoCaja: TipoCaja) => {
        setTipoCajaEdit(tipoCaja);
        setModalType("edit");
        setShowModalContainer(true);
      
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback((tipoCaja: TipoCaja) => {
        setTipoCajaToDelete(tipoCaja);
        setDeleteDialogOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setTipoCajaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (tipoCajaToDelete?.id_tipo_caja) {
            try {
                await deleteTipoCaja(tipoCajaToDelete.id_tipo_caja);
                showAlert('success', 'Éxito', 'Tipo de caja eliminado correctamente');
                refreshList();
            } catch (error) {
                console.error('Error al eliminar tipo de caja:', error);
                showAlert('error', 'Error', 'No se pudo eliminar el tipo de caja');
            } finally {
                setDeleteDialogOpen(false);
                setTipoCajaToDelete(null);
            }
        }
    };

    // Memoized columns con permisos
    const columns = useMemo(
        () => getTipoCajaColumns({ 
            onEdit, 
            onDelete,
            canEdit,
            canDelete
        }),
        [onEdit, onDelete, canEdit, canDelete]
    );

    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-semibold">Lista de Tipos de Caja</h2>
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o descripción..."
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    name="search-tipocaja-no-autocomplete"
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
                                Nuevo Tipo de Caja
                            </Button>
                        )}
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
                    ) : tiposCaja.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron tipos de caja que coincidan con tu búsqueda' : 'No hay tipos de caja disponibles'}
                        </div>
                    ) : (
                        <Datatable data={tiposCaja} columns={columns} />
                    )}
                    {tiposCaja.length > 0 && !isLoading && totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <MuiPagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_, value) => handlePageChange(value)}
                                showFirstButton
                                showLastButton
                                className="flex items-center gap-2"
                            />
                        </div>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            {/* Modal para crear/editar tipo de caja */}
            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <TiposCajaForm
                        tipoCaja={modalType === "edit" ? tipoCajaEdit : undefined}
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
                        <AlertDialogTitle>¿Está seguro de eliminar este tipo de caja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el tipo de caja
                            
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
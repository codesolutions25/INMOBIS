"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import EstadosCajaForm from "./EstadosCajaForm";
import { EstadoCaja } from "@/types/estadoscaja";
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
import { getEstadosCaja, deleteEstadoCaja } from "@/services/apiEstadosCaja";
import { getEstadoCajaColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCheckPermission } from "@/contexts/PermissionContext";
import MuiPagination from "@/components/ui/pagination";

export default function EstadosCajaList() {
    // Permisos
    const optionId = useCurrentOptionId();
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

    // Modal state
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer
    } = useModalContainer();

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [estadoCajaEdit, setEstadoCajaEdit] = useState<EstadoCaja | undefined>(undefined);
    const { showAlert } = useAlert();
    const [estadosCaja, setEstadosCaja] = useState<EstadoCaja[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [estadoCajaToDelete, setEstadoCajaToDelete] = useState<EstadoCaja | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allEstadosCaja, setAllEstadosCaja] = useState<EstadoCaja[]>([]);


    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    // Fetch estados de caja
    const fetchEstadosCaja = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await getEstadosCaja(page, itemsPerPage, search);
            setEstadosCaja(response.data);
            setTotalItems(response.meta.total);
            setTotalPages(response.meta.pages); // Use the actual pages from API
            setCurrentPage(page);
            
        } catch (error) {
            console.error('Error al cargar estados de caja:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de estados de caja');
            setEstadosCaja([]);
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
            fetchEstadosCaja(currentPage, searchTerm);
            return;
        }

        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;

        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;

        if (refreshChanged || searchChanged || pageChanged) {
            fetchEstadosCaja(currentPage, searchTerm);
        }
    }, [fetchEstadosCaja, refreshTrigger, searchTerm, currentPage]);

    useEffect(() => {
        const filtro = inputValue.trim().toLowerCase();
        if (filtro) {
            const filtered = allEstadosCaja.filter(estado =>
                (estado.nombre_estado_caja && estado.nombre_estado_caja.toLowerCase().includes(filtro)) ||
                (estado.descripcion_estado_caja && estado.descripcion_estado_caja.toLowerCase().includes(filtro))
            );
            setEstadosCaja(filtered);
            setTotalItems(filtered.length);
            setCurrentPage(1);
        } else {
            setEstadosCaja(allEstadosCaja);
            setTotalItems(allEstadosCaja.length);
        }
    }, [inputValue, allEstadosCaja]);

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
        setEstadoCajaEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
       
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((estadoCaja: EstadoCaja) => {
        setEstadoCajaEdit(estadoCaja);
        setModalType("edit");
        setShowModalContainer(true);

    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback((estadoCaja: EstadoCaja) => {
        setEstadoCajaToDelete(estadoCaja);
        setDeleteDialogOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setEstadoCajaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (estadoCajaToDelete?.id_estado_caja) {
            try {
                await deleteEstadoCaja(estadoCajaToDelete.id_estado_caja);
                showAlert('success', 'Éxito', 'Estado de caja eliminado correctamente');
                refreshList();
            } catch (error: any) {
                console.error('Error al eliminar estado de caja:', error);
                const errorMessage = error?.response?.data?.message || 'No se pudo eliminar el estado de caja';
                showAlert('error', 'Error', errorMessage);
            } finally {
                setDeleteDialogOpen(false);
                setEstadoCajaToDelete(null);
            }
        }
    };

    // Memoized columns
    const columns = useMemo(() =>
        getEstadoCajaColumns({
            onEdit: canEdit ? onEdit : () => { },
            onDelete: canDelete ? onDelete : () => { },
            canEdit,
            canDelete
        }),
        [onEdit, onDelete, canEdit, canDelete]
    );

    // Modal open/close effect
    useEffect(() => {
        const checkModalOpen = () => {
            const modalBackdrop = document.querySelector('[data-state="open"]');
            setIsModalOpen(!!modalBackdrop);
        };

        checkModalOpen();
        const observer = new MutationObserver(checkModalOpen);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-state']
        });
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-semibold">Lista de Estados de Caja</h2>
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
                                    name="search-estadocaja-no-autocomplete"
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleOpenRegisterModal}
                            variant="default"
                        >
                            Nuevo Estado de Caja {totalPages}
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
                    ) : estadosCaja.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron estados de caja que coincidan con tu búsqueda' : 'No hay estados de caja disponibles'}
                        </div>
                    ) : (
                        <Datatable data={estadosCaja} columns={columns} />
                    )}
                    {estadosCaja.length > 0 && !isLoading && totalPages > 1 && (
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

            {/* Modal para crear/editar estado de caja */}
            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <EstadosCajaForm
                        estadoCaja={modalType === "edit" ? estadoCajaEdit : undefined}
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
                        <AlertDialogTitle>¿Está seguro de eliminar este estado de caja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el estado de caja

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
"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import TiposMovimientoForm from "./TiposMovimientoForm";
import { TipoMovimiento } from "@/types/tiposmovimiento";
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
import { getTiposMovimiento, deleteTipoMovimiento } from "@/services/apiTiposMovimiento";
import { getTiposMovimientoColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import styles from "./styles/TipoMovimientoList.module.css"
import MuiPagination from "@/components/ui/pagination";

export default function TiposMovimientoList() {

    // Modal state
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer
    } = useModalContainer();

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [tipoMovimientoEdit, setTipoMovimientoEdit] = useState<TipoMovimiento | undefined>(undefined);
    const { showAlert } = useAlert();
    const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tipoMovimientoToDelete, setTipoMovimientoToDelete] = useState<TipoMovimiento | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTiposMovimiento, setAllTiposMovimiento] = useState<TipoMovimiento[]>([]);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState('');

    // Obtener el ID de la opción actual
    const optionId = useCurrentOptionId();
    // Verificar permisos
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    // Fetch tipos de movimiento
    const fetchTiposMovimiento = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
         

            const response = await getTiposMovimiento(page, itemsPerPage, search);

            // Set all data for local filtering
            setAllTiposMovimiento(response.data);

            // Update pagination state
            setTotalItems(response.meta.total);
            setTotalPages(response.meta.pages || 1); // Usar pages directamente
            setCurrentPage(page);

            // Apply search filter if needed
            if (search) {
                const filtered = response.data.filter(tipo =>
                    (tipo.nombre_tipo_movimiento?.toLowerCase().includes(search.toLowerCase())) ||
                    (tipo.descripcion_tipo_movimiento?.toLowerCase().includes(search.toLowerCase()))
                );
                setTiposMovimiento(filtered);
            } else {
                setTiposMovimiento(response.data);
            }
        } catch (error) {
            showAlert('error', 'Error', 'Error al cargar la lista de tipos de movimiento');
            setTiposMovimiento([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, showAlert, itemsPerPage]);
    // Effect for data fetching
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchTiposMovimiento(currentPage, searchTerm);
            return;
        }
    
        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;
    
        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;
    
        if (refreshChanged || searchChanged || pageChanged) {
            fetchTiposMovimiento(currentPage, searchTerm); // Ensure we pass searchTerm here
        }
    }, [fetchTiposMovimiento, refreshTrigger, searchTerm, currentPage]);

    useEffect(() => {
        const filtro = inputValue.trim().toLowerCase();
        if (filtro) {
            const filtered = allTiposMovimiento.filter(tipo =>
                (tipo.nombre_tipo_movimiento && tipo.nombre_tipo_movimiento.toLowerCase().includes(filtro)) ||
                (tipo.descripcion_tipo_movimiento && tipo.descripcion_tipo_movimiento.toLowerCase().includes(filtro))
            );
            setTiposMovimiento(filtered);
            setTotalItems(filtered.length);
            setCurrentPage(1);
        } else {
            setTiposMovimiento(allTiposMovimiento);
            setTotalItems(allTiposMovimiento.length);
        }
    }, [inputValue, allTiposMovimiento]);

    // Handlers
    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            fetchTiposMovimiento(page); // Remove searchTerm here
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
        setTipoMovimientoEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
 
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((tipoMovimiento: TipoMovimiento) => {
        setTipoMovimientoEdit(tipoMovimiento);
        setModalType("edit");
        setShowModalContainer(true);
        
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback((tipoMovimiento: TipoMovimiento) => {
        setTipoMovimientoToDelete(tipoMovimiento);
        setDeleteDialogOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setTipoMovimientoEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (!tipoMovimientoToDelete?.id_tipo_movimiento) return;

        try {
            await deleteTipoMovimiento(tipoMovimientoToDelete.id_tipo_movimiento);
            showAlert('success', 'Éxito', 'Tipo de movimiento eliminado correctamente');
            refreshList();
        } catch (error: any) {

            if (error.response?.status === 409) {
                setErrorDialogMessage('No se puede eliminar el tipo de movimiento porque está siendo utilizado en movimientos existentes.');
            } else {
                setErrorDialogMessage(`Error al eliminar el tipo de movimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
            setErrorDialogOpen(true);
        } finally {
            setDeleteDialogOpen(false);
            setTipoMovimientoToDelete(null);
        }
    };

    // Memoized columns
    const columns = useMemo(() => {
        return getTiposMovimientoColumns({
            onEdit: canEdit ? onEdit : undefined,
            onDelete: canDelete ? onDelete : undefined
        });
    }, [onEdit, onDelete, canEdit, canDelete]);

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
                    <div className={styles.titleContainer}>
                        <h2 className={styles.title}>Lista de Tipos de Movimiento</h2>
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className={styles.searchIcon}>
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
                                    name="search-tipomovimiento-no-autocomplete"
                                    className={styles.searchInput}
                                />
                            </div>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={handleOpenRegisterModal}
                                variant="default"
                            >
                                Nuevo Tipo de Movimiento
                            </Button>
                        )}
                    </div>
                </AdminCardLayout.Title>
                <AdminCardLayout.Header>
                    <div className="mt-4"></div>
                </AdminCardLayout.Header>
                <AdminCardLayout.Content>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className={styles.loadingSpinner}></div>
                        </div>
                    ) : tiposMovimiento.length === 0 ? (
                        <div className={styles.noResults}>
                            {searchTerm ? 'No se encontraron tipos de movimiento que coincidan con tu búsqueda' : 'No hay tipos de movimiento disponibles'}
                        </div>
                    ) : (
                        <Datatable data={tiposMovimiento} columns={columns} />
                    )}
                    {totalPages > 1 && !isLoading && (
                        <div className="mt-6 flex justify-center">
                            <MuiPagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_, value) => handlePageChange(value)}
                                showFirstButton
                                showLastButton
                                className={styles.paginationContent}
                            />
                        </div>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            {/* Modal para crear/editar tipo de movimiento */}
            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <TiposMovimientoForm
                        tipoMovimiento={modalType === "edit" ? tipoMovimientoEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                )}
            </ModalContainerComponent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. ¿Deseas eliminar este tipo de movimiento?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error Dialog */}
            <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        {errorDialogMessage}
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <Button
                            onClick={() => setErrorDialogOpen(false)}
                            variant="default"
                        >
                            Cerrar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
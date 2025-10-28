"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import TiposOperacionForm from "./TiposOperacionForm";
import { TipoOperacion } from "@/types/tiposoperacion";
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
import { getTiposOperacion, deleteTipoOperacion } from "@/services/apiTiposOperacion";
import { getTiposOperacionColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import styles from "./styles/TiposOperacionList.module.css";
import MuiPagination from "@/components/ui/pagination";

export default function TiposOperacionList() {
    // Modal state
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer
    } = useModalContainer();

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [tipoOperacionEdit, setTipoOperacionEdit] = useState<TipoOperacion | undefined>(undefined);
    const { showAlert } = useAlert();
    const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tipoOperacionToDelete, setTipoOperacionToDelete] = useState<TipoOperacion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTiposOperacion, setAllTiposOperacion] = useState<TipoOperacion[]>([]);

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

    // Fetch tipos de operación
    const fetchTiposOperacion = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await getTiposOperacion(page, itemsPerPage, search);
            
            // Extract pagination data directly from response
            const meta = response.meta || {
                total: 0,
                currentPage: 1,
                lastPage: 1,
                perPage: itemsPerPage
            };

            // Update all state in one batch
            setAllTiposOperacion(response.data);
            setTiposOperacion(response.data);
            setTotalItems(meta.total);
            setTotalPages(meta.lastPage); // Use lastPage instead of pages
            setCurrentPage(meta.currentPage);

            // Apply search filter if needed
            if (search) {
                const filtered = response.data.filter(tipo =>
                    (tipo.nombreTipoOperacion?.toLowerCase().includes(search.toLowerCase())) ||
                    (tipo.descripcionTipoOperacion?.toLowerCase().includes(search.toLowerCase()))
                );
                setTiposOperacion(filtered);
            }
        } catch (error) {
            console.error('Error fetching tipos operacion:', error);
            showAlert('error', 'Error', 'No se pudo cargar los tipos de operación');
            setTiposOperacion([]);
            setTotalPages(0);
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
            fetchTiposOperacion(currentPage, searchTerm);
            return;
        }
    
        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;
    
        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;
    
        if (refreshChanged || searchChanged || pageChanged) {
            fetchTiposOperacion(currentPage, searchTerm);
        }
    }, [fetchTiposOperacion, refreshTrigger, searchTerm, currentPage]);

    // Handlers
    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            fetchTiposOperacion(page);
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

    // Manejar edición de tipo de operación
    const handleEdit = useCallback((tipoOperacion: TipoOperacion) => {
        setTipoOperacionEdit(tipoOperacion);
        setModalType("edit");
        setShowModalContainer(true);
    
    }, [setShowModalContainer]);

    // Manejar eliminación de tipo de operación
    const handleDelete = useCallback((tipoOperacion: TipoOperacion) => {
        setTipoOperacionToDelete(tipoOperacion);
        setDeleteDialogOpen(true);
    }, []);

    // Memoized columns con permisos
    const columns = useMemo(
        () =>
            getTiposOperacionColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
                canEdit,
                canDelete,
            }),
        [handleEdit, handleDelete, canEdit, canDelete]
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
                    <div className={styles.titleContainer}>
                        <h2 className="text-xl font-semibold">Lista de Tipos de Operación</h2>
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
                                    name="search-tipooperacion-no-autocomplete"
                                    className={styles.searchInput}
                                />
                            </div>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={() => {
                                    setTipoOperacionEdit(undefined);
                                    setModalType("register");
                                    setShowModalContainer(true);
                                 
                                }}
                                variant="default"
                            >
                                Nuevo Tipo de Operación {totalPages}
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
                            <div className={styles.spinner}></div>
                        </div>
                    ) : tiposOperacion.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron tipos de operación que coincidan con tu búsqueda' : 'No hay tipos de operación disponibles'}
                        </div>
                    ) : (
                        <>
                            <Datatable data={tiposOperacion} columns={columns} />
                            {totalPages > 1 && !isLoading && (
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
                        </>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            {/* Modal para crear/editar tipo de operación */}
            <ModalContainerComponent onClose={() => {
                setModalType(null);
                setTipoOperacionEdit(undefined);
                setShowModalContainer(false);
            }}>
                {(modalType === "register" || modalType === "edit") && (
                    <TiposOperacionForm
                        tipoOperacion={modalType === "edit" ? tipoOperacionEdit : undefined}
                        onSuccess={() => {
                            setModalType(null);
                            setTipoOperacionEdit(undefined);
                            setShowModalContainer(false);
                            fetchTiposOperacion(currentPage);
                        }}
                        closeModal={() => {
                            setModalType(null);
                            setTipoOperacionEdit(undefined);
                            setShowModalContainer(false);
                        }}
                    />
                )}
            </ModalContainerComponent>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar este tipo de operación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el tipo de operación
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={async () => {
                                if (tipoOperacionToDelete?.idTipoOperacion) {
                                    try {
                                        await deleteTipoOperacion(tipoOperacionToDelete.idTipoOperacion);
                                        showAlert('success', 'Éxito', 'Tipo de operación eliminado correctamente');
                                        fetchTiposOperacion(currentPage);
                                    } catch (error) {
                                        console.error('Error al eliminar tipo de operación:', error);
                                        showAlert('error', 'Error', 'No se pudo eliminar el tipo de operación');
                                    } finally {
                                        setDeleteDialogOpen(false);
                                        setTipoOperacionToDelete(null);
                                    }
                                }
                            }}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
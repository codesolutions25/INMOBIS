"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import TipoPagoForm from "./TipoPagoForm";
import { TipoPago } from "@/types/tipospago";
import Datatable from "@/components/table/datatable";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { getTiposPago, deleteTipoPago } from "@/services/apiTipoPago";
import { getTipoPagoColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";

export default function TipoPagoList() {
    // Modal state
    const [showModalContainer, setShowModalContainer] = useState(false);

    // Permissions
    const optionId = useCurrentOptionId();
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | null>(null);
    const [tipoPagoEdit, setTipoPagoEdit] = useState<TipoPago | null>(null);
    const { showAlert } = useAlert();
    const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tipoPagoToDelete, setTipoPagoToDelete] = useState<TipoPago | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTiposPago, setAllTiposPago] = useState<TipoPago[]>([]);

    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    // Fetch tipos de pago
    const fetchTiposPago = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;
    
        setIsLoading(true);
        try {
            const response = await getTiposPago(page, itemsPerPage, search);
            setTiposPago(response.data);
            setTotalItems(response.meta.total);
            setTotalPages(response.meta.lastPage);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error al cargar tipos de pago:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de tipos de pago');
            setTiposPago([]);
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
            fetchTiposPago(currentPage, searchTerm);
            return;
        }

        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;

        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;

        if (refreshChanged || searchChanged || pageChanged) {
            fetchTiposPago(currentPage, searchTerm);
        }
    }, [fetchTiposPago, refreshTrigger, searchTerm, currentPage]);

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
            const filtered = allTiposPago.filter(tipoPago =>
                (tipoPago.nombre && tipoPago.nombre.toLowerCase().includes(filtro)) ||
                (tipoPago.descripcion && tipoPago.descripcion.toLowerCase().includes(filtro))
            );
            setTiposPago(filtered);
            setTotalItems(filtered.length);
            setCurrentPage(1);
        } else {
            setTiposPago(allTiposPago);
            setTotalItems(allTiposPago.length);
        }
    }, [inputValue, allTiposPago]);

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

    // Open modal for creating a new tipo de pago
    const handleOpenRegisterModal = () => {
        setTipoPagoEdit(null);
        setModalType("register");
        setShowModalContainer(true);
    };

    // Open modal for editing a tipo de pago
    const handleOpenEditModal = (rowData: any) => {
        // Handle the case where rowData might be a row object from the table
        const tipoPago = 'original' in rowData ? rowData.original : rowData;
        
        // Ensure we have the correct property names for the form
        const tipoPagoToEdit = {
            ...tipoPago,
            // Map idTipoPago to id_tipo_pago if needed
            id_tipo_pago: tipoPago.idTipoPago || tipoPago.id_tipo_pago
        };
        
        console.log('Editing tipo pago:', tipoPagoToEdit);
        setTipoPagoEdit(tipoPagoToEdit);
        setModalType("edit");
        setShowModalContainer(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModalContainer(false);
        setModalType(null);
        setTipoPagoEdit(null);
    };

    const onDelete = useCallback((rowData: any) => {
        // Handle the case where rowData might be a row object from the table
        const tipoPago = 'original' in rowData ? rowData.original : rowData;
        
        console.log('Deleting tipo pago:', tipoPago);
        
        if (!tipoPago || typeof tipoPago !== 'object') {
            console.error('TipoPago object is invalid:', tipoPago);
            showAlert('error', 'Error', 'El tipo de pago seleccionado no es válido');
            return;
        }
        
        const tipoPagoId = tipoPago.idTipoPago;
        
        if (!tipoPagoId) {
            console.error('Missing ID in tipo pago object:', tipoPago);
            showAlert('error', 'Error', 'No se pudo identificar el ID del tipo de pago a eliminar');
            return;
        }
        
        // Ensure we have a valid TipoPago object with idTipoPago
        const tipoPagoToDelete = { ...tipoPago, idTipoPago: tipoPagoId };
        
        setTipoPagoToDelete(tipoPagoToDelete);
        setDeleteDialogOpen(true);
    }, [showAlert]);

    const handleConfirmDelete = async () => {
        try {
            if (!tipoPagoToDelete) {
                throw new Error('No se ha seleccionado ningún tipo de pago para eliminar');
            }
            
            const tipoPagoId = tipoPagoToDelete.idTipoPago;
            
            if (!tipoPagoId) {
                console.error('Missing ID in tipoPagoToDelete:', tipoPagoToDelete);
                throw new Error('No se pudo identificar el ID del tipo de pago a eliminar');
            }
            
            console.log('Attempting to delete tipo pago with ID:', tipoPagoId);
            await deleteTipoPago(tipoPagoId);
            
            showAlert('success', 'Éxito', 'Tipo de pago eliminado correctamente');
            refreshList();
        } catch (error: any) {
            console.error('Error deleting tipo de pago:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar el tipo de pago';
            showAlert('error', 'Error', errorMessage);
        } finally {
            setDeleteDialogOpen(false);
            setTipoPagoToDelete(null);
        }
    };

    // Memoized columns with permissions
    const columns = useMemo(
        () => getTipoPagoColumns({ 
            onEdit: handleOpenEditModal, 
            onDelete,
            canEdit,
            canDelete
        }),
        [handleOpenEditModal, onDelete, canEdit, canDelete]
    );

    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-semibold">Lista de Tipos de Pago</h2>
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
                                    name="search-rol-no-autocomplete"
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
                                Nuevo Tipo de Pago
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
                    ) : tiposPago.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron tipos de pago que coincidan con tu búsqueda' : 'No hay tipos de pago disponibles'}
                        </div>
                    ) : (
                        <Datatable data={tiposPago} columns={columns} />
                    )}
                    {tiposPago.length > 0 && !isLoading && totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="inline-flex items-center rounded-md bg-gray-800 px-1 py-1 shadow-sm">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center justify-center p-2 rounded-md ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
                                    aria-label="Página anterior"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <div className="flex items-center px-1">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        className={`mx-0.5 h-8 w-8 flex items-center justify-center text-sm rounded-md ${currentPage === 1 ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
                                    >
                                        1
                                    </button>
                                    {currentPage > 4 && (
                                        <span className="mx-0.5 text-white text-opacity-70 px-1">...</span>
                                    )}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(pageNumber =>
                                            pageNumber !== 1 &&
                                            pageNumber !== totalPages &&
                                            Math.abs(pageNumber - currentPage) <= 2
                                        )
                                        .map(pageNumber => (
                                            <button
                                                key={pageNumber}
                                                onClick={() => handlePageChange(pageNumber)}
                                                className={`mx-0.5 h-8 w-8 flex items-center justify-center text-sm rounded-md ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                    {currentPage < totalPages - 3 && (
                                        <span className="mx-0.5 text-white text-opacity-70 px-1">...</span>
                                    )}
                                    {totalPages > 1 && (
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            className={`mx-0.5 h-8 w-8 flex items-center justify-center text-sm rounded-md ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
                                        >
                                            {totalPages}
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center justify-center p-2 rounded-md ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
                                    aria-label="Página siguiente"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            {/* Modal for creating/editing tipo de pago */}
            <Dialog open={showModalContainer} onOpenChange={setShowModalContainer}>
                <DialogContent className="sm:max-w-[425px]">
                    {modalType === "edit" && tipoPagoEdit ? (
                        <TipoPagoForm
                            initialData={tipoPagoEdit}
                            onSuccess={() => {
                                handleCloseModal();
                                refreshList();
                            }}
                            onCancel={handleCloseModal}
                        />
                    ) : (
                        <TipoPagoForm
                            onSuccess={() => {
                                handleCloseModal();
                                refreshList();
                            }}
                            onCancel={handleCloseModal}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar este tipo de pago?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el tipo de pago.
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
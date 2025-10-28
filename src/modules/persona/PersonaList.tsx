"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import PersonaForm from "./PersonaForm";
import { Persona } from "@/types/persona";
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
import { getPersonas, deletePersona } from "@/services/apiPersona";
import { getPersonaColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { getTiposDocumento } from "@/services/apiTipoDocumento";
import { getTiposGenero } from "@/services/apiTipoGenero";
import MuiPagination from "@/components/ui/pagination";

export default function PersonaList() {
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
    const [personaEdit, setPersonaEdit] = useState<Persona | undefined>(undefined);
    const { showAlert } = useAlert();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<Record<number, string>>({});
    const [tiposGenero, setTiposGenero] = useState<Record<number, string>>({});

    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    // Fetch tipos de documento y género
    const fetchCatalogos = useCallback(async () => {
        try {
            const [docResponse, genResponse] = await Promise.all([
                getTiposDocumento(),
                getTiposGenero()
            ]);

            const docItems = docResponse.data || [];
            const genItems = genResponse.data || [];
            // Create document type map
            // In PersonaList.tsx, update the docMap creation to:
            const docMap = docItems.reduce<Record<number, string>>((acc, item) => {
                if (item?.id_tipo_documento !== undefined && item?.nombre) {
                    acc[item.id_tipo_documento] = item.nombre;
                }
                return acc;
            }, {});

            // Create gender type map
            const genMap = genItems.reduce<Record<number, string>>((acc, item) => {
                if (item?.idTipoGenero !== undefined && item?.nombre) {
                    acc[item.idTipoGenero] = item.nombre;
                }
                return acc;
            }, {});

            setTiposDocumento(docMap);
            setTiposGenero(genMap);
        } catch (error) {
            console.error('Error loading catalogs:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los catálogos');
        }
    }, [showAlert]);

    // Fetch personas
    const fetchPersonas = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
          
            const response = await getPersonas(page, itemsPerPage, search);

            setPersonas(response.data);
            setAllPersonas(response.data);
            setTotalItems(response.meta.total);
            setCurrentPage(response.meta.currentPage);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error al cargar personas:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de personas');
            setPersonas([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, itemsPerPage, showAlert]);

    // Effect for data fetching
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchCatalogos();
            fetchPersonas(currentPage, searchTerm);
            return;
        }

        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;

        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;

        if (refreshChanged || searchChanged || pageChanged) {
            fetchPersonas(currentPage, searchTerm);
        }
    }, [fetchPersonas, refreshTrigger, searchTerm, currentPage, fetchCatalogos]);

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
        setPersonaEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
     
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((persona: Persona) => {
        setPersonaEdit(persona);
        setModalType("edit");
        setShowModalContainer(true);
     
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback((persona: Persona) => {
        if (canDelete) {
            setPersonaToDelete(persona);
            setDeleteDialogOpen(true);
        }
    }, [canDelete]);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setPersonaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (personaToDelete?.idPersona) {
            try {
                await deletePersona(personaToDelete.idPersona);
                showAlert('success', 'Éxito', 'Persona eliminada correctamente');
                refreshList();
            } catch (error: any) {
                console.error('Error al eliminar persona:', error);
                const errorMessage = error?.response?.data?.message || 'No se pudo eliminar la persona';
                showAlert('error', 'Error', errorMessage);
            } finally {
                setDeleteDialogOpen(false);
                setPersonaToDelete(null);
            }
        }
    };

    // Memoized columns
    const columns = useMemo(() =>
        getPersonaColumns({
            onEdit: canEdit ? onEdit : () => {},
            onDelete: canDelete ? onDelete : () => {},
            tiposGeneroMap: tiposGenero,
            tiposDocumentoMap: tiposDocumento,
            canEdit,
            canDelete
        }),
        [onEdit, onDelete, tiposGenero, tiposDocumento, canEdit, canDelete]
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
                        <h2 className="text-xl font-semibold">Lista de Personas</h2>
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, documento..."
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    name="search-persona-no-autocomplete"
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={handleOpenRegisterModal}
                                variant="default"
                            >
                                Nueva Persona
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
                    ) : personas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron personas que coincidan con tu búsqueda' : 'No hay personas disponibles'}
                        </div>
                    ) : (
                        <Datatable data={personas} columns={columns} />
                    )}
                    {personas.length > 0 && !isLoading && totalPages > 1 && (
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

            {/* Modal para crear/editar persona */}
            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <PersonaForm
                        persona={modalType === "edit" ? personaEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                        tiposDocumento={tiposDocumento}
                        tiposGenero={tiposGenero}
                    />
                )}
            </ModalContainerComponent>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta persona?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la persona
                            y toda su información asociada.
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
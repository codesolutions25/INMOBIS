"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainer from "@/components/modal/ModalContainer";
import RolForm from "./RolForm";
import { Rol } from "@/types/roles";
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
import { getRoles, deleteRol } from "@/services/apiRol";
import { getRolColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { preloadAllCatalogos } from '@/services/apiCatalogos';
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";

export default function RolList() {
    // Get modal methods from the hook
    const {
        showModalContainer,
        setShowModalContainer,
        ModalContainer
    } = useModalContainer();

    // Permissions
    const optionId = useCurrentOptionId();
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | null>(null);
    const [rolEdit, setRolEdit] = useState<Rol | null>(null);
    const { showAlert } = useAlert();
    const [roles, setRoles] = useState<Rol[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [rolToDelete, setRolToDelete] = useState<Rol | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allRoles, setAllRoles] = useState<Rol[]>([]);

    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    // Fetch roles
    const fetchRoles = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;
    
        setIsLoading(true);
        try {
            const response = await getRoles(page, itemsPerPage, search);
            setRoles(response.data);
            setTotalItems(response.meta.total);
            setTotalPages(response.meta.pages);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error al cargar roles:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de roles');
            setRoles([]);
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
            fetchRoles(currentPage, searchTerm);
            return;
        }

        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;

        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;

        if (refreshChanged || searchChanged || pageChanged) {
            fetchRoles(currentPage, searchTerm);
        }
    }, [fetchRoles, refreshTrigger, searchTerm, currentPage]);

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
            const filtered = allRoles.filter(rol =>
                (rol.nombre && rol.nombre.toLowerCase().includes(filtro)) ||
                (rol.descripcion && rol.descripcion.toLowerCase().includes(filtro))
            );
            setRoles(filtered);
            setTotalItems(filtered.length);
            setCurrentPage(1);
        } else {
            setRoles(allRoles);
            setTotalItems(allRoles.length);
        }
    }, [inputValue, allRoles]);

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
        console.log('Opening register modal');
        setRolEdit(null);
        setModalType("register");
        setShowModalContainer(true);
        preloadAllCatalogos();
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((rol: Rol) => {
        console.log('=== HANDLE OPEN EDIT MODAL ===');
        console.log('Role data received:', rol);
        console.log('Role ID:', rol?.id_rol);
        console.log('Role name:', rol?.nombre);
        
        setRolEdit(rol);
        setModalType("edit");
        setShowModalContainer(true);
        preloadAllCatalogos();
        
        console.log('After setting state - modalType:', "edit");
        console.log('After setting state - rolEdit:', rol);
    }, [setShowModalContainer]);

    const handleCloseModal = useCallback(() => {
        console.log('Closing modal');
        setModalType(null);
        setRolEdit(null);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const onDelete = useCallback((rol: any) => {
        
        // Handle both idRol and id_rol property names
        const roleId = rol.id_rol || rol.idRol;
        
        
        if (!roleId) {
            console.error('No valid role ID found in:', rol);
            showAlert('error', 'Error', 'No se pudo identificar el ID del rol a eliminar');
            return;
        }
        
        // Create a normalized role object
        const normalizedRol = {
            ...rol,
            id_rol: roleId,
            es_global: rol.es_global ?? rol.esGlobal
        };
        
        setRolToDelete(normalizedRol);
        setDeleteDialogOpen(true);
    }, [showAlert]);

    const handleConfirmDelete = async () => {
        if (!rolToDelete) {
            console.error('No role selected for deletion');
            showAlert('error', 'Error', 'No se ha seleccionado ningún rol para eliminar');
            setDeleteDialogOpen(false);
            return;
        }

        // Handle both idRol and id_rol property names
        const roleId = rolToDelete.id_rol || rolToDelete.idRol;
        
        if (!roleId) {
            console.error('No valid role ID found for deletion in:', rolToDelete);
            showAlert('error', 'Error', 'No se pudo identificar el ID del rol a eliminar');
            setDeleteDialogOpen(false);
            return;
        }

        console.log('Confirming delete for role ID:', roleId);
        
        try {
            await deleteRol(roleId);
            showAlert('success', 'Éxito', 'Rol eliminado correctamente');
            refreshList();
        } catch (error: any) {
            console.error('Error deleting role:', error);
            showAlert('error', 'Error', error.message || 'Error al eliminar el rol');
        } finally {
            setDeleteDialogOpen(false);
            setRolToDelete(null);
        }
    };

    // Memoized columns with permissions
    const columns = useMemo(
        () => getRolColumns({ 
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
                        <h2 className="text-xl font-semibold">Lista de Roles</h2>
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
                                Nuevo Rol
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
                    ) : roles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron roles que coincidan con tu búsqueda' : 'No hay roles disponibles'}
                        </div>
                    ) : (
                        <Datatable data={roles} columns={columns} />
                    )}
                    {roles.length > 0 && !isLoading && totalPages > 1 && (
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

            {/* Modal para crear/editar rol */}
            <ModalContainer
                onClose={handleCloseModal}
                showModalContainer={showModalContainer}
                setShowModalContainer={setShowModalContainer}
            >
                {modalType === "edit" && rolEdit ? (
                    <>
                        <RolForm
                            key={`edit-${rolEdit.id_rol}`}
                            rol={rolEdit}
                            onSuccess={() => {
                                refreshList();
                                handleCloseModal();
                            }}
                            closeModal={handleCloseModal}
                        />
                    </>
                ) : modalType === "register" ? (
                    <>
                        {console.log('Rendering NEW role form')}
                        <RolForm
                            key="register"
                            onSuccess={() => {
                                refreshList();
                                handleCloseModal();
                            }}
                            closeModal={handleCloseModal}
                        />
                    </>
                ) : null}
            </ModalContainer>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar este rol?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el rol.
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
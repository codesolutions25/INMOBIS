"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import { TipoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
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

import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import styles from "./styles/tiposPropiedadList.module.css";
import MuiPagination from "@/components/ui/pagination";
import { getTiposPropiedadColumns } from "./columns";
import TiposPropiedadForm from "./tiposPropiedadForm";

const TiposPropiedadList: React.FC = () => {
    const {
        setShowModalContainer,
    } = useModalContainer();

    const optionId = useCurrentOptionId();
    const checkPermission = useCheckPermission();
    const canCreate = checkPermission('crear');
    const canEdit = checkPermission('editar');
    const canDelete = checkPermission('eliminar');

    // Estados principales
    const [modalType, setModalType] = useState<'register' | 'edit' | 'delete' | null>(null);
    const [tipoEdit, setTipoEdit] = useState<TipoPropiedad | undefined>(undefined);
    const [tipoToDelete, setTipoToDelete] = useState<TipoPropiedad | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { showAlert } = useAlert();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("");
    const isMounted = useRef(false);
    
    // Estados para la gestión de datos
    const [allTipos, setAllTipos] = useState<TipoPropiedad[]>([]);
    const [filteredTipos, setFilteredTipos] = useState<TipoPropiedad[]>([]);
    const [displayedTipos, setDisplayedTipos] = useState<TipoPropiedad[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Filtrar tipos basado en la búsqueda
    useEffect(() => {
        if (!allTipos.length) return;

        let filtered = [...allTipos];
        
        if (inputValue.trim()) {
            const searchTerm = inputValue.toLowerCase().trim();
            filtered = filtered.filter(tipo => 
                tipo.nombre.toLowerCase().includes(searchTerm) ||
                (tipo.descripcion?.toLowerCase().includes(searchTerm) ?? false)
            );
        }

        setFilteredTipos(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1);
    }, [allTipos, inputValue]);

    // Actualizar tipos mostrados según la paginación
    useEffect(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayedTipos(filteredTipos.slice(start, end));
        
        const total = Math.ceil(filteredTipos.length / itemsPerPage) || 1;
        setTotalPages(total);
    }, [filteredTipos, currentPage, itemsPerPage]);
    
    // Efecto para cargar datos iniciales y cuando cambia el refreshTrigger
    useEffect(() => {
        isMounted.current = true;
        fetchTipos();
        
        return () => {
            isMounted.current = false;
        };
    }, [currentPage, itemsPerPage, refreshTrigger]);

    const fetchTipos = useCallback(async () => {
        if (!isMounted.current) return;
        
        setIsLoading(true);
        try {
            const response = await InmobiliariaApi.tipoPropiedadController.getTipoPropiedadList({ 
                page: currentPage, 
                perPage: 1000, // Traer más elementos para búsqueda en el cliente
                search: inputValue.trim() || undefined
            });
    
            if (!isMounted.current) return;
    
            const formattedData = response?.data?.map((item: any) => ({
                idTiposPropiedad: item.idTiposPropiedad,
                nombre: item.nombre || '',
                descripcion: item.descripcion || '',
                activo: item.activo !== undefined ? item.activo : true,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            })) || [];
    
            setAllTipos(formattedData);
            setTotalItems(response?.meta?.total || 0);
    
        } catch (error) {
            console.error("Error al cargar tipos de propiedad:", error);
            showAlert('error', 'Error', 'Error al cargar la lista de tipos de propiedad');
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [currentPage, itemsPerPage, inputValue, showAlert, refreshTrigger]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        window.scrollTo(0, 0); // Opcional: scroll al inicio de la página
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        // No es necesario setCurrentPage(1) aquí ya que el efecto de búsqueda lo manejará
    };

    const handleItemsPerPageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const newItemsPerPage = Number(event.target.value);
        setItemsPerPage(newItemsPerPage);
        // No es necesario setCurrentPage(1) aquí ya que el efecto lo manejará
    };

    const handleEdit = (tipo: TipoPropiedad) => {
        setTipoEdit(tipo);
        setModalType('edit');
        setShowModalContainer(true);
    };

    const handleDelete = useCallback((idTiposPropiedad: number) => {
        const tipo = allTipos.find((t: TipoPropiedad) => t.idTiposPropiedad === idTiposPropiedad);
        if (tipo) {
            setTipoToDelete(tipo);
            setDeleteDialogOpen(true);
        }
    }, [allTipos]);

    const handleConfirmDelete = useCallback(async () => {
        if (!tipoToDelete) return;
        
        try {
            await InmobiliariaApi.tipoPropiedadController.deleteTipoPropiedad(tipoToDelete.idTiposPropiedad);
            showAlert('success', 'Éxito', 'Tipo de propiedad eliminado correctamente');
            setDeleteDialogOpen(false);
            // Forzar recarga de datos
            setCurrentPage(1);
            fetchTipos();
        } catch (error) {
            console.error("Error al eliminar tipo de propiedad:", error);
            showAlert('error', 'Error', 'No se pudo eliminar el tipo de propiedad');
        }
    }, [tipoToDelete, showAlert, fetchTipos]);

    const handleCreate = () => {
        setTipoEdit(undefined);
        setModalType('register');
        setShowModalContainer(true);
    };

    const handleCloseModal = () => {
        setModalType(null);
        setTipoEdit(undefined);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        handleCloseModal();
    };

    const columns = useMemo(() => 
        getTiposPropiedadColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
            canEdit,
            canDelete,
            currentPage,
            itemsPerPage
        }),
        [handleEdit, handleDelete, canEdit, canDelete, currentPage, itemsPerPage]
    );

    return (
        <>
        <AdminCardLayout>
            <AdminCardLayout.Title>
                <div className={styles.titleContainer}>
                    <h2 className={styles.title}>Lista de Tipos de Propiedad</h2>
                    <div className={styles.searchContainer}>
                        <div className="relative">
                            <div className={styles.searchIcon}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar Tipos de Propiedad..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className={styles.searchInput}
                                disabled={isLoading}
                            />
                            {isLoading && (
                                <div className={styles.searchIcon}>
                                    <div className={styles.loadingSpinnerSmall}></div>
                                </div>
                            )}
                            {!isLoading && inputValue && (
                                <button
                                    type="button"
                                    onClick={() => setInputValue('')}
                                    className={styles.clearSearchButton}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.actionsContainer}>
                        {canCreate && (
                            <Button
                                variant="default"
                                onClick={() => {
                                    setTipoEdit(undefined);
                                    setModalType('register');
                                    setShowModalContainer(true);
                                }}
                            >
                              Nuevo Tipo de Propiedad
                            </Button>
                        )}
                    </div>
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
                ) : filteredTipos.length === 0 ? (
                    <div className={styles.noResults}>
                            {inputValue ? 'No se encontraron tipos de propiedad que coincidan con tu búsqueda' : 'No hay tipos de propiedad disponibles'}
                        </div>
                    ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <div className={styles.tableContainer}>
                                <Datatable
                                    columns={columns}
                                    data={displayedTipos}
                                    meta={{ currentPage, itemsPerPage }}
                                />
                            </div>
                            </div>

                        <div className={styles.paginationContainer}>
                                <MuiPagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    showFirstButton
                                    showLastButton
                                className={styles.paginationContent}
                                />
                            </div>
                    </>
                    )}
            </AdminCardLayout.Content>       
        </AdminCardLayout>
        <ModalContainerComponent 
            showModalContainer={modalType === "register" || modalType === "edit"}
            setShowModalContainer={setShowModalContainer}
            onClose={handleCloseModal}
        >
            <TiposPropiedadForm
                tipo={tipoEdit}
                onSuccess={handleSuccess}
                closeModal={handleCloseModal}
            />
        </ModalContainerComponent>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro que deseas eliminar este tipo de propiedad?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p className="mb-2">
                            Esta acción no se puede deshacer. Esto eliminará el tipo de propiedad.
                            {tipoToDelete ? (
                                <span className="font-semibold"> {tipoToDelete.nombre}</span>
                            ) : null}
                        </p>
                        <p className="text-amber-600 bg-amber-50 p-2 border-l-2 border-amber-500 rounded mt-2">
                            <strong>Importante:</strong> No se podrá eliminar este tipo de propiedad si tiene propiedades vinculadas.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        className={styles.deleteButtonAction} 
                        onClick={handleConfirmDelete}
                        disabled={!tipoToDelete}
                    >
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};

export default TiposPropiedadList;
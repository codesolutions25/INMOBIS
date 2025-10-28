"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import { FeriadosGlobales } from "../models/planPagosModels";
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

import { useAlert } from "@/contexts/AlertContext";
import PlanPagosApi from "../services/PlanPagosApi";
import { getFeriadoGlobalColumns } from "./columns";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import styles from './styles/FeriadosGlobalesList.module.css';
import MuiPagination from "@/components/ui/pagination";
import FeriadosGlobalesForm from "./FeriadosGlobalesForm";

export default function FeriadosGlobalesList () {
    
    const {
        setShowModalContainer,
    } = useModalContainer();

    const optionId = useCurrentOptionId();
    const checkPermission = useCheckPermission();
    const canCreate = checkPermission('crear');
    const canEdit = checkPermission('editar');
    const canDelete = checkPermission('eliminar');

    const [modalType, setModalType] = useState<'register' | 'edit' | 'view' | null>(null);
    const [feriadosGlobalesEdit, setFeriadosGlobalesEdit] = useState<FeriadosGlobales | undefined>(undefined);
    const { showAlert } = useAlert();
    const [feriadosGlobales, setFeriadosGlobales] = useState<FeriadosGlobales[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [feriadosGlobalesToDelete, setFeriadosGlobalesToDelete] = useState<FeriadosGlobales | null>(null);
    const [allFeriadosGlobales, setAllFeriadosGlobales] = useState<FeriadosGlobales[]>([]);

    // Un solo useEffect para cargar los datos, sin referencias cruzadas ni funciones memorizadas
    useEffect(() => {
        let isCancelled = false;
        console.log('[Fetch] useEffect ejecutado. currentPage:', currentPage, 'refreshTrigger:', refreshTrigger);
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await PlanPagosApi.feriadosGlobalesController.getFeriadosGlobalesList({
                    page: currentPage,
                    perPage: itemsPerPage,
                    search: searchTerm
                });
                if (!isCancelled) {
                    if (!response) {
                        throw new Error('No se recibió respuesta del servidor');
                    }
                    setFeriadosGlobales(response.data || []);
                    setTotalItems(response.meta?.total || 0);
                    setTotalPages(response.meta?.pages || 1);
                    setAllFeriadosGlobales(response.data || []);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error al cargar feriados globales:', error);
                    showAlert('error', 'Error', 'Error al cargar la lista de feriados globales');
                    setFeriadosGlobales([]);
                    setTotalPages(1);
                    setTotalItems(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
        return () => { isCancelled = true; };
    }, [currentPage, itemsPerPage, searchTerm, refreshTrigger]);

    const handlePageChange = (newPage: number) => {
        console.log('Cambiando a página:', newPage);
        setCurrentPage(newPage);
    };
    console.log('currentPage:', currentPage, 'totalPages:', totalPages);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Debounce para actualizar searchTerm y currentPage
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setSearchTerm(inputValue);
            setCurrentPage(1); // Resetear a la primera página al buscar
        }, 500);
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [inputValue, debounceTimeoutRef]);

    const handleOpenRegisterModal = useCallback(() => {
        setFeriadosGlobalesEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((feriadosGlobales: FeriadosGlobales) => {
        setFeriadosGlobalesEdit(feriadosGlobales);
        setModalType("edit");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback((feriadosGlobales: FeriadosGlobales) => {
        setFeriadosGlobalesToDelete(feriadosGlobales);
        setDeleteDialogOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setFeriadosGlobalesEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        console.log('[Eliminar] handleConfirmDelete llamado', feriadosGlobalesToDelete);
        if (feriadosGlobalesToDelete?.idFeriadoGlobal) {
            try {
                const resp = await PlanPagosApi.feriadosGlobalesController.deleteFeriadosGlobales(feriadosGlobalesToDelete.idFeriadoGlobal);
                console.log('[Eliminar] Respuesta API:', resp);
                showAlert('success', 'Éxito', 'Feriado global eliminado correctamente');
                setRefreshTrigger((prev) => prev + 1);
            } catch (error) {
                console.error('[Eliminar] Error al eliminar feriado global:', error);
                showAlert('error', 'Error', 'No se pudo eliminar el feriado global');
            } finally {
                setDeleteDialogOpen(false);
                setFeriadosGlobalesToDelete(null);
            }
        }
    };

    const columns = useMemo(
        () => getFeriadoGlobalColumns({ 
            onEdit, 
            onDelete,
            canEdit,
            canDelete,
            currentPage,
            itemsPerPage
        }),
        [onEdit, onDelete, canEdit, canDelete, currentPage, itemsPerPage]
    );
    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className={styles.titleContainer}>
                        <h2 className={styles.title}>Lista de Feriados </h2>
                        <div className={styles.searchContainer}>
                            <div className="relative">
                                <div className={styles.searchIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar Feriados..."
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    className={styles.searchInput}
                                />
                            </div>
                        </div>

                        <div className={styles.actionsContainer}>
                            {canCreate && (
                                <Button
                                    variant="default"
                                    onClick={handleOpenRegisterModal}
                                    className={styles.registerButton}
                                >
                                    Registrar
                                </Button>
                            )}
                        </div>
                    </div>
                </AdminCardLayout.Title>
                <AdminCardLayout.Header>
                    <div className="-mt h1"></div>
                </AdminCardLayout.Header>
                <AdminCardLayout.Content>
                    {isLoading ? (
                        <div className={styles.loadingSpinnerContainer}>
                            <div className={styles.loadingSpinner}></div>
                        </div>
                    ) : feriadosGlobales.length === 0 ? (
                        <div className={styles.noResults}>
                            {searchTerm ? 'No se encontraron feriados que coincidan con tu búsqueda' : 'No hay feriados registrados'}
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <div className={styles.tableContainer}>
                                    <Datatable
                                        columns={columns}
                                        data={feriadosGlobales}
                                        meta={{ currentPage, itemsPerPage }}
                                    />
                                </div>
                            </div>

                            <div className={styles.paginationContainer}>
                                <MuiPagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, page) => handlePageChange(page)}
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
                <FeriadosGlobalesForm
                    feriado={feriadosGlobalesEdit}
                    onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
                    closeModal={handleCloseModal}
                />
            </ModalContainerComponent>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro que deseas eliminar este feriado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará el feriado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={styles.deleteButtonAction} onClick={handleConfirmDelete}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

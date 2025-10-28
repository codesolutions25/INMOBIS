"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";

import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import CaracteristicasInmobiliariosForm from "./CaracteristicasInmobiliariosForm"

import Datatable from "@/components/table/datatable";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { CatalogoCaracteristica } from "@/types/caracteristicas";
import { getCatalogoCaracteristicas, deleteCatalogoCaracteristica, getAllCaracteristicasPropiedad } from "@/services/apiCaracteristicas";
import { getCatalogoCaracteristicasColumns } from "./columns";

import { useAlert } from "@/contexts/AlertContext";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import styles from './styles/CaracteristicasInmobiliariosList.module.css';

export default function CatalogoCaracteristicasList(){

    const {
        setShowModalContainer,
    } = useModalContainer()

    // Permisos
    const optionId = useCurrentOptionId();
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

    console.log('Permisos caracteristicas:', { canCreate, canEdit, canDelete });

    const [modalType, setModalType] = useState<"register" | "edit" | null>(null)
    const [catalogoCaracteristicaEdit, setCatalogoCaracteristicaEdit] = useState<CatalogoCaracteristica | undefined>(undefined)
    const [catalogoCaracteristicaDelete, setCatalogoCaracteristicaDelete] = useState<CatalogoCaracteristica | undefined>(undefined)
    
    const { showAlert } = useAlert()
    
    const [allCatalogoCaracteristica, setAllCatalogoCaracteristica] = useState<CatalogoCaracteristica[]>([])
    const [catalogoCaracteristica, setCatalogoCaracteristica] = useState<CatalogoCaracteristica[]>([])
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
    const [inputValue, setInputValue] = useState<string>("")
    
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [itemsPerPage] = useState<number>(10);
    const [caracteristicasEnUso, setCaracteristicasEnUso] = useState<Set<number>>(new Set());
    
    const paginatedCatalogoCaracteristica= useMemo(() => {
        const startIdx = (currentPage - 1) * itemsPerPage;
        return catalogoCaracteristica.slice(startIdx, startIdx + itemsPerPage);
    }, [catalogoCaracteristica, currentPage, itemsPerPage]);

    const [isLoading, setIsLoading] = useState<boolean>(false)
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [catalogoCaracteristicaToDelete, setCatalogoCaracteristicaToDelete] = useState<CatalogoCaracteristica | null>(null)

    const fetchCaracteristicas = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            // Obtener todas las características y las que están en uso en paralelo
            const [catalogoResponse, caracteristicasEnUsoResponse] = await Promise.all([
                getCatalogoCaracteristicas(1, 1000),
                getAllCaracteristicasPropiedad()
            ]);

            const catalogoCaracteristica = catalogoResponse.data;
            setAllCatalogoCaracteristica(catalogoCaracteristica);
            setCatalogoCaracteristica(catalogoCaracteristica);
            setTotalPages(1);
            setTotalItems(catalogoCaracteristica.length);
            setCurrentPage(1);

            // Crear un Set con los IDs de las características en uso para búsqueda rápida
            const enUsoIds = new Set(caracteristicasEnUsoResponse.map(c => c.idCatalogoCaracteristicas));
            setCaracteristicasEnUso(enUsoIds);

        } catch (error) {
            console.error('Error al obtener datos de características:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los datos de características.');
            setCatalogoCaracteristica([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [showAlert, itemsPerPage, isLoading]);

    useEffect(() => {
        fetchCaracteristicas();
    }, [refreshTrigger]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
    }, []);

    useEffect(() => {
        const filtro = inputValue.trim().toLowerCase();
        let filtrados = allCatalogoCaracteristica;
        if (filtro) {
            filtrados = allCatalogoCaracteristica.filter(c => {
                return (
                        (c.nombre && c.nombre.toLowerCase().includes(filtro))
                    );
                });
            }
            setCatalogoCaracteristica(filtrados);
            setTotalItems(filtrados.length);
            setCurrentPage(1);
    }, [inputValue, allCatalogoCaracteristica]);

    useEffect(() => {
        setTotalPages(Math.max(1, Math.ceil(catalogoCaracteristica.length / itemsPerPage)));
    }, [catalogoCaracteristica, itemsPerPage]);

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

    const handleOpenRegisterModal = useCallback(() => {
        setCatalogoCaracteristicaEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (!catalogoCaracteristicaToDelete) return;

        try {
            const response = await deleteCatalogoCaracteristica(catalogoCaracteristicaToDelete.idCatalogoCaracteristicas);

            // La API ahora devuelve un objeto de error en lugar de lanzar una excepción para errores de FK.
            if (response?.error === 'ForeignKeyConstraint') {
                showAlert(
                    'critical-error',
                    'No se puede eliminar esta característica',
                    `La característica "${catalogoCaracteristicaToDelete.nombre}" está vinculada a una o más propiedades. Debe eliminar las vinculaciones antes de poder borrarla.`
                );
            } else {
                // Si no hay un objeto de error, la eliminación fue exitosa.
                showAlert('success', 'Éxito', 'Característica eliminada exitosamente');
                refreshList();
            }
        } catch (error) {
            // Este bloque ahora solo captura errores inesperados que sí son lanzados por la API.
            console.error('Error inesperado al eliminar característica:', error);
            showAlert('error', 'Error al eliminar', 'Ocurrió un error inesperado. Por favor, intente de nuevo.');
        } finally {
            // Aseguramos que el diálogo se cierre siempre.
            setDeleteDialogOpen(false);
        }
    };

    const handleOpenEditModal = (caracteristica: CatalogoCaracteristica, isReadOnly: boolean = false) => {
        setModalType('edit');
        setCatalogoCaracteristicaEdit({ ...caracteristica, isReadOnly });
        setShowModalContainer(true);
    };

    const onEdit = (caracteristica: CatalogoCaracteristica) => {
        const isReadOnly = caracteristicasEnUso.has(caracteristica.idCatalogoCaracteristicas);
        console.log(`Editando característica: ${caracteristica.nombre}, En uso: ${isReadOnly}`);
        handleOpenEditModal(caracteristica, isReadOnly);
    };

    const onDelete = useCallback(
        (catalogoCaracteristica: CatalogoCaracteristica) => {
            setCatalogoCaracteristicaToDelete(catalogoCaracteristica);
            setDeleteDialogOpen(true);
        },
        []
    )
    
    const columns = useMemo(
        () => getCatalogoCaracteristicasColumns({
            onEdit: canEdit ? handleOpenEditModal : undefined,
            onDelete: canDelete ? (caracteristica) => {
                setCatalogoCaracteristicaToDelete(caracteristica);
                setDeleteDialogOpen(true);
            } : undefined,
            currentPage,
            itemsPerPage,
            canEdit,
            canDelete
        }),
        [currentPage, itemsPerPage, canEdit, canDelete]
    );

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setCatalogoCaracteristicaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);


    return(
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className={styles.titleContainer}>
                        <h2 className={styles.title}>Lista de caracteristicas</h2>
                        
                        <div className={styles.searchContainer}>
                            <div className="relative">
                                <div className={styles.searchIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    placeholder="Buscar características..."
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>

                        {canCreate && (
                            <Button
                                onClick={handleOpenRegisterModal}
                                variant="default"
                            >
                                Registrar
                            </Button>
                        )}
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
                    ) : catalogoCaracteristica.length === 0 ? (
                        <div className={styles.noResults}>
                            {inputValue ? 'No se encontraron caracteristicas que coincidan con tu búsqueda' : 'No hay caracteristicas disponibles'}
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <Datatable data={paginatedCatalogoCaracteristica} columns={columns} />
                        </div>
                    )}

                    {catalogoCaracteristica.length > 0 && !isLoading && (
                        <div className={styles.paginationContainer}>
                            <div className={styles.paginationContent}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={styles.paginationButton}
                                    aria-label="Página anterior"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <div className={styles.pageButtonsContainer}>
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        className={`${styles.pageButton} ${currentPage === 1 ? styles.active : ''}`}
                                    >
                                        1
                                    </button>
                                    {currentPage > 4 && (
                                        <span className={styles.paginationEllipsis}>...</span>
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
                                                className={`${styles.pageButton} ${currentPage === pageNumber ? styles.active : ''}`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                    {currentPage < totalPages - 3 && (
                                        <span className={styles.paginationEllipsis}>...</span>
                                    )}
                                    {totalPages > 1 && (
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            className={`${styles.pageButton} ${currentPage === totalPages ? styles.active : ''}`}
                                        >
                                            {totalPages}
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={styles.paginationButton}
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

            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") ? (
                    <CaracteristicasInmobiliariosForm
                        caracteristica={modalType === "edit" ? catalogoCaracteristicaEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                ) : null}
            </ModalContainerComponent>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta característica?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className={styles.alertDialogDescription}>
                                <p>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente la característica
                                    {catalogoCaracteristicaToDelete && (
                                        <span className={styles['font-semibold']}> {catalogoCaracteristicaToDelete.nombre}</span>
                                    )}
                                </p>
                                <p className={styles.importantNote}>
                                    <strong>Importante:</strong> No se podrá eliminar esta característica si está vinculada a una o más propiedades.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            className={styles.deleteButtonAction}
                            onClick={handleConfirmDelete}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
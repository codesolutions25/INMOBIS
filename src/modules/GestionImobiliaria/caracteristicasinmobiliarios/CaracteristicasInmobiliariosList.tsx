"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";

import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import CaracteristicasInmobiliariosForm from "./CaracteristicasInmobiliariosForm"

import Datatable from "@/components/table/datatable";
import { Button } from '@/components/ui/button';
import MuiPagination from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { CatalogoCaracteristica } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
// import { getCatalogoCaracteristicas, deleteCatalogoCaracteristica, getAllCaracteristicasPropiedad } from "@/services/apiCaracteristicas";
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi"
import { getCatalogoCaracteristicasColumns } from "./columns";

import { useAlert } from "@/contexts/AlertContext";
import styles from './styles/CaracteristicasInmobiliariosList.module.css';

export default function CatalogoCaracteristicasList(){

    const {
        setShowModalContainer,
    } = useModalContainer()

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
            // Obtener todas las características
            const catalogoResponse = await InmobiliariaApi.catalogoCaracteristicaController.getCatalogoCaracteristicaList({page: 1, perPage: 1000});
            
            // Obtener todas las propiedades
            const propiedadesResponse = await InmobiliariaApi.propiedadController.getPropiedadList({page: 1, perPage: 1000});
            
            // Obtener características en uso de todas las propiedades
            const caracteristicasEnUsoPromises = propiedadesResponse?.data.map(propiedad => 
                InmobiliariaApi.caracteristicasPropiedadController.getByPropiedadId(propiedad.idPropiedad)
            ) || [];
            
            const caracteristicasEnUsoResponses = await Promise.all(caracteristicasEnUsoPromises);
            
            // Aplanar el array de arrays de características y extraer los IDs únicos
            const caracteristicasEnUso = caracteristicasEnUsoResponses.flat();
            const enUsoIds = new Set(caracteristicasEnUso.map(c => c.idCatalogoCaracteristicas));
            
            const catalogoCaracteristica = catalogoResponse?.data || [];
            setAllCatalogoCaracteristica(catalogoCaracteristica);
            setCatalogoCaracteristica(catalogoCaracteristica);
            setTotalPages(1);
            setTotalItems(catalogoCaracteristica.length);
            setCurrentPage(1);
            
            console.log('Características en uso:', Array.from(enUsoIds));
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

    const filtrarCaracteristicas = useCallback((texto: string) => {
        const filtro = texto.trim().toLowerCase();
        if (!filtro) {
            setCatalogoCaracteristica([...allCatalogoCaracteristica]);
            setTotalItems(allCatalogoCaracteristica.length);
            return;
        }
        
        const filtrados = allCatalogoCaracteristica.filter(c => {
            return (
                (c.nombre && c.nombre.toLowerCase().includes(filtro)) ||
                (c.descripcion && c.descripcion.toLowerCase().includes(filtro))
            );
        });
        
        setCatalogoCaracteristica(filtrados);
        setTotalItems(filtrados.length);
        setCurrentPage(1);
    }, [allCatalogoCaracteristica]);

    useEffect(() => {
        const timer = setTimeout(() => {
            filtrarCaracteristicas(inputValue);
        }, 300);
        
        return () => clearTimeout(timer);
    }, [inputValue, filtrarCaracteristicas]);

    useEffect(() => {
        setTotalPages(Math.max(1, Math.ceil(catalogoCaracteristica.length / itemsPerPage)));
        setCurrentPage(1);
        setTotalItems(catalogoCaracteristica.length);
        
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

        // Verificar primero si la característica está en uso
        if (caracteristicasEnUso.has(catalogoCaracteristicaToDelete.idCatalogoCaracteristicas)) {
showAlert(
                'warning',
                'No se puede eliminar',
                `La característica "${catalogoCaracteristicaToDelete.nombre}" está siendo utilizada en una o más propiedades. Por favor, elimine primero las referencias en las propiedades antes de eliminarla.`
            );
            setDeleteDialogOpen(false);
            return;
        }

        try {
            setIsLoading(true);
            await InmobiliariaApi.catalogoCaracteristicaController.deleteCatalogoCaracteristica(
                catalogoCaracteristicaToDelete.idCatalogoCaracteristicas
            );
            
            showAlert('success', 'Éxito', 'Característica eliminada correctamente');
            refreshList();
        } catch (error: any) {
            console.error('Error al eliminar característica:', error);
            
            // Manejo específico para errores de restricción de clave foránea
            if (error.response?.data?.message?.includes('foreign key constraint')) {
                showAlert(
                    'warning',
                    'No se puede eliminar',
                    `La característica "${catalogoCaracteristicaToDelete.nombre}" está siendo utilizada en una o más propiedades.`
                );
            } else {
                showAlert(
                    'error',
                    'Error al eliminar',
                    error.response?.data?.message || 'Ocurrió un error al intentar eliminar la característica.'
                );
            }
        } finally {
            setIsLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleOpenEditModal = (caracteristica: CatalogoCaracteristica, isReadOnly: boolean = false) => {
        setModalType('edit');
        // Aseguramos que la característica tenga la propiedad isReadOnly
        setCatalogoCaracteristicaEdit({ ...caracteristica, isReadOnly });
        setShowModalContainer(true);
    };

    const onEdit = (caracteristica: CatalogoCaracteristica) => {
        // Verificar si la característica está en uso
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
    
    const columns = useMemo(() => getCatalogoCaracteristicasColumns({
        onEdit,
        onDelete,
        currentPage,
        itemsPerPage
    }), [onEdit, onDelete, currentPage, itemsPerPage]);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setCatalogoCaracteristicaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    return (
    <>
        <AdminCardLayout>
            <AdminCardLayout.Title>
                <div className={styles.titleContainer}>
                    <h2 className={styles.title}>Lista de características inmobiliarias</h2>
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
                                className={styles.searchInput}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleOpenRegisterModal}
                        variant="default"
                    >
                        Registrar
                    </Button>
                </div>
            </AdminCardLayout.Title>
            <AdminCardLayout.Content>
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <div className={styles.loadingSpinner}></div>
                    </div>
                ) : paginatedCatalogoCaracteristica.length === 0 ? (
                    <div className={styles.noResults}>
                        {inputValue ? 'No se encontraron características que coincidan con tu búsqueda' : 'No hay características registradas'}
                    </div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <div className={styles.tableContainer}>
                                <Datatable
                                    columns={columns}
                                    data={paginatedCatalogoCaracteristica}
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
            <CaracteristicasInmobiliariosForm
                caracteristica={catalogoCaracteristicaEdit}
                isReadOnly={catalogoCaracteristicaEdit?.isReadOnly}
                onSuccess={refreshList}
                closeModal={handleCloseModal}
            />
        </ModalContainerComponent>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro que deseas eliminar esta característica?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará la característica del catálogo.
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
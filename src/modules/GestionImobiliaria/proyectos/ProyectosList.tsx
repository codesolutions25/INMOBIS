"use  client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import MuiPagination from "@/components/ui/pagination";

import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import ProyectosForm from "./ProyectosForm"
import ProyectosDetalle from "./ProyectosDetalle"
import ProyectoImagenesModal from "./ProyectoImagenesModal"

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
    AlertDialogTitle
} from '@/components/ui/alert-dialog';

import {
    Proyecto
} from "@/types/proyectos";
import { EstadoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { getProyectosColumns } from "./columns";

import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
import { useCompany } from "@/contexts/CompanyContext";

import { useAlert } from "@/contexts/AlertContext";
import styles from './styles/ProyectosList.module.css';

const ITEMS_PER_PAGE = 10;

export default function ProyectosList() {
    //MODAL
    const {
        setShowModalContainer,
    } = useModalContainer()

    // Estado para controlar el formulario persistente
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | "images" | null>(null);
    const [proyectoEdit, setProyectoEdit] = useState<Proyecto | undefined>(undefined);
    const [proyectoDetalle, setProyectoDetalle] = useState<Proyecto | undefined>(undefined);

    const { showAlert } = useAlert()
    const { selectedCompany } = useCompany();

    const [allProyectos, setAllProyectos] = useState<Proyecto[]>([])
    const [filteredProyectos, setFilteredProyectos] = useState<Proyecto[]>([])
    const [estadosPropiedad, setEstadosPropiedad] = useState<EstadoPropiedad[]>([])
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
    const [inputValue, setInputValue] = useState<string>("")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null)
    const isMounted = useRef(false);

    // Filter projects based on search input and selected company
    useEffect(() => {
        if (!allProyectos.length) return;

        let filtered = [...allProyectos];

        // Filter by selected company
        if (selectedCompany) {
            filtered = filtered.filter(p => p.idEmpresa === selectedCompany.idEmpresa);
        }

        // Filter by search input
        if (inputValue.trim()) {
            const searchTerm = inputValue.toLowerCase().trim();
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm) ||
                (p.descripcion?.toLowerCase().includes(searchTerm) ?? false)
            );
        }

        setFilteredProyectos(filtered);
        setTotalItems(filtered.length);

        // Reset to first page when filters change
        setCurrentPage(1);
    }, [allProyectos, selectedCompany, inputValue]);

    // Update total pages when filtered projects change
    useEffect(() => {
        const total = Math.ceil(filteredProyectos.length / itemsPerPage) || 1;
        setTotalPages(total);
    }, [filteredProyectos.length, itemsPerPage]);

    const paginatedProyectos = useMemo(() => {
        const startIdx = (currentPage - 1) * itemsPerPage;
        return filteredProyectos.slice(startIdx, startIdx + itemsPerPage);
    }, [filteredProyectos, currentPage, itemsPerPage]);

    const fetchData = useCallback(async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Obtener los proyectos (el filtrado por empresa se maneja en los headers)
            const [proyectosResponse, estadosResponse] = await Promise.all([
                InmobiliariaApi.proyectoController.getProyectoList({ 
                    page: 1, 
                    perPage: 1000,
                    search: inputValue
                }),
                InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList()
            ]);

            if (!isMounted.current) return;

            const proyectosData = proyectosResponse?.data || [];
            setAllProyectos(proyectosData);
            setEstadosPropiedad(estadosResponse?.data || []);
            
            // Actualizar el contador de proyectos
            setTotalItems(proyectosData.length);
        } catch (error) {
            console.error('Error loading data:', error);
            showAlert('error', 'Error', 'Error al cargar los datos');
        } finally {
            setIsLoading(false);
        }
    }, [showAlert, itemsPerPage, isLoading]);

    // Efecto para cargar datos cuando cambia la empresa seleccionada o se solicita actualización
    useEffect(() => {
        if (selectedCompany) {
            fetchData();
        }
    }, [refreshTrigger, selectedCompany?.idEmpresa]);

    useEffect(() => {
        const fetchEstados = async () => {
            try {
                const estados = await InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList();
                setEstadosPropiedad(estados?.data || []);
            } catch (error) {
                setEstadosPropiedad([]);
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        }
    }, [isLoading, showAlert]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();

        return () => {
            isMounted.current = false;
        };
    }, []); // Empty dependency array to run only once on mount

    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchData();
        }
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
        setProyectoEdit(undefined);
        setProyectoDetalle(undefined);
        setModalType("register");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (!proyectoToDelete) return;
        
        try {
            const result = await InmobiliariaApi.proyectoController.deleteProyecto(proyectoToDelete.idProyectoInmobiliario);
            
            if (result.success) {
                showAlert('success', 'Éxito', 'Proyecto eliminado exitosamente');
                refreshList();
            } else {
                // Mostrar mensaje de error específico de la API
                showAlert(
                    'warning',
                    'No se puede eliminar',
                    result.message || 'No se puede eliminar el proyecto porque tiene elementos asociados.'
                );
            }
        } catch (error: any) {
            console.error('Error al eliminar proyecto:', error);
            
            // Manejar errores inesperados
            const errorMessage = error.message || 'Ocurrió un error al intentar eliminar el proyecto. Por favor, intente nuevamente.';
            showAlert('error', 'Error', errorMessage);
        } finally {
            setDeleteDialogOpen(false);
            setProyectoToDelete(null);
        }
    };

    const handleOpenEditModal = useCallback((proyecto: Proyecto) => {
        setProyectoEdit(proyecto);
        setProyectoDetalle(undefined);
        setModalType("edit");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleOpenViewModal = useCallback((proyecto: Proyecto) => {
        setProyectoDetalle(proyecto);
        setProyectoEdit(undefined);
        setModalType("view");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleOpenImagesModal = useCallback((proyecto: Proyecto) => {
        setProyectoDetalle(proyecto);
        setModalType("images");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const onView = handleOpenViewModal;

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback(
        (proyecto: Proyecto) => {
            setProyectoToDelete(proyecto);
            setDeleteDialogOpen(true);
        },
        []
    )

    const onUploadImage = handleOpenImagesModal;

    const columns = useMemo(() => getProyectosColumns({
        onView,
        onEdit,
        onDelete,
        onUploadImage,
        currentPage,
        itemsPerPage,
        estadosPropiedad,
        canEdit: true,
        canDelete: true,
        canUploadImage: true,
    }), [
        onView,
        onEdit,
        onDelete,
        onUploadImage,
        currentPage,
        itemsPerPage,
        estadosPropiedad,
    ]);
    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setProyectoEdit(undefined);
        setProyectoDetalle(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);



    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className={styles.titleContainer}>
                        <h2 className={styles.title}>Lista de proyectos</h2>

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
                                    placeholder="Buscar proyectos..."
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>

                        {(
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
                    ) : filteredProyectos.length === 0 ? (
                        <div className={styles.noResults}>
                            {inputValue ? 'No se encontraron proyectos que coincidan con tu búsqueda' : 'No hay proyectos disponibles'}
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <div className={styles.tableContainer}>
                                    <div className="h-full">
                                        <Datatable data={paginatedProyectos} columns={columns} />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.paginationContainer}>
                                <MuiPagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, value: number) => handlePageChange(value)}
                                    showFirstButton
                                    showLastButton
                                    className={styles.paginationContent}
                                />
                            </div>
                        </>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") ? (
                    <ProyectosForm
                        proyecto={modalType === "edit" ? proyectoEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                ) : modalType === "view" && proyectoDetalle ? (
                    <ProyectosDetalle proyecto={proyectoDetalle} />
                ) : null}
            </ModalContainerComponent>

            {/* Modal específico para subida de imágenes */}
            {modalType === "images" && proyectoDetalle && (
                <ProyectoImagenesModal
                    proyecto={proyectoDetalle}
                    onSuccess={() => {
                        refreshList();
                    }}
                    closeModal={handleCloseModal}
                    trigger={<div style={{ display: 'none' }} />} // Trigger invisible para controlar la apertura programáticamente
                />
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar este proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto.
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
"use  client"

import { useEffect, useState, useContext, useMemo, useCallback, useRef } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";

import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import PropiedadesForm from "./PropiedadesForm"
import PropiedadDetalle from "./PropiedadDetalle"
import PropiedadImagenesModal from "./PropiedadImagenesModal"
import MuiPagination from "@/components/ui/pagination";
import PropiedadCaracteristicasModal from "./PropiedadCaracteristicasModal"

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
} from "@/components/ui/alert-dialog";

import { Propiedad, Proyecto } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";

import { getPropiedadesColumns } from "./columns";

import { useAlert } from "@/contexts/AlertContext";
import styles from './styles/PropiedadesList.module.css';
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
import { useCompany } from "@/contexts/CompanyContext";

export default function PropiedadesList() {
    // MODAL refactorizado
    const {
        setShowModalContainer,
    } = useModalContainer()

    // Permisos
    const optionId = useCurrentOptionId();
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');


    // Get selected company
    const { selectedCompany } = useCompany();

    // Efecto para detectar cambios en la empresa seleccionada
    useEffect(() => {
        setRefreshTrigger(prev => prev + 1); // Forzar recarga de propiedades
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Hacer scroll al inicio cuando cambia la empresa
    }, [selectedCompany?.idEmpresa]); // Solo se ejecuta cuando cambia el ID de la empresa

    const [modalType, setModalType] = useState<'register' | 'edit' | 'view' | 'images' | 'characteristics' | null>(null);
    const [propiedadEdit, setPropiedadEdit] = useState<Propiedad | undefined>(undefined);
    const [propiedadDetalle, setPropiedadDetalle] = useState<Propiedad | undefined>(undefined);

    const { showAlert } = useAlert()
    
    const [allPropiedades, setAllPropiedades] = useState<Propiedad[]>([])
    const [propiedades, setPropiedades] = useState<Propiedad[]>([])
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("");
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    

    const paginatedPropiedades = useMemo(() => {
        // Si la API ya maneja la paginación, devolvemos los datos tal cual
        if (propiedades.length <= itemsPerPage) {
            return propiedades;
        }
        
        // Si hay más elementos que los que caben en una página, aplicamos paginación en el frontend
        const startIndex = (currentPage - 1) * itemsPerPage;
        return propiedades.slice(startIndex, startIndex + itemsPerPage);
    }, [propiedades, currentPage, itemsPerPage]);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [propiedadToDelete, setPropiedadToDelete] = useState<Propiedad | null>(null);

    const fetchPropiedades = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);

        
        try {
            let proyectosFiltrados: Proyecto[] = [];
            
            if (selectedCompany) {
                console.log('Fetching projects for company:', selectedCompany.razonSocial);
                const proyectosResponse = await InmobiliariaApi.proyectoController.getProyectoList({
                    page: 1,
                    perPage: 1000,
                    search: inputValue.trim() || ''
                });
                
                proyectosFiltrados = (proyectosResponse?.data || []).filter(
                    p => p.idEmpresa === selectedCompany.idEmpresa
                );
                
                console.log(`Found ${proyectosFiltrados.length} projects for company ${selectedCompany.razonSocial}`);
                
                if (proyectosFiltrados.length === 0) {
                    console.log('No projects found for this company, showing no properties');
                    setAllPropiedades([]);
                    setPropiedades([]);
                    setTotalItems(0);
                    setTotalPages(1);
                    return;
                }
            }
            
            // Obtener todas las propiedades (con paginación grande para filtrado en frontend)
            const response = await InmobiliariaApi.propiedadController.getPropiedadList({
                page: 1,
                perPage: 1000,
                search: inputValue.trim() || ''
            });
            
            let propiedadesData = response?.data || [];
            console.log(`Fetched ${propiedadesData.length} properties before filtering`);
            
            // Filtrar por empresa si hay una seleccionada
            if (selectedCompany && proyectosFiltrados.length > 0) {
                const proyectosIds = proyectosFiltrados.map(p => p.idProyectoInmobiliario);
                const initialCount = propiedadesData.length;
                
                propiedadesData = propiedadesData.filter(
                    propiedad => propiedad.idProyectoInmobiliario && 
                               proyectosIds.includes(propiedad.idProyectoInmobiliario) &&
                               propiedad.idEstadoPropiedad === 1 // 1 = DISPONIBLE
                );
                
                console.log(`Filtered properties from ${initialCount} to ${propiedadesData.length} for company ${selectedCompany.razonSocial}`);
            }
            
            // Actualizar el estado con los datos filtrados
            setAllPropiedades(propiedadesData);
            setTotalItems(propiedadesData.length);
            const newTotalPages = Math.ceil(propiedadesData.length / itemsPerPage);
            setTotalPages(newTotalPages);
            
            // Ajustar la página actual si es necesario
            if (currentPage > 1 && currentPage > newTotalPages) {
                setCurrentPage(1);
            }
            
        } catch (error) {
            console.error('Error al cargar propiedades:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de propiedades');
            setAllPropiedades([]);
            setPropiedades([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, refreshTrigger]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPropiedades();
        }, 0); // Debounce de 300ms para búsquedas
        
        return () => clearTimeout(timer);
    }, [inputValue, refreshTrigger]);
    
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            // Solo actualizamos la página actual sin forzar recarga
            setCurrentPage(page);
            
            // Si hay pocos elementos, no hacemos scroll automático
            if (propiedades.length > itemsPerPage) {
                // Hacer scroll suave al principio de la tabla
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }
    };

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        // El efecto con el debounce se encargará de hacer la llamada
    }, []);
    
    // Efecto para manejar la búsqueda y filtrado
    useEffect(() => {
        if (!allPropiedades.length) return;
        
        let filtered = [...allPropiedades];
        
        // Aplicar filtro de búsqueda
        if (inputValue.trim()) {
            const searchTerm = inputValue.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.nombre?.toLowerCase().includes(searchTerm) ||
                p.descripcion?.toLowerCase().includes(searchTerm) ||
                p.direccion?.toLowerCase().includes(searchTerm) ||
                p.codigoPropiedad?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Actualizar el estado con los datos filtrados
        setPropiedades(filtered);
        setTotalItems(filtered.length);
        
        // Solo restablecer a la página 1 si hay un cambio en el término de búsqueda
        // No restablecer cuando solo cambian las propiedades
        if (inputValue) {
            setCurrentPage(1);
        }
    }, [allPropiedades, inputValue]);
    
    // Actualizar el total de páginas cuando cambia el total de ítems
    useEffect(() => {
        const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        if (calculatedTotalPages !== totalPages) {
            setTotalPages(calculatedTotalPages);
        }
        
        // Si la página actual es mayor que el total de páginas, volver a la primera página
        if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalItems, itemsPerPage, currentPage, totalPages]);
    
    const isRefreshing = useRef(false);
    
    // Función para refrescar la lista
    const refreshList = useCallback(() => {
        if (isRefreshing.current) return;
        
        isRefreshing.current = true;

        // Forzar un nuevo fetch
        setRefreshTrigger(prev => prev + 1);
        
        setTimeout(() => {
            isRefreshing.current = false;
        }, 300);
    }, []);

    // Abrir el modal de registro
    const handleOpenRegisterModal = useCallback(() => {
        setPropiedadEdit(undefined);
        setPropiedadDetalle(undefined);
        setModalType("register");
        setShowModalContainer(true);
    }, [setShowModalContainer]);
    
    const handleConfirmDelete = async () => {
        if (!propiedadToDelete) return;

        try {
            const response = await InmobiliariaApi.propiedadController.deletePropiedad(propiedadToDelete.idPropiedad);

            if (response.success) {
                showAlert('success', 'Éxito', 'Propiedad eliminada exitosamente');
                refreshList();
            } else {
                showAlert(
                    'warning',
                    'No se puede eliminar',
                    response.message || `La propiedad "${propiedadToDelete.nombre}" tiene características vinculadas. Debe eliminar las vinculaciones antes de poder borrarla.`
                );
            }
        } catch (error) {
            console.error('Error inesperado al eliminar propiedad:', error);
            showAlert('error', 'Error al eliminar', 'Ocurrió un error inesperado. Por favor, intente de nuevo.');
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    const handleOpenEditModal = useCallback((propiedad: Propiedad) => {
        setPropiedadEdit(propiedad);
        setPropiedadDetalle(undefined);
        setModalType("edit");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleOpenViewModal = useCallback((propiedad: Propiedad) => {
        setPropiedadDetalle(propiedad);
        setModalType("view");
        setShowModalContainer(true);
    }, [setShowModalContainer]);
    
    // Función para abrir el modal de imágenes
    const handleUploadImage = useCallback((propiedad: Propiedad) => {
        setPropiedadDetalle(propiedad);
        setModalType('images');
        setShowModalContainer(true);
    }, [setShowModalContainer]);
    
    const handleManageCharacteristics = useCallback((propiedad: Propiedad) => {
        setPropiedadDetalle(propiedad);
        setModalType('characteristics');
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const onView = handleOpenViewModal;

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback(
        (propiedad: Propiedad) => {
            setPropiedadToDelete(propiedad);
            setDeleteDialogOpen(true);
        },
        []
    )

    // Memoized columns with permissions
    const columns = useMemo(
        () => getPropiedadesColumns({
            onView: handleOpenViewModal,
            onEdit: canEdit ? handleOpenEditModal : undefined,
            onDelete: canDelete ? (propiedad) => {
                setPropiedadToDelete(propiedad);
                setDeleteDialogOpen(true);
            } : undefined,
            onUploadImage: canEdit ? handleUploadImage : undefined,
            onManageCharacteristics: canEdit ? handleManageCharacteristics : undefined,
            currentPage,
            itemsPerPage,
            canEdit,
            canDelete,
        }),
        [currentPage, itemsPerPage, canEdit, canDelete]
    );

    const handleCloseModal = useCallback(() => {
        setShowModalContainer(false);
        setModalType(null);
    }, [setShowModalContainer]);

    return(
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className={styles.titleContainer}>
                        <h2 className={styles.title}>Lista de propiedades</h2>
                        
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
                                    placeholder="Buscar propiedades..."
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
                    <div className="flex flex-col gap-4">
                        {isLoading ? (
                            null // No mostrar nada durante la carga
                        ) : propiedades.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400">No se encontraron propiedades</p>
                                {selectedCompany && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        No hay propiedades para la empresa seleccionada
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className={styles.tableWrapper}>
                                    <div className={styles.tableContainer}>
                                        <div className="h-full">
                                            <Datatable 
                                                columns={columns} 
                                                data={paginatedPropiedades}
                                            />
                                        </div>
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
                    </div>
                </AdminCardLayout.Content>
            </AdminCardLayout>

            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") ? (
                    <PropiedadesForm
                        propiedad={modalType === "edit" ? propiedadEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                ) : modalType === "view" && propiedadDetalle ? (
                    <PropiedadDetalle propiedad={propiedadDetalle} />
                ) : null}
            </ModalContainerComponent>
            
            {/* Modal específico para subida de imágenes */}
            {modalType === "images" && propiedadDetalle ? (
                <PropiedadImagenesModal 
                    propiedad={propiedadDetalle}
                    onSuccess={() => {
                        refreshList();
                    }}
                    closeModal={handleCloseModal}
                    trigger={<div style={{display: 'none'}} />} // Trigger invisible para controlar la apertura programáticamente
                />
            ) : null}
            
            {/* Modal para gestionar características de propiedad */}
            {modalType === "characteristics" && propiedadDetalle ? (
                <PropiedadCaracteristicasModal
                    propiedadId={propiedadDetalle.idPropiedad}
                    open={modalType === "characteristics"}
                    onClose={handleCloseModal}
                />
            ) : null}

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta propiedad?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <p className="mb-2">
                                Esta acción no se puede deshacer. Se eliminará permanentemente la propiedad
                                {propiedadToDelete ? (
                                    <span className="font-semibold"> {propiedadToDelete.nombre} ({propiedadToDelete.codigoPropiedad})</span>
                                ) : null}
                            </p>
                            <p className="text-amber-600 bg-amber-50 p-2 border-l-2 border-amber-500 rounded mt-2">
                                <strong>Importante:</strong> No se podrá eliminar esta propiedad si tiene características vinculadas.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            className={styles.deleteButtonAction}
                            onClick={handleConfirmDelete}
                            disabled={!propiedadToDelete}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
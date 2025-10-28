"use  client"

import { useEffect, useState, useContext, useMemo, useCallback, useRef } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";

import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import EmpresasForm from "./EmpresasForm"

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

import { Empresa } from "@/types/empresas";
import { getEmpresas, deleteEmpresa, searchImage, deleteImage } from "@/services/apiEmpresa";
import { getEmpresasColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";

import MuiPagination from "@/components/ui/pagination";
import { EmpresaDetailsModal } from "./components/EmpresaDetailsModal";

export default function EmpresasList() {
    // Detalles Modal State
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleViewEmpresa = (empresa: Empresa) => {
        setSelectedEmpresa(empresa);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedEmpresa(null);
    };

    //MODAL
    const {
        setShowModalContainer,
        // closeModal: closeModalFromHook,
        // ModalContainer
        ModalContainer: ModalContainerComponent
    } = useModalContainer()
    // const [showModalContainer, setShowModalContainerLocal] = useState(false);

    // Estado para controlar el formulario persistente
    const [modalType, setModalType] = useState<"register" | "edit" | null>(null);
    const [empresaEdit, setEmpresaEdit] = useState<Empresa | undefined>(undefined);
    // ...detalle

    const { showAlert } = useAlert()
    //DATATABLE
    //data
    const [empresas, setEmpresa] = useState<Empresa[]>([]);
    //busqueda
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [inputValue, setInputValue] = useState<string>("")
    //paginacion
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [itemsPerPage] = useState<number>(10)
    //loader
    const [isLoading, setIsLoading] = useState<boolean>(false)
    //delete
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null)
    //data
    const fetchEmpresas = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await getEmpresas(page, itemsPerPage, search)

            setEmpresa(response.data)

            const lastPage = Math.max(1, response.meta.lastPage);
            setTotalPages(lastPage);

            setTotalItems(response.meta.total);
            setCurrentPage(response.meta.currentPage);
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de empresas');
            setEmpresa([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false)
        }
    }, [showAlert, itemsPerPage, isLoading])

    const isInitialMount = useRef(true)
    const previousRefreshTrigger = useRef(refreshTrigger)
    const previousSearchTerm = useRef(searchTerm)
    const previousCurrentPage = useRef(currentPage)

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchEmpresas(currentPage, searchTerm);
            return;
        }

        const refreshChanged = previousRefreshTrigger.current !== refreshTrigger;
        const searchChanged = previousSearchTerm.current !== searchTerm;
        const pageChanged = previousCurrentPage.current !== currentPage;

        previousRefreshTrigger.current = refreshTrigger;
        previousSearchTerm.current = searchTerm;
        previousCurrentPage.current = currentPage;

        if (refreshChanged || searchChanged || pageChanged) {
            fetchEmpresas(currentPage, searchTerm);
        }
    }, [fetchEmpresas, refreshTrigger, searchTerm, currentPage]);

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
        const handler = setTimeout(() => {
            setSearchTerm(inputValue);
            if (inputValue !== searchTerm) {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [inputValue, searchTerm]);

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
        setEmpresaEdit(undefined);
        // setProyectoDetalle(undefined);
        setModalType("register");
        setShowModalContainer(true);
      
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (empresaToDelete) {
            try {
                await deleteEmpresa(empresaToDelete.idEmpresa);
                showAlert('success', 'Éxito', 'Empresa eliminada exitosamente');
                const imagenData = await searchImage(empresaToDelete.logoUrl)
                console.log('imagenData: ', imagenData.idImagen)
                if (typeof imagenData.idImagen === 'number') {
                    console.log('funcion de eliminacion llamada')
                    await deleteImage(imagenData.idImagen);
                }
                refreshList();
            } catch (error) {
                console.error('Error al eliminar empresa:', error);
                showAlert('error', 'Error', `Error al eliminar empresa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            } finally {
                setDeleteDialogOpen(false);
                setEmpresaToDelete(null);
            }
        }
    }

    const handleOpenEditModal = useCallback((empresa: Empresa) => {
        setEmpresaEdit(empresa);
        // setProyectoDetalle(undefined);
        setModalType("edit");
        setShowModalContainer(true);
       
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback(
        (empresa: Empresa) => {
            setEmpresaToDelete(empresa);
            setDeleteDialogOpen(true);
        },
        []
    )

    //columns
    const columns = useMemo(() => getEmpresasColumns({
        onEdit,
        onDelete,
        onView: handleViewEmpresa
    }), [handleOpenEditModal, handleViewEmpresa])

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setEmpresaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Lista de empresas</h2>
                        {/* Barra de búsqueda centrada */}
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar empresas..."
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    name="search-companies-no-autocomplete"
                                    // disabled={showModalContainer}
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setEmpresaEdit(undefined); // Asegúrate de que no haya datos de edición
                                setModalType("register"); // Establece el tipo de modal a "register"
                                setShowModalContainer(true); // Muestra el modal
                            }}
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Agregar Empresa
                        </Button>
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
                    ) : empresas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron proyectos que coincidan con tu búsqueda' : 'No hay proyectos disponibles'}
                        </div>
                    ) : (
                        <Datatable data={empresas} columns={columns} />
                    )}
                    {/* Paginacion */}
                    {empresas.length > 0 && !isLoading && (
                        <div className="mt-6 flex justify-center">
                            <MuiPagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_, value) => handlePageChange(value)}
                                showFirstButton
                                showLastButton
                            />
                        </div>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>
            <EmpresaDetailsModal 
                empresa={selectedEmpresa}
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
            />
            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") ? (
                    <EmpresasForm
                        empresa={modalType === "edit" ? empresaEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                ) : null}
            </ModalContainerComponent>
            {/* <ModalContainer /> */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta empresa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la empresa:
                            {empresaToDelete && (
                                <span className="font-semibold"> {empresaToDelete.razonSocial}</span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
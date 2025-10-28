"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";

import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import ClienteInmobiliarioForm from "./cliInmobiliariosForm";
import ClienteInmobiliarioDetalle from "./cliInmobiliariosDetalle"

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

import { ClienteInmobiliario } from "@/types/clienteInmobiliario";
import { getClientesInmobiliarios, deleteClienteInmobiliario } from "@/services/apiClientesInmobiliarios";
import { preloadAllCatalogos } from '@/services/apiCatalogos';
import { getClienteInmobiliariosColumns } from "./columns";

import { useAlert } from "@/contexts/AlertContext";

export default function ClienteInmobiliarioList() {
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer
    } = useModalContainer()

    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [clienteInmobiliarioEdit, setClienteInmobiliarioEdit] = useState<ClienteInmobiliario | undefined>(undefined);
    const [clienteInmobiliarioDetalle, setClienteInmobiliarioDetalle] = useState<ClienteInmobiliario | undefined>(undefined);

    const { showAlert } = useAlert()

    const [allClientesInmobiliarios, setAllClientesInmobiliarios] = useState<ClienteInmobiliario[]>([])
    const [clientesInmobiliarios, setClientesInmobiliarios] = useState<ClienteInmobiliario[]>([])
    const [empresasMap, setEmpresasMap] = useState<Record<number, string>>({})
    const [personasMap, setPersonasMap] = useState<Record<number, string>>({})
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
    const [inputValue, setInputValue] = useState<string>("")
    
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [itemsPerPage] = useState<number>(10)

    // Datos paginados a mostrar en la tabla
    const paginatedClientes = useMemo(() => {
        const startIdx = (currentPage - 1) * itemsPerPage;
        return clientesInmobiliarios.slice(startIdx, startIdx + itemsPerPage);
    }, [clientesInmobiliarios, currentPage, itemsPerPage]);
    
    const [isLoading, setIsLoading] = useState<boolean>(false)
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [clienteInmobiliarioToDelete, setClienteInmobiliarioToDelete] = useState<ClienteInmobiliario | null>(null)

    // Ahora solo se trae una vez todos los clientes (sin search)
    const fetchClientesInmobiliarios = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await preloadAllCatalogos();
            const response = await getClientesInmobiliarios(1, 1000); // Trae hasta 1000 registros, ajusta si es necesario
            const clientes = response.data;

            // Obtener IDs únicos de empresas y personas
            const empresaIds = Array.from(new Set(clientes.map(c => c.idEmpresa)));
            const personaIds = Array.from(new Set(clientes.map(c => c.idPersona)));

            // Obtener todas las empresas y personas
            const [empresas, personas] = await Promise.all([
                import('@/services/apiEmpresa').then(mod => mod.getEmpresas()),
                import('@/services/apiPersona').then(mod => mod.getPersonas())
            ]);

            // Crear mapas para acceso rápido
            const empresasMap: Record<number, string> = {};
            empresas.data.forEach(e => { empresasMap[e.idEmpresa] = e.razonSocial || 'Empresa desconocida'; });
            const personasMap: Record<number, string> = {};
            personas.data.forEach(p => { personasMap[p.idPersona] = `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`.trim(); });

            setEmpresasMap(empresasMap);
            setPersonasMap(personasMap);

            // Enriquecer los datos de clientes con los nombres
            const clientesConNombres = clientes.map(c => ({
                ...c,
                nombreEmpresa: empresasMap[c.idEmpresa] || 'Empresa desconocida',
                nombrePersona: personasMap[c.idPersona] || 'Persona desconocida',
            }));
            setAllClientesInmobiliarios(clientesConNombres);
            setClientesInmobiliarios(clientesConNombres); // Inicialmente muestra todos
            setTotalPages(1); // Opcional: ajusta si quieres paginación local
            setTotalItems(clientesConNombres.length);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error al cargar clientes inmobiliarios:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de clientes inmobiliarios');
            setAllClientesInmobiliarios([]);
            setClientesInmobiliarios([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [showAlert, isLoading]);

    // Eliminados refs relacionados a searchTerm porque ya no es necesario
    // const isInitialMount = useRef(true)
    // const previousRefreshTrigger = useRef(refreshTrigger)
    // const previousSearchTerm = useRef(searchTerm)
    // const previousCurrentPage = useRef(currentPage)

    useEffect(() => {
        fetchClientesInmobiliarios();
        // eslint-disable-next-line
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

    // Filtrado en el front cada vez que cambia inputValue o allClientesInmobiliarios
    useEffect(() => {
        const filtro = inputValue.trim().toLowerCase();
        let filtrados = allClientesInmobiliarios;
        if (filtro) {
            filtrados = allClientesInmobiliarios.filter(c => {
                return (
                    (c.nombrePersona && c.nombrePersona.toLowerCase().includes(filtro)) ||
                    (c.idPersona && c.idPersona.toString().includes(filtro)) ||
                    (c.nombreEmpresa && c.nombreEmpresa.toLowerCase().includes(filtro)) ||
                    (c.idEmpresa && c.idEmpresa.toString().includes(filtro))
                );
            });
        }
        setClientesInmobiliarios(filtrados);
        setTotalItems(filtrados.length);
        setCurrentPage(1);
    }, [inputValue, allClientesInmobiliarios]);

    // Actualiza totalPages cuando cambia el filtro
    useEffect(() => {
        setTotalPages(Math.max(1, Math.ceil(clientesInmobiliarios.length / itemsPerPage)));
    }, [clientesInmobiliarios, itemsPerPage]);

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
        setClienteInmobiliarioEdit(undefined);
        setClienteInmobiliarioDetalle(undefined);
        setModalType("register");
        setShowModalContainer(true);
        preloadAllCatalogos();
    }, [setShowModalContainer]);

    const handleConfirmDelete = async () => {
        if (clienteInmobiliarioToDelete) {
            try {
                await deleteClienteInmobiliario(clienteInmobiliarioToDelete.idClientesInmobiliarios);
                showAlert('success', 'Éxito', 'Cliente inmobiliario eliminado exitosamente');
                refreshList();
            } catch (error) {
                console.error('Error al eliminar cliente inmobiliario:', error);
                showAlert('error', 'Error', `Error al eliminar cliente inmobiliario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            } finally {
                setDeleteDialogOpen(false);
                setClienteInmobiliarioToDelete(null);
            }
        }
    };

    const handleOpenEditModal = useCallback((clienteInmobiliario: ClienteInmobiliario) => {
        setClienteInmobiliarioEdit(clienteInmobiliario);
        setClienteInmobiliarioDetalle(undefined);
        setModalType("edit");
        setShowModalContainer(true);
        preloadAllCatalogos();
    }, [setShowModalContainer]);

    const handleOpenViewModal = useCallback((clienteInmobiliario: ClienteInmobiliario) => {
        setClienteInmobiliarioEdit(undefined);
        setClienteInmobiliarioDetalle(clienteInmobiliario);
        setModalType("view");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const onView = handleOpenViewModal;

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback(
        (clienteInmobiliario: ClienteInmobiliario) => {
            setClienteInmobiliarioToDelete(clienteInmobiliario);
            setDeleteDialogOpen(true);
        },
        []
    )
    
    const columns = useMemo(() => getClienteInmobiliariosColumns({
        onView,
        onEdit,
        onDelete,
    }), [handleOpenEditModal, handleOpenViewModal]);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setClienteInmobiliarioEdit(undefined);
        setClienteInmobiliarioDetalle(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Lista de clientes inmobiliarios</h2>
                        
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    name="search-clientes-inmobiliarios-no-autocomplete"
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                    placeholder="Buscar clientes inmobiliarios..."
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
                <AdminCardLayout.Header>
                    <div className="-mt-4"></div>
                </AdminCardLayout.Header>
                <AdminCardLayout.Content>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4A6E]" />
                        </div>
                    ) : clientesInmobiliarios.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {inputValue ? 'No se encontraron clientes inmobiliarios que coincidan con tu búsqueda' : 'No hay clientes inmobiliarios disponibles'}
                        </div>
                    ) : (
                        <Datatable data={paginatedClientes} columns={columns} />
                    )}

                    {clientesInmobiliarios.length > 0 && !isLoading && (
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
                                    {/* Botón Primera página */}
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        className={`mx-0.5 h-8 w-8 flex items-center justify-center text-sm rounded-md ${currentPage === 1 ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
                                    >
                                        1
                                    </button>
                                    {/* ... antes del bloque central */}
                                    {currentPage > 4 && (
                                        <span className="mx-0.5 text-white text-opacity-70 px-1">...</span>
                                    )}
                                    {/* Páginas centrales */}
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
                                    {/* ... después del bloque central */}
                                    {currentPage < totalPages - 3 && (
                                        <span className="mx-0.5 text-white text-opacity-70 px-1">...</span>
                                    )}
                                    {/* Botón Última página */}
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

            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <ClienteInmobiliarioForm
                        clienteInmobiliario={modalType === "edit" && clienteInmobiliarioEdit ? clienteInmobiliarioEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                )}
                {modalType === "view" && clienteInmobiliarioDetalle && (
                    <ClienteInmobiliarioDetalle clienteInmobiliario={clienteInmobiliarioDetalle} />
                )}
            </ModalContainerComponent>

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


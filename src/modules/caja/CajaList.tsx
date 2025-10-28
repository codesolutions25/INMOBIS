"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import CajaForm from "./CajaForm";
import { Caja } from "@/types/cajas";
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
import { getCajas, deleteCaja, updateCaja } from "@/services/apiCajas";
import { getCajaColumns } from "./columns";
import { useAlert } from "@/contexts/AlertContext";
import { getPuntosVenta } from "@/services/apiPuntoVenta";
import { PuntoVenta } from "@/types/puntoventa";
import { getTiposCaja } from "@/services/apiTiposCaja";
import { TipoCaja } from "@/types/tiposcaja";
import { getEstadosCaja } from "@/services/apiEstadosCaja";
import { EstadoCaja } from "@/types/estadoscaja";
import { getEmpresas } from "@/services/apiEmpresa";
import { Empresa } from "@/types/empresas";
import { Combobox } from "@/components/ui/combobox";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCompany } from "@/contexts/CompanyContext";
import MuiPagination from "@/components/ui/pagination";

// Environment variables for caja statuses
const ESTADO_CAJA_ABIERTA = process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA || 'Abierta';
const ESTADO_CAJA_CERRADA = process.env.NEXT_PUBLIC_ESTADO_CAJA_CERRADA || 'Cerrada';

export default function CajaList() {
    // Modal state
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer
    } = useModalContainer();

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [cajaEdit, setCajaEdit] = useState<Caja | undefined>(undefined);
    const { showAlert } = useAlert();
    const [cajas, setCajas] = useState<Caja[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cajaToDelete, setCajaToDelete] = useState<Caja | null>(null);
    const [cajaToOpen, setCajaToOpen] = useState<Caja | null>(null);
    const [cajaToClose, setCajaToClose] = useState<Caja | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allCajas, setAllCajas] = useState<Caja[]>([]);
    const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
    const [tiposCaja, setTiposCaja] = useState<TipoCaja[]>([]);
    const [estadosCaja, setEstadosCaja] = useState<EstadoCaja[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [puntoVentaMap, setPuntoVentaMap] = useState<Record<number, PuntoVenta>>({});
    const [tiposCajaMap, setTiposCajaMap] = useState<Record<number, TipoCaja>>({});
    const [estadosCajaMap, setEstadosCajaMap] = useState<Record<number, EstadoCaja>>({});
    const [empresasMap, setEmpresasMap] = useState<Record<number, Empresa>>({});
    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);
    const isRefreshing = useRef(false);

    const optionId = useCurrentOptionId();
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

    // Get the selected company from context
    const { selectedCompany } = useCompany();

    // Filter cajas by selected company
    const filteredCajas = useMemo(() => {
        if (!selectedCompany) return cajas;
        return cajas.filter(caja => {
            if (!caja.id_punto_venta) return false;
            const puntoVenta = puntoVentaMap[caja.id_punto_venta];
            return puntoVenta && puntoVenta.empresa_id === selectedCompany.idEmpresa;
        });
    }, [cajas, puntoVentaMap, selectedCompany]);

    // Fetch cajas
    const fetchCajas = useCallback(async (page: number = 1, search?: string) => {
        if (isLoading) return;
    
        setIsLoading(true);
        try {
            const response = await getCajas(page, 1000);
            // Store all cajas in state
            setAllCajas(response.data);
            
            // Filter cajas by selected company if any
            let filteredData = response.data;
             if (selectedCompany) {
                filteredData = response.data.filter(caja => {
                    const puntoVenta = puntoVentaMap[caja.id_punto_venta ?? 0];
                    return puntoVenta && puntoVenta.empresa_id === selectedCompany.idEmpresa;
                });
            }
            
            setCajas(filteredData);
            setTotalItems(filteredData.length);
            setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
            setCurrentPage(1); // Reset to first page when filters change
        } catch (error) {
            console.error('Error al cargar cajas:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de cajas');
            setCajas([]);
            setTotalPages(1);
            setTotalItems(0);
            setCurrentPage(1);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, showAlert, itemsPerPage, puntoVentaMap, selectedCompany]);

    // Fetch catalog data (empresas, puntos de venta, tipos de caja, estados)
    const fetchCatalogData = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // 1. Fetch Puntos de Venta
            const puntosVentaResponse = await getPuntosVenta(1, 100);
            const pvMap: Record<number, PuntoVenta> = {};
            puntosVentaResponse.data.forEach(e => {
                pvMap[e.id_punto_venta] = e;
            });
            setPuntosVenta(puntosVentaResponse.data);
            setPuntoVentaMap(pvMap);

            // 2. Fetch Tipos de Caja
            const tiposCajaResponse = await getTiposCaja(1, 100);
            const tcMap: Record<number, TipoCaja> = {};
            tiposCajaResponse.data.forEach(e => {
                tcMap[e.id_tipo_caja] = e;
            });
            setTiposCaja(tiposCajaResponse.data);
            setTiposCajaMap(tcMap);

            // 3. Fetch Estados de Caja
            const estadosCajaResponse = await getEstadosCaja(1, 100);
            const ecMap: Record<number, EstadoCaja> = {};
            estadosCajaResponse.data.forEach(e => {
                ecMap[e.id_estado_caja] = e;
            });
            setEstadosCaja(estadosCajaResponse.data);
            setEstadosCajaMap(ecMap);

            // 4. Fetch Empresas
            const empresasResponse = await getEmpresas();
            const empMap: Record<number, Empresa> = {};
            if (empresasResponse.data && Array.isArray(empresasResponse.data)) {
                empresasResponse.data.forEach((empresa: Empresa) => {
                    if (empresa && empresa.idEmpresa) {
                        empMap[empresa.idEmpresa] = empresa;
                    }
                });
                setEmpresas(empresasResponse.data);
                setEmpresasMap(empMap);
            }
            
            return true;
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            showAlert('error', 'Error', 'Error al cargar los catálogos');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);

    // Initial data load
    useEffect(() => {
        const loadInitialData = async () => {
            const catalogsLoaded = await fetchCatalogData();
            if (catalogsLoaded) {
                await fetchCajas(currentPage, searchTerm);
            }
        };
        loadInitialData();
    }, []);

    // Handle page changes and search
    useEffect(() => {
        fetchCajas(currentPage, searchTerm);
    }, [currentPage, searchTerm]);

    // Handle refresh trigger
    useEffect(() => {
        if (refreshTrigger > 0) {
            const refreshData = async () => {
                const catalogsLoaded = await fetchCatalogData();
                if (catalogsLoaded) {
                    await fetchCajas(currentPage, searchTerm);
                }
            };
            refreshData();
        }
    }, [refreshTrigger]);

    // Update cajas when selected company changes
    useEffect(() => {
        if (!selectedCompany) return;
        
        // Filter cajas by selected company
        const filtered = allCajas.filter(caja => {
            if (!caja.id_punto_venta) return false;
            const puntoVenta = puntoVentaMap[caja.id_punto_venta];
            return puntoVenta && puntoVenta.empresa_id === selectedCompany.idEmpresa;
        });
        
        setCajas(filtered);
        setTotalItems(filtered.length);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    }, [selectedCompany, allCajas, puntoVentaMap, itemsPerPage]);

    // Handlers
    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        // Reset to page 1 when search term changes
        if (value !== searchTerm) {
            setCurrentPage(1);
        }
    }, [searchTerm]);

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
        setCajaEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((caja: Caja) => {
        setCajaEdit(caja);
        setModalType("edit");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback((caja: Caja) => {
        setCajaToDelete(caja);
        setDeleteDialogOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setCajaEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState('');

    const handleConfirmDelete = async () => {
        if (!cajaToDelete?.id_caja) return;

        try {
            await deleteCaja(cajaToDelete.id_caja);
            showAlert('success', 'Éxito', 'Caja eliminada correctamente');
            refreshList();
        } catch (error: any) {
            console.error('Error al eliminar caja:', error);

            if (error.response?.status === 409) {
                setErrorDialogMessage('No se puede eliminar la caja porque tiene movimientos o asignaciones asociadas.');
            } else {
                setErrorDialogMessage(`Error al eliminar la caja: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
            setErrorDialogOpen(true);
        } finally {
            setDeleteDialogOpen(false);
            setCajaToDelete(null);
        }
    };

    // Handle open/close caja
    const onOpenCaja = useCallback((caja: Caja) => {
        setCajaToOpen(caja);
    }, []);

    const onCloseCaja = useCallback((caja: Caja) => {
        setCajaToClose(caja);
    }, []);

    const handleOpenCaja = useCallback(async (caja: Caja | null) => {
        if (!caja) return;

        setIsLoading(true);
        try {
            // Find the status by name from environment variable
            const estadoAbierta = estadosCaja.find(e =>
                e.nombre_estado_caja?.toLowerCase() === process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA?.toLowerCase()
            );

            if (!estadoAbierta) {
                throw new Error(`No se encontró el estado "${process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA}" en la configuración`);
            }

            await updateCaja(caja.id_caja, {
                id_estado_caja: estadoAbierta.id_estado_caja,
                fecha_apertura: new Date().toISOString(),
                fecha_cierre: null,
                saldo_inicial: Number(caja.saldo_inicial) || 0
            });
            showAlert('success', 'Éxito', 'Caja abierta correctamente');
            refreshList();
            setCajaToOpen(null);
        } catch (error) {
            console.error('Error al abrir caja:', error);
            showAlert(
                'error',
                'Error',
                error instanceof Error ? error.message : 'No se pudo abrir la caja'
            );
        } finally {
            setIsLoading(false);
        }
    }, [estadosCaja, refreshList, showAlert]);

    const handleCloseCaja = useCallback(async (caja: Caja | null) => {
        if (!caja) return;

        setIsLoading(true);

        try {
            // Find the status by name from environment variable
            const estadoCerrada = estadosCaja.find(e =>
                e.nombre_estado_caja?.toLowerCase() === ESTADO_CAJA_CERRADA.toLowerCase()
            );

            if (!estadoCerrada) {
                throw new Error(`No se encontró el estado "${ESTADO_CAJA_CERRADA}" en la configuración`);
            }

            await updateCaja(caja.id_caja, {
                id_estado_caja: estadoCerrada.id_estado_caja,
                fecha_cierre: new Date().toISOString()
            });
            showAlert('success', 'Éxito', 'Caja cerrada correctamente');
            refreshList();
            setCajaToClose(null);
        } catch (error) {
            console.error('Error al cerrar caja:', error);
            showAlert(
                'error',
                'Error',
                error instanceof Error ? error.message : 'No se pudo cerrar la caja'
            );
        } finally {
            setIsLoading(false);
        }
    }, [estadosCaja, refreshList, showAlert]);

    // Helper function to get status text
    const getCajaStatus = useCallback((caja: Caja) => {
        if (!caja.id_estado_caja) return 'Desconocido';
        const estado = estadosCajaMap[caja.id_estado_caja];
        return estado?.nombre_estado_caja || 'Desconocido';
    }, [estadosCajaMap]);

    // Helper function to check if caja is open
    const isCajaAbierta = useCallback((caja: Caja) => {
        if (!caja.id_estado_caja) return false;
        const estado = estadosCajaMap[caja.id_estado_caja];
        return estado?.nombre_estado_caja?.toLowerCase() === process.env.NEXT_PUBLIC_ESTADO_CAJA_ABIERTA?.toLowerCase();
    }, [estadosCajaMap]);

    // Memoized columns
    const columns = useMemo(() =>
        getCajaColumns({
            onEdit,
            onDelete,
            onOpenCaja,
            onCloseCaja,
            puntoVentaMap,
            tiposCajaMap,
            estadosCajaMap,
            empresasMap,
            canEdit,
            canDelete,
        }),
        [onEdit, onDelete, onOpenCaja, onCloseCaja, puntoVentaMap, tiposCajaMap, estadosCajaMap, empresasMap, canEdit, canDelete]
    );

    const puntoVentaOptions = useMemo(() =>
        puntosVenta.map(pv => ({
            value: pv.id_punto_venta.toString(),
            label: `${pv.nombre_punto_venta} (${empresasMap[pv.empresa_id]?.razonSocial || 'Sin empresa'})`
        })),
        [puntosVenta, empresasMap]
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
                        <h2 className="text-xl font-semibold">Lista de Cajas</h2>
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar cajas..."
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    name="search-cajas-no-autocomplete"
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={handleOpenRegisterModal}
                                variant="default"
                                className="flex items-center gap-2"
                            >
                                Nueva Caja 
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
                    ) : filteredCajas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {inputValue ? 'No se encontraron cajas que coincidan con tu búsqueda' : 'No hay cajas disponibles'}
                        </div>
                    ) : (
                        <Datatable data={filteredCajas} columns={columns} />
                    )}
                    {filteredCajas.length > 0 && !isLoading && totalPages > 1 && (
                        <MuiPagination
                            count={totalPages}
                            page={currentPage}
                            onChange={(_, value) => handlePageChange(value)}
                            showFirstButton
                            showLastButton
                            className="flex items-center gap-2"
                        />
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <CajaForm
                        caja={modalType === "edit" ? cajaEdit : undefined}
                        existingCajas={allCajas}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                )}
            </ModalContainerComponent>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta caja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la caja

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

            <AlertDialog open={!!cajaToOpen} onOpenChange={(open) => !open && setCajaToOpen(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Abrir caja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro que desea abrir esta caja? Esta acción registrará la fecha y hora actual.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cajaToOpen && handleOpenCaja(cajaToOpen)}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? 'Abriendo...' : 'Sí, abrir caja'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!cajaToClose} onOpenChange={(open) => !open && setCajaToClose(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar caja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro que desea cerrar esta caja? Esta acción registrará la fecha y hora de cierre.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cajaToClose && handleCloseCaja(cajaToClose)}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading ? 'Cerrando...' : 'Sí, cerrar caja'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        {errorDialogMessage}
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <Button
                            onClick={() => setErrorDialogOpen(false)}
                            variant="default"
                        >
                            Cerrar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
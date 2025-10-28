"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { UsuarioConEmpresa } from "@/types/usuarioConEmpresa";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import ModalContainerComponent from "@/components/modal/ModalContainer";
import CajaUsuarioForm from "./CajaUsuarioForm";
import { CajaUsuario } from "@/types/cajausuario";
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
import { getCajaUsuarioColumns } from "./columns";
import { getCajasUsuario, deleteCajaUsuario, updateCajaUsuario } from "@/services/apiCajaUsuario";
import { useAlert } from "@/contexts/AlertContext";
import { getUsuariosEmpresa } from "@/services/apiUsuarioEmpresa";
import { getPersonas } from "@/services/apiPersona";
import { getCajas } from "@/services/apiCajas";
import { getTiposCaja } from "@/services/apiTiposCaja";
import { getPuntosVenta } from "@/services/apiPuntoVenta";
import { getEmpresas } from "@/services/apiEmpresa";
import { TipoCaja } from "@/schemas/tipoCajaSchema";
import { PuntoVenta } from "@/types/puntoventa";
import { Empresa } from "@/types/empresas";
import { Combobox } from "@/components/ui/combobox";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCompany } from "@/contexts/CompanyContext";
import { Persona } from "@/types/persona";
import { Caja } from "@/types/cajas";
import { UsuarioEmpresa } from "@/types/usuarioEmpresa";
import MuiPagination from "@/components/ui/pagination";

export default function CajaUsuarioList() {
    // MODAL
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer
    } = useModalContainer();

    // Modal state
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [cajaUsuarioEdit, setCajaUsuarioEdit] = useState<CajaUsuario | undefined>(undefined);
    const { showAlert } = useAlert();
    const { selectedCompany } = useCompany();

    // Data state
    const [cajasUsuario, setCajasUsuario] = useState<CajaUsuario[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);

    // UI state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cajaUsuarioToDelete, setCajaUsuarioToDelete] = useState<CajaUsuario | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
    const [cajaUsuarioToFinalize, setCajaUsuarioToFinalize] = useState<CajaUsuario | null>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState('');

    // Refs for optimization
    const isInitialMount = useRef(true);
    const previousRefreshTrigger = useRef(refreshTrigger);
    const previousSearchTerm = useRef(searchTerm);
    const previousCurrentPage = useRef(currentPage);

    const [usuariosEmpresa, setUsuariosEmpresa] = useState<UsuarioEmpresa[]>([]);
    const [personas, setPersonas] = useState<Record<number, Persona>>({});
    const [cajas, setCajas] = useState<Caja[]>([]);
    const [tiposCaja, setTiposCaja] = useState<TipoCaja[]>([]);
    const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
    const [selectedPuntoVenta, setSelectedPuntoVenta] = useState<number | null>(null);
    const [data, setData] = useState<CajaUsuario[]>([]);
    const [selectedCaja, setSelectedCaja] = useState<number | null>(null);
    const [personasMap, setPersonasMap] = useState<Record<number, Persona>>({});
    const [usuariosMap, setUsuariosMap] = useState<Record<number, UsuarioConEmpresa>>({});

    const [hasPointsOfSale, setHasPointsOfSale] = useState<boolean | null>(null);

    // Add this ref to track if we've shown the alert
    const hasShownNoPuntosVentaAlert = useRef(false);

    // Reset the alert flag when company changes
    useEffect(() => {
        hasShownNoPuntosVentaAlert.current = false;
    }, [selectedCompany?.idEmpresa]);

    // Obtener el ID de la opción actual
    const optionId = useCurrentOptionId();

    // Verificar permisos
    const canCreate = useCheckPermission(optionId ?? 0)('crear');
    const canEdit = useCheckPermission(optionId ?? 0)('editar');
    const canDelete = useCheckPermission(optionId ?? 0)('eliminar');
    const canFinalize = useCheckPermission(optionId ?? 0)('finalizar');

    // Fetch data with useCallback to prevent recreation on every render
    const fetchCajasUsuario = useCallback(async (page: number = 1, search: string = '') => {
        if (!selectedCompany) {
            console.log('No company selected, clearing data');
            setCajas([]);
            setCajasUsuario([]);
            setTotalItems(0);
            setTotalPages(1);
            setHasPointsOfSale(null);
            return;
        }

        // Skip fetch if we've already determined there are no points of sale
        // but still allow the component to render with existing data
        if (hasPointsOfSale === false && cajasUsuario.length > 0) {
            return;
        }

        setIsLoading(true);
       

        try {
            // 1. Get company's points of sale
           
            const puntosVentaResponse = await getPuntosVenta(1, 1000);
           

            // Filter points of sale by empresa_id - ensure we're working with the data array
            const puntosVentaData = puntosVentaResponse?.data || [];
            const puntosVentaEmpresa = puntosVentaData.filter(
                (pv: PuntoVenta) => pv.empresa_id === selectedCompany.idEmpresa
            );

           

            if (puntosVentaEmpresa.length === 0) {
                

                // Only show the alert once per company selection
                if (!hasShownNoPuntosVentaAlert.current) {
                    showAlert('info', 'Sin puntos de venta', 'La empresa seleccionada no tiene puntos de venta asociados.');
                    hasShownNoPuntosVentaAlert.current = true;
                }

                setCajas([]);
                setCajasUsuario([]);
                setPuntosVenta(puntosVentaEmpresa); // Set empty array to clear any previous data
                setTotalItems(0);
                setTotalPages(1);
                setHasPointsOfSale(false);
                return;
            }

            setHasPointsOfSale(true);
            // 2. Get all cajas first
           
            const cajasResponse = await getCajas(1, 1000);
            const allCajas = cajasResponse?.data || [];

            // 3. Filter cajas by puntos de venta of the selected company
            const puntosVentaIds = puntosVentaEmpresa.map(pv => pv.id_punto_venta);
            const cajasFiltradas = allCajas.filter(caja =>
                caja.id_punto_venta && puntosVentaIds.includes(caja.id_punto_venta)
            );

           

            if (cajasFiltradas.length === 0) {
                

                // Only show alert if we actually have data to show that there are no cajas
                // and we're not already in a state with no cajas
                if (cajas.length > 0 || cajasUsuario.length > 0) {
                    showAlert('info', 'Sin cajas', 'No se encontraron cajas en los puntos de venta de esta empresa.');
                }

                setCajas([]);
                setCajasUsuario([]);
                setTotalItems(0);
                setTotalPages(1);
                return;
            }

            // 4. Get caja-usuario assignments for these cajas
           
            const response = await getCajasUsuario(1, 1000);

            // Filter assignments to only include those for our cajas
            const cajasIds = cajasFiltradas.map(c => c.id_caja);
            const cajasUsuarioFiltradas = (response?.data || []).filter((asignacion:any) =>
                cajasIds.includes(asignacion.id_caja)
            );

           

            // 5. Get related data in parallel
            const [usuariosEmpresaResponse, personasResponse, tiposCajaResponse, empresasResponse] = await Promise.all([
                getUsuariosEmpresa(1, 1000),
                getPersonas(),
                getTiposCaja(1, 1000),
                getEmpresas()
            ]);
            
               // Filter users by the selected company
            const usuariosFiltrados = selectedCompany 
                ? (usuariosEmpresaResponse?.data || []).filter(
                    (usuario: any) => usuario.idEmpresa === selectedCompany.idEmpresa
                  )
                : [];

           

            // 6. Update all states
            setCajas(cajasFiltradas);
            setCajasUsuario(cajasUsuarioFiltradas);
            setTotalItems(cajasUsuarioFiltradas.length);
            setTotalPages(Math.ceil(cajasUsuarioFiltradas.length / itemsPerPage));
            setPuntosVenta(puntosVentaEmpresa);
            setEmpresas(empresasResponse?.data || []);
            setTiposCaja(tiposCajaResponse?.data || []);

            // 7. Update maps
            const newPersonasMap: Record<number, Persona> = {};
            const newUsuariosMap: Record<number, UsuarioConEmpresa> = {};

            if (personasResponse?.data?.length) {
                personasResponse.data.forEach((persona: Persona) => {
                    if (persona?.idPersona) {
                        newPersonasMap[persona.idPersona] = persona;
                    }
                });
            }
           if (usuariosFiltrados.length > 0) {
                usuariosFiltrados.forEach((usuarioEmpresa: any) => {
                    if (usuarioEmpresa?.idUsuarioEmpresa) {
                        // Map the usuario-empresa data to match the Usuario type expected by the table
                        newUsuariosMap[usuarioEmpresa.idUsuarioEmpresa] = {
                            id: usuarioEmpresa.idUsuarioEmpresa,
                            idPersona: usuarioEmpresa.idPersona,
                            username: usuarioEmpresa.username,
                            email: usuarioEmpresa.email || '', // Add default value for required fields
                            tipo_usuario: 'empresa', // Default value
                            estaActivo: true, // Default value
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            // UsuarioEmpresa properties
                            id_persona: usuarioEmpresa.idPersona,
                            id_empresa: usuarioEmpresa.idEmpresa,
                            id_usuario: usuarioEmpresa.idUsuario,
                            id_sistema: usuarioEmpresa.idSistema,
                            password_hash: usuarioEmpresa.password_hash || ''
                        };
                    }
                });
            }

            setPersonasMap(newPersonasMap);
            setUsuariosMap(newUsuariosMap);

        } catch (error) {
           
            showAlert('error', 'Error', 'Error al cargar los datos de cajas y asignaciones');
        } finally {
            setIsLoading(false);
        }
    }, [selectedCompany, itemsPerPage, showAlert]);

    // Effect for data fetching with debounce
    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            fetchCajasUsuario(currentPage, searchTerm).catch(console.error);
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [currentPage, searchTerm, selectedCompany, fetchCajasUsuario]);

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

    // Modal handlers
    const handleOpenRegisterModal = useCallback(() => {
        setCajaUsuarioEdit(undefined);
        setModalType("register");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const handleOpenEditModal = useCallback((cajaUsuario: CajaUsuario) => {
        setCajaUsuarioEdit(cajaUsuario);
        setModalType("edit");
        setShowModalContainer(true);
    }, [setShowModalContainer]);

    const onEdit = handleOpenEditModal;

    const onDelete = useCallback(
        (cajaUsuario: CajaUsuario) => {
            setCajaUsuarioToDelete(cajaUsuario);
            setDeleteDialogOpen(true);
        },
        []
    );

    const handleFinalizeClick = useCallback((cajaUsuario: CajaUsuario) => {
        setCajaUsuarioToFinalize(cajaUsuario);
        setFinalizeDialogOpen(true);
        return Promise.resolve();
    }, []);

    const handleConfirmFinalize = useCallback(async () => {
        if (!cajaUsuarioToFinalize) return;

        setIsFinalizing(true);
        try {
            // Create a new object with only the fields that should be updated
            const updateData = {
                id_caja: cajaUsuarioToFinalize.id_caja,
                id_usuario: cajaUsuarioToFinalize.id_usuario,
                fecha_termino: new Date().toISOString()
            };

            // Call the API to update the caja usuario
            await updateCajaUsuario(cajaUsuarioToFinalize.id_asignacion, updateData);

            showAlert('success', 'Éxito', 'Asignación finalizada correctamente');
            // Refresh the list to show the updated data
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error finalizando asignación:', error);
            setErrorDialogMessage('Error al finalizar la asignación');
            setErrorDialogOpen(true);
        } finally {
            setIsFinalizing(false);
            setFinalizeDialogOpen(false);
            setCajaUsuarioToFinalize(null);
        }
    }, [cajaUsuarioToFinalize, showAlert]);

    const handleConfirmDelete = async () => {
        if (!cajaUsuarioToDelete?.id_asignacion) return;

        try {
            await deleteCajaUsuario(cajaUsuarioToDelete.id_asignacion);
            showAlert('success', 'Éxito', 'Asignación de caja eliminada exitosamente');
            refreshList();
        } catch (error: any) {
            console.error('Error al eliminar asignación de caja:', error);

            if (error.response?.status === 409) {
                setErrorDialogMessage('No se puede eliminar la asignación de caja porque tiene movimientos asociados.');
            } else {
                setErrorDialogMessage(`Error al eliminar la asignación de caja: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
            setErrorDialogOpen(true);
        } finally {
            setDeleteDialogOpen(false);
            setCajaUsuarioToDelete(null);
        }
    };


    const cajasMap = useMemo(() => {
        const map: Record<number, Caja> = {};
        cajas.forEach(caja => {
            if (caja.id_caja) {
                map[caja.id_caja] = caja;
            }
        });
        return map;
    }, [cajas]);

    const tiposCajaMap = useMemo(() =>
        tiposCaja.reduce<Record<number, TipoCaja>>((acc, tipo) => {
            if (tipo?.id_tipo_caja) {
                acc[tipo.id_tipo_caja] = tipo;
            }
            return acc;
        }, []),
        [tiposCaja]
    );

    const puntosVentaMap = useMemo(() =>
        puntosVenta.reduce<Record<number, PuntoVenta>>((acc, pv) => {
            if (pv?.id_punto_venta) {
                acc[pv.id_punto_venta] = pv;
            }
            return acc;
        }, []),
        [puntosVenta]
    );

    const empresasMap = useMemo(() =>
        empresas.reduce<Record<number, Empresa>>((acc, emp) => {
            if (emp?.idEmpresa) {
                acc[emp.idEmpresa] = emp;
            }
            return acc;
        }, []),
        [empresas]
    );

    const empresaOptions = useMemo(() =>
        empresas.map(emp => ({
            value: emp.idEmpresa.toString(),
            label: emp.razonSocial
        })),
        [empresas]
    );

    const puntosVentaFiltrados = useMemo(() =>
        selectedEmpresa
            ? puntosVenta.filter(pv => pv.empresa_id === selectedEmpresa)
            : puntosVenta,
        [puntosVenta, selectedEmpresa]
    );

    const puntoVentaOptionsFiltrados = useMemo(() =>
        puntosVentaFiltrados.map(pv => ({
            value: pv.id_punto_venta.toString(),
            label: `${pv.nombre_punto_venta} (${empresas.find(e => e.idEmpresa === pv.empresa_id)?.razonSocial || 'Sin empresa'})`
        })),
        [puntosVentaFiltrados, empresas]
    );

    const dataFiltrada = useMemo(() => {
        let result = [...cajasUsuario];
        if (selectedCaja) {
            result = result.filter(item => item.id_caja === selectedCaja);
        }
        return result;
    }, [cajasUsuario, selectedCaja]);

    useEffect(() => {
        const fetchAdditionalData = async () => {
            try {
                const [tiposData, puntosData, empresasData] = await Promise.all([
                    getTiposCaja(1, 1000),
                    getPuntosVenta(1, 1000),
                    getEmpresas()
                ]);

                setTiposCaja(tiposData.data);
                setPuntosVenta(puntosData.data);
                setEmpresas(empresasData.data);
            } catch (error) {
                console.error('Error fetching additional data:', error);
                setErrorDialogMessage('Error al cargar los datos adicionales');
                setErrorDialogOpen(true);
            }
        };

        fetchAdditionalData();
    }, [showAlert]);

    const columns = useMemo(() => getCajaUsuarioColumns({
        onEdit: onEdit,
        onDelete: onDelete,
        onFinalize: handleFinalizeClick,
        usuariosMap,
        personasMap,
        cajasMap,
        tiposCajaMap,
        puntosVentaMap,
        empresasMap,
        canEdit,
        canDelete,
        canFinalize
    }), [usuariosMap, personasMap, cajasMap, tiposCajaMap, puntosVentaMap, empresasMap, canEdit, canDelete, canFinalize]);

    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setCajaUsuarioEdit(undefined);
        setShowModalContainer(false);
    }, [setShowModalContainer]);

    if (hasPointsOfSale === false) {
        return (
            <div className="p-4 text-center text-gray-500">
                La empresa seleccionada no tiene puntos de venta asociados.
            </div>
        );
    }

    return (
        <>
            <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-semibold">Asignaciones de Caja</h2>
                        <div className="flex-1 mx-4 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6 7-7" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por ID de caja o usuario..."
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    name="search-cajausuario-no-autocomplete"
                                    disabled={isModalOpen}
                                    className={`w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm ${isModalOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={handleOpenRegisterModal}
                                className="flex items-center gap-2"
                            >
                                Nueva Asignación
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
                    ) : cajasUsuario.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron asignaciones que coincidan con tu búsqueda' : 'No hay asignaciones de caja disponibles'}
                        </div>
                    ) : (
                        <Datatable data={dataFiltrada} columns={columns} />
                    )}
                    {cajasUsuario.length > 0 && !isLoading && (
                        <div className="mt-6 flex justify-center">
                            <MuiPagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_, value) => handlePageChange(value)}
                                showFirstButton
                                showLastButton
                                className="flex items-center gap-2"
                            />
                        </div>
                    )}
                </AdminCardLayout.Content>
            </AdminCardLayout>

            {/* Modal para crear/editar asignación de caja */}
            <ModalContainerComponent onClose={handleCloseModal}>
                {(modalType === "register" || modalType === "edit") && (
                    <CajaUsuarioForm
                        cajaUsuario={modalType === "edit" ? cajaUsuarioEdit : undefined}
                        onSuccess={() => {
                            handleCloseModal();
                            refreshList();
                        }}
                        closeModal={handleCloseModal}
                    />
                )}
            </ModalContainerComponent>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta asignación de caja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la asignación de caja

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

            {/* Finalize Confirmation Dialog */}
            <AlertDialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Finalizar asignación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas finalizar esta asignación? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isFinalizing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmFinalize}
                            disabled={isFinalizing}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isFinalizing ? 'Finalizando...' : 'Sí, finalizar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error Dialog */}
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
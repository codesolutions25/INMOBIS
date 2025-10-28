"use client"

import { Combobox } from "@/components/ui/combobox";
import { getCajas } from "@/services/apiCajas";
import { getCajasUsuario } from "@/services/apiCajaUsuario";
import { Caja } from "@/types/cajas";
import { CajaUsuario } from "@/types/cajausuario";
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useAlert } from "@/contexts/AlertContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, RefreshCw, Loader2, X, Lock, LockOpen } from "lucide-react"
import Datatable from "@/components/table/datatable"
import { getCajaMovimientoColumns } from "./columns"
import {
  getCajaMovimientos,
  createCajaMovimiento,
  updateCajaMovimiento,
  deleteCajaMovimiento,
} from "@/services/apiCajaMovimientos"
import CajaMovimientosForm from "./CajaMovimientosForm"
import ModalContainerComponent from "@/components/modal/ModalContainer"
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
import { AdminCardLayout } from "@/layouts/AdminCardLayout"
import { CajaMovimiento } from "@/types/cajamovimientos"
import { TipoMovimiento } from "@/types/tiposmovimiento"
import { getTiposMovimiento } from "@/services/apiTiposMovimiento"
import { TipoOperacion } from "@/types/tiposoperacion";
import { getTiposOperacion } from "@/services/apiTiposOperacion";
import { getTiposCaja } from "@/services/apiTiposCaja";
import { TipoCaja } from "@/types/tiposcaja";
import { updateCaja } from "@/services/apiCajas";
import { CajaMovimientosModal } from './CajaMovimientosModal';
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCompany } from "@/contexts/CompanyContext";
import { PuntoVenta } from "@/types/puntoventa";
import { getPuntosVenta } from "@/services/apiPuntoVenta";
import MuiPagination from "@/components/ui/pagination";
import { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/contexts/AuthContext";

interface CajaMovimientosListProps {
  cajaType?: 'central' | 'ejecutiva' | 'chica';
  tipoCajaId?: number | null;
}

// Add this helper function before the component
const isAfterFirstDayOfNextYear = (date: Date): boolean => {
  const nextYear = new Date().getFullYear() + 1;
  const firstDayOfNextYear = new Date(nextYear, 0, 1); // Month is 0-indexed, so 0 = January
  return date >= firstDayOfNextYear;
};

export default function CajaMovimientosList({ cajaType, tipoCajaId }: CajaMovimientosListProps) {

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null)
  const [movimientoEdit, setMovimientoEdit] = useState<CajaMovimiento | undefined>(undefined)
  const { showAlert } = useAlert()
  const [movimientos, setMovimientos] = useState<CajaMovimiento[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [allMovementsData, setAllMovementsData] = useState<CajaMovimiento[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])
  const [tiposMovimientoMap, setTiposMovimientoMap] = useState<Record<number, TipoMovimiento>>({})
  const [tiposOperacionMap, setTiposOperacionMap] = useState<Record<number, TipoOperacion>>({})
  const [tiposOperacion, setTiposOperacion] = useState<{ value: number, label: string }[]>([]);
  const [tiposCaja, setTiposCaja] = useState<TipoCaja[]>([]);
  const [tiposCajaMap, setTiposCajaMap] = useState<Record<number, TipoCaja>>({});
  const itemsPerPage = 10
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [movimientoToDelete, setMovimientoToDelete] = useState<CajaMovimiento | null>(null)
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<number | null>(null);
  const [selectedTipoCaja, setSelectedTipoCaja] = useState<number | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedCajaDetails, setSelectedCajaDetails] = useState<Caja | null>(null);
  // Add this with the other state declarations near the top of the component
  const [isCajaAbierta, setIsCajaAbierta] = useState<boolean>(false);
  const [showCloseCajaDialog, setShowCloseCajaDialog] = useState<boolean>(false);
  const [cajaToClose, setCajaToClose] = useState<Caja | null>(null);
  const [userCajas, setUserCajas] = useState<Caja[]>([]);
  const { user } = useAuth();

  const optionId = useCurrentOptionId();
  const canCreate = useCheckPermission(optionId ?? 0)('crear');
  const canEdit = useCheckPermission(optionId ?? 0)('editar');
  const canDelete = useCheckPermission(optionId ?? 0)('eliminar');

  const { selectedCompany } = useCompany();
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [puntosVentaMap, setPuntosVentaMap] = useState<Record<number, PuntoVenta>>({});

  // New filter states
  const [filters, setFilters] = useState({
    id_caja_destino: null as number | null,
    id_tipo_operacion: null as number | null,
    estado: null as number | null,
    id_tipo_caja: tipoCajaId || null
  });

  // Map caja types to their display names
  const cajaTypeNames = {
    central: 'Central',
    ejecutiva: 'Ejecutiva',
    chica: 'Chica'
  };

  // Get the display name for the current caja type
  const cajaTypeDisplay = cajaType ? cajaTypeNames[cajaType] : '';

  // Keep the filteredMovimientos for summary cards
  const filteredMovimientos = useMemo(() => {
    if (!allMovementsData || allMovementsData.length === 0) return [];

    return allMovementsData.filter(movimiento => {
      const cajaMovimiento = cajas.find(c => c.id_caja === movimiento.id_caja);
      
      // If no caja found for this movimiento, exclude it
      if (!cajaMovimiento) return false;
      
      // If a company is selected, filter by company
      if (selectedCompany) {
        const puntoVenta = cajaMovimiento.id_punto_venta ? puntosVentaMap[cajaMovimiento.id_punto_venta] : null;
        if (!puntoVenta || puntoVenta.empresa_id !== selectedCompany.idEmpresa) {
          return false;
        }
      }

      // Filter by caja if selected
      if (selectedCaja !== null && movimiento.id_caja !== selectedCaja) {
        return false;
      }

      // Filter by tipo de caja if selected
      if (filters.id_tipo_caja !== null) {
        if (!cajaMovimiento || cajaMovimiento.id_tipo_caja !== filters.id_tipo_caja) {
          return false;
        }
      }

      // Apply search term filter if it exists
      if (searchTerm && searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch =
          (movimiento.descripcion_movimiento?.toLowerCase().includes(searchLower)) ||
          (movimiento.referencia_externa?.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Other filters...
      if (filters.id_tipo_operacion !== null) {
        if (movimiento.id_tipo_operacion !== filters.id_tipo_operacion) {
          return false;
        }
      }

      if (filters.estado !== null) {
        if (movimiento.estado !== filters.estado) {
          return false;
        }
      }


      return true;
    });
  }, [allMovementsData, selectedCompany, selectedCaja, searchTerm, filters, cajas, puntosVentaMap]);

  // Calculate paginated data from filteredMovimientos
  const paginatedMovimientos = useMemo(() => {
    if (!filteredMovimientos) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMovimientos.slice(startIndex, endIndex);
  }, [filteredMovimientos, currentPage, itemsPerPage]);

  // Update table data to use filtered and paginated data
  const tableData = useMemo(() => {
    return paginatedMovimientos.map(mov => ({
      ...mov,
      fecha: mov.fecha_movimiento,
      tipo_operacion: tiposOperacionMap[mov.id_tipo_operacion]?.nombreTipoOperacion || 'Desconocido',
      caja_origen: cajas.find(c => c.id_caja === mov.id_caja)?.nombre_caja || 'Desconocida',
      tipo_caja: cajas.find(c => c.id_caja === mov.id_caja)?.id_tipo_caja
        ? tiposCajaMap[cajas.find(c => c.id_caja === mov.id_caja)?.id_tipo_caja!]?.nombre_tipo_caja || 'Desconocido'
        : 'Desconocido',
      caja_destino: mov.id_caja_destino ? (cajas.find(c => c.id_caja === mov.id_caja_destino)?.nombre_caja || 'Desconocida') : 'N/A',
      estado: mov.estado === 1 ? 'Aprobado' : 'Pendiente',
      acciones: mov
    }));
  }, [paginatedMovimientos, tiposOperacionMap, cajas, tiposCajaMap]);

  // Update total items and pages based on filtered data
  const totalFilteredItems = filteredMovimientos?.length || 0;
  const totalFilteredPages = Math.ceil(totalFilteredItems / itemsPerPage);

  // Fetch movement types
  const fetchTiposMovimiento = useCallback(async () => {
    try {
      const response = await getTiposMovimiento(1, 100);

      if (!response || !response.data) {
        console.error('Invalid response format:', response);
        return;
      }

      // Ensure we have the expected data structure
      const tiposData = Array.isArray(response.data) ? response.data : [];

      setTiposMovimiento(tiposData);

      // Create a map for quick lookup
      const map = tiposData.reduce((acc: Record<number, TipoMovimiento>, tipo) => {
        if (tipo && typeof tipo.id_tipo_movimiento === 'number') {
          acc[tipo.id_tipo_movimiento] = tipo;
        } else {
          console.warn('Invalid tipo_movimiento data:', tipo);
        }
        return acc;
      }, {});

      setTiposMovimientoMap(map);
    } catch (error) {
      console.error('Error fetching movement types:', error);
      showAlert('error', 'Error', 'No se pudieron cargar los tipos de movimiento');
    }
  }, [showAlert]);

  // Fetch tipos de operación
  useEffect(() => {
    const fetchTiposOperacion = async () => {
      try {
        // Fetch all tipos de operación without pagination
        const response = await getTiposOperacion(1, 100); // Fetch up to 100 records to ensure we get all types
        const map = response.data.reduce((acc: Record<number, TipoOperacion>, tipo) => {
          acc[tipo.idTipoOperacion] = tipo;
          return acc;
        }, {});

        setTiposOperacionMap(map);
      } catch (error) {
        console.error('Error fetching tipos de operación:', error);
        showAlert('error', 'Error', 'No se pudieron cargar los tipos de operación');
      }
    };

    fetchTiposOperacion();
  }, [showAlert]);

  useEffect(() => {
    const fetchTiposOperacion = async () => {
      try {
        const response = await getTiposOperacion(1, 100); // Fetch first 100 operation types
        const tipos = response.data.map(tipo => ({
          value: tipo.idTipoOperacion,
          label: tipo.nombreTipoOperacion
        }));
        setTiposOperacion(tipos);
      } catch (error) {
        console.error('Error fetching tipos de operación:', error);
        showAlert('error', 'Error', 'No se pudieron cargar los tipos de operación');
      }
    };

    fetchTiposOperacion();
  }, [showAlert]);

  // Fetch tipos de caja
  useEffect(() => {
    const fetchTiposCaja = async () => {
      try {
        const response = await getTiposCaja(1, 100); // Obtener hasta 100 tipos de caja
        setTiposCaja(response.data);

        // Crear un mapa para búsqueda rápida
        const map = response.data.reduce((acc: Record<number, TipoCaja>, tipo) => {
          acc[tipo.id_tipo_caja] = tipo;
          return acc;
        }, {});

        setTiposCajaMap(map);
      } catch (error) {
        console.error('Error al cargar tipos de caja:', error);
        showAlert('error', 'Error', 'No se pudieron cargar los tipos de caja');
      }
    };

    fetchTiposCaja();
  }, [showAlert]);


  // Estados para almacenar los IDs de estado
  const [estadoAbiertaId, setEstadoAbiertaId] = useState<number>(1);
  const [estadoCerradaId, setEstadoCerradaId] = useState<number>(2);

  // Obtener los IDs de estado desde la API
  useEffect(() => {
    const fetchEstadosCaja = async () => {
      try {
        // Obtener estado 'Abierta'
        const responseAbierta = await fetch('api/proxy?service=estado_caja_abierta');
        if (responseAbierta.ok) {
          const dataAbierta = await responseAbierta.json();
          setEstadoAbiertaId(dataAbierta.data[0]?.id_estado_caja || 1);
        }

        // Obtener estado 'Cerrada'
        const responseCerrada = await fetch('api/proxy?service=estado_caja_cerrada');
        if (responseCerrada.ok) {
          const dataCerrada = await responseCerrada.json();
          setEstadoCerradaId(dataCerrada.data[0]?.id_estado_caja || 2);
        }
      } catch (error) {
        console.error('Error al obtener los estados de caja:', error);
      }
    };

    fetchEstadosCaja();
  }, []);

  // Actualizar isCajaAbierta cuando cambia la caja seleccionada o los estados
  useEffect(() => {
    if (selectedCaja) {
      const caja = cajas.find(c => c.id_caja === selectedCaja);
      setSelectedCajaDetails(caja || null);
      setIsCajaAbierta(caja?.id_estado_caja === estadoAbiertaId);
    } else {
      setSelectedCajaDetails(null);
      setIsCajaAbierta(false);
    }
  }, [selectedCaja, cajas, estadoAbiertaId, estadoCerradaId]);



  // Initial data load
  // Efecto para cargar los datos iniciales
  // Efecto principal para cargar datos
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // 1. Cargar tipos de movimiento
        await fetchTiposMovimiento();

        // 2. Cargar datos de la tabla
        const [tableResponse, allDataResponse] = await Promise.all([
          getCajaMovimientos(
            currentPage,
            itemsPerPage,
            searchTerm || undefined,
            selectedCaja || undefined,
            filters.id_tipo_operacion || undefined,
            filters.estado !== null ? filters.estado : undefined,
            filters.id_tipo_caja?.toString() || undefined
          ),
          getCajaMovimientos(
            1,
            10000,
            searchTerm || undefined,
            selectedCaja || undefined,
            filters.id_tipo_operacion || undefined,
            filters.estado !== null ? filters.estado : undefined,
            filters.id_tipo_caja?.toString() || undefined
          )
        ]);

        if (isMounted) {
          setMovimientos(tableResponse.data);
          setTotalItems(tableResponse.meta.total);
          setTotalPages(Math.ceil(tableResponse.meta.total / itemsPerPage));
          setAllMovementsData(allDataResponse.data);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        showAlert('error', 'Error', 'No se pudieron cargar los datos');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedCaja,
    filters,
    refreshTrigger,
    showAlert,
    fetchTiposMovimiento
  ]);
  // Fetch cajas for the filter
  const fetchCajas = useCallback(async () => {
    try {
      let filteredCajas: Caja[] = [];
      
      // If user is a company user, fetch their assigned cajas
      if (user?.tipo_usuario === 'company' && user.id) {
        try {
          // Get user's caja assignments
          const cajasUsuarioResponse = await getCajasUsuario(1, 1000);
         
          const currentDate = new Date();
          
          // Filter for active assignments
          const activeAssignments = cajasUsuarioResponse.data.filter((asignacion: CajaUsuario) => {
            const asignacionDate = new Date(asignacion.fecha_asignacion || 0);
            const terminoDate = asignacion.fecha_termino ? new Date(asignacion.fecha_termino) : null;
            
            return asignacion.id_usuario === user.id  && 
                   (!terminoDate || currentDate <= terminoDate);
          });
         
          // Get the list of caja IDs the user is assigned to
          const assignedCajaIds = activeAssignments.map((asignacion: CajaUsuario) => asignacion.id_caja);
          
          if (assignedCajaIds.length > 0) {
            // Fetch all cajas and filter by assigned ones
            const response = await getCajas(1, 100);
            filteredCajas = response.data.filter((caja: Caja) => 
              caja.id_caja && assignedCajaIds.includes(caja.id_caja)
            );
          }
          
          setUserCajas(filteredCajas);
        } catch (error) {
          console.error('Error fetching user caja assignments:', error);
        }
      } else {
        // For non-company users, show all cajas with company filter
        const response = await getCajas(1, 100);
        filteredCajas = response.data;
        
        if (selectedCompany) {
          // Get punto_venta_ids that belong to the selected company
          const puntoVentaIds = puntosVenta
            .filter(pv => pv.empresa_id === selectedCompany.idEmpresa)
            .map(pv => pv.id_punto_venta);
          
          // Filter cajas that belong to these punto_venta_ids
          filteredCajas = filteredCajas.filter((caja: Caja) => 
            caja.id_punto_venta && puntoVentaIds.includes(caja.id_punto_venta)
          );
        }
        
        setUserCajas(filteredCajas);
      }
      
      setCajas(filteredCajas);
    } catch (error) {
      console.error('Error fetching cajas:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las cajas');
    }
  }, [selectedCompany, puntosVenta, user]);

  // Update selected caja details when selectedCaja changes
  useEffect(() => {
    if (selectedCaja) {
      const caja = cajas.find(c => c.id_caja === selectedCaja);
      setSelectedCajaDetails(caja || null);
    } else {
      setSelectedCajaDetails(null);
    }
  }, [selectedCaja, cajas]);

  // Handle open caja
  const handleOpenCaja = async () => {
    if (!selectedCaja) return;

    try {
      setIsLoading(true);
      await updateCaja(selectedCaja, {
        id_estado_caja: 1, // Assuming 1 is the ID for 'Abierta',
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: null
      });

      showAlert('success', 'Éxito', 'Caja abierta correctamente');
      // Refresh cajas to update the status
      const response = await getCajas(1, 100);
      setCajas(response.data);
    } catch (error) {
      console.error('Error al abrir caja:', error);
      showAlert('error', 'Error', 'No se pudo abrir la caja');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCajaChange = useCallback((value: string | number | null) => {

    // Convert empty string to null, otherwise convert to number
    const newValue = value === '' || value === null ? null : Number(value);
    setSelectedCaja(newValue);
    setCurrentPage(1); 
  }, []);

  // Handle close caja
  const handleCloseCaja = async () => {
    if (!cajaToClose) return;

    try {
      // Check if caja is of type 'chica' or 'principal' (central)
      const isRestrictedType = cajaType === 'chica' || cajaType === 'central';

      if (isRestrictedType && !isAfterFirstDayOfNextYear(new Date())) {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        showAlert('error', 'Error', `Las cajas de tipo ${cajaType} solo pueden cerrarse a partir del 1 de enero de ${nextYear}`);
        return;
      }

      setIsLoading(true);
      await updateCaja(cajaToClose.id_caja, {
        id_estado_caja: 2, // Assuming 2 is the ID for 'Cerrada',
        fecha_cierre: new Date().toISOString()
      });

      showAlert('success', 'Éxito', 'Caja cerrada correctamente');

      // Reset all filters except the selected caja type
      setFilters(prevFilters => ({
        ...prevFilters,
        id_caja_destino: null,
        id_tipo_operacion: null,
        estado: null,
        // Keep the id_tipo_caja filter
      }));

      // Refresh cajas to update the status
      const response = await getCajas(1, 100);
      setCajas(response.data);
      setCajaToClose(null);
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      showAlert('error', 'Error', 'No se pudo cerrar la caja');
    } finally {
      setIsLoading(false);
      setShowCloseCajaDialog(false);
    }
  };

  // Add this function to handle the close button click
  const handleCloseCajaClick = (caja: Caja) => {
    // Reset search input and filters
    setSearchTerm('');
    setInputValue('');
    setFilters(prevFilters => ({
      ...prevFilters,
      id_caja_destino: null,
      id_tipo_operacion: null,
      estado: null,
      // Keep the id_tipo_caja filter
    }));

    setCajaToClose(caja);
    setShowCloseCajaDialog(true);
  };

  // Filter cajas for the combobox based on tipoCajaId and user type
  const filteredCajas = useMemo(() => {
    // For company users, only show their assigned cajas
    const sourceCajas = user?.tipo_usuario === 'empresa' ? userCajas : cajas;
    
    if (!tipoCajaId) return sourceCajas;
    return sourceCajas.filter(caja => caja.id_tipo_caja === tipoCajaId);
  }, [cajas, tipoCajaId, user?.tipo_usuario, userCajas]);

  // Handle search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(handler)
  }, [inputValue])

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // Reemplaza la función existente con:
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Establecer nuevo timeout
    const timeout = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  const refreshList = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    setCurrentPage(1)
  }, [])

  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchTerm('');
    setCurrentPage(1);

  }, []);

  const handleOpenRegisterModal = useCallback(() => {
    if (!selectedCaja) {
      showAlert('warning', 'Advertencia', 'Por favor seleccione una caja primero');
      return;
    }
    setMovimientoEdit(undefined);
    setModalType("register");
    setIsModalOpen(true);
  }, [selectedCaja, showAlert]);

  const handleOpenEditModal = useCallback((movimiento: CajaMovimiento) => {
    console.log('Opening edit modal for movimiento:', movimiento);
    setMovimientoEdit(movimiento);
    setModalType("edit");
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Small delay to allow the modal to close before resetting the form
    setTimeout(() => {
      setModalType(null);
      setMovimientoEdit(undefined);
    }, 300);
  }, []);

  const handleDeleteMovimiento = useCallback((movimiento: CajaMovimiento) => {
    setMovimientoToDelete(movimiento);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!movimientoToDelete) return;

    try {
      setIsLoading(true);
      await deleteCajaMovimiento(movimientoToDelete.id_movimiento || 0);
      showAlert('success', 'Éxito', 'Movimiento eliminado correctamente');
      refreshList();
    } catch (error) {
      console.error('Error deleting movimiento:', error);
      showAlert('error', 'Error', 'No se pudo eliminar el movimiento');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setMovimientoToDelete(null);
    }
  }, [movimientoToDelete, showAlert, refreshList]);

  const handleApproveMovimiento = useCallback(async (movimiento: CajaMovimiento) => {
    if (!movimiento?.id_movimiento) return;

    try {
      setIsLoading(true);

      // Update the movimiento status to approved
      await updateCajaMovimiento(movimiento.id_movimiento, {

        estado: 1 // Assuming 1 is the approved status code
      });

      showAlert('success', 'Éxito', 'Movimiento aprobado correctamente');
      refreshList();
    } catch (error) {
      console.error('Error approving movimiento:', error);
      showAlert('error', 'Error', 'No se pudo aprobar el movimiento');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, refreshList]);


  interface CajaMovimientoTableData extends Omit<CajaMovimiento, 'fecha_movimiento' | 'id_caja' | 'id_caja_destino' | 'id_tipo_operacion' | 'estado'> {
    fecha: string;
    tipo_operacion: string;
    caja_origen: string;
    tipo_caja: string;
    caja_destino: string;
    estado: string;
    acciones: CajaMovimiento;
  }

  const columns = getCajaMovimientoColumns({
    onEdit: handleOpenEditModal,
    onDelete: handleDeleteMovimiento,
    onApprove: handleApproveMovimiento,
    tiposMovimientoMap,
    tiposOperacionMap,
    cajas,
    canEdit,
    canDelete,
  }) as ColumnDef<CajaMovimientoTableData>[];
 
  // Reset to first page when filters change
  useEffect(() => {

    setCurrentPage(1);
  }, [searchTerm, selectedCaja, filters]);

  // Add filter handlers
  const handleFilterChange = useCallback((filterName: string, value: number | null) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCaja(null);
    setSearchTerm('');
    setInputValue('');
    setFilters({
      id_caja_destino: null,
      id_tipo_operacion: null,
      estado: null,
      id_tipo_caja: null
    });
    setCurrentPage(1);
    // No necesitamos forzar un refresh aquí porque el cambio en los filtros
    // ya disparará el efecto principal que carga los datos
  }, []);

  const handleTipoOperacionChange = useCallback((value: string | number | null) => {
    setFilters(prev => ({
      ...prev,
      id_tipo_operacion: value ? Number(value) : null
    }));
    setCurrentPage(1);
    // No necesitamos forzar un refresh aquí porque el cambio en los filtros
    // ya disparará el efecto principal que carga los datos
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setFilters(prev => ({
      ...prev,
      estado: value
    }));
    setCurrentPage(1);
  }, []);

  const handleTipoCajaChange = useCallback((value: string | number | null) => {
    const newValue = value === '' || value === null ? null : Number(value);
    setFilters(prev => ({
      ...prev,
      id_tipo_caja: newValue
    }));
    setCurrentPage(1);
    // No necesitamos forzar un refresh aquí porque el cambio en los filtros
    // ya disparará el efecto principal que carga los datos
  }, []);

  // Format number with 2 decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Fetch puntos de venta
  const fetchPuntosVenta = useCallback(async () => {
    try {
      // First, fetch all puntos de venta
      const response = await getPuntosVenta(1, 1000);
      let puntosVentaData = response?.data || [];
      
      // Filter puntos de venta by selected company on the client side
      if (selectedCompany) {
        puntosVentaData = puntosVentaData.filter(pv => pv.empresa_id === selectedCompany.idEmpresa);
      }
      
      setPuntosVenta(puntosVentaData);
      
      // Create a map for quick lookup
      const map: Record<number, PuntoVenta> = {};
      puntosVentaData.forEach(pv => {
        if (pv.id_punto_venta) {
          map[pv.id_punto_venta] = pv;
        }
      });
      setPuntosVentaMap(map);
    } catch (error) {
      console.error('Error fetching puntos de venta:', error);
      showAlert('error', 'Error', 'No se pudieron cargar los puntos de venta');
      setPuntosVenta([]);
      setPuntosVentaMap({});
    }
  }, [selectedCompany, showAlert]);

  useEffect(() => {
    fetchPuntosVenta();
  }, [fetchPuntosVenta]);

  useEffect(() => {
    if (puntosVenta.length > 0) {
     

      fetchCajas();
    } else {
      setCajas([]);
      setSelectedCaja(null);
    }
  }, [puntosVenta, showAlert]);

  // Reset selected caja when company changes
  useEffect(() => {
    setSelectedCaja(null);
  }, [selectedCompany]);

  // Confirmation Dialog for Closing Caja
  return (
    <>
      <CajaMovimientosModal
        isOpen={showCloseCajaDialog}
        onOpenChange={setShowCloseCajaDialog}
        onConfirm={handleCloseCaja}
        filteredMovimientos={filteredMovimientos}
        tiposOperacionMap={tiposOperacion}  
        isLoading={isLoading}
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <AdminCardLayout.Title>
            <h1 className="text-2xl font-bold">Movimientos de Caja</h1>
          </AdminCardLayout.Title>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Balance */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-500">Saldo Total</div>
            <div className="text-2xl font-bold">
              S/ {formatCurrency(
                filteredMovimientos.reduce((acc, movimiento) => {
                  const tipoOperacion = tiposOperacionMap[movimiento.id_tipo_operacion];
                  const isIngreso = tipoOperacion?.nombreTipoOperacion === 'Ingreso';
                  const isEgreso = tipoOperacion?.nombreTipoOperacion === 'Egreso';
                  const amount = Number(movimiento.monto || 0);
                  return acc + (isIngreso ? amount : (isEgreso ? -amount : 0));
                }, 0)
              )}
            </div>
          </div>

          {/* Total Ingresos */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-500">Total Ingresos</div>
            <div className="text-xl font-semibold text-green-600">
              + S/ {formatCurrency(filteredMovimientos.reduce((acc, movimiento) => {
                const tipoOperacion = tiposOperacionMap[movimiento.id_tipo_operacion];
                const isIngreso = tipoOperacion?.nombreTipoOperacion === 'Ingreso';
                return acc + (isIngreso ? Number(movimiento.monto || 0) : 0);
              }, 0))}
            </div>
          </div>

          {/* Total Egresos */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-sm font-medium text-gray-500">Total Egresos</div>
            <div className="text-xl font-semibold text-red-600">
              - S/ {formatCurrency(filteredMovimientos.reduce((acc, movimiento) => {
                const tipoOperacion = tiposOperacionMap[movimiento.id_tipo_operacion];
                const isEgreso = tipoOperacion?.nombreTipoOperacion === 'Egreso';
                return acc + (isEgreso ? Number(movimiento.monto || 0) : 0);
              }, 0))}
            </div>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar el movimiento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el movimiento #{movimientoToDelete?.id_movimiento}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AdminCardLayout>
          <AdminCardLayout.Title>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">
                Lista de Movimientos - Caja {cajaTypeDisplay && ` ${cajaTypeDisplay}`}
              </h2>
              <div className="flex-1 mx-4 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por descripción o referencia..."
                    value={inputValue}
                    onChange={handleSearchChange}
                    autoComplete="off"
                    className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                  />
                  {inputValue && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {canCreate && (  <Button
                onClick={handleOpenRegisterModal}
                variant="default"
                disabled={!isCajaAbierta || isLoading}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>)}
            </div>
          </AdminCardLayout.Title>
          <AdminCardLayout.Header>
            <div className="-mt-4"></div>
          </AdminCardLayout.Header>
          <AdminCardLayout.Content>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Caja Origen Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caja Seleccionada</label>
                  <div className="flex gap-2">
                    <Combobox
                      options={[
                        { label: 'Todas las cajas', value: '' },
                        ...filteredCajas.map(c => ({
                          label: `${c.nombre_caja}`,
                          value: c.id_caja.toString()
                        }))
                      ]}
                      selected={selectedCaja?.toString() ?? ''}
                      onChange={handleCajaChange}
                      placeholder="Seleccione una caja"
                      
                    />
                    {selectedCajaDetails && (
                      <div className="flex gap-2">
                        {selectedCajaDetails.id_estado_caja === estadoAbiertaId ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCloseCajaClick(selectedCajaDetails)}
                            disabled={isLoading}
                            title="Cerrar caja"
                            className="flex items-center gap-2 mt-2"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            {selectedCajaDetails.id_estado_caja !== estadoCerradaId && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleOpenCaja}
                                disabled={isLoading}
                                title="Abrir caja"
                                className="flex items-center gap-2 mt-2"
                              >
                                <LockOpen className="h-4 w-4" />
                              </Button>
                            )}
                            <div className={`flex items-center px-2 text-xs rounded-md ${selectedCajaDetails.id_estado_caja === estadoCerradaId
                              ? 'text-red-600 bg-red-100'
                              : 'text-gray-600 bg-gray-100'
                              }`}>
                              {selectedCajaDetails.id_estado_caja === estadoCerradaId ? 'Cerrada' : 'En espera'}
                            </div>
                          </>
                        )}
                        {selectedCajaDetails.id_estado_caja === estadoAbiertaId && (
                          <div className="flex items-center px-2 text-xs text-green-600 bg-green-100 rounded-md">
                            Abierta
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipo Operación Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operación</label>
                  <Combobox
                    options={[
                      { label: 'Todos los tipos', value: '' },
                      ...tiposOperacion.map(t => ({
                        ...t,
                        value: t.value.toString()
                      }))
                    ]}
                    selected={filters.id_tipo_operacion?.toString() ?? ''}
                    onChange={(value) => handleFilterChange('id_tipo_operacion', value ? Number(value) : null)}
                    placeholder="Seleccione un tipo"
                  />
                </div>

                {/* Estado Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filters.estado ?? ''}
                    onChange={handleStatusChange}
                    className="w-full mt-1 rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="1">Aprobado</option>
                    <option value="0">Pendiente</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4A6E]"></div>
              </div>
            ) : filteredMovimientos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCaja || filters.estado !== null || filters.id_tipo_operacion !== null || filters.id_tipo_caja !== null
                  ? 'No se encontraron movimientos que coincidan con los filtros actuales'
                  : 'No hay movimientos disponibles'}
              </div>
            ) : (
              <Datatable
                columns={columns}
                data={tableData}
              />
            )}

            {filteredMovimientos.length > 0 && !isLoading && totalFilteredPages > 1 && (
              <div className="mt-6 flex justify-center">
                <MuiPagination
                  count={totalFilteredPages}
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

        {/* Modal for add/edit form - Only render when isModalOpen is true */}
        {isModalOpen && (
          <ModalContainerComponent
            showModalContainer={isModalOpen}
            setShowModalContainer={setIsModalOpen}
            onClose={handleCloseModal}
          >
            <CajaMovimientosForm
              movimiento={modalType === 'edit' ? movimientoEdit : undefined}
              closeModal={handleCloseModal}
              onSuccess={() => {
                refreshList();
                handleCloseModal();
              }}
              cajaOrigenId={selectedCaja || undefined}  // Esta línea es la que falta
            />
          </ModalContainerComponent>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar el movimiento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el movimiento #{movimientoToDelete?.id_movimiento}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}